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
import { Exam, ExamSubmission } from './types';
import { Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [activeExamForStudent, setActiveExamForStudent] = useState<Exam | null>(null);

  // Load initial data from StorageService
  useEffect(() => {
    const loadedExams = StorageService.getExams();
    const loadedSubs = StorageService.getSubmissions();
    setExams(loadedExams);
    setSubmissions(loadedSubs);

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
  const handleSaveExam = (newExam: Exam) => {
    StorageService.saveExam(newExam);
    const updated = StorageService.getExams();
    setExams(updated);
    // Switch to management page
    setCurrentTab('manage_exams');
  };

  // Handler: Delete exam
  const handleDeleteExam = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đề thi này không? Dữ liệu bài làm liên quan cũng sẽ bị gỡ bỏ.')) {
      StorageService.deleteExam(id);
      setExams(StorageService.getExams());
    }
  };

  // Handler: Complete student submission
  const handleFinishSubmission = (submission: ExamSubmission) => {
    StorageService.saveSubmission(submission);
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
