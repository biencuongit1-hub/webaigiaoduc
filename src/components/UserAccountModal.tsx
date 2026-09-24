import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Edit3,
  Save
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';

export interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile) => void;
  onLogout?: () => void;
  initialTab?: 'register' | 'login' | 'forgot_password' | 'switch' | 'profile' | 'edit_profile';
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onLogout,
  initialTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'forgot_password' | 'switch' | 'profile' | 'edit_profile'>(
    currentUser ? initialTab : 'login'
  );
  const [role, setRole] = useState<UserRole>('student');

  // Registration Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('Lớp 9');
  const [className, setClassName] = useState('9A1');
  const [school, setSchool] = useState('Trường THCS & THPT Đoàn Thượng');
  const [birthYear, setBirthYear] = useState('2010');
  const [subject, setSubject] = useState('Toán học');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password form state
  const [recoveryContact, setRecoveryContact] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');

  // Edit profile form state
  const [editFullName, setEditFullName] = useState('');
  const [editGrade, setEditGrade] = useState('Lớp 9');
  const [editClassName, setEditClassName] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editSubject, setEditSubject] = useState('Toán học');
  const [editNewPassword, setEditNewPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => StorageService.getAllUsers());

  // Populate edit fields whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || '');
      setEditGrade(currentUser.grade || 'Lớp 9');
      setEditClassName(currentUser.className || '');
      setEditSchool(currentUser.school || '');
      setEditBirthYear(currentUser.birthYear || '');
      setEditEmail(currentUser.email || '');
      setEditPhoneNumber(currentUser.phoneNumber || '');
      setEditStudentId(currentUser.studentId || '');
      setEditSubject(currentUser.subject || 'Toán học');
      setEditNewPassword('');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // 1. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('Tên tài khoản phải có ít nhất 3 ký tự.');
      return;
    }
    if (!password || password.length < 3) {
      setErrorMsg('Mật khẩu bảo vệ phải có ít nhất 3 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập Email hợp lệ (để lấy lại mật khẩu).');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setErrorMsg('Vui lòng nhập Số điện thoại hợp lệ (để nhận OTP).');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!school.trim()) {
      setErrorMsg('Vui lòng nhập Tên trường học.');
      return;
    }

    const existing = allUsers.find(
      u => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (existing) {
      setErrorMsg(`Tên tài khoản "${username}" đã có người sử dụng.`);
      return;
    }

    const newProfile: UserProfile = {
      id: `user_${role}_${Date.now()}`,
      role,
      username: username.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      grade,
      className: className.trim() || (role === 'teacher' ? 'Tổ Bộ môn' : 'Lớp ' + grade.replace('Lớp ', '')),
      school: school.trim(),
      birthYear: birthYear.trim() || (role === 'teacher' ? '1988' : '2010'),
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
      setSuccessMsg(`Tạo tài khoản "${newProfile.fullName}" thành công! Dữ liệu đã lưu vào Database.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch {
      setErrorMsg('Có lỗi xảy ra khi lưu tài khoản vào Database.');
    }
  };

  // 2. Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Vui lòng nhập thông tin đăng nhập và mật khẩu.');
      return;
    }

    const user = StorageService.login(loginIdentifier, loginPassword);
    if (user) {
      onUserChange(user);
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.fullName}.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } else {
      setErrorMsg('Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  // 3. Handle Find User for Password Recovery
  const handleFindUserForRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSentMsg('');

    if (!recoveryContact.trim()) {
      setErrorMsg('Vui lòng nhập Email, Số điện thoại hoặc Tên tài khoản.');
      return;
    }

    const matched = StorageService.findUserForPasswordReset(recoveryContact);
    if (!matched) {
      setErrorMsg(`Không tìm thấy tài khoản nào khớp với "${recoveryContact}".`);
      return;
    }

    setFoundUser(matched);
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpSentMsg(`Mã xác thực đã gửi tới Email & SĐT của ${matched.fullName}. Mã OTP là: ${randomOtp}`);
  };

  // 4. Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!foundUser) return;
    if (verificationOtp.trim() !== generatedOtp) {
      setErrorMsg('Mã OTP không chính xác.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 3 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Xác nhận mật khẩu không khớp.');
      return;
    }

    const success = await StorageService.resetPassword(foundUser.id, newPassword);
    if (success) {
      setSuccessMsg(`Đã đặt lại mật khẩu mới cho tài khoản "${foundUser.fullName}" và lưu vào Database!`);
      setTimeout(() => {
        const updated = StorageService.getCurrentUser();
        if (updated) onUserChange(updated);
        setSuccessMsg('');
        onClose();
      }, 1500);
    } else {
      setErrorMsg('Có lỗi xảy ra khi cập nhật mật khẩu vào Database.');
    }
  };

  // 5. Handle Edit Profile Submit
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg('');

    if (!editFullName.trim()) {
      setErrorMsg('Họ và tên không được để trống.');
      return;
    }
    if (!editSchool.trim()) {
      setErrorMsg('Tên trường học không được để trống.');
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: editFullName.trim(),
      grade: editGrade,
      className: editClassName.trim(),
      school: editSchool.trim(),
      birthYear: editBirthYear.trim(),
      email: editEmail.trim(),
      phoneNumber: editPhoneNumber.trim(),
      studentId: currentUser.role === 'student' ? editStudentId.trim() : undefined,
      subject: currentUser.role === 'teacher' ? editSubject : undefined,
      password: editNewPassword.trim() ? editNewPassword.trim() : currentUser.password
    };

    try {
      await StorageService.updateUserProfile(updatedUser);
      onUserChange(updatedUser);
      setAllUsers(StorageService.getAllUsers());
      setSuccessMsg('Đã cập nhật thông tin cá nhân thành công lên Database Firestore!');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('profile');
      }, 1200);
    } catch {
      setErrorMsg('Không thể lưu thông tin vào Database.');
    }
  };

  // 6. Select existing user directly
  const handleSelectExistingUser = (u: UserProfile) => {
    StorageService.setCurrentUser(u);
    onUserChange(u);
    setSuccessMsg(`Đã chuyển sang tài khoản "${u.fullName}" (${u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
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
              {currentUser?.role === 'teacher' ? (
                <School className="w-6 h-6 text-amber-300" />
              ) : (
                <GraduationCap className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Tài Khoản & Hồ Sơ Cá Nhân
                </h2>
                {currentUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đã đăng nhập
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-xs mt-0.5">
                Chỉnh sửa thông tin cá nhân, khối lớp, email, SĐT & đồng bộ Database Firestore
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 bg-black/25 p-1 rounded-xl text-xs overflow-x-auto scrollbar-none">
            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Hồ sơ cá nhân
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('edit_profile');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                    activeTab === 'edit_profile'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  ✏️ Sửa thông tin
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              + Tạo tài khoản
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Đăng nhập
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('forgot_password');
                setErrorMsg('');
                setSuccessMsg('');
                setFoundUser(null);
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                activeTab === 'forgot_password'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Quên mật khẩu?
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('switch');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                activeTab === 'switch'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Đổi tài khoản ({allUsers.length})
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: EDIT PROFILE (CHỈNH SỬA THÔNG TIN CÁ NHÂN)          */}
          {/* ======================================================== */}
          {activeTab === 'edit_profile' && currentUser && (
            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Chỉnh sửa thông tin cá nhân & lưu vào Database
                </span>
                <p className="text-[11px] text-slate-600">
                  Thầy cô và các em có thể đổi họ tên, khối lớp, trường học, SĐT, email và đổi mật khẩu mới.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ và tên */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                {/* Khối lớp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp *
                  </label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option>Lớp 6</option>
                    <option>Lớp 7</option>
                    <option>Lớp 8</option>
                    <option>Lớp 9</option>
                    <option>Lớp 10</option>
                    <option>Lớp 11</option>
                    <option>Lớp 12</option>
                    {currentUser.role === 'teacher' && <option>Tất cả các khối</option>}
                  </select>
                </div>

                {/* Lớp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {currentUser.role === 'teacher' ? 'Tổ / Bộ môn' : 'Lớp học'}
                  </label>
                  <input
                    type="text"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    placeholder="VD: 9A1"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
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
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Năm sinh */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm sinh *
                  </label>
                  <input
                    type="number"
                    value={editBirthYear}
                    onChange={(e) => setEditBirthYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* SBD / Môn học */}
                {currentUser.role === 'teacher' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Môn giảng dạy
                    </label>
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
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
                      Số báo danh (SBD) / Mã HS
                    </label>
                    <input
                      type="text"
                      value={editStudentId}
                      onChange={(e) => setEditStudentId(e.target.value)}
                      placeholder="VD: HS0901"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email liên hệ / khôi phục
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại (SĐT)
                  </label>
                  <input
                    type="tel"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Đổi mật khẩu mới */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đổi mật khẩu mới (Để trống nếu không đổi)
                  </label>
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới nếu muốn thay đổi..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Vào Database</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: PROFILE VIEW (XEM HỒ SƠ & TRẠNG THÁI)                */}
          {/* ======================================================== */}
          {activeTab === 'profile' && currentUser && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs ${
                      currentUser.role === 'teacher' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {currentUser.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{currentUser.fullName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentUser.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentUser.role === 'teacher' ? '👨‍🏫 Giáo viên' : '🎓 Học sinh'}
                        </span>
                        {currentUser.username && (
                          <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded font-bold">
                            @{currentUser.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái đăng nhập */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang online
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Tên tài khoản</span>
                    <span className="font-bold text-slate-800 font-mono">{currentUser.username || 'Chưa đặt'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Mật khẩu</span>
                    <span className="font-mono text-slate-500">•••••••• (Đã bảo mật)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Email khôi phục</span>
                    <span className="font-semibold text-slate-800 truncate block">{currentUser.email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block">Số điện thoại (SĐT)</span>
                    <span className="font-bold text-emerald-700">{currentUser.phoneNumber || 'Chưa cập nhật'}</span>
                  </div>
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
                  {currentUser.role === 'student' && currentUser.studentId && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[11px] text-slate-400 block">Số báo danh (SBD)</span>
                      <span className="font-bold text-emerald-700">{currentUser.studentId}</span>
                    </div>
                  )}
                  {currentUser.role === 'teacher' && currentUser.subject && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[11px] text-slate-400 block">Môn giảng dạy</span>
                      <span className="font-bold text-blue-700">{currentUser.subject}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Sửa thông tin & Đăng xuất */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit_profile')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Thay đổi thông tin cá nhân</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('switch')}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Đổi tài khoản</span>
                  </button>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản này không?')) {
                        onLogout();
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Đăng xuất</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: REGISTER (TẠO TÀI KHOẢN MỚI)                        */}
          {/* ======================================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tạo tài khoản dành cho: *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('student');
                      setBirthYear('2010');
                    }}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <div className="text-xs font-bold">Học Sinh</div>
                      <div className="text-[10px] text-slate-500">Làm bài & ôn thi</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('teacher');
                      setBirthYear('1988');
                    }}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <School className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-xs font-bold">Giáo Viên</div>
                      <div className="text-[10px] text-slate-500">Tạo đề & chấm thi</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Credentials */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>1. Tài khoản & Mật khẩu</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên tài khoản (Tên đăng nhập) *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="VD: vanan2010"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Recovery Contact */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Email & SĐT (Khôi phục mật khẩu)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: vanan.2010@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại (SĐT) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>3. Họ tên & Trường lớp</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khối lớp *
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lớp học
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="VD: 9A1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trường học *
                    </label>
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="VD: THCS & THPT Đoàn Thượng"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn Tất Tạo Tài Khoản & Lưu Database</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: LOGIN (ĐĂNG NHẬP)                                   */}
          {/* ======================================================== */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tài khoản, Email hoặc Số điện thoại *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="VD: vanan2010, vanan.2010@gmail.com hoặc 0912345678"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mật khẩu *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot_password');
                      setRecoveryContact(loginIdentifier);
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: FORGOT PASSWORD (KHÔI PHỤC MẬT KHẨU)                */}
          {/* ======================================================== */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              {!foundUser ? (
                <form onSubmit={handleFindUserForRecovery} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email hoặc Số điện thoại đã đăng ký *
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryContact}
                      onChange={(e) => setRecoveryContact(e.target.value)}
                      placeholder="VD: vanan.2010@gmail.com hoặc 0912345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Tìm Kiếm & Nhận Mã OTP Khôi Phục</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 block">{foundUser.fullName}</span>
                      <span className="text-[10px] text-slate-500">{foundUser.school} • {foundUser.grade}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFoundUser(null)}
                      className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Đổi tài khoản khác
                    </button>
                  </div>

                  {otpSentMsg && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                      {otpSentMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã xác thực OTP *
                    </label>
                    <input
                      type="text"
                      required
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value)}
                      placeholder={`Nhập mã OTP: ${generatedOtp}`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-widest text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mật khẩu mới..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Xác nhận lại *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Nhập lại..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu Mật Khẩu Mới Vào Database & Đăng Nhập</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: SWITCH (DANH SÁCH TÀI KHOẢN MẪU)                    */}
          {/* ======================================================== */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Chọn tài khoản để đăng nhập hoặc trải nghiệm ngay:
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isCurrent = currentUser && u.id === currentUser.id;
                  const isTeacher = u.role === 'teacher';

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectExistingUser(u)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {u.fullName}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              isTeacher ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isTeacher ? 'Giáo viên' : 'Học sinh'}
                            </span>
                            {u.username && (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                @{u.username}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-1 py-0.2 rounded">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {u.school} • {u.grade} ({u.className}) {u.phoneNumber && `• SĐT: ${u.phoneNumber}`}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
