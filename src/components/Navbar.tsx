import React from 'react';
import { 
  Sparkles, 
  FileSpreadsheet, 
  GraduationCap, 
  Gamepad2, 
  Compass, 
  Bot, 
  Flame, 
  Cloud,
  CheckCircle2,
  Share2
} from 'lucide-react';

export interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole?: 'teacher' | 'student';
  setUserRole?: (role: 'teacher' | 'student') => void;
  onOpenExamByCode?: () => void;
  examsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  userRole = 'teacher',
  setUserRole,
  onOpenExamByCode,
  examsCount = 0
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
              Mới nhất
            </span>
            <span className="font-medium">
              Hệ sinh thái Giáo viên thời đại AI tích hợp Trình tạo đề & Phòng thi học sinh thông minh!
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-blue-100">
            <span className="flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-emerald-300" />
              Sẵn sàng deploy Firebase Hosting
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            id="nav-logo"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              AI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                  Giáo viên thời đại AI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Thời đại AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hệ sinh thái dạy học thông minh & Khảo thí trực tuyến
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="tab-home"
              onClick={() => onSelectTab('home')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'home'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Trang chủ
            </button>

            <button
              id="tab-exam-creator"
              onClick={() => onSelectTab('create_exam')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'create_exam'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Tạo đề thi AI
            </button>

            <button
              id="tab-exam-management"
              onClick={() => onSelectTab('manage_exams')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'manage_exams'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Quản lý & Điểm số
            </button>

            <button
              id="tab-student-room"
              onClick={() => onSelectTab('student_room')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'student_room'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Phòng thi học sinh
            </button>

            <button
              id="tab-games"
              onClick={() => onSelectTab('games')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'games'
                  ? 'bg-purple-50 text-purple-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Game lớp học
            </button>

            <button
              id="tab-360"
              onClick={() => onSelectTab('vr360')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'vr360'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              Bài giảng 360°
            </button>

            <button
              id="tab-ai-assistant"
              onClick={() => onSelectTab('ai_assistant')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'ai_assistant'
                  ? 'bg-amber-50 text-amber-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4 text-amber-600" />
              Trợ lý AI
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Enter Code Quick Button */}
            {onOpenExamByCode && (
              <button
                id="btn-quick-join"
                onClick={onOpenExamByCode}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:border-blue-400 hover:text-blue-700 bg-white transition-colors"
              >
                Nhập mã đề
              </button>
            )}

            {/* Role switch toggle */}
            {setUserRole && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  id="role-teacher-btn"
                  onClick={() => setUserRole('teacher')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    userRole === 'teacher'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Giáo viên
                </button>
                <button
                  id="role-student-btn"
                  onClick={() => {
                    setUserRole('student');
                    onSelectTab('student_room');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    userRole === 'student'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Học sinh
                </button>
              </div>
            )}

            {/* Firebase button */}
            <button
              id="btn-nav-firebase"
              onClick={() => onSelectTab('firebase_deploy')}
              title="Hướng dẫn Deploy Firebase"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                currentTab === 'firebase_deploy'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Deploy Firebase</span>
            </button>
          </div>
        </div>

        {/* Mobile horizontal scroll tab bar */}
        <div className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              currentTab === 'home' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => onSelectTab('create_exam')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
              currentTab === 'create_exam' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Tạo đề thi AI
          </button>
          <button
            onClick={() => onSelectTab('student_room')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
              currentTab === 'student_room' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            Phòng thi HS
          </button>
          <button
            onClick={() => onSelectTab('manage_exams')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              currentTab === 'manage_exams' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Quản lý đề
          </button>
          <button
            onClick={() => onSelectTab('games')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              currentTab === 'games' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'
            }`}
          >
            Game lớp học
          </button>
          <button
            onClick={() => onSelectTab('vr360')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              currentTab === 'vr360' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            Bài giảng 360°
          </button>
          <button
            onClick={() => onSelectTab('ai_assistant')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              currentTab === 'ai_assistant' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
            }`}
          >
            Trợ lý AI
          </button>
          <button
            onClick={() => onSelectTab('firebase_deploy')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              currentTab === 'firebase_deploy' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'
            }`}
          >
            Deploy Firebase
          </button>
        </div>
      </div>
    </header>
  );
};
