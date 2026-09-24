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
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  HelpCircle
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
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'forgot_password' | 'switch' | 'profile'>('register');
  const [role, setRole] = useState<UserRole>('student');

  // Registration Fields: username, password, email, phone, fullName, grade, className, school, birthYear...
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

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => StorageService.getAllUsers());

  if (!isOpen) return null;

  // 1. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations requested: tài khoản, mật khẩu, email, sđt
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập Tên tài khoản đăng nhập (VD: vanan2010).');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMsg('Tên tài khoản phải có ít nhất 3 ký tự.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập Mật khẩu bảo vệ tài khoản.');
      return;
    }
    if (password.length < 3) {
      setErrorMsg('Mật khẩu quá ngắn, vui lòng nhập ít nhất 3 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ (để có thể lấy lại mật khẩu).');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setErrorMsg('Vui lòng nhập Số điện thoại hợp lệ (để lấy lại mật khẩu khi quên).');
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
    if (!birthYear.trim()) {
      setErrorMsg('Vui lòng nhập Năm sinh.');
      return;
    }

    // Check if username already exists
    const existing = allUsers.find(
      u => u.username && u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (existing) {
      setErrorMsg(`Tên tài khoản "${username}" đã có người sử dụng. Vui lòng chọn tên tài khoản khác.`);
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
      setSuccessMsg(`Tạo tài khoản ${role === 'teacher' ? 'Giáo viên' : 'Học sinh'} "${newProfile.fullName}" thành công! Dữ liệu đã lưu vào Database.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1800);
    } catch {
      setErrorMsg('Có lỗi xảy ra khi lưu tài khoản vào Database. Vui lòng thử lại.');
    }
  };

  // 2. Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
      onUserChange(user);
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.fullName} (${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}).`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } else {
      setErrorMsg('Tài khoản hoặc mật khẩu không chính xác. Nếu quên mật khẩu, vui lòng bấm "Lấy lại mật khẩu" bên dưới.');
    }
  };

  // 3. Handle Find User for Password Recovery
  const handleFindUserForRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setOtpSentMsg('');

    if (!recoveryContact.trim()) {
      setErrorMsg('Vui lòng nhập Email, Số điện thoại hoặc Tên tài khoản đã đăng ký.');
      return;
    }

    const matched = StorageService.findUserForPasswordReset(recoveryContact);
    if (!matched) {
      setErrorMsg(`Không tìm thấy tài khoản nào khớp với "${recoveryContact}". Vui lòng kiểm tra lại Email hoặc Số điện thoại.`);
      return;
    }

    setFoundUser(matched);
    // Generate simulated 6-digit OTP code for verification
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpSentMsg(`Hệ thống đã gửi mã xác thực khôi phục đến Email (${matched.email || 'đã đăng ký'}) và SĐT (${matched.phoneNumber || 'đã đăng ký'}). Mã xác nhận là: ${randomOtp}`);
  };

  // 4. Handle Submit New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!foundUser) return;

    if (!verificationOtp.trim() || verificationOtp.trim() !== generatedOtp) {
      setErrorMsg('Mã xác thực không chính xác. Vui lòng nhập đúng mã đã được cấp.');
      return;
    }

    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('Vui lòng nhập mật khẩu mới (ít nhất 3 ký tự).');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    const success = await StorageService.resetPassword(foundUser.id, newPassword);
    if (success) {
      setSuccessMsg(`Đã đặt lại mật khẩu mới thành công cho tài khoản "${foundUser.fullName}" và lưu vào Database! Đang đăng nhập...`);
      setTimeout(() => {
        const updated = StorageService.getCurrentUser();
        onUserChange(updated);
        setSuccessMsg('');
        onClose();
      }, 2000);
    } else {
      setErrorMsg('Có lỗi xảy ra khi cập nhật mật khẩu mới vào Database.');
    }
  };

  // 5. Select existing user directly
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
              {currentUser.role === 'teacher' ? (
                <School className="w-6 h-6 text-amber-300" />
              ) : (
                <GraduationCap className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Tài Khoản Học Sinh & Giáo Viên
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">
                Đăng ký tài khoản, mật khẩu, email, SĐT bảo mật & tự động lưu Database Firestore
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 bg-black/25 p-1 rounded-xl text-xs overflow-x-auto scrollbar-none">
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
              Lấy lại mật khẩu
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
              Danh sách ({allUsers.length})
            </button>

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
              Hồ sơ
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
          {/* TAB 1: REGISTER ACCOUNT (TẠO TÀI KHOẢN MỚI)             */}
          {/* ======================================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role selection radio buttons */}
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
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold">Học Sinh</div>
                      <div className="text-[10px] text-slate-500">Làm bài & luyện thi</div>
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
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <School className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold">Giáo Viên</div>
                      <div className="text-[10px] text-slate-500">Tạo đề & chấm bài</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION: CREDENTIALS (TÀI KHOẢN & MẬT KHẨU) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>1. Thông tin đăng nhập & Bảo mật</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tên tài khoản */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên tài khoản (Tên đăng nhập) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder={role === 'student' ? 'VD: vanan2010 hoặc hs_nguyenan' : 'VD: thaycuong_toan'}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Dùng để đăng nhập vào làm bài thi trên mọi thiết bị
                    </span>
                  </div>

                  {/* Mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
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

                  {/* Xác nhận mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: EMAIL & SĐT (ĐỂ LẤY LẠI MẬT KHẨU) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Thông tin xác thực (Email & SĐT để lấy lại mật khẩu)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email đăng ký * (Lấy lại mật khẩu)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="VD: vanan.2010@gmail.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại * (Nhận OTP khôi phục)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="VD: 0912345678"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: PROFILE INFO (HỌ TÊN, KHỐI, LỚP, TRƯỜNG, NĂM SINH) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>3. Thông tin học sinh / nhà trường</span>
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
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={role === 'teacher' ? 'VD: Thầy Nguyễn Biên Cương' : 'VD: Nguyễn Văn An'}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
                      placeholder="VD: THCS & THPT Đoàn Thượng, Hải Dương"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  {/* Năm sinh */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Năm sinh *
                    </label>
                    <input
                      type="number"
                      required
                      min={1950}
                      max={2022}
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder={role === 'teacher' ? 'VD: 1988' : 'VD: 2010'}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  {/* SBD / Mã HS hoặc Môn */}
                  {role === 'teacher' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Môn giảng dạy
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  )}
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
                    Hoàn Tất Tạo Tài Khoản {role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'} & Lưu Database
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LOGIN (ĐĂNG NHẬP)                                 */}
          {/* ======================================================== */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-1">
                <h3 className="font-bold text-slate-900 text-xs">Đăng nhập tài khoản của bạn</h3>
                <p className="text-[11px] text-slate-500">
                  Nhập tên tài khoản, email hoặc số điện thoại kèm mật khẩu để đăng nhập
                </p>
              </div>

              <div className="space-y-3">
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
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
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
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </button>

              <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Tạo tài khoản học sinh mới ngay
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORGOT / RESET PASSWORD (LẤY LẠI MẬT KHẨU)        */}
          {/* ======================================================== */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Khôi phục & Lấy lại mật khẩu qua Email / SĐT</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Nhập Email hoặc Số điện thoại đã đăng ký để xác thực danh tính và đặt mật khẩu mới lưu vào Database.
                </p>
              </div>

              {!foundUser ? (
                /* Step 1: Find user by contact */
                <form onSubmit={handleFindUserForRecovery} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email hoặc Số điện thoại đã đăng ký *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={recoveryContact}
                        onChange={(e) => setRecoveryContact(e.target.value)}
                        placeholder="VD: vanan.2010@gmail.com hoặc 0912345678"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                      />
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Tìm Kiếm & Gửi Mã Khôi Phục</span>
                  </button>
                </form>
              ) : (
                /* Step 2: Found user, enter OTP and new password */
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {/* Found User Info Card */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {foundUser.fullName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {foundUser.fullName} ({foundUser.username || 'Chưa đặt username'})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {foundUser.school} • {foundUser.grade} ({foundUser.className})
                        </div>
                      </div>
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
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                      {otpSentMsg}
                    </div>
                  )}

                  {/* Verification OTP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã xác thực OTP (6 số) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value)}
                      placeholder={`Nhập mã OTP: ${generatedOtp}`}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-center font-mono font-bold tracking-widest text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* New Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Xác nhận mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
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

              <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                Nhớ mật khẩu rồi?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SWITCH ACCOUNTS (DANH SÁCH TÀI KHOẢN)              */}
          {/* ======================================================== */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Chọn nhanh tài khoản để đăng nhập hoặc kiểm tra thông tin tài khoản mẫu:
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
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

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Chưa có tài khoản của em?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  + Tạo tài khoản học sinh mới
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PROFILE VIEW (HỒ SƠ CÁ NHÂN)                      */}
          {/* ======================================================== */}
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentUser.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentUser.role === 'teacher' ? '👨‍🏫 Giáo viên' : '🎓 Học sinh'}
                        </span>
                        {currentUser.username && (
                          <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                            @{currentUser.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo tài khoản mới</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
