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
  Share2,
  BookOpen,
  Award,
  User,
  School,
  Building,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

export interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: UserProfile;
  onOpenAccountModal: () => void;
  onOpenExamByCode?: () => void;
  examsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  setUserRole,
  currentUser,
  onOpenAccountModal,
  onOpenExamByCode,
  examsCount = 0
}) => {
  const isTeacher = userRole === 'teacher';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top announcement bar with Vercel & Firebase status */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
              Hệ Sinh Thái AI 4.0
            </span>
            <span className="font-medium truncate">
              {isTeacher
                ? 'Chế độ Giáo viên: Soạn đề Word/PDF, phân quyền khối lớp & chấm thi tự động'
                : `Chế độ Học sinh: Góc học tập & làm bài thi theo khối (${currentUser.grade} - ${currentUser.school})`}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-blue-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Cloud className="w-3.5 h-3.5 text-emerald-300" />
              <span>Đồng bộ Realtime Vercel & Firebase Cloud</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div 
            id="nav-logo"
            onClick={() => onSelectTab(isTeacher ? 'home' : 'student_portal')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md transition-transform group-hover:scale-105 ${
              isTeacher 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20' 
                : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20'
            }`}>
              {isTeacher ? 'AI' : 'HS'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-blue-600 transition-colors">
                  {isTeacher ? 'Giáo viên thời đại AI' : 'Góc Học Sinh'}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  isTeacher 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {isTeacher ? 'Giáo Viên' : currentUser.grade}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {isTeacher 
                  ? 'Hệ sinh thái dạy học thông minh & Quản lý khảo thí' 
                  : `${currentUser.school} • Lớp ${currentUser.className}`}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - CONDITIONAL BASED ON ROLE */}
          <nav className="hidden lg:flex items-center gap-1">
            {isTeacher ? (
              /* TEACHER MENUS */
              <>
                <button
                  id="tab-home"
                  onClick={() => onSelectTab('home')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
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
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'create_exam'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Tạo đề thi AI
                </button>

                <button
                  id="tab-exam-management"
                  onClick={() => onSelectTab('manage_exams')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'manage_exams'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Quản lý & Điểm số
                </button>

                <button
                  id="tab-ai-assistant"
                  onClick={() => onSelectTab('ai_assistant')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'ai_assistant'
                      ? 'bg-amber-50 text-amber-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bot className="w-4 h-4 text-amber-600" />
                  Trợ lý AI
                </button>

                <button
                  id="tab-games"
                  onClick={() => onSelectTab('games')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'vr360'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Bài giảng 360°
                </button>
              </>
            ) : (
              /* STUDENT MENUS - CLEAN & FOCUSED ON LEARNING */
              <>
                <button
                  id="tab-student-portal"
                  onClick={() => onSelectTab('student_portal')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'student_portal'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Làm bài thi ({currentUser.grade})
                </button>

                <button
                  id="tab-student-study"
                  onClick={() => onSelectTab('student_study')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'student_study'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Góc học tập & Ôn luyện
                </button>

                <button
                  id="tab-student-history"
                  onClick={() => onSelectTab('student_history')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'student_history'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Lịch sử & Điểm số
                </button>

                <button
                  id="tab-student-games"
                  onClick={() => onSelectTab('games')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'games'
                      ? 'bg-purple-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  Game học tập
                </button>

                <button
                  id="tab-student-vr"
                  onClick={() => onSelectTab('vr360')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'vr360'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Lớp học 360°
                </button>
              </>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Enter Code for Student */}
            {onOpenExamByCode && (
              <button
                id="btn-quick-join"
                onClick={onOpenExamByCode}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:border-emerald-400 hover:text-emerald-700 bg-white transition-colors cursor-pointer"
              >
                Nhập mã đề
              </button>
            )}

            {/* Role switch toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="role-teacher-btn"
                onClick={() => {
                  setUserRole('teacher');
                  onSelectTab('home');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isTeacher
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👨‍🏫 Giáo viên
              </button>
              <button
                id="role-student-btn"
                onClick={() => {
                  setUserRole('student');
                  onSelectTab('student_portal');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isTeacher
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎓 Học sinh
              </button>
            </div>

            {/* User Profile / Account Switch Button */}
            <button
              type="button"
              onClick={onOpenAccountModal}
              title="Quản lý tài khoản: Họ tên, Lớp, Khối, Trường, Năm sinh"
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer group"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                isTeacher ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {currentUser.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-blue-600">
                  {currentUser.fullName}
                </div>
                <div className="text-[9px] text-slate-400 leading-tight">
                  {currentUser.school ? currentUser.school.split(' ').slice(0, 3).join(' ') : currentUser.role}
                </div>
              </div>
            </button>

            {/* Cloud Sync Button */}
            <button
              id="btn-nav-firebase"
              onClick={() => onSelectTab('firebase_deploy')}
              title="Đồng bộ Vercel & Firebase Cloud"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                currentTab === 'firebase_deploy'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Vercel & Cloud</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Tab Bar */}
        <div className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-slate-100 scrollbar-none">
          {isTeacher ? (
            <>
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
                Tạo đề AI
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
                onClick={() => onSelectTab('ai_assistant')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                  currentTab === 'ai_assistant' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Trợ lý AI
              </button>
              <button
                onClick={() => onSelectTab('games')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                  currentTab === 'games' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'
                }`}
              >
                Game
              </button>
              <button
                onClick={() => onSelectTab('vr360')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                  currentTab === 'vr360' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                360°
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('student_portal')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
                  currentTab === 'student_portal' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                Làm bài thi
              </button>
              <button
                onClick={() => onSelectTab('student_study')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
                  currentTab === 'student_study' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                Ôn luyện
              </button>
              <button
                onClick={() => onSelectTab('student_history')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
                  currentTab === 'student_history' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <Award className="w-3 h-3" />
                Lịch sử
              </button>
              <button
                onClick={() => onSelectTab('games')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                  currentTab === 'games' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'
                }`}
              >
                Game
              </button>
              <button
                onClick={() => onSelectTab('vr360')}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                  currentTab === 'vr360' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                360°
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
