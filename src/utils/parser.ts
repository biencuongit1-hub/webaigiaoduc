import { Question, QuestionOption } from '../types';

/**
 * Robust Vietnamese Question Parser (Azota style)
 * Parses formatted exam text into structured Question objects.
 */
export function parseRawExamText(rawText: string): { questions: Question[]; errors: string[] } {
  const errors: string[] = [];
  const lines = rawText.split(/\r?\n/);
  
  // First, check if there is an answer key table at the bottom
  // e.g. "BẢNG ĐÁP ÁN:", "ĐÁP ÁN:", "1.A 2.B 3.C"
  const answerKeyMap: Record<number, string> = {};
  
  let answerKeyStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(bảng\s*đáp\s*án|phiếu\s*đáp\s*án|đáp\s*án\s*chi\s*tiết|đáp\s*án\s*:)/i.test(line)) {
      answerKeyStartIndex = i;
      break;
    }
  }

  if (answerKeyStartIndex !== -1) {
    const keyLines = lines.slice(answerKeyStartIndex).join(' ');
    // Match patterns like "1.A", "1:A", "1-A", "1A", "Câu 1: A"
    const keyMatches = keyLines.matchAll(/(?:câu\s*)?(\d+)[\.\s:_\-]*([A-D])/gi);
    for (const match of keyMatches) {
      const qNum = parseInt(match[1], 10);
      const opt = match[2].toUpperCase();
      answerKeyMap[qNum] = opt;
    }
  }

  // Question body lines (before answer key if exists)
  const questionContentLines = answerKeyStartIndex !== -1 ? lines.slice(0, answerKeyStartIndex) : lines;
  const contentText = questionContentLines.join('\n');

  // Split into question blocks by "Câu 1", "Câu 2", "Bài 1", or "1."
  // Pattern: start of line or double newline followed by "Câu X[:.]" or "Bài X[:.]"
  const questionBlockRegex = /(?:^|\n)(?:(?:Câu|Bài)\s*(\d+)[\.:\s]|(\d+)[\.:]\s+)([\s\S]*?)(?=(?:\n(?:(?:Câu|Bài)\s*\d+[\.:\s]|\d+[\.:]\s+)|$))/gi;

  const questions: Question[] = [];
  let match: RegExpExecArray | null;
  let autoOrder = 1;

  while ((match = questionBlockRegex.exec(contentText)) !== null) {
    const qNumStr = match[1] || match[2];
    const qNum = qNumStr ? parseInt(qNumStr, 10) : autoOrder;
    const blockContent = match[3].trim();

    const parsedQ = parseSingleQuestionBlock(blockContent, qNum, answerKeyMap[qNum]);
    if (parsedQ) {
      questions.push(parsedQ);
      autoOrder++;
    }
  }

  // Fallback: If no "Câu X" was matched, try splitting by double newlines or looking for blocks with A. B. C. D.
  if (questions.length === 0 && rawText.trim().length > 0) {
    const rawBlocks = rawText.split(/\n\s*\n/);
    let fallbackOrder = 1;
    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (/[A-D][\.:\)]\s+/.test(trimmed)) {
        const parsed = parseSingleQuestionBlock(trimmed, fallbackOrder, answerKeyMap[fallbackOrder]);
        if (parsed) {
          questions.push(parsed);
          fallbackOrder++;
        }
      }
    }
  }

  if (questions.length === 0) {
    errors.push('Không nhận diện được câu hỏi nào. Vui lòng kiểm tra định dạng "Câu 1:", "A.", "B.", "C.", "D."');
  }

  return { questions, errors };
}

function parseSingleQuestionBlock(block: string, qOrder: number, externalAnswer?: string): Question | null {
  // Extract options A, B, C, D
  // Regex matches A. A) A: *A. [x] A.
  const optionRegex = new RegExp(
    '(?:^|\\n)\\s*(\\*|\\[x\\])?\\s*([A-D])[.:\\)]\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:\\*|\\[x\\])?\\s*[A-D][.:\\)]|\\n\\s*(?:Lời giải|Hướng dẫn giải|Giải thích|Đáp án|HD:)|$)',
    'gi'
  );

  let questionText = '';
  const options: QuestionOption[] = [];
  let inlineCorrectOption: string | null = null;
  let explanation: string | undefined;

  // Find the first option match index to split question text from options
  const firstOptionMatch = block.search(/(?:^|\n)\s*(\*|\[x\])?\s*[A-D][.:\)]/i);
  if (firstOptionMatch !== -1) {
    questionText = block.slice(0, firstOptionMatch).trim();
  } else {
    questionText = block.trim();
  }

  // Look for inline answer or explanation in the block
  // e.g. "Đáp án: A", "Đáp án đúng: B", "Lời giải: ..."
  const answerMatch = block.match(/(?:Đáp\s*án\s*(?:đúng)?|Chọn)[\s:_\-]*([A-D])/i);
  if (answerMatch) {
    inlineCorrectOption = answerMatch[1].toUpperCase();
  }

  const explMatch = block.match(/(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Giải\s*thích|HD)[\s:_\-]*([\s\S]*?)(?:Đáp\s*án|$)/i);
  if (explMatch) {
    explanation = explMatch[1].trim();
  }

  // Parse options
  let optMatch: RegExpExecArray | null;
  while ((optMatch = optionRegex.exec(block)) !== null) {
    const isMarked = Boolean(optMatch[1]);
    const letter = optMatch[2].toUpperCase();
    let optText = optMatch[3].trim();

    // Clean up any trailing "Đáp án:" from the last option
    optText = optText.replace(/(?:Lời\s*giải|Đáp\s*án)[\s\S]*$/i, '').trim();

    if (isMarked) {
      inlineCorrectOption = letter;
    }

    options.push({
      id: letter,
      text: optText || `Lựa chọn ${letter}`
    });
  }

  // Ensure standard options A, B, C, D if missing
  if (options.length === 0) {
    // If not standard options, create standard default placeholders
    return null;
  }

  const finalCorrect = inlineCorrectOption || externalAnswer || (options[0] ? options[0].id : 'A');

  return {
    id: `q_${qOrder}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    order: qOrder,
    text: questionText || `Nội dung câu hỏi ${qOrder}`,
    options: options.length > 0 ? options : [
      { id: 'A', text: 'Phương án A' },
      { id: 'B', text: 'Phương án B' },
      { id: 'C', text: 'Phương án C' },
      { id: 'D', text: 'Phương án D' },
    ],
    correctOptionId: finalCorrect,
    explanation: explanation || undefined,
    points: 1
  };
}

export const SAMPLE_RAW_EXAM = `Câu 1: Trong các số sau, số nào là số nguyên tố chẵn duy nhất?
A. 0
B. 1
C. 2
D. 4
Lời giải: Số 2 là số nguyên tố chẵn duy nhất trong tập hợp các số nguyên tố.
Đáp án: C

Câu 2: Công thức tính diện tích hình tròn bán kính R là:
A. S = 2 * π * R
B. S = π * R^2
C. S = 4 * π * R^2
D. S = π * R
Đáp án: B

Câu 3: Ai là tác giả của tác phẩm "Nam quốc sơn hà"?
A. Lý Thường Kiệt
B. Trần Hưng Đạo
C. Nguyễn Trãi
D. Quang Trung
Lời giải: Bài thơ "Nam quốc sơn hà" được cho là của danh tướng Lý Thường Kiệt đọc bên phòng tuyến sông Như Nguyệt.
Đáp án: A

Câu 4: Nước Việt Nam nằm ở khu vực nào của Châu Á?
A. Bắc Á
B. Nam Á
C. Đông Nam Á
D. Tây Á
Đáp án: C

Câu 5: Nguyên tố hóa học nào có ký hiệu là "Fe"?
A. Bạc
B. Vàng
C. Đồng
D. Sắt
Lời giải: Ký hiệu "Fe" bắt nguồn từ tiếng Latin "Ferrum", nghĩa là Sắt.
Đáp án: D`;
