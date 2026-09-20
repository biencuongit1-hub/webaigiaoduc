import { Exam, ExamSubmission, FirebaseConfigState } from '../types';

const EXAMS_STORAGE_KEY = 'gvdm_azota_exams_v1';
const SUBMISSIONS_STORAGE_KEY = 'gvdm_azota_submissions_v1';
const FIREBASE_CONFIG_KEY = 'gvdm_firebase_config_v1';

export const INITIAL_SAMPLE_EXAMS: Exam[] = [
  {
    id: 'exam_demo_toan9',
    title: 'Đề kiểm tra Giữa kì II - Toán học Khối 9',
    description: 'Đề kiểm tra trắc nghiệm kiến thức Hàm số bậc nhất, Hệ phương trình và Hình học đường tròn. Chuẩn ma trận phòng GD&ĐT.',
    subject: 'Toán học',
    grade: 'Lớp 9',
    durationMinutes: 45,
    totalPoints: 10,
    teacherName: 'Thầy Cường - Tổ Toán',
    accessCode: 'TOAN9GK2',
    status: 'published',
    targetClass: '9A1',
    createdAt: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
    settings: {
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultImmediately: true,
      showAnswers: true,
      requireFullName: true,
      requireClass: true,
      requireStudentId: true,
      antiCheatProctoring: true,
      maxTabSwitchWarnings: 3,
      allowedAttempts: 1,
    },
    questions: [
      {
        id: 'q_t1',
        order: 1,
        text: 'Đồ thị của hàm số y = 2x - 3 đi qua điểm nào dưới đây?',
        options: [
          { id: 'A', text: 'M(1; -1)' },
          { id: 'B', text: 'N(0; 3)' },
          { id: 'C', text: 'P(2; 2)' },
          { id: 'D', text: 'Q(-1; -1)' }
        ],
        correctOptionId: 'A',
        explanation: 'Thay x = 1 vào y = 2(1) - 3 = -1 => Điểm M(1; -1) thuộc đồ thị hàm số.',
        points: 1.5
      },
      {
        id: 'q_t2',
        order: 2,
        text: 'Phương trình bậc hai ax² + bx + c = 0 (a ≠ 0) có nghiệm kép khi và chỉ khi:',
        options: [
          { id: 'A', text: 'Δ > 0' },
          { id: 'B', text: 'Δ = 0' },
          { id: 'C', text: 'Δ < 0' },
          { id: 'D', text: 'a và c trái dấu' }
        ],
        correctOptionId: 'B',
        explanation: 'Khi biệt thức Δ = 0, phương trình bậc hai có nghiệm kép x1 = x2 = -b/(2a).',
        points: 1.5
      },
      {
        id: 'q_t3',
        order: 3,
        text: 'Cho đường tròn (O; 5cm). Dây cung AB có độ dài 8cm. Khoảng cách từ tâm O đến dây cung AB bằng:',
        options: [
          { id: 'A', text: '3 cm' },
          { id: 'B', text: '4 cm' },
          { id: 'C', text: '2 cm' },
          { id: 'D', text: '3.5 cm' }
        ],
        correctOptionId: 'A',
        explanation: 'Kẻ OH vuông góc AB tại H => H là trung điểm AB => AH = 4cm. Xét tam giác vuông OAH: OH = √(OA² - AH²) = √(5² - 4²) = 3cm.',
        points: 2.0
      },
      {
        id: 'q_t4',
        order: 4,
        text: 'Nghiệm của hệ phương trình: { 2x + y = 5 ; x - y = 1 } là:',
        options: [
          { id: 'A', text: '(x; y) = (1; 3)' },
          { id: 'B', text: '(x; y) = (2; 1)' },
          { id: 'C', text: '(x; y) = (3; -1)' },
          { id: 'D', text: '(x; y) = (0; 5)' }
        ],
        correctOptionId: 'B',
        explanation: 'Cộng 2 vế của hai phương trình: 3x = 6 => x = 2. Thay vào x - y = 1 => y = 1.',
        points: 2.5
      },
      {
        id: 'q_t5',
        order: 5,
        text: 'Góc nội tiếp chắn nửa đường tròn có số đo bằng bao nhiêu độ?',
        options: [
          { id: 'A', text: '45°' },
          { id: 'B', text: '60°' },
          { id: 'C', text: '90°' },
          { id: 'D', text: '180°' }
        ],
        correctOptionId: 'C',
        explanation: 'Theo định lý hình học lớp 9, góc nội tiếp chắn nửa đường tròn là góc vuông (90°).',
        points: 2.5
      }
    ]
  },
  {
    id: 'exam_demo_history8',
    title: 'Khảo sát 15 phút: Lịch sử & Địa lý Việt Nam',
    description: 'Bài kiểm tra nhanh kiến thức Lịch sử và Địa hình Việt Nam tích hợp hình ảnh đổi mới.',
    subject: 'Lịch sử & Địa lý',
    grade: 'Lớp 8',
    durationMinutes: 15,
    totalPoints: 10,
    teacherName: 'Cô Thu Hương - Sử Địa',
    accessCode: 'SUDIA8',
    status: 'published',
    targetClass: '8B',
    createdAt: new Date(Date.now() - 3600 * 24 * 1 * 1000).toISOString(),
    settings: {
      shuffleQuestions: true,
      shuffleOptions: false,
      showResultImmediately: true,
      showAnswers: true,
      requireFullName: true,
      requireClass: true,
      requireStudentId: false,
      antiCheatProctoring: true,
      maxTabSwitchWarnings: 2,
      allowedAttempts: 2,
    },
    questions: [
      {
        id: 'q_h1',
        order: 1,
        text: 'Chiến thắng lịch sử Điện Biên Phủ diễn ra vào năm nào?',
        options: [
          { id: 'A', text: '1945' },
          { id: 'B', text: '1954' },
          { id: 'C', text: '1972' },
          { id: 'D', text: '1975' }
        ],
        correctOptionId: 'B',
        explanation: 'Chiến dịch Điện Biên Phủ toàn thắng vào ngày 7 tháng 5 năm 1954.',
        points: 2.5
      },
      {
        id: 'q_h2',
        order: 2,
        text: 'Đỉnh núi cao nhất Việt Nam và được mệnh danh là "Nóc nhà Đông Dương" là:',
        options: [
          { id: 'A', text: 'Tây Côn Lĩnh' },
          { id: 'B', text: 'Fansipan' },
          { id: 'C', text: 'Ngọc Linh' },
          { id: 'D', text: 'Bạch Mộc Lương Tử' }
        ],
        correctOptionId: 'B',
        explanation: 'Đỉnh Fansipan cao 3.143m thuộc dãy Hoàng Liên Sơn là đỉnh núi cao nhất.',
        points: 2.5
      },
      {
        id: 'q_h3',
        order: 3,
        text: 'Sông Mê Kông đổ ra Biển Đông qua lãnh thổ Việt Nam bằng bao nhiêu cửa sông (nguyên gốc chín rồng)?',
        options: [
          { id: 'A', text: '7 cửa' },
          { id: 'B', text: '8 cửa' },
          { id: 'C', text: '9 cửa' },
          { id: 'D', text: '5 cửa' }
        ],
        correctOptionId: 'C',
        explanation: 'Sông Cửu Long (Cửu = 9, Long = Rồng) với 9 cửa sông đổ ra biển.',
        points: 2.5
      },
      {
        id: 'q_h4',
        order: 4,
        text: 'Cuộc khởi nghĩa Hai Bà Trưng bùng nổ vào năm nào sau Công nguyên?',
        options: [
          { id: 'A', text: 'Năm 40' },
          { id: 'B', text: 'Năm 248' },
          { id: 'C', text: 'Năm 542' },
          { id: 'D', text: 'Năm 938' }
        ],
        correctOptionId: 'A',
        explanation: 'Mùa xuân năm 40 sau Công nguyên, Hai Bà Trưng dựng cờ khởi nghĩa tại Hát Môn.',
        points: 2.5
      }
    ]
  }
];

export const INITIAL_SAMPLE_SUBMISSIONS: ExamSubmission[] = [
  {
    id: 'sub_1',
    examId: 'exam_demo_toan9',
    studentName: 'Nguyễn Văn An',
    studentClass: '9A1',
    studentId: 'HS0901',
    answers: { q_t1: 'A', q_t2: 'B', q_t3: 'A', q_t4: 'B', q_t5: 'C' },
    score: 10,
    totalQuestions: 5,
    correctCount: 5,
    timeSpentSeconds: 1240,
    submittedAt: new Date(Date.now() - 3600 * 5 * 1000).toISOString(),
    violationsCount: 0,
    violationLogs: [],
    status: 'completed'
  },
  {
    id: 'sub_2',
    examId: 'exam_demo_toan9',
    studentName: 'Trần Thị Mai',
    studentClass: '9A1',
    studentId: 'HS0902',
    answers: { q_t1: 'A', q_t2: 'B', q_t3: 'B', q_t4: 'B', q_t5: 'C' },
    score: 8.0,
    totalQuestions: 5,
    correctCount: 4,
    timeSpentSeconds: 1680,
    submittedAt: new Date(Date.now() - 3600 * 4 * 1000).toISOString(),
    violationsCount: 1,
    violationLogs: [
      {
        timestamp: new Date(Date.now() - 3600 * 4.2 * 1000).toISOString(),
        type: 'tab_switch',
        message: 'Học sinh chuyển qua ứng dụng/tab khác lúc 15:42'
      }
    ],
    status: 'completed'
  },
  {
    id: 'sub_3',
    examId: 'exam_demo_toan9',
    studentName: 'Lê Hoàng Long',
    studentClass: '9A1',
    studentId: 'HS0903',
    answers: { q_t1: 'A', q_t2: 'C', q_t3: 'A', q_t4: 'A', q_t5: 'C' },
    score: 6.0,
    totalQuestions: 5,
    correctCount: 3,
    timeSpentSeconds: 1950,
    submittedAt: new Date(Date.now() - 3600 * 2 * 1000).toISOString(),
    violationsCount: 2,
    violationLogs: [
      {
        timestamp: new Date(Date.now() - 3600 * 2.5 * 1000).toISOString(),
        type: 'tab_switch',
        message: 'Rời khỏi màn hình thi 1 lần'
      },
      {
        timestamp: new Date(Date.now() - 3600 * 2.2 * 1000).toISOString(),
        type: 'blur',
        message: 'Mất con trỏ làm bài và focus trình duyệt'
      }
    ],
    status: 'completed'
  }
];

export const StorageService = {
  getExams(): Exam[] {
    try {
      const data = localStorage.getItem(EXAMS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_EXAMS));
        return INITIAL_SAMPLE_EXAMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SAMPLE_EXAMS;
    }
  },

  saveExam(exam: Exam): void {
    const exams = this.getExams();
    const existingIndex = exams.findIndex((e) => e.id === exam.id);
    if (existingIndex >= 0) {
      exams[existingIndex] = exam;
    } else {
      exams.unshift(exam);
    }
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
  },

  deleteExam(id: string): void {
    const exams = this.getExams().filter((e) => e.id !== id);
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
  },

  getExamById(id: string): Exam | undefined {
    return this.getExams().find((e) => e.id === id);
  },

  getExamByAccessCode(code: string): Exam | undefined {
    const cleanCode = code.trim().toUpperCase();
    return this.getExams().find(
      (e) => e.accessCode.toUpperCase() === cleanCode || e.id.toUpperCase() === cleanCode
    );
  },

  getSubmissions(): ExamSubmission[] {
    try {
      const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_SUBMISSIONS));
        return INITIAL_SAMPLE_SUBMISSIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SAMPLE_SUBMISSIONS;
    }
  },

  getSubmissionsByExamId(examId: string): ExamSubmission[] {
    return this.getSubmissions().filter((s) => s.examId === examId);
  },

  saveSubmission(submission: ExamSubmission): void {
    const list = this.getSubmissions();
    const idx = list.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      list[idx] = submission;
    } else {
      list.unshift(submission);
    }
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
  },

  getFirebaseConfig(): FirebaseConfigState {
    try {
      const data = localStorage.getItem(FIREBASE_CONFIG_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      apiKey: '',
      authDomain: '',
      projectId: 'giao-vien-doi-moi-azota',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      connected: false
    };
  },

  saveFirebaseConfig(config: FirebaseConfigState): void {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  },

  exportAllData(): string {
    const bundle = {
      exams: this.getExams(),
      submissions: this.getSubmissions(),
      firebaseConfig: this.getFirebaseConfig(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(bundle, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.exams)) {
        localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(data.exams));
      }
      if (Array.isArray(data.submissions)) {
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(data.submissions));
      }
      if (data.firebaseConfig) {
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(data.firebaseConfig));
      }
      return true;
    } catch {
      return false;
    }
  },

  resetDefaults(): void {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_EXAMS));
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_SUBMISSIONS));
  }
};
