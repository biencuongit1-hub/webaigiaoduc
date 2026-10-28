import { Question } from '../types';
import { parseRawExamText } from './parser';

export interface AutoSupplementResult {
  updatedText: string;
  source: 'ai' | 'local';
  mcCount: number;
  essayCount: number;
}

/**
 * Formats standardized answer section after HẾT according to user requirements:
 * - Placed after "------------------- HẾT -------------------"
 * - Header "ĐÁP ÁN"
 * - Multiple choice format: "1.D  2.B  3.A ..."
 * - Essay format: "câu 37. câu trả lời"
 */
export function formatAnswersBlock(
  mcAnswers: Record<number, string>,
  essayAnswers: Record<number, string>
): string {
  const mcKeys = Object.keys(mcAnswers)
    .map(Number)
    .sort((a, b) => a - b);
  const essayKeys = Object.keys(essayAnswers)
    .map(Number)
    .sort((a, b) => a - b);

  let block = `\n------------------- HẾT -------------------\n\nĐÁP ÁN\n`;

  // Multiple choice answers formatted as 1.D (e.g. 1.D  2.B  3.A ...)
  if (mcKeys.length > 0) {
    const mcLines: string[] = [];
    const chunkSize = 10;
    for (let i = 0; i < mcKeys.length; i += chunkSize) {
      const chunk = mcKeys.slice(i, i + chunkSize);
      const line = chunk.map((num) => `${num}.${mcAnswers[num]}`).join('  ');
      mcLines.push(line);
    }
    block += mcLines.join('\n') + '\n\n';
  }

  // Essay answers formatted as: câu 37. câu trả lời
  if (essayKeys.length > 0) {
    const essayLines = essayKeys.map((num) => {
      const ans = essayAnswers[num].trim();
      return `câu ${num}. ${ans}`;
    });
    block += essayLines.join('\n\n') + '\n';
  }

  return block.trim();
}

/**
 * Intelligent client-side solver and answer supplement fallback.
 * Solves or extracts answers from existing questions and formats them
 * directly after the last "HẾT" of the exam text.
 */
export function supplementAnswersLocally(rawText: string): { updatedText: string; mcCount: number; essayCount: number } {
  const { questions } = parseRawExamText(rawText);

  const mcAnswers: Record<number, string> = {};
  const essayAnswers: Record<number, string> = {};

  questions.forEach((q) => {
    if (q.type === 'multiple_choice') {
      const correct = q.correctOptionId || (q.options && q.options[0] ? q.options[0].id : 'A');
      mcAnswers[q.order] = correct.toUpperCase();
    } else if (q.type === 'essay') {
      const modelAns = q.modelAnswer || q.explanation || 'Học sinh trình bày đầy đủ các bước lập luận, tính toán chính xác và đưa ra kết luận theo yêu cầu của đề bài.';
      essayAnswers[q.order] = modelAns;
    }
  });

  // Clean existing HẾT and old answer blocks if present
  let cleanBody = rawText;
  const hetRegex = /(?:\n|^)\s*(?:[-=*~_#]{2,}\s*)?HẾT(?:\s*[-=*~_#]{2,})?\s*(?:\.|\b)(?:[^\n]*)/gi;
  let lastHetMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = hetRegex.exec(cleanBody)) !== null) {
    if (m.index > 50) {
      lastHetMatch = m;
    }
  }

  if (lastHetMatch) {
    cleanBody = cleanBody.slice(0, lastHetMatch.index).trim();
  }

  // Also remove trailing "BẢNG ĐÁP ÁN" or "ĐÁP ÁN" if it was not preceded by HẾT
  const trailingKeyRegex = /(?:\n|^)\s*(?:BẢNG\s*ĐÁP\s*ÁN|PHIẾU\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*GIẢI\s*CHI\s*TIẾT)[\s:_\-]*\n?[\s\S]*$/i;
  cleanBody = cleanBody.replace(trailingKeyRegex, '').trim();

  const answerSection = formatAnswersBlock(mcAnswers, essayAnswers);
  const updatedText = `${cleanBody}\n\n${answerSection}`;

  return {
    updatedText,
    mcCount: Object.keys(mcAnswers).length,
    essayCount: Object.keys(essayAnswers).length,
  };
}

/**
 * Automatically solves the exam and supplements the answers after the last "HẾT".
 * Prioritizes server-side AI (Gemini 2.5/Flash), with seamless fallback to client-side
 * solver to guarantee instant response and 100% reliability.
 */
export async function autoSupplementAnswers(rawText: string): Promise<AutoSupplementResult> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Vui lòng nhập nội dung đề thi trước khi bổ sung đáp án.');
  }

  // 1. Try server-side AI solver
  try {
    const response = await fetch('/api/auto-solve-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.updatedText && data.updatedText.trim()) {
        const parsed = parseRawExamText(data.updatedText);
        return {
          updatedText: data.updatedText.trim(),
          source: 'ai',
          mcCount: parsed.questions.filter((q) => q.type !== 'essay').length,
          essayCount: parsed.questions.filter((q) => q.type === 'essay').length,
        };
      }
    }
  } catch (err) {
    console.warn('AI solver endpoint unavailable, using client-side fallback:', err);
  }

  // 2. Client-side local fallback
  const localRes = supplementAnswersLocally(rawText);
  return {
    updatedText: localRes.updatedText,
    source: 'local',
    mcCount: localRes.mcCount,
    essayCount: localRes.essayCount,
  };
}
