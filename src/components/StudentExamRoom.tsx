import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Bookmark, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  RotateCcw, 
  GraduationCap, 
  Layers, 
  Home,
  PenTool,
  CheckSquare,
  Upload,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exam, Question, ExamSubmission, ViolationLog, UserProfile } from '../types';

interface StudentExamRoomProps {
  exam: Exam;
  currentUser?: UserProfile;
  onFinishSubmission: (submission: ExamSubmission) => void;
  onExitRoom: () => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({
  exam,
  currentUser,
  onFinishSubmission,
  onExitRoom
}) => {
  // Step: 'lobby' | 'testing' | 'result'
  const [step, setStep] = useState<'lobby' | 'testing' | 'result'>('lobby');

  // Student Info
  const [studentName, setStudentName] = useState(currentUser?.fullName || '');
  const [studentClass, setStudentClass] = useState(currentUser?.className || exam.targetClass || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Exam runtime state
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(exam.questions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Anti-cheat Violation tracking
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState('');

  // Confirm submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Final Submission object
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);

  // Filter sections inside exam room
  const [activeSection, setActiveSection] = useState<'all' | 'mc' | 'essay'>('all');

  // Categorize questions
  const mcQuestions = useMemo(() => activeQuestions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice'), [activeQuestions]);
  const essayQuestions = useMemo(() => activeQuestions.filter(q => q.type === 'essay'), [activeQuestions]);
  const hasEssay = essayQuestions.length > 0;

  // Prepare questions on lobby start
  const handleStartExam = () => {
    // Validate inputs
    if (exam.settings.requireFullName && !studentName.trim()) {
      setAuthError('Vui lòng nhập Họ và tên của bạn.');
      return;
    }
    if (exam.settings.requireClass && !studentClass.trim()) {
      setAuthError('Vui lòng nhập Lớp học của bạn.');
      return;
    }
    if (exam.settings.requireStudentId && !studentId.trim()) {
      setAuthError('Vui lòng nhập Số báo danh / Mã học sinh.');
      return;
    }
    if (exam.settings.password && inputPassword !== exam.settings.password) {
      setAuthError('Mật khẩu bài thi không chính xác.');
      return;
    }

    // Prepare questions
    let prepared = [...exam.questions];
    if (exam.settings.shuffleQuestions) {
      // Shuffle only if not separated by rigid sections
      prepared.sort(() => Math.random() - 0.5);
    }
    if (exam.settings.shuffleOptions) {
      prepared = prepared.map((q) => {
        if (q.type === 'essay' || !q.options) return q;
        const shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
        return { ...q, options: shuffledOpts };
      });
    }

    setActiveQuestions(prepared);
    setTimeLeft(exam.durationMinutes * 60);
    setStartTime(Date.now());
    setViolationsCount(0);
    setViolationLogs([]);
    setAnswers({});
    setFlaggedQuestions({});
    setAuthError('');
    setStep('testing');
  };

  // Timer effect
  useEffect(() => {
    if (step !== 'testing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Anti-cheat proctoring listener
  useEffect(() => {
    if (step !== 'testing' || !exam.settings.antiCheatProctoring) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = violationsCount + 1;
        setViolationsCount(newCount);
        const log: ViolationLog = {
          timestamp: new Date().toISOString(),
          type: 'tab_switch',
          message: `Học sinh rời màn hình làm bài (Lần thứ ${newCount})`
        };
        setViolationLogs((prev) => [...prev, log]);
        setLastViolationMsg(
          `Bạn vừa rời khỏi màn hình làm bài! Hệ thống "Giáo viên thời đại AI" đã ghi nhận vi phạm.`
        );
        setShowViolationWarning(true);
      }
    };

    const handleWindowBlur = () => {
      const newCount = violationsCount + 1;
      setViolationsCount(newCount);
      const log: ViolationLog = {
        timestamp: new Date().toISOString(),
        type: 'blur',
        message: 'Mất tiêu điểm màn hình / mở ứng dụng ngoài'
      };
      setViolationLogs((prev) => [...prev, log]);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [step, violationsCount, exam.settings.antiCheatProctoring]);

  // Submit exam calculation
  const handleSubmitExam = (force = false) => {
    setShowSubmitModal(false);

    let mcCorrectCount = 0;
    let computedMcScore = 0;
    const questionsToScore = activeQuestions.length > 0 ? activeQuestions : exam.questions;
    
    questionsToScore.forEach((q) => {
      const isEssay = q.type === 'essay';
      if (!isEssay) {
        if (answers[q.id] && answers[q.id] === q.correctOptionId) {
          mcCorrectCount++;
          computedMcScore += q.points || 0;
        }
      }
    });

    const totalQ = questionsToScore.length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // If no specific points set on individual questions, fallback to ratio
    const mcTargetPoints = exam.multipleChoicePoints ?? (hasEssay ? 7.0 : exam.totalPoints);
    const mcCalculatedScore = Number(computedMcScore.toFixed(2));

    const submission: ExamSubmission = {
      id: `sub_${Date.now()}`,
      examId: exam.id,
      studentName: studentName.trim() || 'Học sinh ẩn danh',
      studentClass: studentClass.trim() || 'Tự do',
      studentId: studentId.trim() || undefined,
      answers,
      multipleChoiceScore: mcCalculatedScore,
      essayScore: 0,
      score: mcCalculatedScore, // Partial score until essay graded
      totalQuestions: totalQ,
      correctCount: mcCorrectCount,
      timeSpentSeconds: timeSpent,
      submittedAt: new Date().toISOString(),
      violationsCount,
      violationLogs,
      status: 'completed',
      gradingStatus: hasEssay ? 'pending_review' : 'graded'
    };

    setSubmissionResult(submission);
    onFinishSubmission(submission);
    setStep('result');

    // Confetti if great performance
    if (mcCalculatedScore >= 7 || (!hasEssay && mcCalculatedScore >= 8)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Current Question
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim() !== '').length;

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* 1. LOBBY SCREEN */}
      {step === 'lobby' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Phòng Thi Trực Tuyến - Giáo Viên Thời Đại AI
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {exam.description || 'Vui lòng điền chính xác thông tin để giáo viên ghi nhận điểm số.'}
            </p>
          </div>

          {/* Exam Structure Badges */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Môn học / Lớp:</span>
              <strong className="text-slate-800 font-bold">{exam.subject} - {exam.grade}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Thời gian làm bài:</span>
              <strong className="text-slate-800 font-bold">{exam.durationMinutes} phút</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cấu trúc đề thi:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {mcQuestions.length} câu TN ({exam.multipleChoicePoints ?? 7}đ)
                </span>
                {hasEssay && (
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {essayQuestions.length} câu TL ({exam.essayPoints ?? 3}đ)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
              <span className="text-slate-500">Tổng điểm:</span>
              <strong className="text-amber-600 text-sm font-black">{exam.totalPoints} điểm</strong>
            </div>
          </div>

          {/* Identification Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên thí sinh *
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp học *
                </label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="VD: 9A1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số báo danh / Mã HS
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="VD: HS0901"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {exam.settings.password && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu phòng thi *
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Nhập mật khẩu do giáo viên cấp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartExam}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Bắt đầu làm bài thi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. EXAM TESTING ROOM */}
      {step === 'testing' && (
        <div className="space-y-5">
          {/* Top Sticky Bar */}
          <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                {studentClass || 'HS'}
              </span>
              <div>
                <div className="font-bold text-slate-900 text-sm">{studentName}</div>
                <div className="text-xs text-slate-500 truncate max-w-xs">{exam.title}</div>
              </div>
            </div>

            {/* Countdown Timer & Submit */}
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-base shadow-xs ${
                  timeLeft < 60
                    ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                    : timeLeft < 300
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Nộp bài ({answeredCount}/{activeQuestions.length})</span>
              </button>
            </div>
          </div>

          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* LEFT: ACTIVE QUESTION DISPLAY */}
            <div className="lg:col-span-3 space-y-4">
              {currentQ && (
                <div className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-xs space-y-6 ${
                  currentQ.type === 'essay' ? 'border-purple-200' : 'border-slate-200'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl text-white font-bold text-sm flex items-center justify-center ${
                        currentQ.type === 'essay' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {currentQuestionIndex + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase">
                          Câu {currentQuestionIndex + 1} / {activeQuestions.length}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            currentQ.type === 'essay' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {currentQ.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'} ({currentQ.points || 1} điểm)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setFlaggedQuestions({
                          ...flaggedQuestions,
                          [currentQ.id]: !flaggedQuestions[currentQ.id]
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        flaggedQuestions[currentQ.id]
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{flaggedQuestions[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}</span>
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                    {currentQ.text}
                  </div>

                  {/* CASE 1: MULTIPLE CHOICE OPTIONS */}
                  {currentQ.type !== 'essay' && (
                    <div className="space-y-3">
                      {(currentQ.options || []).map((opt) => {
                        const isSelected = answers[currentQ.id] === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setAnswers({ ...answers, [currentQ.id]: opt.id })}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {opt.id}
                            </div>
                            <span className={`text-sm sm:text-base font-medium ${isSelected ? 'text-blue-950 font-bold' : 'text-slate-800'}`}>
                              {opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CASE 2: ESSAY INPUT WORKSPACE */}
                  {currentQ.type === 'essay' && (
                    <div className="space-y-4 p-5 rounded-2xl bg-purple-50/30 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <PenTool className="w-4 h-4 text-purple-600" />
                          <span>Khung Trình Bày Bài Làm Tự Luận Của Bạn:</span>
                        </label>
                        <span className="text-[11px] text-purple-700 font-medium">
                          {(answers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length} từ đã nhập
                        </span>
                      </div>

                      <textarea
                        rows={8}
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                        placeholder="Hãy gõ lời giải, các bước lập luận và kết quả bài tự luận vào đây..."
                        className="w-full p-4 rounded-xl border border-purple-200 text-sm font-normal text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed shadow-inner"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Bài làm tự luận sẽ tự động lưu liên tục trong quá trình gõ.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Câu trước</span>
                    </button>

                    <div className="text-xs text-slate-400 font-medium hidden sm:block">
                      Câu hỏi {currentQuestionIndex + 1} / {activeQuestions.length}
                    </div>

                    <button
                      type="button"
                      disabled={currentQuestionIndex === activeQuestions.length - 1}
                      onClick={() =>
                        setCurrentQuestionIndex((prev) =>
                          Math.min(activeQuestions.length - 1, prev + 1)
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: QUESTION PALETTE & SECTIONS */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-36">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Bảng Câu Hỏi ({answeredCount}/{activeQuestions.length})
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {Math.round((answeredCount / activeQuestions.length) * 100)}%
                  </span>
                </div>

                {/* Question Grid */}
                <div className="space-y-4">
                  {/* Trắc nghiệm block */}
                  {mcQuestions.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-blue-700 mb-2 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        Phần Trắc Nghiệm ({mcQuestions.length} câu)
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {mcQuestions.map((q) => {
                          const originalIdx = activeQuestions.findIndex(item => item.id === q.id);
                          const isCurrent = currentQuestionIndex === originalIdx;
                          const isDone = Boolean(answers[q.id]);
                          const isFlagged = flaggedQuestions[q.id];

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(originalIdx)}
                              className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                                isCurrent
                                  ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-xs'
                                  : isFlagged
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                  : isDone
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {originalIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tự luận block */}
                  {essayQuestions.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-purple-700 mb-2 flex items-center gap-1">
                        <PenTool className="w-3 h-3" />
                        Phần Tự Luận ({essayQuestions.length} câu)
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {essayQuestions.map((q) => {
                          const originalIdx = activeQuestions.findIndex(item => item.id === q.id);
                          const isCurrent = currentQuestionIndex === originalIdx;
                          const isDone = Boolean(answers[q.id] && answers[q.id].trim() !== '');
                          const isFlagged = flaggedQuestions[q.id];

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(originalIdx)}
                              className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                                isCurrent
                                  ? 'ring-2 ring-purple-600 bg-purple-600 text-white shadow-xs'
                                  : isFlagged
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                  : isDone
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {originalIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-400" />
                    <span>Đã làm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span>Chưa làm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-200 border border-purple-400" />
                    <span>Đã gắn cờ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>Đang chọn</span>
                  </div>
                </div>

                {/* Big Nộp bài button */}
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Nộp bài thi ngay</span>
                </button>
              </div>
            </div>
          </div>

          {/* ANTI-CHEAT POPUP WARNING MODAL */}
          {showViolationWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-500 space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  CẢNH BÁO GIÁM SÁT THI
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {lastViolationMsg}
                </p>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs">
                  Tổng số lần ghi nhận vi phạm: {violationsCount} / {exam.settings.maxTabSwitchWarnings || 3}
                </div>
                <button
                  type="button"
                  onClick={() => setShowViolationWarning(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm"
                >
                  Tôi cam kết quay lại làm bài trung thực
                </button>
              </div>
            </div>
          )}

          {/* CONFIRM SUBMIT MODAL */}
          {showSubmitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác Nhận Nộp Bài Thi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kiểm tra lại số lượng câu hỏi trước khi chính thức kết thúc
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số câu đã hoàn thành:</span>
                    <strong className="text-emerald-700">{answeredCount} / {activeQuestions.length} câu</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số câu chưa hoàn thành:</span>
                    <strong className="text-rose-700">{activeQuestions.length - answeredCount} câu</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian còn lại:</span>
                    <strong className="text-blue-700">{formatTime(timeLeft)}</strong>
                  </div>
                </div>

                {activeQuestions.length - answeredCount > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Bạn vẫn còn câu chưa hoàn thành. Bạn có chắc chắn muốn nộp không?</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                  >
                    Làm tiếp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitExam(true)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                  >
                    Nộp bài ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. RESULT SCREEN (DETAILED SCORECARD & SOLUTIONS) */}
      {step === 'result' && submissionResult && (
        <div className="space-y-8 animate-in fade-in">
          {/* Result Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Đã nộp bài thành công
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Kết Quả Bài Làm Của {submissionResult.studentName}
            </h2>

            {/* Scorecard with separation */}
            <div className="max-w-md mx-auto p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <div className="text-xs text-blue-700 font-bold">Điểm Trắc Nghiệm</div>
                  <div className="text-3xl font-black text-blue-800 my-1">
                    {submissionResult.multipleChoiceScore}
                  </div>
                  <div className="text-[11px] text-blue-600">
                    / {exam.multipleChoicePoints ?? 7} điểm (Tự động chấm)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                  <div className="text-xs text-purple-700 font-bold">Điểm Tự Luận</div>
                  <div className="text-lg font-black text-purple-800 my-1">
                    {submissionResult.gradingStatus === 'graded' 
                      ? `${submissionResult.essayScore} điểm`
                      : 'Đang chấm...'}
                  </div>
                  <div className="text-[11px] text-purple-600">
                    Thang {exam.essayPoints ?? 3} điểm
                  </div>
                </div>
              </div>

              {hasEssay && submissionResult.gradingStatus === 'pending_review' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-left">
                  ⏳ <strong>Thông báo:</strong> Phần tự luận của bạn đã được gửi đến giáo viên. Giáo viên sẽ chấm bài theo barem điểm và cập nhật điểm tổng kết sau!
                </div>
              )}
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <div className="text-xs text-slate-500 font-medium">Số câu đúng TN</div>
                <div className="text-lg font-black text-emerald-600">
                  {submissionResult.correctCount} / {mcQuestions.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Thời gian làm</div>
                <div className="text-lg font-black text-slate-800">
                  {formatTime(submissionResult.timeSpentSeconds)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Cảnh báo vi phạm</div>
                <div className={`text-lg font-black ${submissionResult.violationsCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {submissionResult.violationsCount} lần
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Thời điểm nộp</div>
                <div className="text-xs font-bold text-slate-700 mt-1">
                  {new Date(submissionResult.submittedAt).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onExitRoom}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Quay về trang chủ</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('lobby')}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại bài thi</span>
              </button>
            </div>
          </div>

          {/* DETAILED ANSWER KEY & EXPLANATIONS */}
          {exam.settings.showAnswers && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  Chi Tiết Đáp Án & Hướng Dẫn Chấm
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đối chiếu đáp án của bạn với phương án chính xác và barem điểm từ giáo viên
                </p>
              </div>

              <div className="space-y-6">
                {(activeQuestions.length > 0 ? activeQuestions : exam.questions).map((q, idx) => {
                  const studentAns = submissionResult.answers[q.id];
                  const isEssay = q.type === 'essay';

                  if (isEssay) {
                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/20 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-white bg-purple-600">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {q.text}
                            </span>
                          </div>

                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 shrink-0">
                            Tự luận ({q.points || 1.5} điểm)
                          </span>
                        </div>

                        {/* Student essay answer */}
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase">
                            Bài làm của bạn:
                          </div>
                          <div className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                            {studentAns || <em className="text-slate-400">Bạn chưa nhập bài làm cho câu hỏi này.</em>}
                          </div>
                        </div>

                        {/* Teacher model answer & rubric */}
                        {q.modelAnswer && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                            <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đáp án mẫu & Barem của giáo viên:</span>
                            </div>
                            <div className="text-xs text-emerald-950 whitespace-pre-line font-medium leading-relaxed">
                              {q.modelAnswer}
                            </div>
                            {q.rubric && (
                              <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800">
                                <strong>Barem chi tiết:</strong> {q.rubric}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Multiple Choice
                  const isCorrect = studentAns === q.correctOptionId;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border-2 space-y-3 ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-white ${
                              isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {q.text}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đúng (+{q.points || 1}đ)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Sai (0đ)</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {(q.options || []).map((opt) => {
                          const wasSelected = studentAns === opt.id;
                          const isRight = q.correctOptionId === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                isRight
                                  ? 'bg-emerald-100/70 border-emerald-400 font-bold text-emerald-950'
                                  : wasSelected
                                  ? 'bg-rose-100/70 border-rose-400 text-rose-950'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-200 font-bold flex items-center justify-center text-[10px]">
                                {opt.id}
                              </span>
                              <span className="truncate">{opt.text}</span>
                              {isRight && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-700 uppercase">
                                  Đáp án đúng
                                </span>
                              )}
                              {wasSelected && !isRight && (
                                <span className="ml-auto text-[10px] font-bold text-rose-700 uppercase">
                                  Bạn chọn
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-slate-100/80 text-xs text-slate-700 space-y-0.5">
                          <strong className="text-slate-900 block">💡 Lời giải chi tiết:</strong>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
