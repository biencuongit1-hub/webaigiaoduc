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
export function parseRawExamText(
  rawText: string, 
  optionsOrImageMap?: Record<string, string> | { imageMap?: Record<string, string>; defaultImages?: string[] },
  defaultImagesArg?: string[]
): ParseResult {
  let imageMap: Record<string, string> | undefined = undefined;
  let defaultImages: string[] | undefined = undefined;

  if (optionsOrImageMap) {
    if ('imageMap' in optionsOrImageMap || 'defaultImages' in optionsOrImageMap) {
      const opts = optionsOrImageMap as { imageMap?: Record<string, string>; defaultImages?: string[] };
      imageMap = opts.imageMap;
      defaultImages = opts.defaultImages;
    } else {
      imageMap = optionsOrImageMap as Record<string, string>;
      defaultImages = defaultImagesArg;
    }
  }
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
    .replace(/([^\n])\s+(\(\s*(?:NB|TH|VD|VDC|VC)\s*\)[\.:\s\-–—]+)/gi, '$1\n$2')
    .replace(/([^\n])\s+((?:Câu|Question|Bài)\s*\d+)/gi, '$1\n$2')
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
    const solBlocks = solutionText.matchAll(/(?:^|\n)\s*(?:(?:(?:Câu|Question|Bài)\s*(\d+)|(\d+))\s*(?:\([^)]{1,25}\)|\[[^\]]{1,25}\])?\s*[\.:\s\-–—]+)([\s\S]*?)(?=(?:\n\s*(?:(?:(?:Câu|Question|Bài)\s*\d+|\d+)\s*(?:\([^)]{1,25}\)|\[[^\]]{1,25}\])?\s*[\.:\s\-–—]+)|$))/gi);
    for (const match of solBlocks) {
      const qNumStr = match[1] || match[2];
      const qNum = parseInt(qNumStr, 10);
      let solContent = match[3].trim();
      solContent = solContent.replace(/(?:---+|\*\*\*+|===+)?\s*(?:HẾT|THE\s*END|CÁN\s*BỘ\s*COI\s*THI|THÍ\s*SINH)[\s\S]*$/i, '').trim();
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
  const { mcQuestions: parsedMcQuestions, fallbackEssayQuestions } = parseMultipleChoiceBlocks(mcText, answerKeyMap, explanationMap, imageMap, defaultImages);
  const parsedEssayQuestions: Question[] = [
    ...fallbackEssayQuestions,
    ...parseEssayBlocks(essayText, parsedMcQuestions.length + fallbackEssayQuestions.length, explanationMap, imageMap, defaultImages)
  ];

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
 * Helper to parse a single Essay Question Block
 */
function parseSingleEssayBlock(
  blockContent: string,
  autoOrder: number,
  qNum: number,
  levelTag?: string,
  explanationMap?: Record<number, string>,
  imageMap?: Record<string, string>,
  defaultImages?: string[]
): Question | null {
  // Skip section header title lines
  if (/^(?:PHẦN\s*)?TỰ\s*LUẬN/i.test(blockContent) && blockContent.length < 50) {
    return null;
  }

  // Skip multiple choice questions that may have leaked
  if (/[A-D][\.:\)]/i.test(blockContent) && blockContent.includes('A.') && blockContent.includes('B.')) {
    return null;
  }

  let explicitPoints = 1.5;
  const pointsMatch = blockContent.match(/\(([\d\.,]+)\s*(?:đ|điểm)\)/i);
  if (pointsMatch) {
    const parsed = parseFloat(pointsMatch[1].replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) explicitPoints = parsed;
  }

  // Extract Model Answer / Rubric
  let modelAnswer = explanationMap?.[qNum] || '';
  let questionText = blockContent;

  const answerSplitMatch = blockContent.match(/(?:(?:Đáp\s*án|Hướng\s*dẫn\s*chấm|Biểu\s*điểm|Barem|Lời\s*giải)[\s:_\-]*)([\s\S]*)/i);
  if (answerSplitMatch) {
    if (!modelAnswer) {
      modelAnswer = answerSplitMatch[1].trim();
    }
    questionText = blockContent.slice(0, answerSplitMatch.index).trim();
  }

  // Clean question title and trailing exam footer
  questionText = questionText.replace(/^\(([\d\.,]+)\s*(?:đ|điểm)\)[\s:\-]*/i, '').trim();
  questionText = questionText.replace(/(?:---+|\*\*\*+|===+)?\s*(?:HẾT|THE\s*END|CÁN\s*BỘ\s*COI\s*THI|THÍ\s*SINH\s*KHÔNG\s*ĐƯỢC\s*SỬ\s*DỤNG\s*TÀI\s*LIỆU)[\s\S]*$/i, '').trim();

  if (levelTag && !questionText.startsWith('(') && !questionText.startsWith('[')) {
    questionText = `(${levelTag}) ${questionText}`;
  }

  // Extract essay question image if present
  let essayImage: string | undefined = undefined;
  const essayTokenMatch = questionText.match(/\[(HÌNH_ẢNH_?\d+|IMAGE_?\d+|IMG_?\d+|HÌNH_ẢNH_ĐỀ_THI)\]/i);
  if (essayTokenMatch) {
    essayImage = resolveImageToken(essayTokenMatch[0], imageMap, defaultImages);
    if (essayImage) {
      questionText = questionText.replace(essayTokenMatch[0], '').trim();
    }
  }

  if (!essayImage) {
    const essayImgMatch = questionText.match(/\[(?:HÌNH_ẢNH|IMAGE|HÌNH)\s*:\s*([^\]]+)\]/i) ||
                          questionText.match(/!\[.*?\]\(([^)]+)\)/i);
    if (essayImgMatch) {
      const candidate = essayImgMatch[1].trim();
      if (candidate.startsWith('data:') || candidate.startsWith('http')) {
        essayImage = candidate;
      } else {
        essayImage = resolveImageToken(candidate, imageMap, defaultImages);
      }
      questionText = questionText.replace(essayImgMatch[0], '').trim();
    }
  }

  if (questionText.length > 0) {
    return {
      id: `q_essay_${autoOrder}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: autoOrder,
      type: 'essay',
      text: questionText,
      options: [],
      modelAnswer: modelAnswer || 'Đáp án mẫu & Biểu điểm tự luận do giáo viên cung cấp.',
      explanation: modelAnswer || undefined,
      points: explicitPoints,
      image: essayImage
    };
  }

  return null;
}

/**
 * Parse Multiple Choice Question Blocks
 */
function parseMultipleChoiceBlocks(
  text: string, 
  answerKeyMap: Record<number, string>, 
  explanationMap: Record<number, string>,
  imageMap?: Record<string, string>,
  defaultImages?: string[]
): { mcQuestions: Question[]; fallbackEssayQuestions: Question[] } {
  const mcQuestions: Question[] = [];
  const fallbackEssayQuestions: Question[] = [];

  // Regex to split on "Câu 1:", "Câu 1(NB):", "Câu 1.", "Question 1:", "Bài 1:", "1.", or standalone tags like "(NB):", "[VD]:"
  const blockRegex = /(?:^|\n)\s*(?:(?:(?:(?:Câu|Question|Bài)\s*(\d+)|(\d+))\s*(?:\(([A-Za-z0-9\s]{1,15})\)|\[([A-Za-z0-9\s]{1,15})\])?|(?:\(([A-Za-z0-9\s]{1,15})\)|\[([A-Za-z0-9\s]{1,15})\]))\s*[\.:\s\-–—]+)([\s\S]*?)(?=(?:\n\s*(?:(?:(?:(?:Câu|Question|Bài)\s*\d+|\d+)\s*(?:\([A-Za-z0-9\s]{1,15}\)|\[[A-Za-z0-9\s]{1,15}\])?|(?:\([A-Za-z0-9\s]{1,15}\)|\[[A-Za-z0-9\s]{1,15}\]))\s*[\.:\s\-–—]+)|$))/gi;

  let match: RegExpExecArray | null;
  let autoOrder = 1;

  while ((match = blockRegex.exec(text)) !== null) {
    const qNumStr = match[1] || match[2];
    const qNum = qNumStr ? parseInt(qNumStr, 10) : autoOrder;
    const levelTag = (match[3] || match[4] || match[5] || match[6] || '').trim();
    const blockContent = match[7].trim();

    // Skip section header lines if captured as question
    if (/^(?:PHẦN\s*)?(?:TRẮC\s*NGHIỆM|TỰ\s*LUẬN)/i.test(blockContent) && !/[A-D][\.:\)]/i.test(blockContent)) {
      continue;
    }

    // Check if block has options A, B, C, D
    if (/[A-D][\.:\)]/i.test(blockContent)) {
      const externalExpl = explanationMap[qNum];
      const parsedQ = parseSingleMultipleChoiceBlock(blockContent, qNum, answerKeyMap[qNum], externalExpl, imageMap, defaultImages, levelTag);
      if (parsedQ) {
        mcQuestions.push(parsedQ);
        autoOrder++;
      }
    } else {
      const parsedEssay = parseSingleEssayBlock(blockContent, autoOrder, qNum, levelTag, explanationMap, imageMap, defaultImages);
      if (parsedEssay) {
        fallbackEssayQuestions.push(parsedEssay);
        autoOrder++;
      }
    }
  }

  return { mcQuestions, fallbackEssayQuestions };
}

// Helper function to resolve image token from imageMap
function resolveImageToken(
  token: string, 
  imageMap?: Record<string, string>, 
  defaultImages?: string[]
): string | undefined {
  if (!imageMap && (!defaultImages || defaultImages.length === 0)) return undefined;

  const cleanToken = token.trim();
  if (imageMap) {
    if (imageMap[cleanToken]) return imageMap[cleanToken];

    // Case and spacing insensitive lookup
    const normalizedKey = cleanToken.toLowerCase().replace(/\s+/g, '_');
    for (const [k, v] of Object.entries(imageMap)) {
      const normK = k.toLowerCase().replace(/\s+/g, '_');
      if (normK === normalizedKey || normK.replace(/[\[\]]/g, '') === normalizedKey.replace(/[\[\]]/g, '')) {
        return v;
      }
    }

    // Try number index if token is like [HÌNH_ẢNH_1]
    const numMatch = cleanToken.match(/\d+/);
    if (numMatch) {
      const idx = parseInt(numMatch[0], 10);
      const possibleKey1 = `[HÌNH_ẢNH_${idx}]`;
      const possibleKey2 = `[IMAGE_${idx}]`;
      if (imageMap[possibleKey1]) return imageMap[possibleKey1];
      if (imageMap[possibleKey2]) return imageMap[possibleKey2];
      
      const values = Object.values(imageMap);
      if (idx > 0 && idx <= values.length) {
        return values[idx - 1];
      }
    }
  }

  if (defaultImages && defaultImages.length > 0) {
    const numMatch = cleanToken.match(/\d+/);
    if (numMatch) {
      const idx = parseInt(numMatch[0], 10);
      if (idx > 0 && idx <= defaultImages.length) {
        return defaultImages[idx - 1];
      }
    }
    return defaultImages[0];
  }

  return undefined;
}

function parseSingleMultipleChoiceBlock(
  block: string, 
  qOrder: number, 
  externalAnswer?: string,
  externalExplanation?: string,
  imageMap?: Record<string, string>,
  defaultImages?: string[],
  levelTag?: string
): Question | null {
  // Normalize inline options that share a line: e.g. "A. x   B. y" -> separate lines
  const normalizedBlock = block
    .replace(/([^\n])\s{2,}(\*|\[x\])?\s*([A-D][.:\)])/g, '$1\n$2 $3')
    .replace(/([^\n])\t+(\*|\[x\])?\s*([A-D][.:\)])/g, '$1\n$2 $3')
    .replace(/([^\n\s][\.\?!;])\s+(\*|\[x\])?\s*([A-D][.:\)])/g, '$1\n$2 $3');

  // Option Regex to extract A., B., C., D.
  const optionRegex = /(?:^|\n)\s*(\*|\[x\])?\s*([A-D])[.:\)]\s*([\s\S]*?)(?=(?:\n\s*(?:\*|\[x\])?\s*[A-D][.:\)]|\n\s*(?:Lời\s*giải|Hướng\s*dẫn|Giải\s*thích|Đáp\s*án|HD:)|\s*$))/g;

  let questionText = '';
  const options: QuestionOption[] = [];
  let inlineCorrectOption: string | null = null;
  let explanation = externalExplanation;
  let explicitPoints = 1;

  // Check explicit points in question header: e.g. "(0.5 điểm)", "(0.5đ)", "(1đ)"
  const pointsMatch = normalizedBlock.match(/\(([\d\.,]+)\s*(?:đ|điểm)\)/i);
  if (pointsMatch) {
    const parsed = parseFloat(pointsMatch[1].replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) explicitPoints = parsed;
  }

  // Separate question text from options
  const firstOptionMatch = normalizedBlock.search(/(?:^|\n)\s*(\*|\[x\])?\s*[A-D][.:\)]/);
  if (firstOptionMatch !== -1) {
    questionText = normalizedBlock.slice(0, firstOptionMatch).trim();
  } else {
    questionText = normalizedBlock.trim();
  }

  // Clean trailing punctuation or points label from question text
  questionText = questionText.replace(/^\(([\d\.,]+)\s*(?:đ|điểm)\)[\s:\-]*/i, '').trim();

  // If level tag provided, ensure cognitive level tag is nicely formatted
  if (levelTag && !questionText.startsWith('(') && !questionText.startsWith('[')) {
    questionText = `(${levelTag}) ${questionText}`;
  }

  // Extract question image if present in question text
  let questionImage: string | undefined = undefined;

  // Pattern 1: Token [HÌNH_ẢNH_1] or [IMAGE_1] from imageMap
  const tokenMatch = questionText.match(/\[(HÌNH_ẢNH_?\d+|IMAGE_?\d+|IMG_?\d+|HÌNH_ẢNH_ĐỀ_THI)\]/i);
  if (tokenMatch) {
    const resolved = resolveImageToken(tokenMatch[0], imageMap, defaultImages);
    if (resolved) {
      questionImage = resolved;
      questionText = questionText.replace(tokenMatch[0], '').trim();
    }
  }

  // Pattern 2: [HÌNH_ẢNH: ...] or markdown image
  if (!questionImage) {
    const qImgMatch = questionText.match(/\[(?:HÌNH_ẢNH|IMAGE|HÌNH|ẢNH|HÌNH_VẼ)\s*:\s*([^\]]+)\]/i) ||
                      questionText.match(/!\[.*?\]\(([^)]+)\)/i);
    if (qImgMatch) {
      const candidate = qImgMatch[1].trim();
      if (candidate.startsWith('data:') || candidate.startsWith('http')) {
        questionImage = candidate;
      } else {
        questionImage = resolveImageToken(candidate, imageMap, defaultImages);
      }
      questionText = questionText.replace(qImgMatch[0], '').trim();
    }
  }

  // Pattern 3: OCR description tag like "[Hình ảnh minh họa: ...]"
  if (!questionImage) {
    const ocrFigureMatch = questionText.match(/\[(?:Hình\s*ảnh\s*minh\s*họa|Hình\s*vẽ|Sơ\s*đồ|Đồ\s*thị|Hình\s*bên)[^\]]*\]/i);
    if (ocrFigureMatch) {
      if (defaultImages && defaultImages.length > 0) {
        questionImage = defaultImages[0];
      }
      questionText = questionText.replace(ocrFigureMatch[0], '').trim();
    }
  }

  // Inline answer or explanation
  const answerMatch = normalizedBlock.match(/(?:Đáp\s*án\s*(?:đúng)?|Chọn)[\s:_\-]*([A-D])\b/i);
  if (answerMatch) {
    inlineCorrectOption = answerMatch[1].toUpperCase();
  }

  const explMatch = normalizedBlock.match(/(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Giải\s*thích|HD)[\s:_\-]*([\s\S]*?)(?:Đáp\s*án|$)/i);
  if (explMatch && !explanation) {
    explanation = explMatch[1].trim();
  }

  // Parse options
  let optMatch: RegExpExecArray | null;
  while ((optMatch = optionRegex.exec(normalizedBlock)) !== null) {
    const isMarked = Boolean(optMatch[1]);
    const letter = optMatch[2].toUpperCase();
    let optText = optMatch[3].trim();
    optText = optText.replace(/(?:Lời\s*giải|Đáp\s*án)[\s\S]*$/i, '').trim();
    optText = optText.replace(/(?:---+|\*\*\*+|===+)?\s*(?:HẾT|THE\s*END|CÁN\s*BỘ\s*COI\s*THI|THÍ\s*SINH\s*KHÔNG\s*ĐƯỢC\s*SỬ\s*DỤNG\s*TÀI\s*LIỆU)[\s\S]*$/i, '').trim();

    // Extract image attached to this option
    let optImage: string | undefined = undefined;

    // Pattern 1: Token [HÌNH_ẢNH_X] from imageMap
    const optTokenMatch = optText.match(/\[(HÌNH_ẢNH_?\d+|IMAGE_?\d+|IMG_?\d+)\]/i);
    if (optTokenMatch) {
      const resolved = resolveImageToken(optTokenMatch[0], imageMap, defaultImages);
      if (resolved) {
        optImage = resolved;
        optText = optText.replace(optTokenMatch[0], '').trim();
      }
    }

    // Pattern 2: Direct data URL or URL or token in tag
    if (!optImage) {
      const optImgMatch = optText.match(/\[(?:HÌNH_ẢNH|IMAGE|HÌNH|ẢNH)\s*:\s*([^\]]+)\]/i) ||
                          optText.match(/!\[.*?\]\(([^)]+)\)/i);
      if (optImgMatch) {
        const candidate = optImgMatch[1].trim();
        if (candidate.startsWith('data:') || candidate.startsWith('http')) {
          optImage = candidate;
        } else {
          optImage = resolveImageToken(candidate, imageMap, defaultImages);
        }
        optText = optText.replace(optImgMatch[0], '').trim();
      }
    }

    if (isMarked) {
      inlineCorrectOption = letter;
    }

    // Deduplicate options by letter so a question never has duplicate option IDs
    const existingIndex = options.findIndex((o) => o.id === letter);
    if (existingIndex >= 0) {
      options[existingIndex] = {
        id: letter,
        text: optText || `Phương án ${letter}`,
        image: optImage || options[existingIndex].image
      };
    } else {
      options.push({
        id: letter,
        text: optText || `Phương án ${letter}`,
        image: optImage
      });
    }
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
    points: explicitPoints,
    image: questionImage
  };
}

/**
 * Parse Essay Question Blocks
 */
function parseEssayBlocks(
  text: string, 
  startIndex: number,
  explanationMap: Record<number, string>,
  imageMap?: Record<string, string>,
  defaultImages?: string[]
): Question[] {
  if (!text.trim()) return [];

  const questions: Question[] = [];
  const blockRegex = /(?:^|\n)\s*(?:(?:(?:(?:Câu|Question|Bài)\s*(\d+)|(\d+))\s*(?:\(([A-Za-z0-9\s]{1,15})\)|\[([A-Za-z0-9\s]{1,15})\])?|(?:\(([A-Za-z0-9\s]{1,15})\)|\[([A-Za-z0-9\s]{1,15})\]))\s*[\.:\s\-–—]+)([\s\S]*?)(?=(?:\n\s*(?:(?:(?:(?:Câu|Question|Bài)\s*\d+|\d+)\s*(?:\([A-Za-z0-9\s]{1,15}\)|\[[A-Za-z0-9\s]{1,15}\])?|(?:\([A-Za-z0-9\s]{1,15}\)|\[[A-Za-z0-9\s]{1,15}\]))\s*[\.:\s\-–—]+)|$))/gi;

  let match: RegExpExecArray | null;
  let autoOrder = startIndex + 1;

  while ((match = blockRegex.exec(text)) !== null) {
    const qNumStr = match[1] || match[2];
    const qNum = qNumStr ? parseInt(qNumStr, 10) : autoOrder;
    const levelTag = (match[3] || match[4] || match[5] || match[6] || '').trim();
    const blockContent = match[7].trim();

    const parsedEssay = parseSingleEssayBlock(blockContent, autoOrder, qNum, levelTag, explanationMap, imageMap, defaultImages);
    if (parsedEssay) {
      questions.push(parsedEssay);
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

// Built-in presets based directly on user's real exam samples (Trường THCS Nguyễn Đôn)
export const EXAM_SAMPLE_PRESETS = [
  {
    id: 'sample_toan_thpt',
    title: 'Đề kiểm tra Môn Toán - Trường THCS Nguyễn Đôn (50 câu trắc nghiệm + Lời giải)',
    description: 'Đề chuẩn cấu trúc có bảng đáp án 50 câu (1-D 2-C 3-B...) và phần Lời giải chi tiết.',
    subject: 'Toán học',
    grade: 'Lớp 9',
    durationMinutes: 90,
    mcPoints: 10,
    essayPoints: 0,
    rawText: `PHÒNG GD&ĐT
TRƯỜNG THCS NGUYỄN ĐÔN
ĐỀ THI HỌC KỲ NĂM HỌC 2024 - 2025
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
    title: 'Đề kiểm tra Môn Tiếng Anh - Trường THCS Nguyễn Đôn',
    description: 'Đề thi Tiếng Anh chuẩn format gồm trắc nghiệm ngữ pháp, từ vựng và bài đọc hiểu.',
    subject: 'Tiếng Anh',
    grade: 'Lớp 9',
    durationMinutes: 45,
    mcPoints: 10,
    essayPoints: 0,
    rawText: `TRƯỜNG THCS NGUYỄN ĐÔN
ĐỀ KIỂM TRA ĐỊNH KỲ
MÔN TIẾNG ANH
Thời gian làm bài: 45 phút

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
  },
  {
    id: 'sample_tinhoc8_tinhson',
    title: 'Đề cương Giữa kỳ I - Tin học 8 - THCS Tịnh Sơn',
    description: 'Đề cương ôn tập Giữa kỳ I môn Tin học Lớp 8 - Trường THCS Tịnh Sơn (Sơn Tịnh), gồm 36 câu trắc nghiệm (NB, TH, VD) và 6 câu tự luận có đáp án và lời giải chi tiết.',
    subject: 'Tin học',
    grade: 'Lớp 8',
    durationMinutes: 45,
    mcPoints: 7,
    essayPoints: 3,
    rawText: `TRƯỜNG THCS TỊNH SƠN
UBND HUYỆN SƠN TỊNH
ĐỀ CƯƠNG GIỮA KỲ I - NĂM HỌC 2023 - 2024
Môn Tin học - Lớp 8

I. Phần trắc nghiệm. Hãy khoanh tròn chữ cái trước câu trả lời đúng nhất.
Câu 1(NB): Chiếc máy tính cơ học đầu tiên có tên là gì?
A. Pascaline.		 B. Babbage.			C. Charle.                    D. Digitus.
Câu 2(NB):Thành phần điện tử chính trong máy tính thế hệ thứ nhất là loại linh kiện điện tử nào?
A. Bóng bán dẫn. 				B. Đèn điện tử chân không.		
C. Mạch tích hợp.				D. Mạch tích hợp cỡ rất lớn.
Câu 3(NB): Máy tính cấu tạo dựa trên kiến trúc Von Neumann gồm những thành phần nào? 
A. Bộ xử lý, bộ phân tích, các cổng kết nối với thiết bị vào – ra và đường truyền giữa các bộ phận đó. 
B. Bộ xử lý, bộ nhớ, các cổng kết nối với thiết bị vào – ra và đường truyền giữa các bộ phận đó. 
C. Bộ phân tích, bộ nhớ, các cổng kết nối với thiết bị vào – ra và đường truyền giữa các bộ phận đó.
D. Bộ xử lý, bộ nhớ, bộ phân tích và đường truyền giữa các bộ phận đó 
Câu 4(NB): Cho đến hiện nay, máy tính điện tử đã trải qua bao nhiêu thế hệ?
A. 3.				B. 4.		C. 5.	D. 6.
Câu 5(NB): Máy tính điện tử ra đời vào
A. những năm 1900. 			B. những năm 1920.	
C. những năm 1940.			D. những năm 1960. 
Câu 6(NB):  Một trong những đặc điểm mà những chiếc máy tính phát minh sau đó hướng tới là gì?
A.Nhỏ, nhẹ, tiêu thụ ít điện năng.		B.To lớn hơn.
C.Dung lượng vừa phải.				D.Xử lí chậm.
Câu 7(NB): Đâu không phải là một trong những đặc điểm chính của thông tin số
A. Dễ dàng nhân bản.		B. Khó lan truyền.		C. Khó bị xóa bỏ hoàn toàn.
D. Có thể được truy cập từ xa nếu được phép.
Câu 8(NB): Một bức ảnh được chụp thì có điểm khác gì với một bức tranh tạo ra trên giấy?
A. Bức ảnh chụp luôn đắt tiền hơn.
B. Bức ảnh chụp không thể chuyển cho người khác.
C. Khi chuyển cho người khác, bức ảnh chụp không mất đi.
D. Khi chuyển cho người khác, bức ảnh chụp sẽ mất đi.
Câu 9(NB): Thông tin số là thông tin được mã hóa thành gì?
A. Các dãy bit.						B. Các bức ảnh.
C. Các dòng điện.			                     D. Các đoạn phim.
Câu 10(NB): Thông tin số có thể được truy cập từ xa thông qua gì?
A. Kết nối điện tử.		              B. Kết nối Internet.
C. Kết nối vật lý.		              D. Thông tin số không thể được truy cập từ xa.
Câu 11(NB): Từ nào còn thiếu trong chỗ trống:
Thông tin số …… được nhân bản và chia sẻ. 
A. dễ dàng.                 B. khó khăn.                    C. luôn luôn.              D. không bao giờ.
Câu 12(NB): Tại sao các thông tin số khó bị xóa bỏ hoàn toàn?
A. Vì các thông tin đã được mã hóa.
B. Vì nhân bản và chia sẻ thông tin số rất khó khăn.
C. Vì nhân bản và chia sẻ thông tin số rất dễ dàng.
D. Vì không có kết nối Internet.
Câu 13(VD): Thông tin trong môi trường số đáng tin cậy ở mức độ nào?
A. Hoàn toàn đáng tin cậy bởi vì luôn có người chịu trách nhiệm đối với thông tin cụ thể.
B. Chủ yếu là thông tin bịa đặt do mục đích của người tạo ra và lan truyền thông tin.
C. Hầu hết là những tin đồn từ người này qua người khác, từ nơi này đến nơi khác.
D. Mức độ tin cậy rất khác nhau, từ những thông tin sai lệch đến thông tin đáng tin cậy.
Câu 14(NB): Câu nói nào đúng khi nói về quyền tác giả của thông tin số?
A. Thông tin số là của tất cả mọi người, ai cũng có quyền chỉnh sửa và chia sẻ. 
B. Pháp luật bảo hộ quyền tác giả của thông tin số
C. Công ty sở hữu mạng xã hội, ứng dụng…là người duy nhất sở hữu quyền tác giả đối với thông tin số.
D. Việc chỉnh sửa và chia sẻ thông tin số trên Internet không chịu sự quản lý của Nhà nước và pháp luật.
Câu 15(NB): Thông tin số được nhiều tổ chức và cá nhân lưu trữ với dung lượng rất lớn,
A. được truy cập tự do và có độ tin cậy khác nhau.
B. được bảo hộ quyền tác giả và không đáng tin cậy.
C. được cấp quyền truy cập khác nhau.
D. được bảo hộ quyền tác giả và rất đáng tin cậy.
Câu 16(NB): Từ nào còn thiếu trong chỗ trống:
Thông tin số cần được quản lý, khai thác ……….. và có trách nhiệm
A. tự do.                 B. tối đa.                    C. an toàn.              D. nhanh chóng.
Câu 17(TH): Thế hệ máy tính nào bắt đầu sử dụng bàn phím và màn hình?
A. Thế hệ đầu tiên.	B. Thế hệ thứ hai.	C. Thế hệ thứ ba.	D. Thế hệ thứ tư.
Câu 18(NB): Hãy sắp xếp các thế hệ công cụ tính toán sau theo thứ tự thời gian:
a) Máy tính điện tử; b) Máy tính cơ học; c) Công cụ thủ công.
A. a -> b -> c.		B. b -> c -> a.	C. c -> a -> b.		D. c -> b -> a
Câu 19(VC): Bộ vi xử lý là linh kiện máy tính dựa trên công nghệ nào? 
A. Đèn điện tử chân không.	B. Linh kiện bán dẫn đơn giản.
C. Mạch tích hợp hàng chục, hàng trăm linh kiện bán dẫn.
D. Mạch tích hợp cỡ lớn, gồm hàng chục nghìn đến hàng triệu linh kiện bán dẫn.	
Câu 20(TH): Nguyên lý nào đã đặt nền móng cho sự phát triển của máy tính điện tử?
A. Nguyên lý Von Neumann		B. Nguyên lý năng lượng mặt trời
C. Nguyên lý Archimedes		D. Đáp án khác
Câu 21(VD): Vào thời điểm nước ta hoàn toàn thống nhất, năm 1975. Thế hệ máy tính điện tử nào đã xuất hiện ở nước ta ?
A. Thế hệ thứ năm	B. Thế hệ thứ tư	C. Thế hệ thứ ba	D. Thế hệ thứ nhất
Câu 22(NB): Thế hệ thứ nhất trong lịch sử phát triển máy tính diễn ra vào năm nào?
A. 1990 – nay 	B.1965 – 1974.	C. 1945 – 1955. 	D. 1955 – 1965.
Câu 23(NB): Máy tính được Babbage thiết kế để làm gì?
A. Thực hiện bốn phép tính số học		B. Tính toán ngoài bốn phép tính số học.
C. Thực hiện phép cộng				D. Thực hiện phép trừ
Câu 24(TH): Thông tin số có thể được truy cập như thế nào?
A. Có thể truy cập từ xa mà không cần sự đồng ý của người quản lí.
B. Có thể truy cập từ xa nếu được sự đồng ý của người quản lí.
C. Không thể truy cập từ xa dù được sự đồng ý của người quản lí.
D. Không thể truy cập từ xa nên không cần sự đồng ý của người quản lí.
Câu 25(TH): Phát biểu “ Thông tin số khó bị xóa bỏ hoàn toàn” có đúng không? Tại sao?
A. Đúng. Vì không xác định được tất cả những nơi nó được sao chép và lưu trữ.
B. Đúng. Vì sau khi xóa, tệp và thư mục vẫn còn được lưu trữ trong thùng rác.
C. Sai. Vì các tệp và thư mục dễ dàng bị xoá khỏi nơi nó được lưu trữ..
D. Sai. Vì thông tin số không giống như một tờ giấy để xé hay đốt đi được.
Câu 26(VD): Thông tin trong môi trường số đáng tin cậy ở mức độ nào?
A. Hoàn toàn đáng tin cậy bởi vì luôn có người chịu trách nhiệm đối với thông tin cụ thể.
B. Chủ yếu là thông tin bịa đặt do mục đích của người tạo ra và lan truyền thông tin.
C. Hầu hết là những tin đồn từ người này qua người khác, từ nơi này đến nơi khác.
D. Mức độ tin cậy rất khác nhau, từ những thông tin sai lệch đến thông tin đáng tin cậy.
Câu 27(NB): Đặc điểm của thông tin trên Internet là?
A. Thường xuyên được cập nhật; có thể tìm kiếm dễ dàng, nhanh chóng.
B. Có nguồn thông tin đáng tin cậy nhưng cũng có nguồn thông tin không thực sự đáng tin cậy.
C. Nguồn thông tin khổng lồ, đa dạng, phong phú.			D. Cả ba đặc điểm trên.
Câu 28(TH): Đặc điểm nào sau đây không thuộc về thông tin số?
A.Nhiều người có thể truy cập đồng thời.	B.Chỉ cho phép một người sử dụng tại một thời điểm.
C.Có công cụ hỗ trợ tìm kiếm, xử lí, chuyển đổi hiệu quả.	D.Có thể truy cập từ xa.
Câu 29(TH): Thông tin trong những trường hợp nào sau đây là không đáng tin cậy?
A.Thông tin trên website có tên miền là .gov.
B.Bài viết hướng dẫn phòng tránh dịch bệnh trên trang web của cơ quan y tế.
C.Bài viết của một cá nhân đăng tải trên mạng xã hội với mục đích bôi nhọ người khác.
D. Bài viết trên tài khoản mạng xã hội của một nhà báo có uy tín và có trích dẫn nguồn thông tin từ trang web của Chính phủ.
Câu 30(NB): Hành động nào sau đây không vi phạm đạo đức và pháp luật?
A. Đăng tải thông tin sai sự thật lên mạng.		B. Cố ý nghe, ghi âm trái phép các cuộc trò chuyện.
C. Tải một bài trình chiếu của người khác từ internet và sử dụng như là của mình tạo ra.
D. Tặng đĩa nhạc có bản quyền em đã mua cho người khác.
Câu 31(NB): Thông tin số có đặc điểm chính là?
A.Thông tin số dễ dàng được nhân bản và lan truyền nhưng khó bị xóa bỏ hoàn toàn.
B.Thông tin số không thể được truy cập từ xa nếu người quản lí thông tin đó cho phép.
C.Thông tin số không thể nhân bản và lan truyền nhưng khó bị xóa bỏ hoàn toàn.
D.Đáp án khác.
Câu 32(TH): Từ nào sau đây xuất hiện nhiều nhất cùng với từ “tìm kiếm", thuật ngữ được sử dụng để nói về việc tra cứu thông tin trên Internet?
A. Trang web.		B. Từ khoá.		C. Báo cáo.		D. Biểu mẫu.
Câu 33(TH): Ví dụ nào sau đây nói về thông tin có độ tin cậy thấp? 
A. Bài bình luận về một CD âm nhạc.	B. Bảng xếp hạng doanh thu âm nhạc.
C. Một bộ sưu tập các bản nhạc cũ.		D. Giá bán một CD âm nhạc thời xưa.
Câu 34(VD): Sau khi tạo xong bài trình chiếu về chủ đề “Năng lượng tái tạo” em có thể sử dụng phương tiện kĩ thuật số nào để chia sẻ bài trình chiếu cho các bạn trong lớp?
A. Thư  tay.				B. Thư điện tử.		
C. Máy tính cá nhân. 	  		D. In ra rồi gửi.
Câu 35(VD): Nguồn thông tin nào đáng tin cậy nhất khi em muốn tìm hiểu về chiếc Ipad em mới được tặng nhân dịp sinh nhật:
A. Hướng dẫn của nhà sản xuất		B.Hướng dẫn của một người bạn đã từng sử dụng
C. Hướng dẫn trên một số diễn đàn công nghệ	D. Hướng dẫn của ba mẹ em .
Câu 36(NB): Khi em đăng một bức ảnh lên mạng xã hội ở chế độ công khai, ai là người có thể tiếp cận bức ảnh đó?
A. Chỉ có bạn bè của em.				B. Không ai cả.
C. Chỉ có em.                               			D. Tất cả mọi người.

II. Phần tự luận.
Câu 37(TH) : Em hãy nêu một vài biểu hiện vi phạm đạo đức và pháp luật hay biểu hiện thiếu văn hoá khi sử dụng công nghệ số?
Câu 38(VD):Em hãy nêu một vài kết quả (địa chỉ trang web) đã tìm được với từ khoá “nguồn năng lượng tái tạo” mà em đã được thực hành. Theo em nguồn thông tin nào đáng tin cậy nhất?
Câu 39(VDC) :Khoa chia sẻ cho An bức ảnh ruộng lúa chín vàng mà mình đã chụp. An không hỏi ý kiến Khoa, tự mình sửa ảnh và sử dụng trong bài trình chiếu của mình.Theo em An làm đúng hay không?Vì sao? 
Câu 40 (NB): Thông tin số có những đặc điểm chính nào? 
Câu 41(VD):Làm thế nào để  xác định được thông tin có  đáng tin cậy hay không?
Câu 42(VDC): Em hãy kể một ví dụ về tin đồn(trong cuộc sống hoặc trên mạng) và trả lời các câu hỏi sau: Tin đồn đó xuất hiện từ sự việc nào? Tác hại của tin đồn dó là gì?

-----------HẾT----------
Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm

ĐÁP ÁN
 1.A	2.B	3.B	4.C	5.C	6.D	7.B	8.C
 9.A	10.B	11.A	12.C	13.D	14.B	15.C	16.C
 17.C	18.D	19.A	20.A	21.C	22.C	23.B	24.B
 25.A	26.D	27.D	28.B	29.C	30.D	31.C	32.B
 33.A	34.B	35.A	36.D

HƯỚNG DẪN GIẢI CHI TIẾT
Câu 37: 
- Quay phim trong rạp chiếu phim.
- Chụp ảnh ở nơi không cho phép (Hình 4.1 SGK trang 19)
- Ghi âm trái phép các cuộc nói chuyện.
- Tải về máy tính cá nhân các tệp bài hát, video có bản quyền để sử dụng mà chưa được phép.
- Sao chép thông tin từ một trang web và coi đó là của mình.
- Sử dụng phần mềm bẻ khoá.
- Phát trực tiếp (livestream) hoặc chia sẻ các vụ bạo lực học đường. Đưa lên mạng thông tin cá nhân của người khác mà chưa được phép…
- Tham gia, chia sẻ, quảng cáo cho các trang web cổ vũ bạo lực, đánh bạc…
(Học sinh chỉ cần nêu đúng 3 biểu hiện)
Câu 38: 
- Học sinh sẽ đưa ra một vài địa chỉ trang web.
- Nguồn thông tin đáng tin cậy nhất là thông tin tư cơ quan chính phủ.
Câu 39: 
- An làm không đúng.
- Vì An đã sử dụng ảnh của Khoa mà không có sự cho phép của Khoa.
Câu 40: Thông tin số có những đặc điểm chính nào?
Thông tin số có những đặc điểm chính như sau:
- Thông tin số dễ dàng được nhân bản và lan truyền nhưng khó bị xóa bỏ hoàn toàn
- Thông tin số có thể được truy cập từ xa nếu người quản lý thông tin đó cho phép
Câu 41:Làm thế nào để  xác định được thông tin có  đáng tin cậy hay không?
* Làm thế nào để  xác định được thông tin có  đáng tin cậy hay không?  
Để  xác định được thông tin có  đáng tin cậy hay không, ta cần:
- Kiểm tra nguồn thông tin
- Phân biệt ý kiến với sự kiện
- Kiểm tra chứng cứ của kết luận
- Đánh giá tính thời sự của thông tin
Câu 42: 
Ví dụ : Tin đồn về tác dụng của thuốc chữa bệnh Covid 19.
Tác hại: mất tiền và thêm bệnh.`
  }
];

export const SAMPLE_RAW_EXAM_MIXED = EXAM_SAMPLE_PRESETS[1].rawText;

