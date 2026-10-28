import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  FileText, 
  Bot, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck,
  ShieldX,
  ToggleLeft,
  ToggleRight,
  Save, 
  Copy, 
  ExternalLink,
  GraduationCap,
  Layers,
  ArrowRight,
  RefreshCw,
  UploadCloud,
  Calculator,
  PenTool,
  CheckSquare,
  HelpCircle,
  FileCheck,
  Image as ImageIcon,
  Camera,
  ZoomIn,
  X,
  Lock
} from 'lucide-react';
import { Exam, Question, ExamSettings, QuestionType } from '../types';
import { parseRawExamText, SAMPLE_RAW_EXAM_MIXED, EXAM_SAMPLE_PRESETS } from '../utils/parser';
import { extractTextFromFile, extractTextFromFiles, ExtractedDocument } from '../utils/fileExtractor';
import { generateExamShareUrl } from '../utils/shareUrl';
import { autoSupplementAnswers, formatAnswersBlock } from '../utils/answerSupplement';

export interface ExamCreatorProps {
  onSaveExam: (exam: Exam) => void;
  onNavigateToExam?: (examId: string) => void;
  onCancel?: () => void;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({
  onSaveExam,
  onNavigateToExam,
  onCancel
}) => {
  // Method tab: 'raw_text' | 'ai_generate' | 'manual'
  const [method, setMethod] = useState<'raw_text' | 'ai_generate' | 'manual'>('raw_text');

  // Basic Info
  const [title, setTitle] = useState('Đề kiểm tra Giữa kì - Trường THCS Nguyễn Đôn (Trắc nghiệm + Tự luận)');
  const [description, setDescription] = useState('Đề kiểm tra định kỳ Trường THCS Nguyễn Đôn kết hợp trắc nghiệm khách quan và tự luận có barem điểm.');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Lớp 9');
  const [targetClass, setTargetClass] = useState('9A1');
  const [restrictToGrade, setRestrictToGrade] = useState<boolean>(true);
  const [allowedGrades, setAllowedGrades] = useState<string[]>(['Lớp 9']);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [accessCode, setAccessCode] = useState(
    () => 'AI' + Math.floor(1000 + Math.random() * 9000)
  );

  // Section Point Allocation State
  const [multipleChoicePoints, setMultipleChoicePoints] = useState<number>(7.0);
  const [essayPoints, setEssayPoints] = useState<number>(3.0);
  const [filterType, setFilterType] = useState<'all' | 'multiple_choice' | 'essay'>('all');
  const [distributionMsg, setDistributionMsg] = useState<string | null>(null);

  // File Upload State
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; type: string; pageCount?: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Raw Text State
  const [rawText, setRawText] = useState(SAMPLE_RAW_EXAM_MIXED);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isAutoSolving, setIsAutoSolving] = useState(false);

  // AI Generator Form State
  const [aiTopic, setAiTopic] = useState('Định lý Pytago và Hệ thức lượng trong tam giác vuông');
  const [aiMcCount, setAiMcCount] = useState(5);
  const [aiEssayCount, setAiEssayCount] = useState(2);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Initial Questions parsed from sample
  const [questions, setQuestions] = useState<Question[]>(() => {
    const { questions: parsed, multipleChoicePoints: mcPts, essayPoints: esPts } = parseRawExamText(SAMPLE_RAW_EXAM_MIXED);
    if (mcPts) setMultipleChoicePoints(mcPts);
    if (esPts) setEssayPoints(esPts);
    return parsed;
  });

  // Settings
  const [settings, setSettings] = useState<ExamSettings>({
    shuffleQuestions: false,
    shuffleOptions: true,
    showResultImmediately: true,
    showAnswers: true,
    requireMinScoreForReview: false,
    minScoreToShowResult: 5.0,
    requireFullName: true,
    requireClass: true,
    requireStudentId: true,
    antiCheatProctoring: true,
    maxTabSwitchWarnings: 3,
    allowedAttempts: 1,
    password: ''
  });

  // Modal share
  const [savedExam, setSavedExam] = useState<Exam | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCloudDeploying, setIsCloudDeploying] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Extracted Images from uploaded exam files (Auto-browsed from docx, pdf, images)
  const [extractedImageMap, setExtractedImageMap] = useState<Record<string, string>>({});
  const [extractedImagesList, setExtractedImagesList] = useState<string[]>([]);
  const [selectedImagePickerTarget, setSelectedImagePickerTarget] = useState<{ qId: string; optId?: string } | null>(null);

  // Computed totals
  const totalPoints = Number((multipleChoicePoints + essayPoints).toFixed(1));
  const mcQuestions = useMemo(() => questions.filter((q) => (q.type || 'multiple_choice') === 'multiple_choice'), [questions]);
  const essayQuestions = useMemo(() => questions.filter((q) => q.type === 'essay'), [questions]);

  // Handle Parse Raw Text with auto-browsed image map
  const handleParseText = () => {
    const { questions: parsed, multipleChoicePoints: mcPts, essayPoints: esPts, errors } = parseRawExamText(
      rawText,
      {
        imageMap: extractedImageMap,
        defaultImages: extractedImagesList
      }
    );
    setParseErrors(errors);
    if (parsed.length > 0) {
      setQuestions(parsed);
      if (mcPts !== undefined && mcPts >= 0) setMultipleChoicePoints(mcPts);
      if (esPts !== undefined && esPts >= 0) setEssayPoints(esPts);
      const withImg = parsed.filter(q => q.image || q.options?.some(o => o.image)).length;
      setDistributionMsg(`Đã bóc tách thành công ${parsed.length} câu hỏi (${parsed.filter(q => q.type !== 'essay').length} trắc nghiệm, ${parsed.filter(q => q.type === 'essay').length} tự luận${withImg > 0 ? `, tự duyệt ${withImg} câu có hình ảnh` : ''})!`);
      setTimeout(() => setDistributionMsg(null), 4000);
    }
  };

  // Handle Auto-Supplement Answers after the last "HẾT" of the exam
  const handleAutoSupplementAnswers = async () => {
    if (!rawText.trim()) {
      alert('Vui lòng dán hoặc tải nội dung đề thi trước khi bổ sung đáp án!');
      return;
    }

    setIsAutoSolving(true);
    setParseErrors([]);

    try {
      const res = await autoSupplementAnswers(rawText);
      setRawText(res.updatedText);

      // Re-parse with newly supplemented answers
      const { questions: parsed, multipleChoicePoints: mcPts, essayPoints: esPts, errors } = parseRawExamText(
        res.updatedText,
        {
          imageMap: extractedImageMap,
          defaultImages: extractedImagesList
        }
      );
      setParseErrors(errors);
      if (parsed.length > 0) {
        setQuestions(parsed);
        if (mcPts !== undefined && mcPts >= 0) setMultipleChoicePoints(mcPts);
        if (esPts !== undefined && esPts >= 0) setEssayPoints(esPts);
      }

      setDistributionMsg(
        `Đã tự động bổ sung đáp án sau chữ HẾT thành công (${res.mcCount} câu trắc nghiệm dạng 1.D, ${res.essayCount} câu tự luận dạng "câu [N]. câu trả lời")!`
      );
      setTimeout(() => setDistributionMsg(null), 5000);
    } catch (err: any) {
      console.error('Lỗi bổ sung đáp án tự động:', err);
      alert(err instanceof Error ? err.message : 'Không thể tự động bổ sung đáp án.');
    } finally {
      setIsAutoSolving(false);
    }
  };

  // Process uploaded Word (.docx), PDF (.pdf), Text, or Image files
  const handleProcessUploadedFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const hasImage = files.some(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext || '') || f.type.startsWith('image/');
    });

    setIsExtractingFile(true);
    setIsExtractingImage(hasImage);
    setParseErrors([]);

    try {
      const extracted: ExtractedDocument = files.length === 1
        ? await extractTextFromFile(files[0])
        : await extractTextFromFiles(files);

      setUploadedFileInfo({
        name: extracted.fileName,
        type: extracted.fileType.toUpperCase(),
        pageCount: extracted.pageCount
      });
      setRawText(extracted.text);

      // Auto-extract title from first few lines if available
      const lines = extracted.text.split('\n').filter(l => l.trim().length > 3);
      const possibleTitle = lines.find(l => 
        l.toLowerCase().includes('đề thi') || 
        l.toLowerCase().includes('đề kiểm tra') || 
        l.toLowerCase().includes('kỳ thi')
      );
      if (possibleTitle && possibleTitle.length < 120) {
        setTitle(possibleTitle.trim());
      }

      // Collect new extracted images & tokens
      const newMap = { ...extractedImageMap, ...(extracted.imageMap || {}) };
      const newImages = Array.from(new Set([...extractedImagesList, ...(extracted.extractedImages || [])]));
      setExtractedImageMap(newMap);
      setExtractedImagesList(newImages);

      // Automatically parse questions and point allocations with imageMap & defaultImages
      const { questions: parsed, multipleChoicePoints: mcPts, essayPoints: esPts, errors } = parseRawExamText(
        extracted.text,
        {
          imageMap: newMap,
          defaultImages: newImages
        }
      );
      setParseErrors(errors);
      if (parsed.length > 0) {
        setQuestions(parsed);
        if (mcPts !== undefined && mcPts >= 0) setMultipleChoicePoints(mcPts);
        if (esPts !== undefined && esPts >= 0) setEssayPoints(esPts);
      }
      const withImgCount = parsed.filter(q => q.image || q.options?.some(o => o.image)).length;
      setDistributionMsg(
        hasImage
          ? `Đã nhận diện thành công hình ảnh đề thi bằng AI Vision (${parsed.length} câu hỏi)!`
          : `Đã đọc tệp ${extracted.fileName} thành công (${parsed.length} câu hỏi${newImages.length > 0 ? `, tự duyệt ${newImages.length} hình ảnh đi kèm` : ''}${withImgCount > 0 ? ` - ${withImgCount} câu có ảnh` : ''})!`
      );
      setTimeout(() => setDistributionMsg(null), 5000);
    } catch (err) {
      console.error('File extraction error:', err);
      setParseErrors([err instanceof Error ? err.message : String(err)]);
    } finally {
      setIsExtractingFile(false);
      setIsExtractingImage(false);
    }
  };

  // Upload file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      handleProcessUploadedFiles(Array.from(fileList));
    }
    e.target.value = '';
  };

  // Clipboard paste handler (supports Ctrl+V screenshots)
  const handleClipboardPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleProcessUploadedFiles(imageFiles);
    }
  };

  // Load Exam Preset
  const handleLoadPreset = (presetId: string) => {
    const preset = EXAM_SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setTitle(preset.title);
    setDescription(preset.description);
    setSubject(preset.subject);
    setGrade(preset.grade);
    setDurationMinutes(preset.durationMinutes);
    setRawText(preset.rawText);
    setMultipleChoicePoints(preset.mcPoints);
    setEssayPoints(preset.essayPoints);

    const { questions: parsed, errors } = parseRawExamText(preset.rawText);
    setParseErrors(errors);
    if (parsed.length > 0) {
      setQuestions(parsed);
    }
    setDistributionMsg(`Đã nạp đề mẫu: "${preset.title}" (${parsed.length} câu)!`);
    setTimeout(() => setDistributionMsg(null), 4000);
  };

  // Auto-distribute points evenly across questions
  const handleAutoDistributePoints = () => {
    const totalMc = mcQuestions.length;
    const totalEs = essayQuestions.length;

    if (totalMc === 0 && totalEs === 0) {
      alert('Chưa có câu hỏi nào trong đề thi!');
      return;
    }

    const mcPerQ = totalMc > 0 ? Number((multipleChoicePoints / totalMc).toFixed(2)) : 0;
    const esPerQ = totalEs > 0 ? Number((essayPoints / totalEs).toFixed(2)) : 0;

    const updated = questions.map((q) => {
      if (q.type === 'essay') {
        return { ...q, points: esPerQ };
      } else {
        return { ...q, points: mcPerQ };
      }
    });

    setQuestions(updated);
    setDistributionMsg(`Đã chia đều: Mỗi câu trắc nghiệm = ${mcPerQ} điểm, mỗi câu tự luận = ${esPerQ} điểm.`);
    setTimeout(() => setDistributionMsg(null), 4000);
  };

  // Preset point allocations
  const applyPointPreset = (mc: number, es: number) => {
    setMultipleChoicePoints(mc);
    setEssayPoints(es);
    
    // Also auto-distribute to questions
    const totalMc = mcQuestions.length;
    const totalEs = essayQuestions.length;
    const mcPerQ = totalMc > 0 ? Number((mc / totalMc).toFixed(2)) : 0;
    const esPerQ = totalEs > 0 ? Number((es / totalEs).toFixed(2)) : 0;

    const updated = questions.map((q) => {
      if (q.type === 'essay') {
        return { ...q, points: esPerQ };
      } else {
        return { ...q, points: mcPerQ };
      }
    });
    setQuestions(updated);
    setDistributionMsg(`Đã áp dụng tỉ lệ ${mc}đ Trắc nghiệm : ${es}đ Tự luận.`);
    setTimeout(() => setDistributionMsg(null), 3500);
  };

  // Add a Multiple Choice question
  const handleAddMultipleChoice = () => {
    const nextOrder = questions.length + 1;
    const defaultPoint = mcQuestions.length > 0 ? mcQuestions[0].points || 1 : 1;
    const newQ: Question = {
      id: `q_mc_${Date.now()}`,
      order: nextOrder,
      type: 'multiple_choice',
      text: `Nội dung câu hỏi trắc nghiệm số ${nextOrder}`,
      options: [
        { id: 'A', text: 'Phương án A' },
        { id: 'B', text: 'Phương án B' },
        { id: 'C', text: 'Phương án C' },
        { id: 'D', text: 'Phương án D' }
      ],
      correctOptionId: 'A',
      points: defaultPoint,
      explanation: 'Lời giải chi tiết câu hỏi này.'
    };
    setQuestions([...questions, newQ]);
  };

  // Add an Essay question
  const handleAddEssay = () => {
    const nextOrder = questions.length + 1;
    const defaultPoint = essayQuestions.length > 0 ? essayQuestions[0].points || 1.5 : 1.5;
    const newQ: Question = {
      id: `q_essay_${Date.now()}`,
      order: nextOrder,
      type: 'essay',
      text: `Nội dung đề bài tự luận số ${nextOrder}: Hãy trình bày các bước giải quyết...`,
      options: [],
      modelAnswer: 'Đáp án mẫu & hướng dẫn chấm chi tiết của giáo viên cho câu hỏi này.',
      rubric: '- Bước 1: 0.5 điểm\n- Bước 2: 0.5 điểm\n- Kết luận: 0.5 điểm',
      points: defaultPoint
    };
    setQuestions([...questions, newQ]);
  };

  // Toggle question type
  const handleToggleQuestionType = (id: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== id) return q;
        const newType: QuestionType = q.type === 'essay' ? 'multiple_choice' : 'essay';
        if (newType === 'essay') {
          return {
            ...q,
            type: 'essay',
            options: [],
            correctOptionId: undefined,
            modelAnswer: q.explanation || 'Đáp án mẫu & hướng dẫn chấm tự luận.',
            rubric: 'Barem điểm chi tiết.'
          };
        } else {
          return {
            ...q,
            type: 'multiple_choice',
            options: [
              { id: 'A', text: 'Phương án A' },
              { id: 'B', text: 'Phương án B' },
              { id: 'C', text: 'Phương án C' },
              { id: 'D', text: 'Phương án D' }
            ],
            correctOptionId: 'A',
            explanation: q.modelAnswer || 'Lời giải chi tiết.'
          };
        }
      })
    );
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    const updated = questions
      .filter((q) => q.id !== id)
      .map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
  };

  // Update question property
  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  // Update question option text
  const handleUpdateOption = (qId: string, optId: string, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;
        const currentOpts = q.options || [];
        const newOpts = currentOpts.map((opt) =>
          opt.id === optId ? { ...opt, text } : opt
        );
        return { ...q, options: newOpts };
      })
    );
  };

  // Update question option image
  const handleUpdateOptionImage = (qId: string, optId: string, image: string | undefined) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;
        const currentOpts = q.options || [];
        const newOpts = currentOpts.map((opt) =>
          opt.id === optId ? { ...opt, image } : opt
        );
        return { ...q, options: newOpts };
      })
    );
  };

  // Assign an auto-browsed extracted image from exam file to question or option
  const handleAssignExtractedImage = (imageSrc: string, targetQId: string, targetOptId?: string) => {
    if (targetOptId) {
      handleUpdateOptionImage(targetQId, targetOptId, imageSrc);
    } else {
      handleUpdateQuestion(targetQId, { image: imageSrc });
    }
    const qObj = questions.find(q => q.id === targetQId);
    setDistributionMsg(
      `Đã gắn hình ảnh vào ${targetOptId ? `Câu ${qObj?.order || ''} (Phương án ${targetOptId})` : `Câu ${qObj?.order || ''} (Đề bài)`} thành công!`
    );
    setSelectedImagePickerTarget(null);
    setTimeout(() => setDistributionMsg(null), 3500);
  };

  // AI Generator with mixed question types
  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const aiQuestions: Question[] = [];
      const mcAnswers: Record<number, string> = {};
      const essayAnswers: Record<number, string> = {};

      let examRawText = `TRƯỜNG THCS NGUYỄN ĐÔN\nĐỀ KIỂM TRA ĐỊNH KỲ\nMôn: ${subject} - ${grade}\nChủ đề: ${aiTopic}\nThời gian làm bài: ${durationMinutes} phút\n\nI. PHẦN TRẮC NGHIỆM (${multipleChoicePoints} điểm)\n`;

      // 1. Generate MC
      for (let i = 1; i <= aiMcCount; i++) {
        const correctLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        const chosenCorrect = correctLetters[(i - 1) % 4];
        mcAnswers[i] = chosenCorrect;

        const qText = `Câu hỏi về ${aiTopic}: Khẳng định nào sau đây là đúng về đặc điểm thứ ${i}?`;
        const qOptions = [
          { id: 'A', text: `Phương án A: ${chosenCorrect === 'A' ? `Định lý và tính chất chuẩn xác của ${aiTopic}` : `Trường hợp chưa đầy đủ`}` },
          { id: 'B', text: `Phương án B: ${chosenCorrect === 'B' ? `Định nghĩa chính xác theo chuẩn SGK của ${aiTopic}` : `Phát biểu ngược lại`}` },
          { id: 'C', text: `Phương án C: ${chosenCorrect === 'C' ? `Tính chất áp dụng đúng trong mọi điều kiện của ${aiTopic}` : `Quy tắc bổ trợ`}` },
          { id: 'D', text: `Phương án D: ${chosenCorrect === 'D' ? `Hệ thức liên hệ quan trọng nhất của ${aiTopic}` : `Ngoại lệ không thỏa mãn`}` }
        ];

        examRawText += `\nCâu ${i}: ${qText}\n`;
        qOptions.forEach(opt => {
          examRawText += `${opt.id}. ${opt.text}\n`;
        });

        aiQuestions.push({
          id: `q_ai_mc_${i}_${Date.now()}`,
          order: i,
          type: 'multiple_choice',
          text: qText,
          options: qOptions,
          correctOptionId: chosenCorrect,
          explanation: `Giải thích chi tiết: Áp dụng định nghĩa và tính chất cơ bản của ${aiTopic}.`,
          points: Number((multipleChoicePoints / Math.max(1, aiMcCount)).toFixed(2))
        });
      }

      // 2. Generate Essay
      examRawText += `\nII. PHẦN TỰ LUẬN (${essayPoints} điểm)\n`;
      for (let j = 1; j <= aiEssayCount; j++) {
        const order = aiMcCount + j;
        const essayQText = `Vận dụng kiến thức bài học ${aiTopic}. Hãy viết lời giải chi tiết và tính toán kết quả cuối cùng của bài toán thực tế sau.`;
        const essayAns = `1. Phân tích bài toán, vẽ hình minh họa và tóm tắt đại lượng đã cho.\n2. Vận dụng trực tiếp định lý ${aiTopic} để thiết lập phương trình liên hệ.\n3. Biến đổi trung gian chính xác và đưa ra kết luận đáp số.`;
        essayAnswers[order] = essayAns;

        examRawText += `\nCâu ${order}: ${essayQText}\n`;

        aiQuestions.push({
          id: `q_ai_es_${j}_${Date.now()}`,
          order,
          type: 'essay',
          text: essayQText,
          options: [],
          modelAnswer: essayAns,
          rubric: `- Thiết lập phương trình đúng: 0.5 điểm\n- Các bước biến đổi trung gian: 0.5 điểm\n- Đáp số đúng kèm đơn vị: 0.5 điểm`,
          points: Number((essayPoints / Math.max(1, aiEssayCount)).toFixed(2))
        });
      }

      // Format answers strictly after HẾT
      const answerSection = formatAnswersBlock(mcAnswers, essayAnswers);
      const fullExamWithAnswers = `${examRawText.trim()}\n\n${answerSection}`;
      setRawText(fullExamWithAnswers);

      setQuestions(aiQuestions);
      setTitle(`Đề kiểm tra AI: ${aiTopic} (${subject} ${grade})`);
      setIsGeneratingAI(false);
      setDistributionMsg(`Đã tạo đề AI: ${aiMcCount} câu trắc nghiệm (1.D) + ${aiEssayCount} câu tự luận (câu [N]. câu trả lời) sau chữ HẾT!`);
      setTimeout(() => setDistributionMsg(null), 4000);
    }, 600);
  };

  // Save Exam
  const handleSave = async () => {
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi vào đề thi!');
      return;
    }

    setIsCloudDeploying(true);
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: title.trim() || 'Đề kiểm tra trắc nghiệm & tự luận',
      description: description.trim(),
      subject,
      grade,
      allowedGrades: restrictToGrade ? (allowedGrades.length > 0 ? allowedGrades : [grade]) : ['all'],
      restrictToGrade,
      targetClass,
      durationMinutes: Number(durationMinutes) || 45,
      totalPoints,
      multipleChoicePoints,
      essayPoints,
      questions,
      settings,
      createdAt: new Date().toISOString(),
      teacherName: 'Giáo viên bộ môn',
      accessCode: accessCode.trim().toUpperCase() || 'AI' + Math.floor(100 + Math.random() * 900),
      status: 'published'
    };

    try {
      await onSaveExam(newExam);
      setSavedExam(newExam);
    } finally {
      setIsCloudDeploying(false);
    }
  };

  // Filtered Questions list
  const filteredQuestions = useMemo(() => {
    if (filterType === 'multiple_choice') {
      return questions.filter((q) => (q.type || 'multiple_choice') === 'multiple_choice');
    }
    if (filterType === 'essay') {
      return questions.filter((q) => q.type === 'essay');
    }
    return questions;
  }, [questions, filterType]);

  // Copy share link
  const handleCopyLink = () => {
    const shareUrl = generateExamShareUrl(savedExam?.accessCode || accessCode);
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Trình Soạn Đề Thời Đại AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tạo Đề Thi Trắc Nghiệm & Tự Luận
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tự upload đề thi, nhập đáp án mẫu và chủ động phân bổ điểm số riêng cho từng phần
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isCloudDeploying}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isCloudDeploying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Deploy Lên Firebase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu & Tự Động Deploy Lên Firebase</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. BASIC INFORMATION & EXAM SETTINGS */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">
            1. Thông Tin Cơ Bản & Cài Đặt Phòng Thi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề đề thi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề kiểm tra 1 tiết - Học kỳ II môn Toán 9 (Trắc nghiệm + Tự luận)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Môn học
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option>Toán học</option>
              <option>Vật lý</option>
              <option>Hóa học</option>
              <option>Sinh học</option>
              <option>Ngữ văn</option>
              <option>Lịch sử & Địa lý</option>
              <option>Tiếng Anh</option>
              <option>Tin học</option>
              <option>Giáo dục công dân</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khối lớp chính *
            </label>
            <select
              value={grade}
              onChange={(e) => {
                const newG = e.target.value;
                setGrade(newG);
                if (!allowedGrades.includes(newG)) {
                  setAllowedGrades([newG]);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option>Lớp 6</option>
              <option>Lớp 7</option>
              <option>Lớp 8</option>
              <option>Lớp 9</option>
              <option>Lớp 10</option>
              <option>Lớp 11</option>
              <option>Lớp 12</option>
              <option>Tất cả các khối</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lớp áp dụng (Mặc định)
            </label>
            <input
              type="text"
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              placeholder="VD: 9A1, 9A2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Grade Restriction Setting */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Giới hạn học sinh làm bài theo khối lớp
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Khi bật, chỉ học sinh đăng ký đúng khối lớp được chọn mới nhìn thấy và được phép vào thi đề này
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictToGrade}
                  onChange={(e) => setRestrictToGrade(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {restrictToGrade && (
              <div className="pt-2 border-t border-blue-200/60">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Các khối lớp được phép làm bài này:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map((g) => {
                    const isSelected = allowedGrades.includes(g) || grade === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Don't uncheck the main grade
                            if (g === grade) return;
                            setAllowedGrades(allowedGrades.filter(x => x !== g));
                          } else {
                            setAllowedGrades([...allowedGrades, g]);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {g} {g === grade && '(Chính)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thời gian làm bài (Phút)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Proctoring Settings Checklist - PROMINENT ON/OFF TOGGLE */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Tính năng Giám Sát Chống Gian Lận (Proctoring)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  settings.antiCheatProctoring 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}>
                  {settings.antiCheatProctoring ? 'Đang BẬT' : 'Đang TẮT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bật hoặc tắt tính năng theo dõi chuyển tab, mất tiêu điểm trình duyệt khi học sinh làm bài
              </p>
            </div>

            {/* Big Interactive Toggle Switch */}
            <button
              type="button"
              onClick={() => setSettings({ ...settings, antiCheatProctoring: !settings.antiCheatProctoring })}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                settings.antiCheatProctoring
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {settings.antiCheatProctoring ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>BẬT GIÁM SÁT THI</span>
                  <ToggleRight className="w-5 h-5 text-emerald-200" />
                </>
              ) : (
                <>
                  <ShieldX className="w-4 h-4 text-slate-400" />
                  <span>TẮT GIÁM SÁT THI</span>
                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                </>
              )}
            </button>
          </div>

          {/* Context box depending on Proctoring state */}
          {settings.antiCheatProctoring ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Chế độ kiểm tra chính thức (Có giám sát):</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Hệ thống sẽ tự động phát hiện và ghi lại thời gian học sinh chuyển sang tab khác, mở ứng dụng khác hoặc rời khỏi trang thi.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-bold text-emerald-900">
                  Số lần cảnh báo tối đa trước khi tự động nộp bài:
                </span>
                <select
                  value={settings.maxTabSwitchWarnings || 3}
                  onChange={(e) => setSettings({ ...settings, maxTabSwitchWarnings: Number(e.target.value) })}
                  className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1}>1 lần (Nghiêm ngặt nhất)</option>
                  <option value={2}>2 lần</option>
                  <option value={3}>3 lần (Khuyên dùng)</option>
                  <option value={5}>5 lần</option>
                  <option value={10}>10 lần (Nhắc nhở nhẹ)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2.5">
              <ShieldX className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                <strong>Chế độ tự do (Không giám sát):</strong> Học sinh có thể thoải mái chuyển tab, tra cứu tài liệu hoặc làm bài tập về nhà mà không bị cảnh báo vi phạm hay khóa bài.
              </span>
            </div>
          )}

          {/* Other exam options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shuffleOptions}
                onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Đảo phương án A, B, C, D
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Hoán vị ngẫu nhiên các lựa chọn câu trắc nghiệm
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.showAnswers}
                onChange={(e) => setSettings({ ...settings, showAnswers: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Xem đáp án & barem chấm
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Cho phép học sinh đối chiếu bài làm sau khi nộp
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.showResultImmediately}
                onChange={(e) => setSettings({ ...settings, showResultImmediately: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Hiện điểm trắc nghiệm ngay
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Học sinh thấy điểm trắc nghiệm ngay khi nộp bài
                </span>
              </div>
            </label>
          </div>

          {/* GIỚI HẠN ĐIỂM ĐẠT ĐƯỢC MỚI XEM KẾT QUẢ / ĐÁP ÁN */}
          <div className={`mt-3 p-4 rounded-2xl border transition-all ${
            settings.requireMinScoreForReview
              ? 'bg-amber-50/80 border-amber-300 shadow-xs'
              : 'bg-slate-50/60 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  settings.requireMinScoreForReview ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Giới hạn điểm làm được mới xem được kết quả & đáp án
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      settings.requireMinScoreForReview
                        ? 'bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {settings.requireMinScoreForReview ? 'Đang BẬT' : 'Đang TẮT'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thí sinh phải đạt từ số điểm tối thiểu này trở lên mới được mở khóa xem đáp án và giải thích chi tiết. Nếu chưa đạt, hệ thống sẽ nhắc học sinh ôn tập thêm.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!!settings.requireMinScoreForReview}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    requireMinScoreForReview: e.target.checked,
                    minScoreToShowResult: settings.minScoreToShowResult ?? 5.0
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {settings.requireMinScoreForReview && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-wrap items-center gap-3">
                <label className="text-xs font-bold text-amber-900">
                  Điểm tối thiểu cần đạt để mở khóa kết quả / đáp án:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={totalPoints || 10}
                    value={settings.minScoreToShowResult ?? 5.0}
                    onChange={(e) => setSettings({ ...settings, minScoreToShowResult: Number(e.target.value) })}
                    className="w-24 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-black text-amber-900 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-amber-800">/ {totalPoints} điểm</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  {[5.0, 6.0, 7.0, 8.0].map((presetScore) => (
                    <button
                      key={presetScore}
                      type="button"
                      onClick={() => setSettings({ ...settings, minScoreToShowResult: presetScore })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        settings.minScoreToShowResult === presetScore
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {presetScore}đ
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. POINT ALLOCATION & EXAM STRUCTURE PANEL (THE CORE USER REQUEST) */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4" />
              Công Cụ Phân Bổ Điểm Số Tự Động
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Phân Bổ Điểm Trắc Nghiệm & Tự Luận
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Bạn tự phân chia điểm số cho từng phần theo đúng barem và ma trận đề thi mong muốn
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-xs border border-white/10 text-right">
              <div className="text-[11px] text-slate-300">Tổng điểm đề thi</div>
              <div className="text-2xl font-black text-amber-400 leading-tight">
                {totalPoints} <span className="text-xs text-slate-300 font-medium">điểm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Ratio */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-blue-300 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              Phần Trắc Nghiệm: {multipleChoicePoints}đ ({mcQuestions.length} câu)
            </span>
            <span className="text-purple-300 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5" />
              Phần Tự Luận: {essayPoints}đ ({essayQuestions.length} câu)
            </span>
          </div>

          <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden flex p-0.5 gap-1">
            <div
              className="bg-blue-500 h-full rounded-l-full transition-all duration-300"
              style={{
                width: `${totalPoints > 0 ? (multipleChoicePoints / totalPoints) * 100 : 70}%`
              }}
              title={`Trắc nghiệm: ${multipleChoicePoints} điểm`}
            />
            <div
              className="bg-purple-500 h-full rounded-r-full transition-all duration-300"
              style={{
                width: `${totalPoints > 0 ? (essayPoints / totalPoints) * 100 : 30}%`
              }}
              title={`Tự luận: ${essayPoints} điểm`}
            />
          </div>
        </div>

        {/* Point inputs & quick preset buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trắc nghiệm Input */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-sm font-bold text-white">Điểm Phần Trắc Nghiệm</span>
              </div>
              <span className="text-xs text-blue-300 font-semibold">
                {mcQuestions.length} câu hiện có
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step={0.25}
                min={0}
                max={20}
                value={multipleChoicePoints}
                onChange={(e) => setMultipleChoicePoints(Math.max(0, Number(e.target.value)))}
                className="w-28 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-black text-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="text-xs text-slate-300 leading-tight">
                Mỗi câu tương đương: <strong className="text-blue-300">{mcQuestions.length > 0 ? (multipleChoicePoints / mcQuestions.length).toFixed(2) : 0} điểm</strong>
              </div>
            </div>
          </div>

          {/* Tự luận Input */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-sm font-bold text-white">Điểm Phần Tự Luận</span>
              </div>
              <span className="text-xs text-purple-300 font-semibold">
                {essayQuestions.length} câu hiện có
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step={0.25}
                min={0}
                max={20}
                value={essayPoints}
                onChange={(e) => setEssayPoints(Math.max(0, Number(e.target.value)))}
                className="w-28 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-black text-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <div className="text-xs text-slate-300 leading-tight">
                Mỗi câu tương đương: <strong className="text-purple-300">{essayQuestions.length > 0 ? (essayPoints / essayQuestions.length).toFixed(2) : 0} điểm</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Preset buttons row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Tỉ lệ phổ biến:</span>
            <button
              type="button"
              onClick={() => applyPointPreset(7, 3)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              7đ TN : 3đ TL (Chuẩn GDPT)
            </button>
            <button
              type="button"
              onClick={() => applyPointPreset(8, 2)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              8đ TN : 2đ TL
            </button>
            <button
              type="button"
              onClick={() => applyPointPreset(5, 5)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              5đ TN : 5đ TL (50/50)
            </button>
            <button
              type="button"
              onClick={() => applyPointPreset(10, 0)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              100% Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => applyPointPreset(0, 10)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              100% Tự luận
            </button>
          </div>

          <button
            type="button"
            onClick={handleAutoDistributePoints}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>⚡ Chia đều điểm cho các câu</span>
          </button>
        </div>

        {distributionMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium animate-in fade-in">
            ✓ {distributionMsg}
          </div>
        )}
      </section>

      {/* 3. METHOD TABS: TEXT/WORD UPLOAD vs AI vs MANUAL */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setMethod('raw_text')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              method === 'raw_text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Nhập nhanh từ Word / Text (Có Trắc nghiệm & Tự luận)
          </button>

          <button
            type="button"
            onClick={() => setMethod('manual')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              method === 'manual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Soạn thảo thủ công từng câu
          </button>

          <button
            type="button"
            onClick={() => setMethod('ai_generate')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              method === 'ai_generate'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            Trợ lý AI Tạo Đề Tự Động
          </button>
        </div>

        {/* METHOD 1: RAW TEXT / WORD & PDF UPLOAD */}
        {method === 'raw_text' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            {/* Header & Preset Buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Tải Lên File Word (.docx), PDF (.pdf) Hoặc Dán Văn Bản Đề Thi</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ đầy đủ: Đề trắc nghiệm 50 câu có Bảng đáp án & Lời giải chi tiết, đề tự luận hoặc đề thi hỗn hợp trắc nghiệm + tự luận có barem điểm.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4" />
                    <span>Tải tệp Word / PDF (.docx, .pdf)</span>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <label className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>📷 Tải ảnh đề thi / Chụp ảnh (AI Vision OCR)</span>
                    <input
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sample Presets row matching user's PDF templates */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Mẫu đề thi thực tế chuẩn theo tệp PDF:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('sample_toan_thpt')}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                  >
                    📐 Đề Toán - THCS Nguyễn Đôn (Bảng Đ/A & Lời giải)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('sample_daiso8_mixed')}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-400 hover:text-purple-600 text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                  >
                    ✏️ Đề Đại số 8 (TN 2đ + TL 8đ Barem)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('sample_anh_thpt')}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 text-[11px] font-bold text-slate-700 transition-colors shadow-2xs"
                  >
                    🇬🇧 Đề Tiếng Anh THPT (50 câu + Đáp án)
                  </button>
                </div>
              </div>
            </div>

            {/* Drag and drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = Array.from(e.dataTransfer.files || []);
                if (files.length > 0) handleProcessUploadedFiles(files);
              }}
              onPaste={handleClipboardPaste}
              tabIndex={0}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer focus:outline-none focus:border-purple-500 ${
                isDragging
                  ? 'border-purple-500 bg-purple-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-purple-400 bg-slate-50/50'
              }`}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.docx,.pdf,.txt,image/*,.png,.jpg,.jpeg,.webp';
                input.multiple = true;
                input.onchange = (e) => {
                  const fileList = (e.target as HTMLInputElement).files;
                  if (fileList && fileList.length > 0) {
                    handleProcessUploadedFiles(Array.from(fileList));
                  }
                };
                input.click();
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-purple-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800">
                  Kéo thả tệp Word (.docx), PDF (.pdf), hoặc <span className="text-purple-600 underline">Ảnh chụp đề thi</span> vào đây, hoặc bấm để chọn tệp
                </div>
                <div className="text-[11px] text-slate-500">
                  Hệ thống tự động OCR nhận diện ảnh bằng Gemini AI Vision, đọc bảng đáp án & lời giải (Hỗ trợ chụp nhiều trang / Bấm Ctrl + V để Dán ảnh)
                </div>
              </div>

              {isExtractingFile && (
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-purple-800 bg-purple-100/90 border border-purple-200 px-4 py-2 rounded-full animate-pulse shadow-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                  <span>
                    {isExtractingImage
                      ? '🤖 Đang nhận diện đề thi từ hình ảnh bằng Gemini Vision OCR... Vui lòng đợi trong giây lát...'
                      : 'Đang trích xuất nội dung từ tệp tài liệu...'}
                  </span>
                </div>
              )}

              {uploadedFileInfo && !isExtractingFile && (
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã tải: {uploadedFileInfo.name} ({uploadedFileInfo.type}{uploadedFileInfo.pageCount ? ` - ${uploadedFileInfo.pageCount} trang` : ''})</span>
                </div>
              )}
            </div>

            {/* Textarea for viewing and editing extracted text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Nội dung văn bản đề thi & đáp án:</span>
                <span className="text-slate-400 font-normal">
                  Có thể chỉnh sửa trực tiếp bên dưới trước khi bóc tách
                </span>
              </div>
              <textarea
                rows={12}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onPaste={handleClipboardPaste}
                placeholder="Dán toàn bộ đề thi có phần trắc nghiệm, phần tự luận, bảng đáp án và lời giải chi tiết vào đây... (Hoặc bấm Ctrl + V để dán trực tiếp ảnh chụp đề thi)"
                className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 leading-relaxed"
              />
            </div>

            {/* Guide badge explaining answer format after HẾT */}
            <div className="flex items-start sm:items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 shadow-2xs">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="leading-relaxed">
                <span className="font-bold text-indigo-950">Quy chuẩn đáp án sau chữ HẾT: </span>
                Đáp án nằm ở phần cuối cùng sau chữ <strong>HẾT</strong> của đề. Trắc nghiệm dạng <span className="font-mono font-bold bg-white/80 px-1 py-0.5 rounded text-indigo-700">1.D</span> (câu 1 đáp án D), tự luận dạng <span className="font-mono font-bold bg-white/80 px-1 py-0.5 rounded text-purple-700">câu 37. câu trả lời</span>.
              </div>
            </div>

            {parseErrors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Cảnh báo cấu trúc bóc tách:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  {parseErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isAutoSolving}
                onClick={handleAutoSupplementAnswers}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group"
                title="AI phân tích toàn bộ đề thi và tự động bổ sung đáp án sau chữ HẾT (1.D cho trắc nghiệm, câu [N]. cho tự luận)"
              >
                {isAutoSolving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Đang tự bổ sung đáp án sau HẾT...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>AI Tự bổ sung đáp án (sau chữ HẾT)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleParseText}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Bóc tách câu hỏi & cập nhật đề thi</span>
              </button>
            </div>
          </div>
        )}

        {/* METHOD 2: AI GENERATOR */}
        {method === 'ai_generate' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bot className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Trợ Lý AI Tạo Đề Thi Kết Hợp Trắc Nghiệm & Tự Luận
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chủ đề / Bài học kiến thức cần kiểm tra
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="VD: Định lý Pytago và tam giác đồng dạng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số câu trắc nghiệm
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={aiMcCount}
                    onChange={(e) => setAiMcCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số câu tự luận
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiEssayCount}
                    onChange={(e) => setAiEssayCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={handleGenerateAI}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo câu hỏi & barem đáp án...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Kích hoạt AI tạo đề thi ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. QUESTIONS PREVIEW & INLINE EDITOR */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh Sách Câu Hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-slate-500">
              Kiểm tra đề bài, đáp án đúng/mẫu và điều chỉnh điểm số của từng câu
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('multiple_choice')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'multiple_choice' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Trắc nghiệm ({mcQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('essay')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'essay' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tự luận ({essayQuestions.length})
              </button>
            </div>

            {/* Action buttons */}
            <button
              type="button"
              onClick={handleAddMultipleChoice}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Thêm câu Trắc nghiệm
            </button>

            <button
              type="button"
              onClick={handleAddEssay}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + Thêm câu Tự luận
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* KHO HÌNH ẢNH TỰ DUYỆT TỪ TỆP ĐỀ GỬI                       */}
        {/* ======================================================== */}
        {extractedImagesList.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/80 to-purple-50/90 rounded-2xl border border-indigo-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>Kho Hình Ảnh Tự Duyệt Từ Tệp Đề ({extractedImagesList.length} ảnh)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      Tự động gán theo định dạng tệp đề
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tệp Word/PDF có hình ảnh đi kèm sẵn. Hệ thống đã tự động liên kết vào câu hỏi hoặc câu trả lời. Thầy/cô có thể bấm ảnh để xem lớn hoặc chọn gán lại nhanh.
                  </p>
                </div>
              </div>

              <div className="text-[11px] font-bold text-indigo-700 bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-200">
                {questions.filter(q => q.image || q.options?.some(o => o.image)).length} / {questions.length} câu đã có ảnh
              </div>
            </div>

            {/* Grid of Extracted Images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {extractedImagesList.map((imgSrc, imgIdx) => {
                const usedInQuestion = questions.find(q => q.image === imgSrc);
                const usedInOption = questions.find(q => q.options?.some(o => o.image === imgSrc));
                const optMatch = usedInOption?.options?.find(o => o.image === imgSrc);

                return (
                  <div 
                    key={`extracted_img_${imgIdx}`} 
                    className="p-2.5 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2 flex flex-col justify-between hover:border-indigo-400 transition-all"
                  >
                    <div 
                      className="relative group cursor-pointer aspect-video bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100"
                      onClick={() => setZoomedImage(imgSrc)}
                      title="Nhấp để xem phóng to"
                    >
                      <img 
                        src={imgSrc} 
                        alt={`Ảnh tệp đề #${imgIdx + 1}`} 
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Xem lớn</span>
                      </div>
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        #{imgIdx + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold truncate">
                        {usedInQuestion ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block truncate">
                            ✓ Câu {usedInQuestion.order} (Đề bài)
                          </span>
                        ) : usedInOption && optMatch ? (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 block truncate">
                            ✓ Câu {usedInOption.order} (Đ/A {optMatch.id})
                          </span>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded block truncate">
                            Chưa gán vào câu
                          </span>
                        )}
                      </div>

                      {/* Dropdown to reassign */}
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const [targetQId, targetOptId] = val.split(':');
                          handleAssignExtractedImage(imgSrc, targetQId, targetOptId || undefined);
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="w-full text-[10px] font-semibold py-1 px-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="" disabled>+ Gán vào câu...</option>
                        {questions.map((q) => (
                          <React.Fragment key={`assign_q_${q.id}`}>
                            <option value={`${q.id}:`}>Câu {q.order} (Đề bài)</option>
                            {(q.options || []).map((o) => (
                              <option key={`assign_opt_${q.id}_${o.id}`} value={`${q.id}:${o.id}`}>
                                ↳ Câu {q.order} - Phương án {o.id}
                              </option>
                            ))}
                          </React.Fragment>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">Chưa có câu hỏi nào trong danh mục này</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hãy dán nội dung từ file Word ở trên hoặc bấm vào các nút thêm câu hỏi để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const isEssay = q.type === 'essay';

              return (
                <div
                  key={`${q.id}_${idx}`}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                    isEssay
                      ? 'border-purple-200 hover:border-purple-400'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 text-white ${
                          isEssay ? 'bg-purple-600' : 'bg-blue-600'
                        }`}
                      >
                        {q.order}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Câu {q.order}
                      </span>

                      {/* Type Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isEssay
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isEssay ? (
                          <>
                            <PenTool className="w-3 h-3" />
                            <span>Tự luận</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3 h-3" />
                            <span>Trắc nghiệm</span>
                          </>
                        )}
                      </span>

                      {/* Toggle type button */}
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionType(q.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium ml-1"
                        title="Đổi loại câu hỏi"
                      >
                        Đổi sang {isEssay ? 'Trắc nghiệm' : 'Tự luận'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Points input */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-semibold">Điểm:</span>
                        <input
                          type="number"
                          step={0.25}
                          min={0.25}
                          value={q.points}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { points: Number(e.target.value) })
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Textarea */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Nội dung câu hỏi / đề bài
                    </label>
                    <textarea
                      rows={2}
                      value={q.text}
                      onChange={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                      onPaste={(e) => {
                        const file = e.clipboardData.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          e.preventDefault();
                          const reader = new FileReader();
                          reader.onload = () => {
                            handleUpdateQuestion(q.id, { image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập nội dung đề bài... (Hỗ trợ Dán ảnh chụp đề bài Ctrl + V)"
                    />

                    {/* Question Image (Diagram, Graph, Map, Figure) */}
                    <div className="pt-2">
                      {q.image ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block max-w-full space-y-2">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1.5">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                              Hình minh họa câu {q.order}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setZoomedImage(q.image || null)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <ZoomIn className="w-3 h-3" />
                                Phóng to
                              </button>
                              {extractedImagesList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedImagePickerTarget({ qId: q.id })}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  Đổi ảnh từ tệp
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(q.id, { image: undefined })}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                              >
                                Gỡ ảnh
                              </button>
                            </div>
                          </div>
                          <div 
                            className="relative group cursor-pointer"
                            onClick={() => setZoomedImage(q.image || null)}
                          >
                            <img
                              src={q.image}
                              alt={`Hình minh họa câu ${q.order}`}
                              className="max-h-48 w-auto rounded-lg object-contain bg-white border border-slate-200 shadow-2xs"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" />
                              <span>Click để xem lớn</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-dashed border-blue-300 transition-colors inline-flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span>Tải ảnh từ máy (hoặc Ctrl+V)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    handleUpdateQuestion(q.id, { image: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          {extractedImagesList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedImagePickerTarget({ qId: q.id })}
                              className="cursor-pointer text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Chọn từ tệp đề gửi ({extractedImagesList.length} ảnh)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CASE 1: MULTIPLE CHOICE OPTIONS */}
                  {!isEssay && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                        <span>Các phương án lựa chọn (Click radio để chọn đáp án đúng):</span>
                        <span className="text-emerald-600 font-bold">
                          Đáp án đúng: {q.correctOptionId || 'A'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(q.options || []).map((opt, optIdx) => {
                          const isCorrect = q.correctOptionId === opt.id;
                          return (
                            <div
                              key={`${q.id}_opt_${opt.id}_${optIdx}`}
                              className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                  <input
                                    type="radio"
                                    name={`correct_${q.id}`}
                                    checked={isCorrect}
                                    onChange={() => handleUpdateQuestion(q.id, { correctOptionId: opt.id })}
                                    className="w-4 h-4 text-emerald-600"
                                  />
                                  <span
                                    className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {opt.id}
                                  </span>
                                </label>

                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                  onPaste={(e) => {
                                    const file = e.clipboardData.files?.[0];
                                    if (file && file.type.startsWith('image/')) {
                                      e.preventDefault();
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        handleUpdateOptionImage(q.id, opt.id, reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="flex-1 bg-transparent border-none text-xs font-medium focus:outline-none"
                                  placeholder={`Nội dung phương án ${opt.id}...`}
                                />

                                {/* Attach image to option buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {extractedImagesList.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedImagePickerTarget({ qId: q.id, optId: opt.id })}
                                      title={`Chọn ảnh từ tệp đề cho phương án ${opt.id}`}
                                      className="cursor-pointer p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-0.5 text-[10px] font-bold border border-indigo-200 bg-indigo-50/40"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Từ tệp</span>
                                    </button>
                                  )}

                                  <label 
                                    className="cursor-pointer p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" 
                                    title={`Tải ảnh từ máy cho phương án ${opt.id}`}
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            handleUpdateOptionImage(q.id, opt.id, reader.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Option Image Thumbnail if present */}
                              {opt.image && (
                                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                                  <div
                                    className="relative group cursor-pointer inline-block"
                                    onClick={() => setZoomedImage(opt.image || null)}
                                    title="Nhấp để phóng to"
                                  >
                                    <img
                                      src={opt.image}
                                      alt={`Hình phương án ${opt.id}`}
                                      className="max-h-24 w-auto rounded-lg object-contain bg-white border border-slate-200 shadow-2xs"
                                    />
                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                      <ZoomIn className="w-3 h-3" />
                                      <span>Phóng to</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {extractedImagesList.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedImagePickerTarget({ qId: q.id, optId: opt.id })}
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                                      >
                                        Đổi ảnh từ tệp
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOptionImage(q.id, opt.id, undefined)}
                                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                                    >
                                      Gỡ ảnh
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Lời giải chi tiết (Học sinh xem sau khi nộp)
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                          placeholder="Nhập lời giải hoặc căn cứ lý thuyết..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* CASE 2: ESSAY MODEL ANSWER & RUBRIC */}
                  {isEssay && (
                    <div className="space-y-3 p-4 rounded-xl bg-purple-50/40 border border-purple-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-purple-900">
                            Đáp án mẫu & Lời giải tự luận của giáo viên *
                          </label>
                          <span className="text-[11px] text-purple-600 font-semibold">
                            Dùng để chấm bài và học sinh đối chiếu
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={q.modelAnswer || ''}
                          onChange={(e) => handleUpdateQuestion(q.id, { modelAnswer: e.target.value })}
                          placeholder="Nhập lời giải chuẩn từng bước của câu tự luận này..."
                          className="w-full p-3 rounded-xl border border-purple-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">
                          Biểu điểm chi tiết (Barem chấm)
                        </label>
                        <input
                          type="text"
                          value={q.rubric || ''}
                          onChange={(e) => handleUpdateQuestion(q.id, { rubric: e.target.value })}
                          placeholder="VD: Ý 1 đúng: 0.5 điểm | Ý 2 đúng: 0.5 điểm | Kết luận đúng: 0.5 điểm"
                          className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL: SUCCESSFUL PUBLISH & SHARE */}
      {savedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Xuất Bản & Deploy Firebase Thành Công!
              </h3>
              <p className="text-xs text-slate-500">
                Đề thi đã được lưu và deploy trực tiếp lên cơ sở dữ liệu đám mây Firebase Firestore miễn phí.
              </p>
            </div>

            {/* Cloud Badge */}
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mx-auto w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Firestore: Đã lưu trữ đám mây trực tuyến</span>
            </div>

            {/* Exam info badge */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tên đề thi:</span>
                <strong className="text-slate-900 font-bold">{savedExam.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cấu trúc đề:</span>
                <strong className="text-blue-700">
                  {savedExam.multipleChoicePoints || 0}đ Trắc nghiệm + {savedExam.essayPoints || 0}đ Tự luận = {savedExam.totalPoints}đ
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <strong className="text-slate-900 font-bold">{savedExam.durationMinutes} phút</strong>
              </div>
            </div>

            {/* Access Code Display */}
            <div className="text-center space-y-1 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Mã Phòng Thi Dành Cho Học Sinh
              </div>
              <div className="text-3xl font-black text-blue-700 tracking-widest">
                {savedExam.accessCode}
              </div>
              <div className="text-[11px] text-slate-500">
                Học sinh chỉ cần vào trang chủ và nhập mã này để làm bài
              </div>
            </div>

            {/* Copy share link */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/?code=${savedExam.accessCode}`}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {onNavigateToExam && (
                <button
                  type="button"
                  onClick={() => onNavigateToExam(savedExam.id)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Vào phòng thi thử nghiệm ngay</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSavedExam(null)}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Đóng & Tiếp tục quản lý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECT IMAGE FROM EXTRACTED IMAGES LIST */}
      {selectedImagePickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Chọn Hình Ảnh Từ Tệp Đề Gửi ({extractedImagesList.length} ảnh)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đang chọn gán cho: <strong className="text-indigo-700">Câu {questions.find(q => q.id === selectedImagePickerTarget.qId)?.order}</strong> {selectedImagePickerTarget.optId ? `(Phương án ${selectedImagePickerTarget.optId})` : '(Đề bài)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImagePickerTarget(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {extractedImagesList.map((imgSrc, idx) => {
                const usedInQ = questions.find(q => q.image === imgSrc);
                const usedInOpt = questions.find(q => q.options?.some(o => o.image === imgSrc));
                const optMatch = usedInOpt?.options?.find(o => o.image === imgSrc);

                return (
                  <div
                    key={`modal_picker_${idx}`}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 bg-slate-50/50"
                  >
                    <div 
                      className="aspect-video bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 cursor-pointer relative group"
                      onClick={() => setZoomedImage(imgSrc)}
                      title="Nhấp để xem lớn"
                    >
                      <img src={imgSrc} alt={`Ảnh #${idx + 1}`} className="max-h-full max-w-full object-contain" />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" />
                        <span>Xem lớn</span>
                      </div>
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-500 truncate">
                        {usedInQ ? (
                          <span className="text-emerald-700 font-bold">✓ Đang gắn: Câu {usedInQ.order}</span>
                        ) : usedInOpt && optMatch ? (
                          <span className="text-blue-700 font-bold">✓ Đang gắn: Câu {usedInOpt.order} (Đ/A {optMatch.id})</span>
                        ) : (
                          <span>Chưa gắn câu nào</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAssignExtractedImage(imgSrc, selectedImagePickerTarget.qId, selectedImagePickerTarget.optId)}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Chọn ảnh này</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Có thể bấm vào ảnh để phóng to kiểm tra chi tiết</span>
              <button
                type="button"
                onClick={() => setSelectedImagePickerTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: ZOOM IMAGE */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg cursor-pointer"
              title="Đóng xem ảnh"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Phóng to hình ảnh"
              className="max-h-[82vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
