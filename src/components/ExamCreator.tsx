import React, { useState } from 'react';
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
  Shuffle, 
  KeyRound, 
  Save, 
  Eye, 
  Copy, 
  QrCode, 
  ExternalLink,
  GraduationCap,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Exam, Question, ExamSettings } from '../types';
import { parseRawExamText, SAMPLE_RAW_EXAM } from '../utils/parser';

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
  const [title, setTitle] = useState('Đề kiểm tra trắc nghiệm 15 phút');
  const [description, setDescription] = useState('Kiểm tra kiến thức trọng tâm học kỳ.');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Lớp 9');
  const [targetClass, setTargetClass] = useState('9A1');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [accessCode, setAccessCode] = useState(
    () => 'DE' + Math.floor(1000 + Math.random() * 9000)
  );

  // Raw Text State
  const [rawText, setRawText] = useState(SAMPLE_RAW_EXAM);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // AI Generator Form State
  const [aiTopic, setAiTopic] = useState('Định lý Pytago và Hệ thức lượng trong tam giác vuông');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Vừa phải (Nhận biết + Thông hiểu + Vận dụng)');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>(() => {
    const { questions: parsed } = parseRawExamText(SAMPLE_RAW_EXAM);
    return parsed;
  });

  // Settings
  const [settings, setSettings] = useState<ExamSettings>({
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultImmediately: true,
    showAnswers: true,
    requireFullName: true,
    requireClass: true,
    requireStudentId: false,
    antiCheatProctoring: true,
    maxTabSwitchWarnings: 3,
    allowedAttempts: 1,
    password: ''
  });

  // Modal share
  const [savedExam, setSavedExam] = useState<Exam | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Handle Parse Raw Text
  const handleParseText = () => {
    const { questions: parsed, errors } = parseRawExamText(rawText);
    setParseErrors(errors);
    if (parsed.length > 0) {
      setQuestions(parsed);
    }
  };

  // Handle AI Question Generator
  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    // Simulate smart AI generation with curated Vietnamese educational items
    setTimeout(() => {
      let aiQuestions: Question[] = [];
      if (subject === 'Toán học') {
        aiQuestions = [
          {
            id: `q_ai_1_${Date.now()}`,
            order: 1,
            text: `Trong tam giác vuông ABC vuông tại A có AB = 6cm, AC = 8cm. Độ dài cạnh huyền BC là:`,
            options: [
              { id: 'A', text: '9 cm' },
              { id: 'B', text: '10 cm' },
              { id: 'C', text: '12 cm' },
              { id: 'D', text: '14 cm' }
            ],
            correctOptionId: 'B',
            explanation: 'Theo định lý Pytago: BC² = AB² + AC² = 6² + 8² = 100 => BC = 10cm.',
            points: 2
          },
          {
            id: `q_ai_2_${Date.now()}`,
            order: 2,
            text: `Cho tam giác ABC vuông tại A có đường cao AH. Hệ thức lượng nào sau đây là ĐÚNG?`,
            options: [
              { id: 'A', text: 'AH² = BH * CH' },
              { id: 'B', text: 'AH = BH * CH' },
              { id: 'C', text: 'AB² = AH * BC' },
              { id: 'D', text: 'AC² = BH * BC' }
            ],
            correctOptionId: 'A',
            explanation: 'Bình phương đường cao bằng tích hai hình chiếu của hai cạnh góc vuông trên cạnh huyền: AH² = BH * CH.',
            points: 2
          },
          {
            id: `q_ai_3_${Date.now()}`,
            order: 3,
            text: `Tỉ số lượng giác sin của một góc nhọn α trong tam giác vuông bằng:`,
            options: [
              { id: 'A', text: 'Cạnh kề / Cạnh huyền' },
              { id: 'B', text: 'Cạnh đối / Cạnh huyền' },
              { id: 'C', text: 'Cạnh đối / Cạnh kề' },
              { id: 'D', text: 'Cạnh kề / Cạnh đối' }
            ],
            correctOptionId: 'B',
            explanation: 'Sin đi học (Đối/Huyền), Cos khóc nhè (Kề/Huyền), Tan đoàn kết (Đối/Kề), Cotang kết đoàn (Kề/Đối).',
            points: 2
          },
          {
            id: `q_ai_4_${Date.now()}`,
            order: 4,
            text: `Giá trị của biểu thức sin²(30°) + cos²(30°) bằng:`,
            options: [
              { id: 'A', text: '0' },
              { id: 'B', text: '0.5' },
              { id: 'C', text: '1' },
              { id: 'D', text: '2' }
            ],
            correctOptionId: 'C',
            explanation: 'Với mọi góc nhọn α, luôn có sin²α + cos²α = 1.',
            points: 2
          },
          {
            id: `q_ai_5_${Date.now()}`,
            order: 5,
            text: `Một chiếc thang dài 4m dựng vào tường tạo với mặt đất góc 60°. Chiều cao của chân thang tiếp giáp với đỉnh tường là:`,
            options: [
              { id: 'A', text: '2√3 m (khoảng 3.46m)' },
              { id: 'B', text: '2 m' },
              { id: 'C', text: '3 m' },
              { id: 'D', text: '4 m' }
            ],
            correctOptionId: 'A',
            explanation: 'Chiều cao h = 4 * sin(60°) = 4 * (√3 / 2) = 2√3 m.',
            points: 2
          }
        ];
      } else if (subject === 'Tiếng Anh') {
        aiQuestions = [
          {
            id: `q_ai_e1_${Date.now()}`,
            order: 1,
            text: 'Choose the word whose underlined part is pronounced differently: A. painted B. needed C. stopped D. decided',
            options: [
              { id: 'A', text: 'painted' },
              { id: 'B', text: 'needed' },
              { id: 'C', text: 'stopped' },
              { id: 'D', text: 'decided' }
            ],
            correctOptionId: 'C',
            explanation: '"stopped" phát âm đuôi -ed là /t/, các từ còn lại phát âm là /ɪd/.',
            points: 2
          },
          {
            id: `q_ai_e2_${Date.now()}`,
            order: 2,
            text: 'If she ______ harder, she will pass the entrance examination easily.',
            options: [
              { id: 'A', text: 'studies' },
              { id: 'B', text: 'studied' },
              { id: 'C', text: 'will study' },
              { id: 'D', text: 'would study' }
            ],
            correctOptionId: 'A',
            explanation: 'Câu điều kiện loại 1: Mệnh đề If dùng thì Hiện tại đơn (studies).',
            points: 2
          },
          {
            id: `q_ai_e3_${Date.now()}`,
            order: 3,
            text: 'The Internet is an essential tool for modern education, ______ it?',
            options: [
              { id: 'A', text: 'is it' },
              { id: 'B', text: 'isn\'t it' },
              { id: 'C', text: 'doesn\'t it' },
              { id: 'D', text: 'does it' }
            ],
            correctOptionId: 'B',
            explanation: 'Câu hỏi đuôi (Tag question): Vế đầu khẳng định với động từ "is", vế đuôi phủ định "isn\'t it".',
            points: 2
          }
        ];
      } else {
        // General subjects
        aiQuestions = [
          {
            id: `q_ai_g1_${Date.now()}`,
            order: 1,
            text: `Kiến thức trọng tâm về: ${aiTopic}. Chọn nhận định chính xác nhất:`,
            options: [
              { id: 'A', text: 'Khẳng định A phù hợp với định luật khoa học cơ bản' },
              { id: 'B', text: 'Khẳng định B chỉ áp dụng trong điều kiện tiêu chuẩn' },
              { id: 'C', text: 'Khẳng định C là trường hợp ngoại lệ' },
              { id: 'D', text: 'Tất cả các đáp án trên đều sai' }
            ],
            correctOptionId: 'A',
            explanation: 'Theo chương trình đổi mới GDPT 2018, học sinh cần nắm vững quy luật cốt lõi.',
            points: 2.5
          },
          {
            id: `q_ai_g2_${Date.now()}`,
            order: 2,
            text: `Ứng dụng thực tiễn của ${aiTopic} trong đời sống xã hội ngày nay là:`,
            options: [
              { id: 'A', text: 'Tối ưu hóa năng suất và bảo vệ môi trường' },
              { id: 'B', text: 'Chỉ mang tính lý thuyết phòng thí nghiệm' },
              { id: 'C', text: 'Không áp dụng được trong thực tế' },
              { id: 'D', text: 'Giảm thiểu khả năng tự học' }
            ],
            correctOptionId: 'A',
            explanation: 'Khoa học đổi mới luôn gắn liền với phát triển bền vững và chuyển đổi số.',
            points: 2.5
          }
        ];
      }

      setQuestions(aiQuestions);
      setTitle(`Đề kiểm tra AI: ${aiTopic}`);
      setIsGeneratingAI(false);
    }, 600);
  };

  // Add a manual question
  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q_manual_${Date.now()}`,
      order: questions.length + 1,
      text: `Nội dung câu hỏi số ${questions.length + 1}`,
      options: [
        { id: 'A', text: 'Phương án A' },
        { id: 'B', text: 'Phương án B' },
        { id: 'C', text: 'Phương án C' },
        { id: 'D', text: 'Phương án D' }
      ],
      correctOptionId: 'A',
      points: 1,
      explanation: 'Lời giải chi tiết câu hỏi này.'
    };
    setQuestions([...questions, newQ]);
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
        const newOpts = q.options.map((opt) =>
          opt.id === optId ? { ...opt, text } : opt
        );
        return { ...q, options: newOpts };
      })
    );
  };

  // Save Exam
  const handleSave = () => {
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi vào đề thi!');
      return;
    }

    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: title.trim() || 'Đề kiểm tra trắc nghiệm',
      description: description.trim(),
      subject,
      grade,
      targetClass,
      durationMinutes: Number(durationMinutes) || 15,
      totalPoints: 10,
      questions,
      settings,
      createdAt: new Date().toISOString(),
      teacherName: 'Giáo viên bộ môn',
      accessCode: accessCode.trim().toUpperCase() || 'AI' + Math.floor(100 + Math.random() * 900),
      status: 'published'
    };

    onSaveExam(newExam);
    setSavedExam(newExam);
  };

  // Copy share link
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?code=${savedExam?.accessCode || accessCode}`;
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
            Trình Soạn Thảo Đề Thi Thời Đại AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tạo Đề Kiểm Tra & Bài Tập Trực Tuyến
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Hỗ trợ bóc tách đề từ Word, tự động sinh đề bằng AI, cấu hình giám sát thi chống gian lận
          </p>
        </div>

        <button
          id="btn-save-exam-top"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          Xuất bản đề thi
        </button>
      </div>

      {/* 1. BASIC EXAM CONFIGURATION */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          Thông tin cơ bản của bài kiểm tra
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề đề thi / bài tập *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra 1 tiết Đại số chương III"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Môn học
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Toán học">Toán học</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Khoa học tự nhiên">Khoa học tự nhiên (KHTN)</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
              <option value="Tin học">Tin học</option>
              <option value="Giáo dục công dân">Giáo dục công dân (GDCD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khối lớp
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Lớp 6">Lớp 6</option>
              <option value="Lớp 7">Lớp 7</option>
              <option value="Lớp 8">Lớp 8</option>
              <option value="Lớp 9">Lớp 9</option>
              <option value="Lớp 10">Lớp 10</option>
              <option value="Lớp 11">Lớp 11</option>
              <option value="Lớp 12">Lớp 12</option>
              <option value="Tiểu học">Khối Tiểu học</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thời gian làm bài (phút) *
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lớp giao bài (Tùy chọn)
            </label>
            <input
              type="text"
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              placeholder="VD: 9A1, 9A2 hoặc Để trống"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mã truy cập đề (Access Code)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="VD: TOAN9GK"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setAccessCode('AI' + Math.floor(1000 + Math.random() * 9000))}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600"
                title="Tạo mã ngẫu nhiên"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mật khẩu đề thi (Nếu có)
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.password || ''}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                placeholder="Để trống nếu không đặt"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Anti-cheat & Advanced Proctoring settings */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Cấu hình quy chế & Giám sát thi thời đại AI
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.antiCheatProctoring}
                onChange={(e) => setSettings({ ...settings, antiCheatProctoring: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Giám sát chống gian lận
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Cảnh báo và đếm số lần học sinh chuyển tab hoặc rời màn hình
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shuffleQuestions}
                onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Đảo thứ tự câu hỏi
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Mỗi học sinh sẽ nhận được một mã đề đảo ngẫu nhiên
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shuffleOptions}
                onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Đảo thứ tự đáp án (A, B, C, D)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Hoán vị các phương án lựa chọn trong từng câu
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
                  Hiển thị điểm ngay khi nộp
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Học sinh biết ngay kết quả sau khi bấm nộp bài
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
                  Xem đáp án & lời giải chi tiết
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Cho phép học sinh xem câu đúng/sai và bài giải
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.requireStudentId}
                onChange={(e) => setSettings({ ...settings, requireStudentId: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Yêu cầu Số báo danh / Mã học sinh
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Bắt buộc nhập SBD để đối soát danh sách thi
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* 2. CHOOSE CREATION METHOD TABS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setMethod('raw_text')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              method === 'raw_text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Nhập nhanh từ Word / Text (Thời đại AI)
          </button>

          <button
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

          <button
            onClick={() => setMethod('manual')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              method === 'manual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Soạn Đề Thủ Công ({questions.length} câu)
          </button>
        </div>

        {/* METHOD 1: RAW TEXT PARSER (AZOTA SIGNATURE) */}
        {method === 'raw_text' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Dán nội dung đề thi từ Word, Docs hoặc PDF
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự nhận diện các câu hỏi, phương án A, B, C, D, đáp án đúng và lời giải chi tiết.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_RAW_EXAM)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Dán đề mẫu
                </button>
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold hover:text-rose-600"
                >
                  Xóa trắng
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={12}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Câu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. Đà Nẵng\nC. TP. Hồ Chí Minh\nD. Hải Phòng\nĐáp án: A\nLời giải: Hà Nội là thủ đô của Việt Nam.`}
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {parseErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{parseErrors.join(' | ')}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 font-medium">
                💡 <span className="font-bold">Mẹo soạn nhanh:</span> Có thể để đáp án ở từng câu (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded">Đáp án: A</code>) hoặc để bảng đáp án ở cuối bài (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded">1.A 2.B 3.C</code>).
              </div>

              <button
                type="button"
                onClick={handleParseText}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Bóc tách & Xem trước ({questions.length} câu đã nhận)
              </button>
            </div>
          </div>
        )}

        {/* METHOD 2: AI GENERATE */}
        {method === 'ai_generate' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-600" />
                Trợ Lý AI Giáo Viên Thời Đại AI - Sinh Đề Trắc Nghiệm Thông Minh
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập chủ đề bài học để AI thiết kế trọn bộ câu hỏi kèm 4 phương án, đáp án chuẩn và lời giải thích sư phạm.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chủ đề / Bài học cần tạo câu hỏi *
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="VD: Định lý Thales, Thì Hiện tại hoàn thành, Khởi nghĩa Lam Sơn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lượng câu hỏi
                </label>
                <select
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value={5}>5 câu trắc nghiệm</option>
                  <option value={10}>10 câu trắc nghiệm</option>
                  <option value={15}>15 câu trắc nghiệm</option>
                  <option value={20}>20 câu trắc nghiệm</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ma trận cấp độ nhận thức
                </label>
                <input
                  type="text"
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  placeholder="Nhận biết 40%, Thông hiểu 30%, Vận dụng 20%, Vận dụng cao 10%"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <span>Đang phân tích chương trình & khởi tạo câu hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Kích hoạt AI tạo đề thi ngay</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* 3. QUESTION PREVIEW & INLINE EDITOR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh Sách Câu Hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-slate-500">
              Kiểm tra nội dung câu hỏi, đổi đáp án đúng và chỉnh sửa điểm số từng câu
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi mới
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">Chưa có câu hỏi nào trong đề</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hãy dán nội dung từ file Word ở trên hoặc bấm nút "Thêm câu hỏi mới" để bắt đầu soạn.
            </p>
            <button
              onClick={() => {
                setRawText(SAMPLE_RAW_EXAM);
                handleParseText();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Nạp ngay đề thi mẫu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all space-y-4"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Câu {idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>Điểm:</span>
                      <input
                        type="number"
                        step={0.5}
                        min={0.5}
                        value={q.points}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, { points: Number(e.target.value) })
                        }
                        className="w-14 px-1.5 py-0.5 rounded border border-slate-200 text-center font-bold text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question text input */}
                <textarea
                  rows={2}
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nội dung câu hỏi..."
                />

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt) => {
                    const isCorrect = q.correctOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(q.id, { correctOptionId: opt.id })}
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title="Chọn làm đáp án đúng"
                        >
                          {opt.id}
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                          className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                          placeholder={`Phương án ${opt.id}...`}
                        />

                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">
                    Lời giải thích / Hướng dẫn giải:
                  </div>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                    placeholder="Giải thích vì sao chọn đáp án này..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/30"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Floating/Fixed Save Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/90 text-white backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black">
            {questions.length}
          </div>
          <div>
            <div className="text-sm font-bold">Tổng số: {questions.length} câu hỏi</div>
            <div className="text-xs text-slate-400">
              Thời lượng: {durationMinutes} phút • Mã đề: <span className="text-amber-300 font-mono font-bold">{accessCode}</span>
            </div>
          </div>
        </div>

        <button
          id="btn-save-exam-bottom"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Lưu & Xuất bản đề thi</span>
        </button>
      </div>

      {/* MODAL: SUCCESSFUL PUBLISH & SHARE LINK */}
      {savedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Xuất Bản Đề Thi Thành Công!
              </h3>
              <p className="text-slate-500 text-xs">
                Học sinh có thể truy cập bằng liên kết hoặc nhập mã đề thi trực tiếp trên hệ thống
              </p>
            </div>

            {/* Exam info badge */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                {savedExam.title}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span>Môn: <strong>{savedExam.subject}</strong></span>
                <span>•</span>
                <span>Khối: <strong>{savedExam.grade}</strong></span>
                <span>•</span>
                <span>Số câu: <strong>{savedExam.questions.length}</strong></span>
                <span>•</span>
                <span>Thời gian: <strong>{savedExam.durationMinutes} phút</strong></span>
              </div>
            </div>

            {/* Code Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Mã truy cập phòng thi (Học sinh nhập vào ô tìm kiếm):
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xl font-mono font-black text-blue-800 tracking-wider">
                  {savedExam.accessCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(savedExam.accessCode);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                >
                  {copiedLink ? 'Đã sao chép!' : 'Copy mã'}
                </button>
              </div>
            </div>

            {/* Direct Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Đường dẫn liên kết trực tiếp:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?code=${savedExam.accessCode}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-100 font-mono text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 shrink-0"
                >
                  {copiedLink ? 'Đã copy!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const examId = savedExam.id;
                  setSavedExam(null);
                  if (onNavigateToExam) {
                    onNavigateToExam(examId);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                Vào thi thử nghiệm ngay
              </button>

              <button
                type="button"
                onClick={() => setSavedExam(null)}
                className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
