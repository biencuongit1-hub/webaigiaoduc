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
import { StorageService } from '../services/storage';
import { checkCredentialExistsInFirestore } from '../services/firebase';

export interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'forgot_password';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'lab_quick'>(initialMode);
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
  const [school, setSchool] = useState('Trường THCS Nguyễn Đôn');
  const [birthYear, setBirthYear] = useState('2010');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('Toán học');

  // Computer Lab Period State ("Phòng máy theo tiết")
  const [labPeriod, setLabPeriod] = useState('Tiết 1');
  const [computerNumber, setComputerNumber] = useState('');

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

  // One-click clear previous account on this computer
  const handleClearCachedSession = () => {
    StorageService.logout();
    setLoginIdentifier('');
    setLoginPassword('');
    setUsername('');
    setFullName('');
    setComputerNumber('');
    setSuccessMsg('🧹 Đã xóa sạch tài khoản và phiên đăng nhập cũ trên máy tính này! Học sinh mới có thể tạo tài khoản hoặc vào thi ngay.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
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

    const user = await StorageService.login(loginIdentifier, loginPassword);
    if (user) {
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.fullName} (${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}).`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 700);
    } else {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  // Handle Quick Computer Lab Join
  const handleLabQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên học sinh.');
      return;
    }
    if (!className.trim()) {
      setErrorMsg('Vui lòng nhập Lớp học (VD: 9A1).');
      return;
    }

    // Auto-generate clean username for this student in the lab
    const cleanLab = labPeriod.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanComp = computerNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || `m${Math.floor(10 + Math.random() * 89)}`;
    const autoUsername = `hs_${cleanLab}_${cleanComp}_${Date.now().toString().slice(-4)}`;

    const labProfile: UserProfile = {
      id: `user_lab_${Date.now()}`,
      role: 'student',
      username: autoUsername,
      password: regPassword || '123456',
      fullName: fullName.trim(),
      grade,
      className: className.trim(),
      school: school.trim() || 'Trường THCS & THPT',
      birthYear: birthYear.trim() || '2010',
      email: `${autoUsername}@hocsinh.school.local`,
      phoneNumber: '',
      studentId: studentId.trim() || `SBD-${cleanComp.toUpperCase()}`,
      labPeriod,
      computerNumber: computerNumber.trim() || `Máy ${cleanComp}`,
      createdAt: new Date().toISOString()
    };

    try {
      await StorageService.registerUser(labProfile);
      setSuccessMsg(`Đã tạo tài khoản cho học sinh "${labProfile.fullName}" (${labPeriod} - ${computerNumber || 'Phòng máy'}). Đang vào bài thi...`);
      setTimeout(() => {
        onLoginSuccess(labProfile);
      }, 700);
    } catch {
      setErrorMsg('Có lỗi xảy ra khi tạo tài khoản phòng máy.');
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

    // Teacher requires real email & phone. Students in school labs can leave them blank!
    if (role === 'teacher') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Vui lòng nhập Email hợp lệ (để xác thực và lấy lại mật khẩu giáo viên).');
        return;
      }
      if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
        setErrorMsg('Vui lòng nhập Số điện thoại hợp lệ (để nhận OTP khôi phục mật khẩu giáo viên).');
        return;
      }
    } else {
      // Student: if email provided, validate it; if not, assign friendly internal alias
      if (email.trim() && !email.includes('@')) {
        setErrorMsg('Email không đúng định dạng. Em có thể để trống nếu không có email cá nhân.');
        return;
      }
    }

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!school.trim()) {
      setErrorMsg('Vui lòng nhập Tên trường học.');
      return;
    }

    // Check duplicate username in local cache
    const allUsers = StorageService.getAllUsers();
    if (allUsers.some(u => u.username && u.username.toLowerCase() === username.trim().toLowerCase())) {
      setErrorMsg(`Tên tài khoản "${username}" đã tồn tại. Vui lòng chọn tên đăng nhập khác.`);
      return;
    }

    const effectiveEmail = email.trim() || (role === 'student' ? `${username.trim().toLowerCase()}@hocsinh.school.local` : '');

    // Check duplicate username or email in Firestore cloud database
    try {
      const cloudCheck = await checkCredentialExistsInFirestore(username, effectiveEmail);
      if (cloudCheck.exists) {
        setErrorMsg(cloudCheck.reason || 'Tài khoản hoặc email này đã tồn tại trong Database.');
        return;
      }
    } catch {
      // Continue
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
      email: effectiveEmail,
      phoneNumber: phoneNumber.trim(),
      studentId: role === 'student' ? (studentId.trim() || `HS${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
      subject: role === 'teacher' ? subject : undefined,
      labPeriod: role === 'student' ? labPeriod : undefined,
      computerNumber: role === 'student' ? computerNumber : undefined,
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
  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSentMsg('');

    if (!recoveryContact.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký.');
      return;
    }

    const matched = await StorageService.findUserForPasswordReset(recoveryContact);
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
            {mode === 'lab_quick' && '💻 Vào Thi Phòng Máy (Theo Tiết)'}
            {mode === 'register' && 'Tạo Tài Khoản Mới (Lưu Database)'}
            {mode === 'forgot_password' && 'Lấy Lại Mật Khẩu'}
          </h2>

          <p className="text-xs text-blue-100 mt-1">
            {mode === 'login' && 'Đăng nhập để vào giao diện Giáo viên (Tạo đề, chấm bài) hoặc Học sinh (Làm bài, ôn luyện).'}
            {mode === 'lab_quick' && 'Chế độ đặc biệt cho phòng máy: không cần email/sđt, chọn Tiết học và Số máy, tự động xóa tài khoản cũ.'}
            {mode === 'register' && 'Tạo tài khoản Giáo viên hoặc Học sinh. Với học sinh, email và SĐT là tùy chọn.'}
            {mode === 'forgot_password' && 'Xác thực qua Email hoặc Số điện thoại đã đăng ký để đặt lại mật khẩu mới.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 mt-5 bg-black/25 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 min-w-[70px] py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
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
                setMode('lab_quick');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 min-w-[120px] py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                mode === 'lab_quick'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-amber-200 hover:text-amber-100'
              }`}
            >
              💻 Phòng máy theo tiết
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 min-w-[85px] py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
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
              className={`flex-1 min-w-[70px] py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                mode === 'forgot_password'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              Quên MK
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
            <div className="space-y-4">
              {/* Computer Lab Handover Banner */}
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-slate-600">
                  <strong className="text-slate-900 block">💻 Bạn đang ngồi phòng máy theo tiết?</strong>
                  <span>Nếu máy đang lưu tài khoản của học sinh tiết trước:</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCachedSession}
                  className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  🧹 Xóa tài khoản cũ trên máy
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên tài khoản, Email hoặc Số điện thoại *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Nhập tên tài khoản, email hoặc số điện thoại..."
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
                      autoComplete="new-password"
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
              </form>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: LAB QUICK JOIN (PHÒNG MÁY THEO TIẾT)             */}
          {/* ======================================================= */}
          {mode === 'lab_quick' && (
            <form onSubmit={handleLabQuickSubmit} autoComplete="off" className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Chế độ dành riêng cho Phòng Máy Tin Học
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCachedSession}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    🧹 Xóa tài khoản cũ trên máy này
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Không cần Email, không cần Số điện thoại. Học sinh chỉ cần nhập Họ tên, Lớp, chọn Tiết học và Số máy là vào thi được ngay!
                </p>
              </div>

              {/* Lab Period & Machine Selection */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>Thông tin Tiết học & Vị trí máy</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="VD: Máy 08"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Student Identity */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Thông tin Học sinh</span>
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên học sinh *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Khối lớp *
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 bg-white"
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số báo danh / Mã HS
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="VD: HS01"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu (Mặc định 123456)
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>🚀 Vào Phòng Thi ({labPeriod} - {computerNumber || 'Máy hiện tại'})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ======================================================= */}
          {/* TAB 3: REGISTER FORM                                    */}
          {/* ======================================================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} autoComplete="off" className="space-y-4">
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
                      <span className="text-[10px] text-slate-500">Làm bài thi & xem điểm</span>
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
                      autoComplete="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder={role === 'student' ? 'Nhập tên đăng nhập (VD: hocsinh_nguyenan)' : 'Nhập tên đăng nhập (VD: giaovien_toan)'}
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
                  <span>2. Email & SĐT {role === 'student' ? '(Tùy chọn cho học sinh)' : '(Bắt buộc)'}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email {role === 'teacher' ? '*' : '(Không bắt buộc)'}
                    </label>
                    <input
                      type="email"
                      required={role === 'teacher'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'teacher' ? 'VD: giaovien@gmail.com' : 'Để trống nếu không có'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại {role === 'teacher' ? '*' : '(Không bắt buộc)'}
                    </label>
                    <input
                      type="tel"
                      required={role === 'teacher'}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={role === 'teacher' ? 'VD: 0912345678' : 'Để trống nếu không có'}
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

                  {role === 'student' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tiết học (Nếu ở phòng máy)
                        </label>
                        <select
                          value={labPeriod}
                          onChange={(e) => setLabPeriod(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="Tiết 1">Tiết 1</option>
                          <option value="Tiết 2">Tiết 2</option>
                          <option value="Tiết 3">Tiết 3</option>
                          <option value="Tiết 4">Tiết 4</option>
                          <option value="Tiết 5">Tiết 5</option>
                          <option value="Tiết 6">Tiết 6</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số máy (Tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={computerNumber}
                          onChange={(e) => setComputerNumber(e.target.value)}
                          placeholder="VD: Máy 05"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

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
