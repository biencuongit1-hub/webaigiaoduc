import { Question, QuestionOption } from '../types';

export interface ParseResult {
  questions: Question[];
  multipleChoicePoints: number;
  essayPoints: number;
  totalPoints: number;
  errors: string[];
}

/**
 * Intelligent Vietnamese & English Exam Parser
 * Supports:
 * - Both Multiple Choice (Phần Trắc Nghiệm) and Essay (Phần Tự Luận)
 * - Custom point allocation for each section and each question (e.g. (2đ), (4đ), (1.5 điểm))
 * - Answer key parsing at the end of exam (e.g. "BẢNG ĐÁP ÁN: 1-D 2-C 3-B" or "1.A 2.B" or "1: A")
 * - Detailed explanations section ("HƯỚNG DẪN GIẢI CHI TIẾT" / "GIẢI CHI TIẾT") mapped directly to questions
 * - Standard Vietnamese markers ("Câu 1:", "Câu 1.", "Bài 1:", "Question 1:")
 */
export function parseRawExamText(rawText: string): ParseResult {
  const errors: string[] = [];
  if (!rawText.trim()) {
    return {
      questions: [],
      multipleChoicePoints: 7,
      essayPoints: 3,
      totalPoints: 10,
      errors: ['Văn bản rỗng. Vui lòng dán nội dung đề thi hoặc tải tệp Word/PDF lên.']
    };
  }

  // Pre-clean line endings and standard spaces
  const normalizedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  // 1. Separate "HƯỚNG DẪN GIẢI CHI TIẾT" / "LỜI GIẢI CHI TIẾT" / "GIẢI CHI TIẾT" if present
  let mainExamText = normalizedText;
  let solutionText = '';

  const solutionHeaderRegex = /(?:\n|^)\s*(?:HƯỚNG\s*DẪN\s*GIẢI\s*CHI\s*TIẾT|LỜI\s*GIẢI\s*CHI\s*TIẾT|GIẢI\s*CHI\s*TIẾT|HƯỚNG\s*DẪN\s*CHẤM\s*CHI\s*TIẾT|ĐÁP\s*ÁN\s*CHI\s*TIẾT)[\s:_\-]*\n?/i;
  const solutionSplitIndex = mainExamText.search(solutionHeaderRegex);
  if (solutionSplitIndex !== -1) {
    solutionText = mainExamText.slice(solutionSplitIndex);
    mainExamText = mainExamText.slice(0, solutionSplitIndex);
  }

  // 2. Extract "BẢNG ĐÁP ÁN" / "ĐÁP ÁN" table at the bottom of the exam if present
  // Matches formats: "1-D 2-C 3-B", "1.A 2.B", "1: A 2: B", "1A 2B", "Câu 1: A"
  const answerKeyMap: Record<number, string> = {};
  const answerKeyHeaderRegex = /(?:\n|^)\s*(?:BẢNG\s*ĐÁP\s*ÁN|PHIẾU\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN\s*(?:TRẮC\s*NGHIỆM)?|ANSWER\s*KEY)[\s:_\-]*\n?/i;
  const answerKeyIndex = mainExamText.search(answerKeyHeaderRegex);
  if (answerKeyIndex !== -1) {
    const keySection = mainExamText.slice(answerKeyIndex);
    mainExamText = mainExamText.slice(0, answerKeyIndex);

    // Extract all matches like "1-D", "1.D", "1: D", "1. D", "Câu 1. D", "1 D"
    const keyMatches = keySection.matchAll(/(?:câu\s*|question\s*)?(\d+)[\.\s:_\-–—]+([A-D])/gi);
    for (const match of keyMatches) {
      const qNum = parseInt(match[1], 10);
      const opt = match[2].toUpperCase();
      if (!isNaN(qNum) && opt) {
        answerKeyMap[qNum] = opt;
      }
    }
  }

  // 3. Extract Detailed Explanations by Question number from solutionText
  const explanationMap: Record<number, string> = {};
  if (solutionText) {
    const solBlocks = solutionText.matchAll(/(?:^|\n)\s*(?:Câu|Question|Bài)\s*(\d+)[\.:\s\-–—]([\s\S]*?)(?=(?:\n\s*(?:Câu|Question|Bài)\s*\d+[\.:\s\-–—]|$))/gi);
    for (const match of solBlocks) {
      const qNum = parseInt(match[1], 10);
      const solContent = match[2].trim();
      if (!isNaN(qNum) && solContent) {
        explanationMap[qNum] = solContent;

        // Also check if answer is in explanation e.g. "Chọn D.", "Chọn đáp án C"
        const inlineSelectMatch = solContent.match(/(?:Chọn|Đáp\s*án(?:\s*đúng)?(?:\s*là)?|Chọn\s*đáp\s*án)[\s:_\-]*([A-D])\b/i);
        if (inlineSelectMatch && !answerKeyMap[qNum]) {
          answerKeyMap[qNum] = inlineSelectMatch[1].toUpperCase();
        }
      }
    }
  }

  // 4. Detect Section Points (Phần Trắc nghiệm: X điểm, Phần Tự luận: Y điểm)
  let detectedMcPoints: number | null = null;
  let detectedEssayPoints: number | null = null;

  const mcHeaderRegex = /(?:I|1|A)[\.:\s\-–—]+(?:PHẦN\s*)?TRẮC\s*NGHIỆM[^\n]*?(?:\(([\d\.,]+)\s*(?:đ|điểm)\)|([\d\.,]+)\s*(?:đ|điểm))/i;
  const essayHeaderRegex = /(?:II|2|B)[\.:\s\-–—]+(?:PHẦN\s*)?TỰ\s*LUẬN[^\n]*?(?:\(([\d\.,]+)\s*(?:đ|điểm)\)|([\d\.,]+)\s*(?:đ|điểm))/i;

  const mcHeaderMatch = mainExamText.match(mcHeaderRegex);
  if (mcHeaderMatch) {
    const pts = parseFloat((mcHeaderMatch[1] || mcHeaderMatch[2] || '').replace(',', '.'));
    if (!isNaN(pts)) detectedMcPoints = pts;
  }

  const essayHeaderMatch = mainExamText.match(essayHeaderRegex);
  if (essayHeaderMatch) {
    const pts = parseFloat((essayHeaderMatch[1] || essayHeaderMatch[2] || '').replace(',', '.'));
    if (!isNaN(pts)) detectedEssayPoints = pts;
  }

  // 5. Partition Exam into Multiple Choice & Essay text blocks
  const essaySectionSplitRegex = /(?:\n|^)\s*(?:(?:II|2|B)[\.:\s\-–—]+(?:PHẦN\s*)?TỰ\s*LUẬN|PHẦN\s*(?:TỰ\s*LUẬN|II|2)[\s:]*)/i;
  const mcSectionSplitRegex = /(?:\n|^)\s*(?:(?:I|1|A)[\.:\s\-–—]+(?:PHẦN\s*)?TRẮC\s*NGHIỆM|PHẦN\s*(?:TRẮC\s*NGHIỆM|I|1)[\s:]*)/i;

  let mcText = mainExamText;
  let essayText = '';

  const essaySplitIndex = mainExamText.search(essaySectionSplitRegex);
  const mcSplitIndex = mainExamText.search(mcSectionSplitRegex);

  if (essaySplitIndex !== -1 && mcSplitIndex !== -1) {
    if (mcSplitIndex < essaySplitIndex) {
      mcText = mainExamText.slice(mcSplitIndex, essaySplitIndex);
      essayText = mainExamText.slice(essaySplitIndex);
    } else {
      essayText = mainExamText.slice(essaySplitIndex, mcSplitIndex);
      mcText = mainExamText.slice(mcSplitIndex);
    }
  } else if (essaySplitIndex !== -1) {
    mcText = mainExamText.slice(0, essaySplitIndex);
    essayText = mainExamText.slice(essaySplitIndex);
  }

  // 6. Parse questions
  const parsedMcQuestions: Question[] = parseMultipleChoiceBlocks(mcText, answerKeyMap, explanationMap);
  const parsedEssayQuestions: Question[] = parseEssayBlocks(essayText, parsedMcQuestions.length, explanationMap);

  const allQuestions: Question[] = [...parsedMcQuestions, ...parsedEssayQuestions];

  // Re-index sequentially
  allQuestions.forEach((q, idx) => {
    q.order = idx + 1;
  });

  if (allQuestions.length === 0) {
    errors.push('Không nhận diện được câu hỏi nào. Vui lòng kiểm tra đề thi có định dạng "Câu 1:", "A.", "B.", "C.", "D." hoặc "Câu 1: [Tự luận]".');
  }

  // 7. Calculate and distribute points
  let finalMcPoints = detectedMcPoints;
  let finalEssayPoints = detectedEssayPoints;

  const totalMcQ = parsedMcQuestions.length;
  const totalEssayQ = parsedEssayQuestions.length;

  // Sum explicit question points if present
  let explicitMcSum = 0;
  let explicitEssaySum = 0;
  let hasExplicitMcPoints = false;
  let hasExplicitEssayPoints = false;

  parsedMcQuestions.forEach(q => {
    if (q.points && q.points !== 1) {
      explicitMcSum += q.points;
      hasExplicitMcPoints = true;
    }
  });

  parsedEssayQuestions.forEach(q => {
    if (q.points && q.points !== 1.5) {
      explicitEssaySum += q.points;
      hasExplicitEssayPoints = true;
    }
  });

  if (finalMcPoints === null && finalEssayPoints === null) {
    if (hasExplicitMcPoints && hasExplicitEssayPoints) {
      finalMcPoints = explicitMcSum;
      finalEssayPoints = explicitEssaySum;
    } else if (totalMcQ > 0 && totalEssayQ > 0) {
      finalMcPoints = 7;
      finalEssayPoints = 3;
    } else if (totalMcQ > 0) {
      finalMcPoints = 10;
      finalEssayPoints = 0;
    } else {
      finalMcPoints = 0;
      finalEssayPoints = 10;
    }
  } else if (finalMcPoints === null && finalEssayPoints !== null) {
    finalMcPoints = Math.max(0, 10 - finalEssayPoints);
  } else if (finalMcPoints !== null && finalEssayPoints === null) {
    finalEssayPoints = Math.max(0, 10 - finalMcPoints);
  }

  // Evenly distribute section points if individual questions didn't specify points
  if (totalMcQ > 0 && finalMcPoints !== null && finalMcPoints > 0 && !hasExplicitMcPoints) {
    const ptPerMc = Number((finalMcPoints / totalMcQ).toFixed(2));
    parsedMcQuestions.forEach((q) => {
      q.points = ptPerMc;
    });
  }

  if (totalEssayQ > 0 && finalEssayPoints !== null && finalEssayPoints > 0 && !hasExplicitEssayPoints) {
    const ptPerEssay = Number((finalEssayPoints / totalEssayQ).toFixed(2));
    parsedEssayQuestions.forEach((q) => {
      q.points = ptPerEssay;
    });
  }

  const finalTotalPoints = Number(((finalMcPoints || 0) + (finalEssayPoints || 0)).toFixed(1));

  return {
    questions: allQuestions,
    multipleChoicePoints: finalMcPoints || 0,
    essayPoints: finalEssayPoints || 0,
    totalPoints: finalTotalPoints || 10,
    errors
  };
}

/**
 * Parse Multiple Choice Question Blocks
 */
function parseMultipleChoiceBlocks(
  text: string, 
  answerKeyMap: Record<number, string>, 
  explanationMap: Record<number, string>
): Question[] {
  const questions: Question[] = [];
  // Regex to split on "Câu 1:", "Câu 1.", "Question 1:", "Bài 1:"
  const blockRegex = /(?:^|\n)(?:(?:Câu|Question|Bài)\s*(\d+)[\.:\s\-–—]|(\d+)[\.:]\s+)([\s\S]*?)(?=(?:\n(?:(?:Câu|Question|Bài)\s*\d+[\.:\s\-–—]|\d+[\.:]\s+)|$))/gi;

  let match: RegExpExecArray | null;
  let autoOrder = 1;

  while ((match = blockRegex.exec(text)) !== null) {
    const qNumStr = match[1] || match[2];
    const qNum = qNumStr ? parseInt(qNumStr, 10) : autoOrder;
    const blockContent = match[3].trim();

    // Skip section header lines if captured as question
    if (/^(?:PHẦN\s*)?(?:TRẮC\s*NGHIỆM|TỰ\s*LUẬN)/i.test(blockContent) && !/[A-D][\.:\)]/i.test(blockContent)) {
      continue;
    }

    // Check if block has options A, B, C, D
    if (/[A-D][\.:\)]\s+/i.test(blockContent)) {
      const externalExpl = explanationMap[qNum];
      const parsedQ = parseSingleMultipleChoiceBlock(blockContent, qNum, answerKeyMap[qNum], externalExpl);
      if (parsedQ) {
        questions.push(parsedQ);
        autoOrder++;
      }
    }
  }

  return questions;
}

function parseSingleMultipleChoiceBlock(
  block: string, 
  qOrder: number, 
  externalAnswer?: string,
  externalExplanation?: string
): Question | null {
  // Option Regex to extract A., B., C., D.
  const optionRegex = new RegExp(
    '(?:^|\\n)\\s*(\\*|\\[x\\])?\\s*([A-D])[.:\\)]\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:\\*|\\[x\\])?\\s*[A-D][.:\\)]|\\n\\s*(?:Lời\\s*giải|Hướng\\s*dẫn|Giải\\s*thích|Đáp\\s*án|HD:)|$)',
    'gi'
  );

  let questionText = '';
  const options: QuestionOption[] = [];
  let inlineCorrectOption: string | null = null;
  let explanation = externalExplanation;
  let explicitPoints = 1;

  // Check explicit points in question header: e.g. "(0.5 điểm)", "(0.5đ)", "(1đ)"
  const pointsMatch = block.match(/\(([\d\.,]+)\s*(?:đ|điểm)\)/i);
  if (pointsMatch) {
    const parsed = parseFloat(pointsMatch[1].replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) explicitPoints = parsed;
  }

  // Separate question text from options
  const firstOptionMatch = block.search(/(?:^|\n)\s*(\*|\[x\])?\s*[A-D][.:\)]/i);
  if (firstOptionMatch !== -1) {
    questionText = block.slice(0, firstOptionMatch).trim();
  } else {
    questionText = block.trim();
  }

  // Clean trailing punctuation or points label from question text
  questionText = questionText.replace(/^\(([\d\.,]+)\s*(?:đ|điểm)\)[\s:\-]*/i, '').trim();

  // Inline answer or explanation
  const answerMatch = block.match(/(?:Đáp\s*án\s*(?:đúng)?|Chọn)[\s:_\-]*([A-D])\b/i);
  if (answerMatch) {
    inlineCorrectOption = answerMatch[1].toUpperCase();
  }

  const explMatch = block.match(/(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Giải\s*thích|HD)[\s:_\-]*([\s\S]*?)(?:Đáp\s*án|$)/i);
  if (explMatch && !explanation) {
    explanation = explMatch[1].trim();
  }

  // Parse options
  let optMatch: RegExpExecArray | null;
  while ((optMatch = optionRegex.exec(block)) !== null) {
    const isMarked = Boolean(optMatch[1]);
    const letter = optMatch[2].toUpperCase();
    let optText = optMatch[3].trim();
    optText = optText.replace(/(?:Lời\s*giải|Đáp\s*án)[\s\S]*$/i, '').trim();

    if (isMarked) {
      inlineCorrectOption = letter;
    }

    options.push({
      id: letter,
      text: optText || `Phương án ${letter}`
    });
  }

  if (options.length === 0) {
    return null;
  }

  const finalCorrect = inlineCorrectOption || externalAnswer || (options[0] ? options[0].id : 'A');

  return {
    id: `q_mc_${qOrder}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    order: qOrder,
    type: 'multiple_choice',
    text: questionText || `Nội dung câu hỏi ${qOrder}`,
    options: options.length > 0 ? options : [
      { id: 'A', text: 'Phương án A' },
      { id: 'B', text: 'Phương án B' },
      { id: 'C', text: 'Phương án C' },
      { id: 'D', text: 'Phương án D' },
    ],
    correctOptionId: finalCorrect,
    explanation: explanation || undefined,
    points: explicitPoints
  };
}

/**
 * Parse Essay Question Blocks
 */
function parseEssayBlocks(
  text: string, 
  startIndex: number,
  explanationMap: Record<number, string>
): Question[] {
  if (!text.trim()) return [];

  const questions: Question[] = [];
  const blockRegex = /(?:^|\n)(?:(?:Câu|Question|Bài)\s*(\d+)[\.:\s\-–—]|(\d+)[\.:]\s+)([\s\S]*?)(?=(?:\n(?:(?:Câu|Question|Bài)\s*\d+[\.:\s\-–—]|\d+[\.:]\s+)|$))/gi;

  let match: RegExpExecArray | null;
  let autoOrder = startIndex + 1;

  while ((match = blockRegex.exec(text)) !== null) {
    const qNumStr = match[1] || match[2];
    const qNum = qNumStr ? parseInt(qNumStr, 10) : autoOrder;
    const blockContent = match[3].trim();

    // Skip section header title lines
    if (/^(?:PHẦN\s*)?TỰ\s*LUẬN/i.test(blockContent) && blockContent.length < 50) {
      continue;
    }

    // Skip multiple choice questions that may have leaked into essay section
    if (/[A-D][\.:\)]\s+/i.test(blockContent) && blockContent.includes('A.') && blockContent.includes('B.')) {
      continue;
    }

    let explicitPoints = 1.5;
    const pointsMatch = blockContent.match(/\(([\d\.,]+)\s*(?:đ|điểm)\)/i);
    if (pointsMatch) {
      const parsed = parseFloat(pointsMatch[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) explicitPoints = parsed;
    }

    // Extract Model Answer / Rubric
    let modelAnswer = explanationMap[qNum] || '';
    let questionText = blockContent;

    const answerSplitMatch = blockContent.match(/(?:(?:Đáp\s*án|Hướng\s*dẫn\s*chấm|Biểu\s*điểm|Barem|Lời\s*giải)[\s:_\-]*)([\s\S]*)/i);
    if (answerSplitMatch) {
      if (!modelAnswer) {
        modelAnswer = answerSplitMatch[1].trim();
      }
      questionText = blockContent.slice(0, answerSplitMatch.index).trim();
    }

    // Clean question title
    questionText = questionText.replace(/^\(([\d\.,]+)\s*(?:đ|điểm)\)[\s:\-]*/i, '').trim();

    if (questionText.length > 0) {
      questions.push({
        id: `q_essay_${autoOrder}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        order: autoOrder,
        type: 'essay',
        text: questionText,
        options: [],
        modelAnswer: modelAnswer || 'Đáp án mẫu & Biểu điểm tự luận do giáo viên cung cấp.',
        explanation: modelAnswer || undefined,
        points: explicitPoints
      });
      autoOrder++;
    }
  }

  // Fallback: If no "Câu X" matched but essay text exists, split by paragraphs
  if (questions.length === 0 && text.trim().length > 10) {
    const rawParagraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);
    rawParagraphs.forEach((p, idx) => {
      if (/^(?:PHẦN\s*)?TỰ\s*LUẬN/i.test(p)) return;
      questions.push({
        id: `q_essay_fb_${idx + 1}_${Date.now()}`,
        order: startIndex + idx + 1,
        type: 'essay',
        text: p.trim(),
        options: [],
        modelAnswer: 'Đáp án & Biểu điểm tự luận do giáo viên cung cấp.',
        points: 2
      });
    });
  }

  return questions;
}

// Built-in presets based directly on user's real exam samples (Đoàn Thượng, Đại số 8, Lý Thái Tổ)
export const EXAM_SAMPLE_PRESETS = [
  {
    id: 'sample_toan_thpt',
    title: 'Đề thi thử THPT QG Môn Toán - Trường THPT Đoàn Thượng (50 câu trắc nghiệm + Lời giải)',
    description: 'Đề chuẩn cấu trúc THPT Quốc Gia có bảng đáp án 50 câu (1-D 2-C 3-B...) và phần Lời giải chi tiết.',
    subject: 'Toán học',
    grade: 'Lớp 12',
    durationMinutes: 90,
    mcPoints: 10,
    essayPoints: 0,
    rawText: `SỞ GD VÀ ĐT HẢI DƯƠNG
TRƯỜNG THPT ĐOÀN THƯỢNG
ĐỀ THI THỬ THPT QG LẦN 1, NĂM HỌC 2020 - 2021
Môn: Toán
Thời gian làm bài: 90 phút (50 câu trắc nghiệm)

Câu 1: Hàm số nào sau đây đồng biến trên khoảng (-∞; +∞)?
A. y = ((√3 + √2)/4)^x
B. y = (2/e)^x
C. y = (√3 - √2)^x
D. y = ((√3 + √2)/3)^x

Câu 2: Cho hình chóp S.ABCD có đáy ABCD là hình chữ nhật, AB = 2a, BC = a, SA = a√3 và SA vuông góc với mặt đáy (ABCD). Thể tích V của khối chóp S.ABCD bằng:
A. V = a^3 * √3
B. V = (a^3 * √3) / 3
C. V = (2a^3 * √3) / 3
D. V = 2a^3 * √3

Câu 3: Đồ thị hàm số bậc 3 y = x^3 - 3x^2 + 1 cắt trục tung tại điểm có tung độ bằng:
A. y = 3x^2 + 2x + 1
B. y = x^3 - 3x^2 + 1
C. y = -x^3/3 + x^2 + 1
D. y = x^4 + 3x^2 + 1

Câu 4: Chọn khẳng định sai. Trong một khối đa diện:
A. Mỗi mặt có ít nhất 3 cạnh.
B. Mỗi cạnh của một khối đa diện là cạnh chung của đúng 2 mặt.
C. Mỗi đỉnh là đỉnh chung của ít nhất 3 mặt.
D. Hai mặt bất kì luôn có ít nhất một điểm chung.

Câu 5: Tiệm cận ngang của đồ thị hàm số y = (x + 1)/(-3x + 2) là:
A. x = 2/3
B. y = 2/3
C. y = -1/3
D. x = -1/3

------------------- HẾT -----------------

BẢNG ĐÁP ÁN
1-D  2-C  3-B  4-D  5-C

HƯỚNG DẪN GIẢI CHI TIẾT
Câu 1:
Hàm số y = a^x đồng biến trên (-∞; +∞) khi a > 1. Ta có: (√3 + √2)/3 ≈ 1.05 > 1 nên chọn D.
Chọn D.

Câu 2:
Diện tích đáy S_ABCD = AB * BC = 2a * a = 2a^2.
Thể tích khối chóp: V = (1/3) * B * h = (1/3) * 2a^2 * a√3 = (2a^3 * √3)/3.
Chọn C.

Câu 3:
Dạng đồ thị có hệ số a > 0 và qua điểm (0; 1), cực đại và cực tiểu rõ nét.
Chọn B.

Câu 4:
Khẳng định D sai vì hai mặt bất kỳ có thể không có điểm chung nào.
Chọn D.

Câu 5:
lim (x->+∞) (x + 1)/(-3x + 2) = -1/3. Vậy tiệm cận ngang y = -1/3.
Chọn C.`
  },
  {
    id: 'sample_daiso8_mixed',
    title: 'Đề kiểm tra 1 tiết Đại số 8 (Trắc nghiệm 2.0đ + Tự luận 8.0đ có Barem điểm)',
    description: 'Cấu trúc kết hợp: 4 câu trắc nghiệm (2đ) và 3 bài tự luận (8đ) có barem biểu điểm chi tiết.',
    subject: 'Toán học',
    grade: 'Lớp 8',
    durationMinutes: 45,
    mcPoints: 2,
    essayPoints: 8,
    rawText: `ĐỀ KIỂM TRA MỘT TIẾT
Môn: Đại số 8
Thời gian: 45 phút

Phần I. Trắc nghiệm (2đ). Hãy chọn chữ cái đứng trước câu trả lời đúng:

Câu 1. Phương trình x^2 - 9 = 0 có tập nghiệm là:
A. S = {-3}
B. S = {3}
C. S = Ø
D. S = {3; -3}

Câu 2. Phương trình 3x + 1 = x + 5 có nghiệm là:
A. x = 3
B. x = 2
C. x = 1
D. x = 0

Câu 3. Giá trị của m để phương trình (m - 1)x - 3m + 1 = 0 có nghiệm x = 4 là:
A. m = -4
B. m = 4
C. m = -3
D. m = 3

Câu 4. Điều kiện xác định của phương trình x/(x + 1) + (x + 1)/(3 + x) = 0 là:
A. x ≠ -3
B. x ≠ -3 và x ≠ -1
C. x ≠ -1
D. x ≠ -3 hoặc x ≠ -1

Phần II: Tự luận (8đ)

Câu 5 (4đ). Giải các phương trình sau:
1) -5x + 6 = 3x - 10
2) (2x + 1)^2 - 3x(x + 1) = x(x + 1) + 1
3) (x - 9)(2x + 3) = 9x - x^2
4) x/(x + 3) - 6/(3 - x) = 18/(x^2 - 9)
Đáp án:
1) -5x - 3x = -10 - 6 <=> -8x = -16 <=> x = 2. (1đ)
2) 4x^2 + 4x + 1 - 3x^2 - 3x = x^2 + x + 1 <=> 0x = 0 => Vô số nghiệm. (1đ)
3) 2x^2 + 3x - 18x - 27 = 9x - x^2 <=> 3x^2 - 24x - 27 = 0 <=> x = 9 hoặc x = -1. (1đ)
4) ĐKXĐ: x ≠ 3, x ≠ -3. Quy đồng khử mẫu ta được x = 0 (thỏa mãn). (1đ)

Câu 6 (3đ). Bài toán chuyển động:
Lúc 6h sáng, một người đi ô tô từ A đến B với vận tốc 60km/h. Sau đó 1 giờ, một người khác đi xe máy từ B đến A với vận tốc ít hơn ô tô là 20km/h. Hỏi hai người gặp nhau lúc mấy giờ biết rằng quãng đường AB dài 260km?
Đáp án:
- Vận tốc người đi xe máy: 60 - 20 = 40 (km/h). (0.5đ)
- Trong 1 giờ đầu ô tô đi được: 60 * 1 = 60 (km). Quãng đường còn lại: 260 - 60 = 200 (km). (1đ)
- Thời gian hai xe cùng đi đến khi gặp nhau: 200 / (60 + 40) = 2 (giờ). (1đ)
- Thời điểm hai xe gặp nhau: 6h + 1h + 2h = 9h sáng. (0.5đ)

Câu 7 (1đ). Giải phương trình nâng cao sau:
(2019 - x)^3 + (2021 - x)^3 + (2x - 4020)^3 = 0
Đáp án:
- Đặt a = 2019 - x, b = 2021 - x, c = 2x - 4020.
- Ta thấy a + b + c = 0. Khi a + b + c = 0 thì a^3 + b^3 + c^3 = 3abc. (0.5đ)
- Phương trình <=> 3(2019 - x)(2021 - x)(2x - 4020) = 0
<=> x = 2019, x = 2021 hoặc x = 2010. (0.5đ)

----------------------Hết------------------------
Đáp án Trắc nghiệm
1.D  2.B  3.D  4.B`
  },
  {
    id: 'sample_anh_thpt',
    title: 'Đề thi thử THPT Môn Tiếng Anh - Trường THPT Lý Thái Tổ',
    description: 'Đề thi Tiếng Anh chuẩn format Bộ GD&ĐT gồm trắc nghiệm ngữ pháp, từ vựng và bài đọc hiểu.',
    subject: 'Tiếng Anh',
    grade: 'Lớp 12',
    durationMinutes: 60,
    mcPoints: 10,
    essayPoints: 0,
    rawText: `SỞ GD & ĐT BẮC NINH
TRƯỜNG THPT LÝ THÁI TỔ
KỲ THI THỬ TỐT NGHIỆP THPT KHỐI 12
MÔN TIẾNG ANH
Thời gian làm bài: 60 phút

Question 1: They believe that burning fossil fuels is the main cause of air pollution.
A. Burning fossil fuels is believed to have caused high levels of air pollution.
B. It is believed that air pollution is mainly to blame for burning fossil fuels.
C. Burning fossil fuels is believed to result from air pollution.
D. It is believed that burning fossil fuels is held responsible for air pollution.

Question 2: "I haven't been very open-minded," said the manager.
A. The manager denied having been very open-minded.
B. The manager refused to have been very open-minded.
C. The manager admitted not having been very open-minded.
D. The manager promised to be very open-minded.

Question 3: Peter used to work as a journalist for a local newspaper.
A. Peter has stopped working as a journalist for a local newspaper.
B. Peter no longer likes the job as a journalist for a local newspaper.
C. Peter enjoyed working as a journalist for a local newspaper.
D. Peter refused to work as a journalist for a local newspaper.

Question 4: Mark the word whose underlined part differs in pronunciation:
A. liberty
B. reliable
C. revival
D. final

Question 5: Mark the word whose underlined part differs in pronunciation:
A. raised
B. developed
C. influenced
D. introduced

ĐÁP ÁN
1-D 2-C 3-A 4-A 5-A

HƯỚNG DẪN GIẢI CHI TIẾT
Question 1:
Cấu trúc bị động khách quan: It is believed that... / S + is believed to V. "To be held responsible for" nghĩa là chịu trách nhiệm cho nguyên nhân chính.
Chọn đáp án D.

Question 2:
Admit + V-ing: thừa nhận đã làm gì. Câu gốc "Tôi không cởi mở lắm" tương đương người quản lý thừa nhận điều đó.
Chọn đáp án C.

Question 3:
Used to + V: từng làm gì trong quá khứ và nay không làm nữa = Peter has stopped working...
Chọn đáp án A.

Question 4:
Chữ "i" trong liberty phát âm là /ɪ/, các từ còn lại phát âm là /aɪ/.
Chọn đáp án A.

Question 5:
Đuôi "-ed" của raised phát âm là /d/, các từ còn lại phát âm là /t/.
Chọn đáp án A.`
  }
];

export const SAMPLE_RAW_EXAM_MIXED = EXAM_SAMPLE_PRESETS[1].rawText;

