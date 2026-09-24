import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeOverview } from './components/HomeOverview';
import { ExamCreator } from './components/ExamCreator';
import { StudentExamRoom } from './components/StudentExamRoom';
import { ExamManagement } from './components/ExamManagement';
import { InteractiveGames } from './components/InteractiveGames';
import { Virtual360Space } from './components/Virtual360Space';
import { AIAssistantModal } from './components/AIAssistantModal';
import { FirebaseDeployGuide } from './components/FirebaseDeployGuide';
import { StorageService } from './services/storage';
import { testConnection, subscribeToExams, subscribeToSubmissions } from './services/firebase';
import { Exam, ExamSubmission } from './types';
import { Heart, Sparkles, CheckCircle2, Flame, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [activeExamForStudent, setActiveExamForStudent] = useState<Exam | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Load initial data from StorageService & setup Firestore sync
  useEffect(() => {
    const loadedExams = StorageService.getExams();
    const loadedSubs = StorageService.getSubmissions();
    setExams(loadedExams);
    setSubmissions(loadedSubs);

    // Test connection and sync with Firestore cloud database
    testConnection().then(() => {
      setIsCloudSynced(true);
      StorageService.syncWithCloud().then(({ examCount, submissionCount }) => {
        console.log(`[Firebase Cloud] Đã đồng bộ ${examCount} đề thi và ${submissionCount} bài làm từ Firestore.`);
        setExams(StorageService.getExams());
        setSubmissions(StorageService.getSubmissions());
      }).catch(() => {});
    }).catch(() => {});

    // Subscribe to Firestore real-time updates
    let unsubExams: (() => void) | undefined;
    let unsubSubs: (() => void) | undefined;
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
    } catch {
      // Fallback
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

    return () => {
      if (unsubExams) unsubExams();
      if (unsubSubs) unsubSubs();
    };
  }, []);

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

  // Handler: Save newly created exam
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
        examsCount={exams.length}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Firebase Cloud Live Database Status Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  Firebase Cloud Firestore: Đã kích hoạt tự động đồng bộ
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động (Free Database)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mọi đề thi từ Word/PDF và bài làm học sinh đều tự động đồng bộ lên Database đám mây để học sinh làm bài từ mọi thiết bị.
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
                alert(`Đồng bộ thành công! Hiện có ${res.examCount} đề thi và ${res.submissionCount} bài làm trên Cloud.`);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Đồng bộ ngay</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('create_exam')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition-all text-xs cursor-pointer"
            >
              <span>+ Úp đề Word/PDF</span>
            </button>
          </div>
        </div>

        {/* VIEW: HOME OVERVIEW */}
        {currentTab === 'home' && (
          <HomeOverview
            exams={exams}
            onNavigateTab={setCurrentTab}
            onJoinExamCode={handleJoinExamByCode}
            onSelectExam={handleSelectExamForStudent}
          />
        )}

        {/* VIEW: EXAM CREATOR (AZOTA STYLE) */}
        {currentTab === 'create_exam' && (
          <ExamCreator
            onSaveExam={handleSaveExam}
            onCancel={() => setCurrentTab('home')}
          />
        )}

        {/* VIEW: EXAM MANAGEMENT & GRADEBOOK */}
        {currentTab === 'manage_exams' && (
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

        {/* VIEW: STUDENT EXAM ROOM */}
        {currentTab === 'student_room' && (
          activeExamForStudent ? (
            <StudentExamRoom
              exam={activeExamForStudent}
              onFinishSubmission={handleFinishSubmission}
              onExitRoom={() => {
                setActiveExamForStudent(null);
                setCurrentTab('home');
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
                onClick={() => setCurrentTab('home')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Quay lại trang chủ
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

        {/* VIEW: FIREBASE DEPLOYMENT GUIDE */}
        {currentTab === 'firebase_deploy' && <FirebaseDeployGuide />}
      </main>

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
            <span>Đồng hành cùng hàng nghìn giáo viên Việt Nam đổi mới phương pháp dạy học</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('firebase_deploy')}
              className="text-orange-600 hover:text-orange-700 font-bold hover:underline"
            >
              Hướng dẫn Deploy Firebase
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
