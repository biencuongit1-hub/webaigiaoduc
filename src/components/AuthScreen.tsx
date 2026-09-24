import React, { useState } from 'react';
import { 
  GraduationCap, 
  School, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  KeyRound, 
  Building, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  BookOpen
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { StorageService, INITIAL_SAMPLE_USERS } from '../services/storage';

export interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'forgot_password';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [username, setUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('Lớp 9');
  const [className, setClassName] = useState('9A1');
  const [school, setSchool] = useState('Trường THCS & THPT Đoàn Thượng');
  const [birthYear, setBirthYear] = useState('2010');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('Toán học');

  // Forgot password form state
  const [recoveryContact, setRecoveryContact] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Vui lòng nhập Tên tài khoản, Email hoặc Số điện thoại.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Vui lòng nhập Mật khẩu.');
      return;
    }

    const user = StorageService.login(loginIdentifier, loginPassword);
    if (user) {
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.fullName} (${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}).`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 700);
    } else {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác. Mật khẩu mẫu: 123');
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('Tên tài khoản đăng nhập phải có ít nhất 3 ký tự.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setErrorMsg('Mật khẩu bảo vệ phải có ít nhất 3 ký tự.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập Email hợp lệ (để xác thực và lấy lại mật khẩu).');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setErrorMsg('Vui lòng nhập Số điện thoại hợp lệ (để nhận OTP khôi phục mật khẩu).');
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

    // Check duplicate username
    const allUsers = StorageService.getAllUsers();
    if (allUsers.some(u => u.username && u.username.toLowerCase() === username.trim().toLowerCase())) {
      setErrorMsg(`Tên tài khoản "${username}" đã tồn tại. Vui lòng chọn tên đăng nhập khác.`);
      return;
    }

    const newProfile: UserProfile = {
      id: `user_${role}_${Date.now()}`,
      role,
      username: username.trim().toLowerCase(),
      password: regPassword,
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
      setSuccessMsg(`Tạo tài khoản ${role === 'teacher' ? 'Giáo viên' : 'Học sinh'} "${newProfile.fullName}" thành công! Dữ liệu đã lưu vào Database.`);
      setTimeout(() => {
        onLoginSuccess(newProfile);
      }, 1000);
    } catch {
      setErrorMsg('Có lỗi xảy ra khi lưu tài khoản vào Database.');
    }
  };

  // Handle Find User for Password Reset
  const handleFindUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSentMsg('');

    if (!recoveryContact.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký.');
      return;
    }

    const matched = StorageService.findUserForPasswordReset(recoveryContact);
    if (!matched) {
      setErrorMsg(`Không tìm thấy tài khoản nào với "${recoveryContact}".`);
      return;
    }

    setFoundUser(matched);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpSentMsg(`Mã xác thực đã được gửi tới Email & SĐT của ${matched.fullName}. Mã OTP là: ${otp}`);
  };

  // Handle Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
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

    const ok = await StorageService.resetPassword(foundUser.id, newPassword);
    if (ok) {
      setSuccessMsg(`Đã đặt lại mật khẩu mới cho tài khoản "${foundUser.fullName}" và lưu vào Database!`);
      setTimeout(() => {
        const updated = StorageService.getCurrentUser();
        if (updated) onLoginSuccess(updated);
        else setMode('login');
      }, 1500);
    } else {
      setErrorMsg('Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    }
  };

  // Quick 1-click sample login
  const handleQuickLogin = (user: UserProfile) => {
    StorageService.setCurrentUser(user);
    setSuccessMsg(`Đã đăng nhập tài khoản "${user.fullName}" (${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})!`);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
            AI
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
              Giáo viên thời đại AI
            </h1>
            <p className="text-[11px] text-blue-200">
              Hệ Thống Tạo Đề Thi & Phòng Thi Thông Minh
            </p>
          </div>
        </div>

        {/* Status Badge: Chưa đăng nhập */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300">Yêu cầu đăng nhập</span>
        </div>
      </div>

      {/* Main Center Card */}
      <div className="max-w-xl w-full mx-auto my-6 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chỉ khi đăng nhập mới thấy và sử dụng các chức năng</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            {mode === 'login' && 'Đăng Nhập Tài Khoản'}
            {mode === 'register' && 'Tạo Tài Khoản Mới (Lưu Database)'}
            {mode === 'forgot_password' && 'Lấy Lại Mật Khẩu'}
          </h2>

          <p className="text-xs text-blue-100 mt-1">
            {mode === 'login' && 'Đăng nhập để vào giao diện Giáo viên (Tạo đề, chấm bài) hoặc Học sinh (Làm bài, ôn luyện).'}
            {mode === 'register' && 'Nhập tài khoản, mật khẩu, email và SĐT để bảo mật và khôi phục khi cần.'}
            {mode === 'forgot_password' && 'Xác thực qua Email hoặc Số điện thoại đã đăng ký để đặt lại mật khẩu mới.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-2 mt-5 bg-black/25 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Đăng nhập
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              + Tạo tài khoản
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('forgot_password');
                setErrorMsg('');
                setSuccessMsg('');
                setFoundUser(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                mode === 'forgot_password'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Quên mật khẩu?
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 1: LOGIN FORM                                       */}
          {/* ======================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tài khoản, Email hoặc Số điện thoại *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="VD: vanan2010, vanan.2010@gmail.com hoặc 0912345678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                      setMode('forgot_password');
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
                    placeholder="Nhập mật khẩu của bạn..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Đăng Nhập Vào Hệ Thống</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Login Section */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">
                  ⚡ Hoặc đăng nhập nhanh bằng 1-click (Tài khoản mẫu):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(INITIAL_SAMPLE_USERS[2])}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-emerald-900 text-xs block">🎓 HS: Nguyễn Văn An</span>
                    <span className="text-[10px] text-slate-500 block">Lớp 9A1 • Đoàn Thượng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin(INITIAL_SAMPLE_USERS[0])}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-blue-900 text-xs block">👨‍🏫 GV: Thầy Biên Cương</span>
                    <span className="text-[10px] text-slate-500 block">Tổ Toán • Đoàn Thượng</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ======================================================= */}
          {/* TAB 2: REGISTER FORM                                    */}
          {/* ======================================================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bạn muốn tạo tài khoản cho: *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <span className="font-bold text-xs block">Học Sinh</span>
                      <span className="text-[10px] text-slate-500">Làm bài & ôn luyện</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <School className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <span className="font-bold text-xs block">Giáo Viên</span>
                      <span className="text-[10px] text-slate-500">Tạo đề & chấm thi</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Credentials Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
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
                      placeholder={role === 'student' ? 'VD: vanan2010 hoặc hs_nguyenan' : 'VD: thaycuong_toan'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
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
                      placeholder="Nhập lại mật khẩu..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Recovery Verification Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Email & SĐT (Để lấy lại mật khẩu)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email * (Khôi phục mật khẩu)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: vanan.2010@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại (SĐT) * (Nhận OTP)
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Details Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>3. Thông tin học sinh / trường lớp</span>
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
                      placeholder={role === 'teacher' ? 'VD: Thầy Nguyễn Biên Cương' : 'VD: Nguyễn Văn An'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khối lớp *
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                      Lớp học *
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="VD: 9A1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                      placeholder="VD: THCS & THPT Đoàn Thượng, Hải Dương"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn Tất Đăng Ký & Tự Động Lưu Database</span>
              </button>
            </form>
          )}

          {/* ======================================================= */}
          {/* TAB 3: FORGOT PASSWORD                                  */}
          {/* ======================================================= */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Khôi phục & lấy lại mật khẩu
                </span>
                <p className="text-[11px] text-slate-600">
                  Nhập Email hoặc Số điện thoại bạn đã dùng khi tạo tài khoản để xác minh và đặt mật khẩu mới.
                </p>
              </div>

              {!foundUser ? (
                <form onSubmit={handleFindUser} className="space-y-3">
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
                    className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Tìm Kiếm & Nhận Mã Xác Thực</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
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
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-blue-300/80 py-2">
        Hệ thống phân quyền Giáo viên & Học sinh bảo mật 4.0 • Dữ liệu tự động đồng bộ Firestore & Vercel
      </div>
    </div>
  );
};
