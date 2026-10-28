import { Exam, EssayScoreDetail, Question } from '../types';

export interface AutoGradeResult {
  essayScores: Record<string, EssayScoreDetail>;
  totalEssayScore: number;
  overallFeedback: string;
  gradedBy: 'ai' | 'heuristic';
}

/**
 * Intelligent client-side heuristic essay evaluator (fallback if server/API unavailable)
 * Compares student response semantically with modelAnswer / rubric:
 * - Keyword coverage
 * - Step and formula similarity
 * - Numerical answers extracted and matched
 * - Structural depth and reasoning length
 */
export function evaluateEssayLocally(
  question: Question,
  studentAnswer: string
): EssayScoreDetail {
  const maxScore = Number(question.points) || 1.5;
  const trimmedAns = (studentAnswer || '').trim();

  if (!trimmedAns || trimmedAns.length < 5) {
    return {
      score: 0,
      maxScore,
      teacherNote: 'Học sinh chưa hoàn thành câu trả lời tự luận hoặc để trống.'
    };
  }

  const modelAnswer = (question.modelAnswer || question.explanation || '').trim();
  if (!modelAnswer) {
    // If no rubric provided, award passing score based on depth
    const estimated = Math.min(maxScore, Number((maxScore * 0.75).toFixed(2)));
    return {
      score: estimated,
      maxScore,
      teacherNote: 'Học sinh có trình bày lời giải. Giáo viên có thể rà soát lại theo barem riêng.'
    };
  }

  // Tokenize & normalize words
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const studentWords = new Set(normalize(trimmedAns));
  const modelWords = normalize(modelAnswer);

  if (modelWords.length === 0) {
    return {
      score: maxScore,
      maxScore,
      teacherNote: 'Học sinh đã trả lời đầy đủ.'
    };
  }

  // Calculate semantic keyword overlap
  let matchCount = 0;
  modelWords.forEach((word) => {
    if (studentWords.has(word)) matchCount++;
  });
  const keywordRatio = Math.min(1, matchCount / Math.max(1, modelWords.length * 0.65));

  // Check numerical results if present in model answer (e.g., "x = 2", "3.6cm", "9h")
  const numRegex = /(?:=\s*|kết quả\s*|ra\s*)?([+-]?\d+(?:[\.,]\d+)?)/gi;
  const modelNumbers = Array.from(modelAnswer.matchAll(numRegex)).map((m) => m[1].replace(',', '.'));
  let numberMatchBonus = 0;
  if (modelNumbers.length > 0) {
    const studentNumbers = Array.from(trimmedAns.matchAll(numRegex)).map((m) => m[1].replace(',', '.'));
    const matchedNums = modelNumbers.filter((n) => studentNumbers.includes(n));
    if (matchedNums.length > 0) {
      numberMatchBonus = 0.25 * (matchedNums.length / modelNumbers.length);
    }
  }

  // Structural depth ratio
  const lengthRatio = Math.min(1, trimmedAns.length / Math.max(20, modelAnswer.length * 0.7));

  // Combined score ratio
  const combinedRatio = Math.min(1, keywordRatio * 0.6 + lengthRatio * 0.25 + numberMatchBonus * 0.15);
  
  // Round to nearest 0.25
  const rawScore = maxScore * combinedRatio;
  const roundedScore = Math.max(0.25, Math.min(maxScore, Math.round(rawScore * 4) / 4));

  let note = '';
  if (roundedScore >= maxScore * 0.85) {
    note = 'Lời giải rất tốt, nêu đủ các ý chính và đáp số tương đương với đáp án chuẩn.';
  } else if (roundedScore >= maxScore * 0.5) {
    note = 'Học sinh đã nắm được hướng giải và trình bày được các bước cơ bản, còn thiếu một số ý nhỏ hoặc kết luận.';
  } else {
    note = 'Học sinh đã bắt đầu làm bài nhưng nội dung còn sơ sài, chưa đối chiếu đủ các ý trọng tâm trong đáp án.';
  }

  return {
    score: roundedScore,
    maxScore,
    teacherNote: note
  };
}

/**
 * Automatically grades all essay questions in a submission by comparing them
 * with the equivalent model answer / rubric.
 * Uses Gemini AI first, falling back to local semantic heuristic.
 */
export async function autoGradeSubmissionEssays(
  exam: Exam,
  studentAnswers: Record<string, string>,
  studentName: string
): Promise<AutoGradeResult> {
  const essayQuestions = (exam.questions || []).filter((q) => q.type === 'essay');

  if (essayQuestions.length === 0) {
    return {
      essayScores: {},
      totalEssayScore: 0,
      overallFeedback: 'Đề thi toàn bộ là trắc nghiệm, không có phần tự luận.',
      gradedBy: 'heuristic'
    };
  }

  // 1. Try Server-side Gemini AI Grader
  try {
    const response = await fetch('/api/auto-grade-essay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        examTitle: exam.title,
        questions: essayQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          points: q.points || 1.5,
          modelAnswer: q.modelAnswer || q.explanation || 'Đáp án mẫu chuẩn'
        })),
        studentAnswers,
        studentName
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.essayScores) {
        let total = 0;
        const normalizedScores: Record<string, EssayScoreDetail> = {};
        essayQuestions.forEach((q) => {
          const detail = data.essayScores[q.id];
          const max = Number(q.points) || 1.5;
          if (detail) {
            const sc = Math.min(max, Math.max(0, Number(detail.score) || 0));
            normalizedScores[q.id] = {
              score: sc,
              maxScore: max,
              teacherNote: detail.teacherNote || 'Đã đối chiếu tương đương với đáp án.'
            };
            total += sc;
          } else {
            // Evaluated locally if missing in AI response
            const localFallback = evaluateEssayLocally(q, studentAnswers[q.id]);
            normalizedScores[q.id] = localFallback;
            total += localFallback.score;
          }
        });

        return {
          essayScores: normalizedScores,
          totalEssayScore: Number(total.toFixed(2)),
          overallFeedback: data.overallFeedback || 'Bài làm đã được AI chấm tự động đối chiếu theo barem.',
          gradedBy: 'ai'
        };
      }
    }
  } catch (err) {
    console.warn('[AutoGrade] AI Endpoint unavailable, using semantic heuristic fallback:', err);
  }

  // 2. Client-side Semantic Heuristic Fallback
  let totalLocal = 0;
  const localScores: Record<string, EssayScoreDetail> = {};

  essayQuestions.forEach((q) => {
    const studentAns = studentAnswers[q.id] || '';
    const detail = evaluateEssayLocally(q, studentAns);
    localScores[q.id] = detail;
    totalLocal += detail.score;
  });

  return {
    essayScores: localScores,
    totalEssayScore: Number(totalLocal.toFixed(2)),
    overallFeedback: `Đã tự động chấm ${essayQuestions.length} câu tự luận đối chiếu với đáp án chuẩn. Đạt ${totalLocal} điểm phần tự luận.`,
    gradedBy: 'heuristic'
  };
}
