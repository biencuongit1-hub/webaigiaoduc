import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeOverview } from './components/HomeOverview';
import { ExamCreator } from './components/ExamCreator';
import { StudentExamRoom } from './components/StudentExamRoom';
import { StudentPortal } from './components/StudentPortal';
import { ExamManagement } from './components/ExamManagement';
import { InteractiveGames } from './components/InteractiveGames';
import { Virtual360Space } from './components/Virtual360Space';
import { AIAssistantModal } from './components/AIAssistantModal';
import { FirebaseDeployGuide } from './components/FirebaseDeployGuide';
import { UserAccountModal } from './components/UserAccountModal';
import { GradingNotificationToast, GradingNotification } from './components/GradingNotificationToast';
import { StorageService } from './services/storage';
import { testConnection, subscribeToExams, subscribeToSubmissions, subscribeToUserProfiles } from './services/firebase';
import { Exam, ExamSubmission, UserProfile, UserRole } from './types';
import { Heart, Sparkles, CheckCircle2, Flame, RefreshCw, UserCheck, Cloud } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => StorageService.getCurrentUser());
  const [userRole, setUserRole] = useState<UserRole>(() => currentUser.role || 'teacher');
  const [currentTab, setCurrentTab] = useState<string>(() => userRole === 'student' ? 'student_portal' : 'home');

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [activeExamForStudent, setActiveExamForStudent] = useState<Exam | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  // Live Toast Notification for Graded Exam
  const [liveNotification, setLiveNotification] = useState<GradingNotification | null>(null);
  const prevGradedSubsRef = React.useRef<Set<string>>(new Set());
  const initialLoadRef = React.useRef<boolean>(true);

  // Load initial data from StorageService & setup Firestore sync
  useEffect(() => {
    const loadedExams = StorageService.getExams();
    const loadedSubs = StorageService.getSubmissions();
    const loadedUser = StorageService.getCurrentUser();
    setExams(loadedExams);
    setSubmissions(loadedSubs);
    setCurrentUser(loadedUser);
    setUserRole(loadedUser.role);

    // Test connection and sync with Firestore cloud database
    testConnection().then(() => {
      setIsCloudSynced(true);
      StorageService.syncWithCloud().then(({ examCount, submissionCount, userCount }) => {
        console.log(`[Firebase Cloud] Đã đồng bộ ${examCount} đề thi, ${submissionCount} bài làm và ${userCount} tài khoản từ Firestore.`);
        setExams(StorageService.getExams());
        setSubmissions(StorageService.getSubmissions());
      }).catch(() => {});
    }).catch(() => {});

    // Subscribe to Firestore real-time updates (Exams, Submissions, User profiles)
    let unsubExams: (() => void) | undefined;
    let unsubSubs: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    try {
      unsubExams = subscribeToExams((cloudExams) => {
        if (cloudExams && cloudExams.length > 0) {
          setExams(cloudExams);
        }
      });
      unsubSubs = subscribeToSubmissions(undefined, (cloudSubs) => {
        if (cloudSubs && cloudSubs.length > 0) {
          setSubmissions(cloudSubs);
        }
      });
      unsubUsers = subscribeToUserProfiles((cloudUsers) => {
        if (cloudUsers && cloudUsers.length > 0) {
          // Keep current user updated
          const match = cloudUsers.find(u => u.id === currentUser.id);
          if (match) {
            setCurrentUser(match);
          }
        }
      });
    } catch {
      // Fallback to local
    }

    // Check URL params for direct exam join code (?code=XYZ)
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      const match = loadedExams.find((e) => e.accessCode.toUpperCase() === codeParam.toUpperCase());
      if (match) {
        setActiveExamForStudent(match);
        setCurrentTab('student_room');
      }
    }

    // Role param (?role=student or ?role=teacher)
    const roleParam = params.get('role');
    if (roleParam === 'student' || roleParam === 'teacher') {
      setUserRole(roleParam);
      setCurrentTab(roleParam === 'student' ? 'student_portal' : 'home');
    }

    return () => {
      if (unsubExams) unsubExams();
      if (unsubSubs) unsubSubs();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Listen for newly graded submissions in realtime
  useEffect(() => {
    if (submissions.length === 0) return;

    if (initialLoadRef.current) {
      // First load: cache all already graded submission IDs
      submissions.forEach((s) => {
        if (s.gradingStatus === 'graded') {
          prevGradedSubsRef.current.add(s.id);
        }
      });
      initialLoadRef.current = false;
      return;
    }

    // Check if any submission belonging to this student just became graded
    const newlyGraded = submissions.find((s) => {
      const isGraded = s.gradingStatus === 'graded';
      const alreadyNotified = prevGradedSubsRef.current.has(s.id);
      const isForCurrentStudent =
        userRole === 'student' &&
        (s.studentName.toLowerCase() === currentUser.fullName.toLowerCase() ||
         (currentUser.studentId && s.studentId === currentUser.studentId));

      return isGraded && !alreadyNotified && isForCurrentStudent;
    });

    if (newlyGraded) {
      prevGradedSubsRef.current.add(newlyGraded.id);
      const examRef = exams.find((e) => e.id === newlyGraded.examId);
      setLiveNotification({
        id: newlyGraded.id,
        examId: newlyGraded.examId,
        examTitle: examRef ? examRef.title : `Đề thi #${newlyGraded.examId}`,
        score: newlyGraded.score,
        mcScore: newlyGraded.multipleChoiceScore,
        essayScore: newlyGraded.essayScore,
        teacherFeedback: newlyGraded.teacherFeedback,
        gradedAt: new Date().toISOString()
      });
    }

    // Always keep cache updated
    submissions.forEach((s) => {
      if (s.gradingStatus === 'graded') {
        prevGradedSubsRef.current.add(s.id);
      }
    });
  }, [submissions, currentUser, userRole, exams]);

  // Handler: Change Role
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    // If current user's role is different, update or offer to switch
    const updated = { ...currentUser, role: newRole };
    StorageService.setCurrentUser(updated);
    setCurrentUser(updated);

    if (newRole === 'student') {
      setCurrentTab('student_portal');
    } else {
      setCurrentTab('home');
    }
  };

  // Handler: User changes profile via modal
  const handleUserChange = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    setUserRole(newUser.role);
    if (newUser.role === 'student') {
      setCurrentTab('student_portal');
    } else {
      setCurrentTab('home');
    }
  };

  // Handler: Student joins exam by access code
  const handleJoinExamByCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = exams.find((e) => e.accessCode.toUpperCase() === cleanCode);
    if (found) {
      setActiveExamForStudent(found);
      setCurrentTab('student_room');
    } else {
      alert(`Không tìm thấy đề thi với mã "${code}". Vui lòng kiểm tra lại hoặc thử mã mẫu: TOAN9GK2`);
    }
  };

  // Handler: Start student exam directly from card
  const handleSelectExamForStudent = (examId: string) => {
    const found = exams.find((e) => e.id === examId);
    if (found) {
      setActiveExamForStudent(found);
      setCurrentTab('student_room');
    }
  };

  // Handler: Save newly created exam (Auto-sync to Cloud & Vercel)
  const handleSaveExam = async (newExam: Exam) => {
    await StorageService.saveExam(newExam);
    const updated = StorageService.getExams();
    setExams(updated);
    // Switch to management page
    setCurrentTab('manage_exams');
  };

  // Handler: Delete exam
  const handleDeleteExam = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đề thi này không? Dữ liệu bài làm liên quan cũng sẽ bị gỡ bỏ.')) {
      await StorageService.deleteExam(id);
      setExams(StorageService.getExams());
    }
  };

  // Handler: Complete student submission
  const handleFinishSubmission = async (submission: ExamSubmission) => {
    await StorageService.saveSubmission(submission);
    setSubmissions(StorageService.getSubmissions());
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'student_room') {
            setActiveExamForStudent(null);
          }
        }}
        userRole={userRole}
        setUserRole={handleRoleChange}
        currentUser={currentUser}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenExamByCode={() => {
          const code = prompt('Nhập mã đề thi (VD: TOAN9GK2 hoặc SUDIA8):');
          if (code) handleJoinExamByCode(code);
        }}
        examsCount={exams.length}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Firebase & Vercel Cloud Realtime Sync Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  Firebase Cloud Firestore & Vercel: Tự động đồng bộ đề thi và bài làm
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Đề giáo viên úp lên từ Word/PDF hoặc AI tự động đồng bộ tức thì lên giao diện Vercel và thiết bị của học sinh theo thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={async () => {
                const res = await StorageService.syncWithCloud();
                setExams(StorageService.getExams());
                setSubmissions(StorageService.getSubmissions());
                alert(`Đồng bộ thành công! Hiện có ${res.examCount} đề thi, ${res.submissionCount} bài làm và ${res.userCount} tài khoản trên Cloud.`);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Đồng bộ ngay</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 flex items-center gap-1.5 transition-all text-xs cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Tạo / Đổi tài khoản</span>
            </button>

            {userRole === 'teacher' && (
              <button
                type="button"
                onClick={() => setCurrentTab('create_exam')}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition-all text-xs cursor-pointer"
              >
                <span>+ Úp đề Word/PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* CONDITIONAL PORTALS: TEACHER VS STUDENT                 */}
        {/* ======================================================= */}

        {/* VIEW: STUDENT PORTAL (LÀM BÀI, ÔN TẬP, LỊCH SỬ) */}
        {(userRole === 'student' || currentTab === 'student_portal' || currentTab === 'student_study' || currentTab === 'student_history') && currentTab !== 'student_room' && (
          <StudentPortal
            currentUser={currentUser}
            exams={exams}
            submissions={submissions}
            onSelectExam={handleSelectExamForStudent}
            onJoinExamByCode={handleJoinExamByCode}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
          />
        )}

        {/* VIEW: TEACHER HOME OVERVIEW */}
        {userRole === 'teacher' && currentTab === 'home' && (
          <HomeOverview
            exams={exams}
            onNavigateTab={setCurrentTab}
            onJoinExamCode={handleJoinExamByCode}
            onSelectExam={handleSelectExamForStudent}
          />
        )}

        {/* VIEW: EXAM CREATOR (AZOTA STYLE WITH GRADE RESTRICTION) */}
        {userRole === 'teacher' && currentTab === 'create_exam' && (
          <ExamCreator
            onSaveExam={handleSaveExam}
            onCancel={() => setCurrentTab('home')}
          />
        )}

        {/* VIEW: EXAM MANAGEMENT & GRADEBOOK */}
        {userRole === 'teacher' && currentTab === 'manage_exams' && (
          <ExamManagement
            exams={exams}
            submissions={submissions}
            onDeleteExam={handleDeleteExam}
            onTakeExam={(id) => {
              handleSelectExamForStudent(id);
            }}
            onUpdateSubmission={handleFinishSubmission}
            onCreateNew={() => setCurrentTab('create_exam')}
          />
        )}

        {/* VIEW: STUDENT EXAM ROOM (ACTIVE TEST TAKING) */}
        {currentTab === 'student_room' && (
          activeExamForStudent ? (
            <StudentExamRoom
              exam={activeExamForStudent}
              currentUser={currentUser}
              onFinishSubmission={handleFinishSubmission}
              onExitRoom={() => {
                setActiveExamForStudent(null);
                setCurrentTab(userRole === 'student' ? 'student_portal' : 'home');
              }}
            />
          ) : (
            <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg">Chưa chọn đề thi nào</h3>
              <p className="text-xs text-slate-500">
                Vui lòng nhập mã đề thi từ trang chủ hoặc chọn một đề từ danh sách đề có sẵn.
              </p>
              <button
                type="button"
                onClick={() => setCurrentTab(userRole === 'student' ? 'student_portal' : 'home')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Quay lại danh sách đề
              </button>
            </div>
          )
        )}

        {/* VIEW: CLASSROOM GAMES (GAMIFICATION) */}
        {currentTab === 'games' && <InteractiveGames />}

        {/* VIEW: 360 DEGREE VIRTUAL CLASSROOM */}
        {currentTab === 'vr360' && <Virtual360Space />}

        {/* VIEW: TEACHER AI ASSISTANT */}
        {currentTab === 'ai_assistant' && <AIAssistantModal />}

        {/* VIEW: FIREBASE & VERCEL DEPLOYMENT GUIDE */}
        {currentTab === 'firebase_deploy' && <FirebaseDeployGuide />}
      </main>

      {/* Account Registration & Switch Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />

      {/* Realtime Grading Notification Toast */}
      <GradingNotificationToast
        notification={liveNotification}
        onClose={() => setLiveNotification(null)}
        onViewDetails={(examId) => {
          setUserRole('student');
          setCurrentTab('student_history');
        }}
      />

      {/* Global Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-xs py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              AI
            </span>
            <span className="font-bold text-slate-700">
              Giáo viên thời đại AI - Hệ Thống Tạo Đề Thi & Khảo Thí Thông Minh
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Đồng hành cùng hàng nghìn giáo viên & học sinh Việt Nam đổi mới giáo dục</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Tài khoản ({currentUser.fullName})
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCurrentTab('firebase_deploy')}
              className="text-orange-600 hover:text-orange-700 font-bold hover:underline cursor-pointer"
            >
              Deploy Vercel & Firebase
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
