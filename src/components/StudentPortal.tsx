import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Award, 
  Search, 
  Sparkles, 
  Gamepad2, 
  Compass, 
  ArrowRight, 
  Filter, 
  Lock, 
  Eye, 
  RotateCcw, 
  Building, 
  Calendar, 
  Flame, 
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';
import { Exam, ExamSubmission, UserProfile } from '../types';
import { InteractiveGames } from './InteractiveGames';
import { Virtual360Space } from './Virtual360Space';

export interface StudentPortalProps {
  currentUser: UserProfile;
  exams: Exam[];
  submissions: ExamSubmission[];
  onSelectExam: (examId: string) => void;
  onJoinExamByCode: (code: string) => void;
  onOpenAccountModal: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  exams,
  submissions,
  onSelectExam,
  onJoinExamByCode,
  onOpenAccountModal
}) => {
  // Student navigation tabs
  const [activeMenu, setActiveMenu] = useState<'exams' | 'study' | 'history' | 'games' | 'vr360'>('exams');
  
  // Grade filter state - Defaults to student's registered grade
  const [selectedGrade, setSelectedGrade] = useState<string>(currentUser.grade || 'Lớp 9');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickCode, setQuickCode] = useState('');

  // Selected submission to inspect answers
  const [inspectingSub, setInspectingSub] = useState<ExamSubmission | null>(null);
  const [inspectingGradedSub, setInspectingGradedSub] = useState<{ sub: ExamSubmission; exam?: Exam } | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'graded' | 'pending'>('all');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Practice question state for Study Corner
  const [practiceSubject, setPracticeSubject] = useState<string>('Toán học');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  const gradesList = ['Tất cả', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'];

  // Filter exams for student
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // 1. Grade Restriction logic
      const isAllowedByGrade = 
        selectedGrade === 'Tất cả' ||
        exam.grade === 'Tất cả các khối' ||
        exam.grade === selectedGrade ||
        (exam.allowedGrades && (exam.allowedGrades.includes('all') || exam.allowedGrades.includes(selectedGrade)));

      // 2. Subject filter
      const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject;

      // 3. Search text
      const matchesSearch = 
        !searchTerm.trim() ||
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.accessCode.toLowerCase().includes(searchTerm.toLowerCase());

      return isAllowedByGrade && matchesSubject && matchesSearch;
    });
  }, [exams, selectedGrade, selectedSubject, searchTerm]);

  // Exams strictly for this grade vs other grades
  const targetGradeExams = useMemo(() => {
    return filteredExams.filter(e => e.grade === selectedGrade || e.grade === 'Tất cả các khối');
  }, [filteredExams, selectedGrade]);

  // Student's personal submissions
  const mySubmissions = useMemo(() => {
    return submissions.filter(
      (s) =>
        s.studentName.toLowerCase() === currentUser.fullName.toLowerCase() ||
        (currentUser.studentId && s.studentId === currentUser.studentId)
    );
  }, [submissions, currentUser]);

  const gradedSubs = useMemo(() => mySubmissions.filter(s => s.gradingStatus === 'graded'), [mySubmissions]);
  const pendingSubs = useMemo(() => mySubmissions.filter(s => s.gradingStatus !== 'graded'), [mySubmissions]);

  const filteredHistorySubs = useMemo(() => {
    if (historyFilter === 'graded') return gradedSubs;
    if (historyFilter === 'pending') return pendingSubs;
    return mySubmissions;
  }, [mySubmissions, gradedSubs, pendingSubs, historyFilter]);

  // My stats
  const completedCount = mySubmissions.length;
  const avgScore = completedCount > 0 
    ? (mySubmissions.reduce((acc, cur) => acc + cur.score, 0) / completedCount).toFixed(1)
    : '0.0';
  const highestScore = completedCount > 0
    ? Math.max(...mySubmissions.map(s => s.score))
    : 0;

  // Study corner practice questions sample
  const samplePracticeQuestions = useMemo(() => {
    return [
      {
        id: 'pr_1',
        subject: 'Toán học',
        grade: 'Lớp 9',
        question: 'Tìm nghiệm của phương trình x² - 4x + 3 = 0 bằng cách phân tích thành nhân tử.',
        options: [
          { id: 'A', text: 'x = 1 hoặc x = 3' },
          { id: 'B', text: 'x = -1 hoặc x = -3' },
          { id: 'C', text: 'x = 2 hoặc x = 3' },
          { id: 'D', text: 'x = -1 hoặc x = 3' }
        ],
        correct: 'A',
        explanation: 'Ta có x² - 4x + 3 = (x - 1)(x - 3) = 0 => x = 1 hoặc x = 3.'
      },
      {
        id: 'pr_2',
        subject: 'Toán học',
        grade: 'Lớp 9',
        question: 'Góc tạo bởi tia tiếp tuyến và dây cung có số đo bằng bao nhiêu so với góc ở tâm cùng chắn một cung?',
        options: [
          { id: 'A', text: 'Bằng số đo góc ở tâm' },
          { id: 'B', text: 'Bằng một nửa số đo góc ở tâm' },
          { id: 'C', text: 'Gấp đôi số đo góc ở tâm' },
          { id: 'D', text: 'Bằng 90 độ' }
        ],
        correct: 'B',
        explanation: 'Số đo của góc tạo bởi tia tiếp tuyến và dây cung bằng một nửa số đo của cung bị chắn, tức bằng nửa góc ở tâm chắn cung đó.'
      },
      {
        id: 'pr_3',
        subject: 'Vật lý',
        grade: 'Lớp 9',
        question: 'Công thức tính công suất điện của một đoạn mạch là:',
        options: [
          { id: 'A', text: 'P = U / I' },
          { id: 'B', text: 'P = U . I' },
          { id: 'C', text: 'P = U² . I' },
          { id: 'D', text: 'P = I² / U' }
        ],
        correct: 'B',
        explanation: 'Công suất điện của một đoạn mạch bằng tích của hiệu điện thế giữa hai đầu đoạn mạch và cường độ dòng điện chạy qua nó: P = U.I.'
      },
      {
        id: 'pr_4',
        subject: 'Tiếng Anh',
        grade: 'Lớp 9',
        question: 'Choose the best word: "If she _______ hard, she will pass the entrance exam with high scores."',
        options: [
          { id: 'A', text: 'study' },
          { id: 'B', text: 'studies' },
          { id: 'C', text: 'studied' },
          { id: 'D', text: 'will study' }
        ],
        correct: 'B',
        explanation: 'Câu điều kiện loại 1: Mệnh đề If dùng thì Hiện tại đơn (she + V-s/es -> studies), mệnh đề chính dùng will + V.'
      }
    ].filter(q => practiceSubject === 'all' || q.subject === practiceSubject);
  }, [practiceSubject]);

  return (
    <div className="space-y-6 pb-16">
      {/* Student Profile Welcome Banner */}
      <section className="bg-gradient-to-r from-emerald-800 via-teal-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Giao Diện Học Tập & Làm Bài Dành Cho Học Sinh</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-2">
              <span>Xin chào, <span className="text-amber-300">{currentUser.fullName}</span>! 👋</span>
              {currentUser.username && (
                <span className="text-xs font-mono bg-black/25 text-emerald-200 px-2 py-0.5 rounded-lg border border-white/10 font-normal">
                  @{currentUser.username}
                </span>
              )}
            </h1>

            <p className="text-emerald-100 text-xs sm:text-sm flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 font-bold">
                <Building className="w-3.5 h-3.5 text-amber-300" />
                {currentUser.school}
              </span>
              <span>•</span>
              <span className="bg-emerald-700/60 px-2 py-0.5 rounded-md font-bold">
                Lớp {currentUser.className}
              </span>
              <span>•</span>
              <span className="bg-blue-700/60 px-2 py-0.5 rounded-md font-bold">
                {currentUser.grade}
              </span>
              {currentUser.studentId && (
                <>
                  <span>•</span>
                  <span className="text-amber-200 font-bold">SBD: {currentUser.studentId}</span>
                </>
              )}
              {currentUser.phoneNumber && (
                <>
                  <span>•</span>
                  <span className="text-emerald-200">SĐT: {currentUser.phoneNumber}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenAccountModal}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>Tài khoản / Đổi mật khẩu</span>
            </button>
          </div>
        </div>

        {/* Quick Student Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-emerald-200 text-[11px] block">Đề thi cho khối của em</span>
            <span className="text-xl font-black text-white mt-0.5 block">{targetGradeExams.length} đề thi</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-emerald-200 text-[11px] block">Bài thi đã hoàn thành</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block">{completedCount} bài</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-emerald-200 text-[11px] block">Điểm trung bình của em</span>
            <span className="text-xl font-black text-white mt-0.5 block">{avgScore} / 10</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
            <span className="text-emerald-200 text-[11px] block">Điểm cao nhất</span>
            <span className="text-xl font-black text-emerald-300 mt-0.5 block">{highestScore} điểm</span>
          </div>
        </div>
      </section>

      {/* Student Navigation Bar - ONLY LEARNING MENUS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => setActiveMenu('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMenu === 'exams'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Làm Bài Thi ({targetGradeExams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('study')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMenu === 'study'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Góc Học Tập & Ôn Luyện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMenu === 'history'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Lịch Sử Bài Làm ({mySubmissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('games')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMenu === 'games'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Game Học Tập</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu('vr360')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMenu === 'vr360'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Lớp Học 360° VR</span>
          </button>
        </div>

        {/* Quick Code Entry Input in Navbar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (quickCode.trim()) {
              onJoinExamByCode(quickCode.trim());
            }
          }}
          className="flex items-center gap-1.5 w-full sm:w-auto"
        >
          <input
            type="text"
            placeholder="Nhập mã đề (VD: TOAN9GK2)..."
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-bold w-full sm:w-48"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Vào thi
          </button>
        </form>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EXAM LIST (LÀM BÀI THI)                           */}
      {/* ======================================================== */}
      {activeMenu === 'exams' && (
        <div className="space-y-6">
          {/* Grade selection bar & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Khối lớp của học sinh (Chọn để xem đề đúng khối):
                </span>
                <span className="text-[11px] text-slate-500">
                  Giáo viên giới hạn học sinh chỉ làm đề theo khối lớp tương ứng
                </span>
              </div>

              {/* Grade Badges selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {gradesList.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedGrade === g
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by subject & search */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên đề thi, mã đề, môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">Tất cả môn học</option>
                <option value="Toán học">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                <option value="Tin học">Tin học</option>
              </select>
            </div>
          </div>

          {/* Exam Cards Grid */}
          {filteredExams.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Chưa có đề thi nào phù hợp cho {selectedGrade}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Thầy cô chưa giao đề cho khối này hoặc bạn đang tìm kiếm với từ khóa không khớp. Bạn có thể chọn "Tất cả" hoặc nhập mã đề thi nếu được cấp riêng.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('Tất cả');
                  setSelectedSubject('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Xem tất cả các đề thi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => {
                const isMyGrade = exam.grade === currentUser.grade || exam.grade === 'Tất cả các khối';
                const hasSub = mySubmissions.find((s) => s.examId === exam.id);

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {exam.subject}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {hasSub && hasSub.gradingStatus === 'graded' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shadow-xs animate-in fade-in">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                              ĐÃ CHẤM: {hasSub.score}đ
                            </span>
                          ) : hasSub ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chờ chấm tự luận
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              isMyGrade ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {exam.grade}
                            </span>
                          )}
                          {exam.targetClass && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Lớp {exam.targetClass}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Exam Title */}
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {exam.title}
                      </h3>

                      {exam.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      {/* Details row */}
                      <div className="grid grid-cols-2 gap-2 my-4 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.durationMinutes} phút</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.questions.length} câu hỏi</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>Giáo viên: {exam.teacherName || 'Tổ bộ môn'}</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                            Mã: {exam.accessCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action with 'Đã chấm' indicator */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {hasSub ? (
                        hasSub.gradingStatus === 'graded' ? (
                          <div className="flex flex-col min-w-0">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Điểm: <strong className="text-sm font-extrabold text-emerald-600">{hasSub.score}</strong>/10đ</span>
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">
                              TN: {hasSub.multipleChoiceScore ?? hasSub.score}đ • TL: {hasSub.essayScore ?? 0}đ
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Đã nộp • Chờ chấm</span>
                          </div>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Chưa làm bài</span>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasSub && hasSub.gradingStatus === 'graded' && (
                          <button
                            type="button"
                            onClick={() => setInspectingGradedSub({ sub: hasSub, exam })}
                            className="px-2.5 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                            title="Xem chi tiết điểm từng câu và lời phê của giáo viên"
                          >
                            Xem điểm
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectExam(exam.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer group-hover:translate-x-0.5"
                        >
                          <span>{hasSub ? 'Làm lại' : 'Vào thi'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STUDY CORNER & PRACTICE (GÓC HỌC TẬP & ÔN TẬP)    */}
      {/* ======================================================== */}
      {activeMenu === 'study' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Góc Tự Học & Luyện Tập Chuyên Đề
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Luyện tập các câu hỏi mẫu có lời giải chi tiết để củng cố kiến thức trước các kì thi
                </p>
              </div>

              {/* Subject filter for practice */}
              <div className="flex items-center gap-1.5">
                {['Toán học', 'Vật lý', 'Tiếng Anh'].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setPracticeSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      practiceSubject === sub
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Questions List */}
            <div className="space-y-4">
              {samplePracticeQuestions.map((q, idx) => {
                const selectedOpt = practiceAnswers[q.id];
                const isRevealed = revealedSolutions[q.id];
                const isCorrect = selectedOpt === q.correct;

                return (
                  <div key={q.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                        Câu {idx + 1} • {q.subject}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRevealedSolutions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {isRevealed ? 'Ẩn lời giải' : 'Xem lời giải chi tiết'}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      {q.question}
                    </p>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isChosen = selectedOpt === opt.id;
                        let optStyle = 'border-slate-200 bg-white hover:border-blue-300';
                        if (isChosen) {
                          optStyle = isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-rose-400 bg-rose-50 text-rose-800 font-bold';
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPracticeAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                            className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${optStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    {isRevealed && (
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-blue-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Đáp án đúng: {q.correct}
                        </span>
                        <p className="text-slate-700">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SUBMISSION HISTORY & RESULTS (LỊCH SỬ BÀI LÀM)    */}
      {/* ======================================================== */}
      {activeMenu === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Kết Quả & Bảng Điểm Cá Nhân Của Em
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xem lại điểm số, nhận xét của thầy cô và chi tiết bài làm từng câu
                </p>
              </div>

              {/* Status Filter for History */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({mySubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('graded')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyFilter === 'graded'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  ✓ Đã chấm ({gradedSubs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    historyFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  ⏳ Chờ chấm ({pendingSubs.length})
                </button>
              </div>
            </div>

            {filteredHistorySubs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Award className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs">
                  {historyFilter === 'graded'
                    ? 'Chưa có bài thi nào được giáo viên chấm xong.'
                    : historyFilter === 'pending'
                    ? 'Không có bài thi nào đang chờ chấm.'
                    : 'Em chưa nộp bài thi nào trên hệ thống.'}
                </p>
                {historyFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('all')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Xem tất cả bài nộp
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('exams')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Chọn đề và làm bài ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistorySubs.map((sub) => {
                  const examRef = exams.find((e) => e.id === sub.examId);
                  const isGraded = sub.gradingStatus === 'graded';

                  return (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isGraded
                          ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {examRef ? examRef.title : `Đề thi #${sub.examId}`}
                          </span>

                          {/* Prominent Status Badge */}
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs animate-in fade-in">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              ĐÃ CHẤM XONG ({sub.score}/10đ)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chờ cô chấm tự luận
                            </span>
                          )}

                          {examRef && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {examRef.subject} • {examRef.grade}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')} • Thời gian làm: {Math.floor(sub.timeSpentSeconds / 60)} phút • Vi phạm: {sub.violationsCount} lần
                        </p>

                        {/* Teacher's Feedback Quote */}
                        {sub.teacherFeedback && (
                          <div className="text-xs text-blue-800 bg-blue-50/90 p-2.5 rounded-xl border border-blue-200/80 font-medium flex items-start gap-2">
                            <span className="text-sm">💬</span>
                            <div>
                              <strong className="text-blue-900">Lời phê của giáo viên:</strong>
                              <p className="mt-0.5 text-slate-700 italic">"{sub.teacherFeedback}"</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-600">{sub.score}</span>
                          <span className="text-xs text-slate-400">/10 điểm</span>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            TN: {sub.multipleChoiceScore ?? sub.score}đ • TL: {sub.essayScore ?? 0}đ
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {isGraded && (
                            <button
                              type="button"
                              onClick={() => setInspectingGradedSub({ sub, exam: examRef })}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Xem điểm chi tiết</span>
                            </button>
                          )}

                          {examRef && (
                            <button
                              type="button"
                              onClick={() => onSelectExam(examRef.id)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer text-center"
                            >
                              Làm lại
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILED GRADED EXAM RESULTS */}
      {inspectingGradedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setInspectingGradedSub(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 text-xs font-black uppercase mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Phiếu Điểm & Nhận Xét Chi Tiết
              </div>

              <h3 className="text-xl font-bold tracking-tight">
                {inspectingGradedSub.exam?.title || `Bài thi #${inspectingGradedSub.sub.examId}`}
              </h3>

              <p className="text-xs text-emerald-100 mt-1">
                Học sinh: <strong className="text-white">{inspectingGradedSub.sub.studentName}</strong> • Lớp: <strong className="text-white">{inspectingGradedSub.sub.studentClass}</strong> • SBD: {inspectingGradedSub.sub.studentId || 'Chưa có'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Score Summary Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[11px] text-slate-500 block">Trắc nghiệm</span>
                  <span className="text-lg font-black text-slate-800">
                    {inspectingGradedSub.sub.multipleChoiceScore ?? inspectingGradedSub.sub.score}đ
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-emerald-100">
                  <span className="text-[11px] text-slate-500 block">Tự luận cô chấm</span>
                  <span className="text-lg font-black text-blue-600">
                    {inspectingGradedSub.sub.essayScore ?? 0}đ
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <span className="text-[11px] text-emerald-100 block font-semibold">TỔNG ĐIỂM</span>
                  <span className="text-xl font-black text-amber-300">
                    {inspectingGradedSub.sub.score}/10đ
                  </span>
                </div>
              </div>

              {/* Teacher Overall Feedback */}
              {inspectingGradedSub.sub.teacherFeedback && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <span>💬</span>
                    <span>Nhận xét chung của giáo viên:</span>
                  </span>
                  <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-blue-100">
                    "{inspectingGradedSub.sub.teacherFeedback}"
                  </p>
                </div>
              )}

              {/* Essay Questions Detail Breakdown */}
              {inspectingGradedSub.exam && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chi tiết điểm từng câu Tự luận:
                  </h4>

                  {inspectingGradedSub.exam.questions
                    .filter(q => q.type === 'essay')
                    .map((q, idx) => {
                      const scoreDetail = inspectingGradedSub.sub.essayScores?.[q.id];
                      const studentAnswer = inspectingGradedSub.sub.answers[q.id];

                      return (
                        <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                              Câu {q.order || idx + 1} (Tự luận - Tối đa {q.points}đ)
                            </span>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg">
                              Điểm đạt: {scoreDetail ? scoreDetail.score : 0} / {q.points}đ
                            </span>
                          </div>

                          <p className="text-xs text-slate-800 font-semibold">{q.text}</p>

                          {/* Student Answer */}
                          <div className="text-xs bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 block font-bold mb-0.5">
                              Bài làm của em:
                            </span>
                            <p className="text-slate-700 whitespace-pre-wrap">
                              {studentAnswer || 'Em chưa làm câu hỏi này.'}
                            </p>
                          </div>

                          {/* Teacher Note on this question */}
                          {scoreDetail?.teacherNote && (
                            <div className="text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                              <span className="font-bold block">Ghi chú của giáo viên:</span>
                              <p className="italic">{scoreDetail.teacherNote}</p>
                            </div>
                          )}

                          {/* Model Answer / Rubric */}
                          {q.modelAnswer && (
                            <details className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl">
                              <summary className="font-bold text-slate-700 cursor-pointer hover:underline">
                                Xem đáp án mẫu & hướng dẫn chấm
                              </summary>
                              <p className="mt-2 whitespace-pre-wrap text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                {q.modelAnswer}
                              </p>
                            </details>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingGradedSub(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Đóng phiếu điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: INTERACTIVE GAMES (GAME HỌC TẬP)                  */}
      {/* ======================================================== */}
      {activeMenu === 'games' && <InteractiveGames />}

      {/* ======================================================== */}
      {/* TAB 5: VIRTUAL 360° SPACE (LỚP HỌC 360°)                */}
      {/* ======================================================== */}
      {activeMenu === 'vr360' && <Virtual360Space />}
    </div>
  );
};
