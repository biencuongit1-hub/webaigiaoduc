import React, { useState, useEffect, useRef } from 'react';
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
  Award, 
  User, 
  GraduationCap, 
  KeyRound, 
  Maximize2, 
  Layers, 
  HelpCircle,
  Eye,
  Home
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exam, Question, ExamSubmission, ViolationLog } from '../types';

interface StudentExamRoomProps {
  exam: Exam;
  onFinishSubmission: (submission: ExamSubmission) => void;
  onExitRoom: () => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({
  exam,
  onFinishSubmission,
  onExitRoom
}) => {
  // Step: 'lobby' | 'testing' | 'result'
  const [step, setStep] = useState<'lobby' | 'testing' | 'result'>('lobby');

  // Student Info
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState(exam.targetClass || '');
  const [studentId, setStudentId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Questions (shuffled if requested)
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Answers Map: questionId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Flagged questions for review
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // Timer: seconds left
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [startTime, setStartTime] = useState<number>(0);

  // Anti-cheat Violation tracking
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState('');

  // Confirm submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Final Submission object
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);

  // Display mode: 'single' | 'scroll'
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('single');

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
      prepared.sort(() => Math.random() - 0.5);
    }
    if (exam.settings.shuffleOptions) {
      prepared = prepared.map((q) => {
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
          // Auto submit when time is up
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
        handleViolation('tab_switch', 'Học sinh chuyển tab hoặc thu nhỏ trình duyệt');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('blur', 'Mất tiêu điểm màn hình bài thi (chuyển qua ứng dụng khác)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [step, exam.settings.antiCheatProctoring, violationsCount]);

  const handleViolation = (type: 'tab_switch' | 'blur', message: string) => {
    const newCount = violationsCount + 1;
    setViolationsCount(newCount);

    const log: ViolationLog = {
      timestamp: new Date().toISOString(),
      type,
      message: `${message} (Lần thứ ${newCount})`
    };
    setViolationLogs((prev) => [...prev, log]);

    setLastViolationMsg(`Bạn vừa rời khỏi màn hình làm bài (Lần ${newCount})! Hành vi này đã được ghi vào biên bản nộp cho giáo viên.`);
    setShowViolationWarning(true);

    // If exceeded max warnings, auto-submit exam
    if (exam.settings.maxTabSwitchWarnings && newCount >= exam.settings.maxTabSwitchWarnings) {
      alert(`Đã vi phạm quy chế thi quá ${exam.settings.maxTabSwitchWarnings} lần! Hệ thống sẽ tự động thu bài của bạn.`);
      handleSubmitExam(true);
    }
  };

  // Submit exam calculation
  const handleSubmitExam = (force = false) => {
    setShowSubmitModal(false);

    let correctCount = 0;
    const questionsToScore = activeQuestions.length > 0 ? activeQuestions : exam.questions;
    
    questionsToScore.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        correctCount++;
      }
    });

    const totalQ = questionsToScore.length;
    // Score scaled to 10
    const rawScore = totalQ > 0 ? (correctCount / totalQ) * exam.totalPoints : 0;
    const finalScore = Math.round(rawScore * 10) / 10;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const submission: ExamSubmission = {
      id: `sub_${Date.now()}`,
      examId: exam.id,
      studentName: studentName.trim() || 'Học sinh ẩn danh',
      studentClass: studentClass.trim() || 'Tự do',
      studentId: studentId.trim() || undefined,
      answers,
      score: finalScore,
      totalQuestions: totalQ,
      correctCount,
      timeSpentSeconds: timeSpent,
      submittedAt: new Date().toISOString(),
      violationsCount,
      violationLogs,
      status: 'completed'
    };

    setSubmissionResult(submission);
    onFinishSubmission(submission);
    setStep('result');

    // Confetti if high score
    if (finalScore >= 8) {
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
  const answeredCount = Object.keys(answers).length;

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
              Phòng Thi Trực Tuyến Thời Đại AI
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {exam.description || 'Vui lòng điền chính xác thông tin để giáo viên ghi nhận điểm số.'}
            </p>
          </div>

          {/* Exam Summary Specs */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <div className="text-xs text-slate-500 font-medium">Thời gian</div>
              <div className="text-base font-black text-slate-800">{exam.durationMinutes} phút</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Số câu hỏi</div>
              <div className="text-base font-black text-slate-800">{exam.questions.length} câu</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Thang điểm</div>
              <div className="text-base font-black text-slate-800">{exam.totalPoints} điểm</div>
            </div>
          </div>

          {/* Anti-cheat notification banner */}
          {exam.settings.antiCheatProctoring && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Quy chế thi chống gian lận được kích hoạt
              </div>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống sẽ tự động giám sát và đếm số lần học sinh chuyển tab hoặc thoát khỏi màn hình làm bài. Quá {exam.settings.maxTabSwitchWarnings || 3} lần sẽ bị tự động thu bài.
              </p>
            </div>
          )}

          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên học sinh *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số báo danh (SBD)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="VD: HS09"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {exam.settings.password && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu bài thi *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Nhập mật khẩu do giáo viên cấp"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            {authError && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {authError}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleStartExam}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all"
            >
              Bắt đầu làm bài thi
            </button>
            <button
              type="button"
              onClick={onExitRoom}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Quay lại trang chủ
            </button>
          </div>
        </div>
      )}

      {/* 2. EXAM TESTING ROOM (AZOTA RUNTIME) */}
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

            {/* Countdown Timer */}
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

              {/* Submit Action Button */}
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
            {/* LEFT / CENTER: QUESTION DISPLAY */}
            <div className="lg:col-span-3 space-y-4">
              {viewMode === 'single' && currentQ && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Question Title & Actions */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                        {currentQuestionIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Câu {currentQuestionIndex + 1} / {activeQuestions.length}
                      </span>
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
                      <span>{flaggedQuestions[currentQ.id] ? 'Đã gắn cờ xem lại' : 'Gắn cờ xem lại'}</span>
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQ.text}
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {currentQ.options.map((opt) => {
                      const isSelected = answers[currentQ.id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setAnswers({ ...answers, [currentQ.id]: opt.id })}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
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

                  {/* Prev / Next Question controls */}
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
                      Dùng phím mũi tên hoặc bấm câu hỏi bên phải
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

            {/* RIGHT SIDEBAR: QUESTION PALETTE (AZOTA STYLE) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5 lg:sticky lg:top-36">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Phiếu Trả Lời Trắc Nghiệm
                </h3>
                <span className="text-xs font-bold text-blue-600">
                  {answeredCount} / {activeQuestions.length} đã làm
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{
                    width: `${(answeredCount / activeQuestions.length) * 100}%`
                  }}
                />
              </div>

              {/* Question grid palette */}
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
                {activeQuestions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlagged = Boolean(flaggedQuestions[q.id]);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs relative flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'ring-2 ring-blue-600 ring-offset-2'
                          : ''
                      } ${
                        isAnswered
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend notes */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-600" />
                  <span>Đã chọn ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-200" />
                  <span>Chưa làm ({activeQuestions.length - answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md border-2 border-blue-600" />
                  <span>Đang xem</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-500" />
                  <span>Đã đặt cờ</span>
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
                    <span className="text-slate-500">Số câu đã làm:</span>
                    <strong className="text-emerald-700">{answeredCount} / {activeQuestions.length} câu</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số câu chưa trả lời:</span>
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
                    <span>Bạn vẫn còn câu chưa chọn đáp án. Bạn có chắc chắn muốn nộp không?</span>
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

            {/* Big Score Badge */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white mx-auto flex flex-col items-center justify-center shadow-xl shadow-blue-500/20 border-4 border-white">
              <div className="text-4xl font-black">{submissionResult.score}</div>
              <div className="text-xs font-medium text-blue-200">trên 10 điểm</div>
            </div>

            {/* Performance Classification */}
            <div className="text-sm font-bold text-slate-700">
              Xếp loại: {' '}
              <span className={`font-black ${
                submissionResult.score >= 8.5 ? 'text-emerald-600' :
                submissionResult.score >= 6.5 ? 'text-blue-600' :
                submissionResult.score >= 5.0 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {submissionResult.score >= 8.5 ? 'Xuất sắc ⭐' :
                 submissionResult.score >= 6.5 ? 'Khá - Giỏi 👍' :
                 submissionResult.score >= 5.0 ? 'Đạt yêu cầu' : 'Cần cố gắng ôn lại'}
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <div className="text-xs text-slate-500 font-medium">Số câu đúng</div>
                <div className="text-lg font-black text-emerald-600">
                  {submissionResult.correctCount} / {submissionResult.totalQuestions}
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
                  Chi Tiết Đáp Án & Hướng Dẫn Giải
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đối chiếu đáp án của bạn với phương án chính xác và lời giải từ giáo viên
                </p>
              </div>

              <div className="space-y-6">
                {(activeQuestions.length > 0 ? activeQuestions : exam.questions).map((q, idx) => {
                  const studentChoice = submissionResult.answers[q.id];
                  const isCorrect = studentChoice === q.correctOptionId;

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
                              <span>Chính xác</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Sai</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options.map((opt) => {
                          const wasSelected = studentChoice === opt.id;
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
