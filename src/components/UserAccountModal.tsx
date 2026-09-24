import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  School, 
  Calendar, 
  BookOpen, 
  Mail, 
  Phone, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Layers, 
  LogOut,
  UserCheck,
  Building,
  KeyRound
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';

export interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'register' | 'switch'>('register');
  const [role, setRole] = useState<UserRole>('student');

  // Form Fields as requested: Tên, Khối, Lớp, Trường, Năm sinh...
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('Lớp 9');
  const [className, setClassName] = useState('9A1');
  const [school, setSchool] = useState('Trường THCS & THPT Đoàn Thượng');
  const [birthYear, setBirthYear] = useState('2010');
  const [subject, setSubject] = useState('Toán học');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => StorageService.getAllUsers());

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!school.trim()) {
      setErrorMsg('Vui lòng nhập Tên trường học.');
      return;
    }
    if (!birthYear.trim()) {
      setErrorMsg('Vui lòng nhập Năm sinh.');
      return;
    }

    const newProfile: UserProfile = {
      id: `user_${role}_${Date.now()}`,
      role,
      fullName: fullName.trim(),
      grade,
      className: className.trim() || (role === 'teacher' ? 'Tổ Bộ môn' : 'Lớp ' + grade.replace('Lớp ', '')),
      school: school.trim(),
      birthYear: birthYear.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      studentId: role === 'student' ? (studentId.trim() || `HS${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
      subject: role === 'teacher' ? subject : undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await StorageService.registerUser(newProfile);
      onUserChange(newProfile);
      setAllUsers(StorageService.getAllUsers());
      setSuccessMsg(`Tạo tài khoản ${role === 'teacher' ? 'Giáo viên' : 'Học sinh'} "${newProfile.fullName}" thành công!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch {
      setErrorMsg('Có lỗi xảy ra khi lưu tài khoản. Vui lòng thử lại.');
    }
  };

  const handleSelectExistingUser = (u: UserProfile) => {
    StorageService.setCurrentUser(u);
    onUserChange(u);
    setSuccessMsg(`Đã chuyển sang tài khoản "${u.fullName}" (${u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
              {currentUser.role === 'teacher' ? (
                <School className="w-6 h-6 text-amber-300" />
              ) : (
                <GraduationCap className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Quản Lý Tài Khoản Giáo Viên & Học Sinh
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">
                Tạo tài khoản với đầy đủ thông tin: Họ tên, Khối, Lớp, Trường học, Năm sinh
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 bg-black/20 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                activeTab === 'register'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              + Tạo tài khoản mới
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('switch')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                activeTab === 'switch'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Đổi tài khoản ({allUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                activeTab === 'profile'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Hồ sơ hiện tại
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6">
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: REGISTER ACCOUNT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role selection radio buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Bạn muốn tạo tài khoản cho ai? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('teacher');
                      setBirthYear('1988');
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <School className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold">Giáo Viên</div>
                      <div className="text-[10px] text-slate-500">Tạo đề thi & chấm bài</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('student');
                      setBirthYear('2010');
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold">Học Sinh</div>
                      <div className="text-[10px] text-slate-500">Làm bài & ôn tập</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Required Fields Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Họ và tên */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={role === 'teacher' ? 'VD: Thầy Nguyễn Biên Cương' : 'VD: Nguyễn Văn An'}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Khối lớp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option>Lớp 6</option>
                    <option>Lớp 7</option>
                    <option>Lớp 8</option>
                    <option>Lớp 9</option>
                    <option>Lớp 10</option>
                    <option>Lớp 11</option>
                    <option>Lớp 12</option>
                    {role === 'teacher' && <option>Tất cả các khối</option>}
                  </select>
                </div>

                {/* Lớp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {role === 'teacher' ? 'Tổ / Bộ môn giảng dạy' : 'Lớp học *'}
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder={role === 'teacher' ? 'VD: Tổ Toán - Tin' : 'VD: 9A1'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Trường học */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trường học *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="VD: THCS & THPT Đoàn Thượng, Hải Dương"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Năm sinh */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm sinh *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1950}
                      max={2022}
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder={role === 'teacher' ? 'VD: 1988' : 'VD: 2010'}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Môn học (Teacher) hoặc Mã học sinh (Student) */}
                {role === 'teacher' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Môn giảng dạy
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    >
                      <option>Toán học</option>
                      <option>Vật lý</option>
                      <option>Hóa học</option>
                      <option>Sinh học</option>
                      <option>Ngữ văn</option>
                      <option>Lịch sử & Địa lý</option>
                      <option>Tiếng Anh</option>
                      <option>Tin học</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số báo danh / Mã HS (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="VD: HS0901"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                )}

                {/* Email / Số điện thoại liên hệ */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email hoặc Số điện thoại (Nhận thông báo & kết quả)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: email@school.edu.vn hoặc 0988xxxxxx"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'teacher'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Hoàn Tất Đăng Ký Tài Khoản {role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SWITCH ACCOUNT */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Chọn tài khoản để đăng nhập hoặc chuyển đổi vai trò ngay lập tức:
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isTeacher = u.role === 'teacher';

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectExistingUser(u)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                          isTeacher ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}>
                          {isTeacher ? <School className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {u.fullName}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isTeacher ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isTeacher ? 'Giáo viên' : 'Học sinh'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-1.5 py-0.2 rounded">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {u.school} • {u.grade} ({u.className}) • Sinh năm {u.birthYear}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 shrink-0"
                      >
                        Chọn
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Chưa có tài khoản của bạn?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  + Đăng ký tài khoản mới
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CURRENT PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                      currentUser.role === 'teacher' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {currentUser.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{currentUser.fullName}</h3>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        currentUser.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {currentUser.role === 'teacher' ? '👨‍🏫 Giáo viên' : '🎓 Học sinh'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ID: {currentUser.id.slice(-6)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Khối lớp</span>
                    <span className="font-bold text-slate-800">{currentUser.grade}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">{currentUser.role === 'teacher' ? 'Tổ / Bộ môn' : 'Lớp'}</span>
                    <span className="font-bold text-slate-800">{currentUser.className}</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Trường học</span>
                    <span className="font-bold text-slate-800">{currentUser.school}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Năm sinh</span>
                    <span className="font-bold text-slate-800">{currentUser.birthYear}</span>
                  </div>
                  {currentUser.role === 'teacher' && currentUser.subject && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[11px] text-slate-400 block">Môn giảng dạy</span>
                      <span className="font-bold text-blue-700">{currentUser.subject}</span>
                    </div>
                  )}
                  {currentUser.role === 'student' && currentUser.studentId && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[11px] text-slate-400 block">Số báo danh (SBD)</span>
                      <span className="font-bold text-emerald-700">{currentUser.studentId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Đổi tài khoản khác</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo thêm tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
