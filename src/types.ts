export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
  points: number;
  image?: string;
}

export interface ExamSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  showAnswers: boolean;
  requireFullName: boolean;
  requireClass: boolean;
  requireStudentId: boolean;
  antiCheatProctoring: boolean;
  maxTabSwitchWarnings: number;
  password?: string;
  startDate?: string;
  endDate?: string;
  allowedAttempts: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  totalPoints: number;
  questions: Question[];
  settings: ExamSettings;
  createdAt: string;
  teacherName: string;
  accessCode: string;
  status: 'published' | 'draft' | 'archived';
  targetClass?: string;
}

export interface ViolationLog {
  timestamp: string;
  type: 'tab_switch' | 'fullscreen_exit' | 'blur';
  message: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentName: string;
  studentClass: string;
  studentId?: string;
  answers: Record<string, string>; // questionId -> optionId
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  violationsCount: number;
  violationLogs: ViolationLog[];
  status: 'completed' | 'in_progress';
}

export interface FirebaseConfigState {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  connected: boolean;
}

export interface TeacherAIQuery {
  type: 'lesson_plan' | 'skkn' | 'quiz_generator' | 'classroom_dragon';
  subject: string;
  grade: string;
  topic: string;
  requirements?: string;
}

export interface InteractiveGameDemo {
  id: string;
  title: string;
  type: 'head_tilt' | 'lucky_wheel' | 'tug_of_war';
  description: string;
  iconName: string;
}
