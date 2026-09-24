import React, { useState } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  FileCheck2, 
  Compass, 
  Gamepad2, 
  Bot, 
  ShieldAlert, 
  Clock, 
  Shuffle, 
  QrCode, 
  Flame, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Users, 
  Globe2,
  BrainCircuit,
  ExternalLink
} from 'lucide-react';
import { Exam } from '../types';

export interface HomeOverviewProps {
  exams: Exam[];
  onNavigate?: (tab: string) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenExam?: (examId: string) => void;
  onSelectExam?: (examId: string) => void;
  onOpenExamByCode?: () => void;
  onJoinExamCode?: (code: string) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  exams,
  onNavigate,
  onNavigateTab,
  onOpenExam,
  onSelectExam,
  onOpenExamByCode,
  onJoinExamCode
}) => {
  const [showCodeInputModal, setShowCodeInputModal] = useState(false);
  const [typedCode, setTypedCode] = useState('');

  const navigateTo = (tab: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleOpenExamId = (examId: string) => {
    if (onSelectExam) {
      onSelectExam(examId);
    } else if (onOpenExam) {
      onOpenExam(examId);
    }
  };

  const handleEnterCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCode.trim()) return;
    setShowCodeInputModal(false);
    if (onJoinExamCode) {
      onJoinExamCode(typedCode.trim());
    } else if (onOpenExamByCode) {
      onOpenExamByCode();
    }
  };
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-12 shadow-2xl border border-blue-700/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_50%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Nền tảng Giáo Dục Số 4.0 Dành Riêng Cho Thầy Cô Việt Nam</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Giáo viên thời đại AI <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-amber-200 bg-clip-text text-transparent">
              Tích hợp Hệ Thống Tạo Đề Thi & Phòng Thi Thông Minh
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            Hệ sinh thái <strong className="text-white">Giáo viên thời đại AI</strong> (Không gian bài giảng 360°, Game lớp học tương tác, Trợ lý AI 4.0), tích hợp <strong className="text-amber-300">Tính năng tạo đề kiểm tra & phòng thi học sinh chống gian lận thông minh</strong>, sẵn sàng đóng gói và deploy lên <strong className="text-orange-400">Firebase Hosting</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-create-exam-btn"
              onClick={() => navigateTo('create_exam')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:translate-y-[-1px]"
            >
              <Sparkles className="w-4 h-4" />
              Tạo đề thi mới (Thời đại AI)
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-student-room-btn"
              onClick={() => setShowCodeInputModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:translate-y-[-1px]"
            >
              <GraduationCap className="w-4 h-4" />
              Nhập mã vào phòng thi
            </button>

            <button
              id="hero-firebase-btn"
              onClick={() => navigateTo('firebase_deploy')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm backdrop-blur-md transition-all"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              Hướng dẫn Deploy Firebase
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700/60">
            <div>
              <div className="text-2xl font-black text-amber-300">01 Giây</div>
              <div className="text-xs text-slate-400">Bóc tách đề Word sang trắc nghiệm</div>
            </div>
            <div>
              <div className="text-2xl font-black text-sky-300">100%</div>
              <div className="text-xs text-slate-400">Giám sát chống gian lận rời tab</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-300">360° VR</div>
              <div className="text-xs text-slate-400">Không gian bảo tàng bài giảng số</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-300">Firebase</div>
              <div className="text-xs text-slate-400">Chuẩn bị sẵn hosting config</div>
            </div>
          </div>
        </div>
      </section>

      {/* KIẾN TRÚC HỆ THỐNG: Khảo sát nền tảng Giáo viên thời đại AI */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Globe2 className="w-4 h-4" />
              Báo cáo nghiên cứu & Chuyển đổi số
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hệ Sinh Thái Giáo Viên Thời Đại AI
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Khảo sát kiến trúc chức năng, phương pháp sư phạm và công nghệ cốt lõi của nền tảng Giáo viên thời đại AI
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 self-start md:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mô hình Giáo Dục Số 4.0</span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">1. Không Gian 360° / Bảo Tàng 3D</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cho phép giáo viên tạo tour tham quan 360 độ ảo (di tích lịch sử, địa lý, vũ trụ, phòng thí nghiệm). Tích hợp điểm tương tác (hotspots) chèn hình ảnh, video, âm thanh giải thích trực tiếp.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">2. Trò Chơi Tương Tác Lớp Học</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gamification giáo dục độc đáo: <em>Quiz nghiêng đầu</em> (học sinh nghiêng người chọn phương án), <em>Kéo co kiến thức</em> (thi đua giữa các tổ/nhóm), <em>Vòng quay may mắn</em> gọi tên ngẫu nhiên.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">3. Trợ Lý AI Giáo Viên 4.0</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tích hợp AI hỗ trợ tự động: Soạn Kế hoạch bài dạy chuẩn CV 5512 của Bộ GD&ĐT, Trợ lý viết ý tưởng Sáng kiến kinh nghiệm (SKKN), và "Chú rồng AI" quản lý âm lượng, trật tự lớp học.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1.5">4. Kho Học Liệu & Đổi Mới</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thư viện giáo án mẫu, ngân hàng câu hỏi phân môn (Toán, Văn, Anh, KHTN, Sử, Địa, Tin học...), hỗ trợ nhập xuất câu hỏi từ Excel/Word để thầy cô dùng ngay khi lên lớp hoặc dạy trực tuyến.
            </p>
          </div>
        </div>

        {/* The New Azota Integration Breakthrough */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 rounded-2xl p-6 border border-blue-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold tracking-wide">
              ĐỘT PHÁ NÂNG CẤP CÔNG NGHỆ
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Module Khảo Thí & Tạo Đề Thi Thời Đại AI Cho Học Sinh
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Giải quyết trọn vẹn mong muốn của thầy cô: <strong className="text-blue-900">Tạo đề thi trắc nghiệm siêu tốc</strong> (copy từ Word, file text hoặc AI sinh đề), <strong className="text-blue-900">Cấu hình giám sát chống gian lận</strong> (phát hiện học sinh chuyển tab/thu nhỏ màn hình), <strong className="text-blue-900">Phòng thi chuyên nghiệp</strong> với phiếu trả lời và đồng hồ đếm ngược, cùng <strong className="text-emerald-900">Hệ thống chấm điểm tự động & xuất bảng điểm Excel</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => navigateTo('create_exam')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors text-center"
            >
              Trải nghiệm tạo đề ngay
            </button>
            <button
              onClick={() => navigateTo('student_room')}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition-colors text-center"
            >
              Vào thi thử nghiệm
            </button>
          </div>
        </div>
      </section>

      {/* AZOTA FEATURE MATRIX: So sánh tính năng giống Azota */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tính Năng Tạo Đề & Khảo Thí Thời Đại AI
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Được thiết kế tối ưu cho thói quen soạn đề của giáo viên và trải nghiệm làm bài của học sinh
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Fast Parsing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Bóc Tách Đề Thi Từ Word / Text</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Giáo viên chỉ cần copy đề thi có sẵn từ Word hoặc dán văn bản trắc nghiệm. Hệ thống tự động nhận diện câu hỏi, các phương án A, B, C, D, đáp án đúng và lời giải chi tiết thông minh.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hỗ trợ dạng Câu 1, Câu 2... hoặc 1. 2.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tự nhận diện bảng đáp án cuối bài</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tích hợp AI tạo đề theo ma trận chuẩn</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigateTo('create_exam')}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
            >
              Thử nhập đề Word ngay
            </button>
          </div>

          {/* Card 2: Anti-cheat Proctoring */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Giám Sát Chống Gian Lận</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Phát hiện ngay lập tức khi học sinh chuyển qua tab khác, mở ứng dụng tra cứu hoặc thoát chế độ làm bài. Tự động ghi lại thời gian và số lần vi phạm để báo cáo cho giáo viên.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bắt sự kiện visibilitychange & window blur</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cảnh báo răn đe ngay trên màn hình</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Thống kê số lần vi phạm trong bảng điểm</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigateTo('student_room')}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition-colors"
            >
              Trải nghiệm phòng thi chống gian lận
            </button>
          </div>

          {/* Card 3: Real-time Gradebook */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Chấm Tự Động & Thống Kê Phổ Điểm</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Ngay khi học sinh bấm nộp bài hoặc hết thời gian, bài thi được chấm điểm tức thì trên thang điểm 10. Giáo viên xem được bảng điểm cả lớp, phân tích câu sai nhiều nhất và xuất Excel.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Chấm trắc nghiệm chính xác tuyệt đối</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Xem chi tiết câu trả lời từng học sinh</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tải file Excel báo cáo cho nhà trường</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigateTo('manage_exams')}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
            >
              Xem sổ điểm & thống kê
            </button>
          </div>
        </div>
      </section>

      {/* SAMPLE EXAMS READY TO TEST */}
      <section className="bg-slate-100/80 rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Đề Thi Mẫu Có Sẵn Trong Hệ Thống
            </h2>
            <p className="text-slate-500 text-sm">
              Học sinh và thầy cô có thể bấm vào làm bài hoặc xem cấu trúc đề ngay
            </p>
          </div>
          <button
            onClick={() => setShowCodeInputModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:border-blue-500 hover:text-blue-700 transition-colors self-start sm:self-auto shadow-xs"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            Nhập mã đề hoặc quét QR
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                    {exam.subject} • {exam.grade}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Mã: {exam.accessCode}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-base leading-snug">
                  {exam.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {exam.description || 'Đề kiểm tra trắc nghiệm đánh giá năng lực học sinh.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {exam.questions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length} TN ({exam.multipleChoicePoints ?? 7}đ)
                  </span>
                  {exam.questions.some(q => q.type === 'essay') && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                      {exam.questions.filter(q => q.type === 'essay').length} TL ({exam.essayPoints ?? 3}đ)
                    </span>
                  )}
                  <span className="text-slate-400 font-semibold">•</span>
                  <span className="font-bold text-slate-700">{exam.durationMinutes} phút</span>
                  <span className="text-slate-400 font-semibold">•</span>
                  <span className="font-bold text-amber-700">{exam.totalPoints}đ</span>
                  {exam.settings.antiCheatProctoring && (
                    <>
                      <span className="text-slate-400 font-semibold">•</span>
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        Giám sát tab
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 truncate">
                  Tạo bởi: {exam.teacherName}
                </span>

                <button
                  onClick={() => handleOpenExamId(exam.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Vào làm bài
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK EXPLORE GVDM INNOVATIVE FEATURES */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Khám Phá Hệ Sinh Thái Đổi Mới Dạy Học
          </h2>
          <p className="text-slate-500 text-sm">
            Trải nghiệm trực tiếp các công nghệ giảng dạy tương tác của Giáo viên thời đại AI
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div 
            onClick={() => navigateTo('games')}
            className="group cursor-pointer rounded-2xl p-5 border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
              Chơi Game Lớp Học
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Trải nghiệm "Quiz Nghiêng Đầu", "Vòng Quay May Mắn" và "Kéo Co Kiến Thức" khuấy động không khí lớp học.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-700">
              <span>Mở phòng Game</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => navigateTo('vr360')}
            className="group cursor-pointer rounded-2xl p-5 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-700 transition-colors">
              Không Gian Bài Giảng 360°
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Tour bảo tàng 3D ảo và không gian tương tác hình ảnh, điểm hotspot phục vụ môn Lịch sử, Địa lý và KHTN.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-700">
              <span>Vào tham quan 360°</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => navigateTo('ai_assistant')}
            className="group cursor-pointer rounded-2xl p-5 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
              Trợ Lý AI Giáo Viên 4.0
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Soạn giáo án CV 5512, gợi ý đề tài Sáng kiến kinh nghiệm (SKKN), và kích hoạt chú rồng AI giữ trật tự.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-700">
              <span>Mở trợ lý AI</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* CODE INPUT MODAL */}
      {showCodeInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Nhập Mã Đề Kiểm Tra Thời Đại AI
              </h3>
              <p className="text-xs text-slate-500">
                Nhập mã do giáo viên cung cấp (VD: <span className="font-mono font-bold text-blue-600">AIEXAM1</span>)
              </p>
            </div>

            <form onSubmit={handleEnterCodeSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={typedCode}
                onChange={(e) => setTypedCode(e.target.value.toUpperCase())}
                placeholder="VD: AIEXAM1"
                className="w-full text-center tracking-widest font-mono text-xl font-black py-3 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-none uppercase"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeInputModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!typedCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40"
                >
                  Vào thi ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
