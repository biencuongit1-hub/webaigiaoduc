import React, { useState } from 'react';
import { 
  GraduationCap, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  School, 
  Lock, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { Exam, UserProfile } from '../types';
import { StorageService } from '../services/storage';

export interface PublicExamJoinScreenProps {
  exam: Exam;
  currentUser: UserProfile | null;
  onEnterExamRoom: (studentUser: UserProfile) => void;
  onOpenLogin: () => void;
}

export const PublicExamJoinScreen: React.FC<PublicExamJoinScreenProps> = ({
  exam,
  currentUser,
  onEnterExamRoom,
  onOpenLogin
}) => {
  // Form fields for quick student access without pre-existing account
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [grade, setGrade] = useState(currentUser?.grade || exam.grade || 'Lớp 9');
  const [className, setClassName] = useState(currentUser?.className || '9A1');
  const [school, setSchool] = useState(currentUser?.school || 'Trường THCS Nguyễn Đôn');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [labPeriod, setLabPeriod] = useState(currentUser?.labPeriod || 'Tiết 1');
  const [computerNumber, setComputerNumber] = useState(currentUser?.computerNumber || '');
  const [examPassword, setExamPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleClearPreviousAccount = () => {
    StorageService.logout();
    setFullName('');
    setStudentId('');
    setComputerNumber('');
    setNotificationMsg('🧹 Đã xóa tài khoản cũ trên máy này. Em có thể nhập thông tin của mình để vào thi!');
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const mcCount = (exam.questions || []).filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length;
  const essayCount = (exam.questions || []).filter(q => q.type === 'essay').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check exam password if required
    if (exam.settings?.password && exam.settings.password.trim() !== '') {
      if (examPassword.trim() !== exam.settings.password.trim()) {
        setErrorMessage('Mật khẩu đề thi không chính xác. Vui lòng kiểm tra lại với giáo viên!');
        return;
      }
    }

    // Check grade restriction
    if (exam.restrictToGrade && exam.allowedGrades && exam.allowedGrades.length > 0 && !exam.allowedGrades.includes('all')) {
      if (!exam.allowedGrades.includes(grade)) {
        setErrorMessage(`Đề thi này chỉ dành cho học sinh: ${exam.allowedGrades.join(', ')}. Khối lớp hiện tại của em (${grade}) không phù hợp.`);
        return;
      }
    }

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên của em.');
      return;
    }
    if (!className.trim()) {
      setErrorMessage('Vui lòng nhập Lớp học của em.');
      return;
    }

    // Create or use profile with lab period & computer number
    let studentProfile: UserProfile;
    if (currentUser) {
      studentProfile = {
        ...currentUser,
        fullName: fullName.trim(),
        grade,
        className: className.trim(),
        school: school.trim(),
        studentId: studentId.trim() || currentUser.studentId,
        labPeriod,
        computerNumber: computerNumber.trim() || currentUser.computerNumber
      };
      StorageService.setCurrentUser(studentProfile);
    } else {
      const generatedId = `hs_guest_${Date.now()}`;
      studentProfile = {
        id: generatedId,
        role: 'student',
        fullName: fullName.trim(),
        grade,
        className: className.trim(),
        school: school.trim() || 'Trường THCS & THPT',
        studentId: studentId.trim() || `SBD-${Math.floor(100 + Math.random() * 900)}`,
        birthYear: '2010',
        labPeriod,
        computerNumber: computerNumber.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      StorageService.setCurrentUser(studentProfile);
    }

    onEnterExamRoom(studentProfile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
            AI
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
              Phòng Thi Trực Tuyến 4.0
            </h1>
            <p className="text-[11px] text-blue-200">
              Hệ Thống Khảo Thí & Chấm Bài Giáo Viên Thời Đại AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Thí sinh: <strong>{currentUser.fullName}</strong></span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập tài khoản</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Join Card */}
      <div className="max-w-2xl w-full mx-auto my-6 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Banner with Exam Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
              Mã đề: {exam.accessCode}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black">
              {exam.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-200 text-[11px] font-bold border border-emerald-300/30">
              {exam.grade}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            {exam.title}
          </h2>

          {exam.description && (
            <p className="text-xs text-blue-100 mt-2 line-clamp-2">
              {exam.description}
            </p>
          )}

          {/* Exam Specs */}
          <div className="grid grid-cols-3 gap-2.5 mt-5 bg-black/20 p-3 rounded-2xl text-center text-xs backdrop-blur-xs">
            <div>
              <span className="text-[10px] text-blue-200 block">Thời gian thi</span>
              <span className="font-extrabold text-white text-sm flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                {exam.durationMinutes} phút
              </span>
            </div>

            <div>
              <span className="text-[10px] text-blue-200 block">Số lượng câu</span>
              <span className="font-extrabold text-white text-sm flex items-center justify-center gap-1 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-emerald-300" />
                {(exam.questions || []).length} câu
              </span>
            </div>

            <div>
              <span className="text-[10px] text-blue-200 block">Cấu trúc đề</span>
              <span className="font-extrabold text-white text-xs block mt-1">
                {mcCount} TN • {essayCount} TL
              </span>
            </div>
          </div>
        </div>

        {/* Card Body: Student Info Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {notificationMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notificationMsg}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Computer Lab Handover Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>💻 Phòng máy theo tiết:</span>
                {currentUser ? (
                  <span className="text-blue-700">Đang lưu máy của {currentUser.fullName} ({currentUser.className})</span>
                ) : (
                  <span className="text-slate-500">Chưa có tài khoản lưu trên máy này</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Nếu bạn là học sinh của tiết học mới, hãy nhấn nút bên cạnh để làm mới máy.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearPreviousAccount}
              className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              🧹 Đổi học sinh / Xóa tài khoản cũ
            </button>
          </div>

          {/* Notification on Proctoring / Anti-cheat */}
          {exam.settings?.antiCheatProctoring && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Lưu ý:</strong> Đề thi có bật giám sát chuyển tab. Vui lòng giữ màn hình thi liên tục trong suốt quá trình làm bài.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span>Thông tin thí sinh dự thi</span>
            </div>

            {/* Lab Period & Machine Selection */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiết học *
                </label>
                <select
                  value={labPeriod}
                  onChange={(e) => setLabPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Tiết 1">Tiết 1</option>
                  <option value="Tiết 2">Tiết 2</option>
                  <option value="Tiết 3">Tiết 3</option>
                  <option value="Tiết 4">Tiết 4</option>
                  <option value="Tiết 5">Tiết 5</option>
                  <option value="Tiết 6">Tiết 6</option>
                  <option value="Tiết 7">Tiết 7</option>
                  <option value="Tiết 8">Tiết 8</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số máy (Phòng máy)
                </label>
                <input
                  type="text"
                  value={computerNumber}
                  onChange={(e) => setComputerNumber(e.target.value)}
                  placeholder="VD: Máy 12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Họ và tên */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên thí sinh *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              {/* Khối lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối lớp *
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option>Lớp 6</option>
                  <option>Lớp 7</option>
                  <option>Lớp 8</option>
                  <option>Lớp 9</option>
                  <option>Lớp 10</option>
                  <option>Lớp 11</option>
                  <option>Lớp 12</option>
                </select>
              </div>

              {/* Lớp học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp học *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="VD: 9A1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Trường học */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trường học *
                </label>
                <input
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="VD: Trường THCS Nguyễn Đôn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Số báo danh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số báo danh (SBD) / Mã HS
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="VD: SBD-09 hoặc HS0901"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Mật khẩu đề thi nếu có */}
              {exam.settings?.password && exam.settings.password.trim() !== '' && (
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Mật khẩu vào đề thi *</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={examPassword}
                    onChange={(e) => setExamPassword(e.target.value)}
                    placeholder="Nhập mật khẩu do giáo viên cấp..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>BẮT ĐẦU VÀO LÀM BÀI THI ({labPeriod})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {!currentUser && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Em đã có tài khoản học sinh?</span>
              <button
                type="button"
                onClick={onOpenLogin}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Đăng nhập tài khoản
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-blue-300/80 py-2">
        Hệ thống phòng thi trực tuyến thời đại AI • Kết nối dữ liệu Cloud Firestore thời gian thực
      </div>
    </div>
  );
};
