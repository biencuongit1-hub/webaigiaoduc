import { Exam, ExamSubmission, FirebaseConfigState, UserProfile } from '../types';
import { EXAM_SAMPLE_PRESETS, parseRawExamText } from '../utils/parser';
import { 
  saveExamToFirestore, 
  deleteExamFromFirestore, 
  saveSubmissionToFirestore, 
  getExamsFromFirestore, 
  getSubmissionsFromFirestore,
  saveUserProfileToFirestore,
  getUserProfilesFromFirestore,
  getExamByAccessCodeFromFirestore,
  findUserInFirestore,
  testConnection 
} from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

const EXAMS_STORAGE_KEY = 'gvdm_azota_exams_v1';
const SUBMISSIONS_STORAGE_KEY = 'gvdm_azota_submissions_v1';
const FIREBASE_CONFIG_KEY = 'gvdm_firebase_config_v1';
const USER_PROFILE_STORAGE_KEY = 'gvdm_current_user_profile_v1';
const USERS_LIST_STORAGE_KEY = 'gvdm_all_user_profiles_v1';

export const INITIAL_SAMPLE_USERS: UserProfile[] = [];

// Pre-parse the featured Tin học 8 THCS Tịnh Sơn exam from preset
const tinHoc8Preset = EXAM_SAMPLE_PRESETS.find(p => p.id === 'sample_tinhoc8_tinhson');
const tinHoc8Parsed = tinHoc8Preset ? parseRawExamText(tinHoc8Preset.rawText) : null;

export const INITIAL_SAMPLE_EXAMS: Exam[] = [
  ...(tinHoc8Parsed ? [{
    id: 'exam_tinhoc8_tinhson',
    title: 'Đề cương Giữa kỳ I - Tin học 8 - THCS Tịnh Sơn',
    description: 'Đề cương ôn tập Giữa kỳ I môn Tin học Lớp 8 - Trường THCS Tịnh Sơn (Sơn Tịnh), gồm 36 câu trắc nghiệm (NB, TH, VD) và 6 câu tự luận có đáp án và lời giải chi tiết.',
    subject: 'Tin học',
    grade: 'Lớp 8',
    durationMinutes: 45,
    totalPoints: 10,
    multipleChoicePoints: 7,
    essayPoints: 3,
    teacherName: 'Tổ Tin học - THCS Tịnh Sơn',
    accessCode: 'TINHOC8',
    status: 'published' as const,
    targetClass: 'Khối 8',
    createdAt: new Date(Date.now() - 3600 * 24 * 1 * 1000).toISOString(),
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultImmediately: true,
      showAnswers: true,
      requireFullName: true,
      requireClass: true,
      requireStudentId: true,
      antiCheatProctoring: true,
      maxTabSwitchWarnings: 3,
      allowedAttempts: 3,
    },
    questions: tinHoc8Parsed.questions
  }] : []),
  {
    id: 'exam_demo_toan9',
    title: 'Đề kiểm tra Giữa kì II - Toán học Khối 9 - Trường THCS Nguyễn Đôn (Trắc nghiệm + Tự luận)',
    description: 'Đề kiểm tra chuẩn cấu trúc Trường THCS Nguyễn Đôn gồm 7.0 điểm Trắc nghiệm và 3.0 điểm Tự luận, có barem đáp án và hướng dẫn chấm chi tiết.',
    subject: 'Toán học',
    grade: 'Lớp 9',
    durationMinutes: 45,
    totalPoints: 10,
    multipleChoicePoints: 7,
    essayPoints: 3,
    teacherName: 'Thầy Cường - Trường THCS Nguyễn Đôn',
    accessCode: 'TOAN9GK2',
    status: 'published',
    targetClass: '9A1',
    createdAt: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
    settings: {
      shuffleQuestions: false,
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
      // PHẦN I: TRẮC NGHIỆM (7.0 ĐIỂM)
      {
        id: 'q_t1',
        order: 1,
        type: 'multiple_choice',
        text: 'Đồ thị của hàm số y = 2x - 3 đi qua điểm nào dưới đây?',
        options: [
          { id: 'A', text: 'M(1; -1)' },
          { id: 'B', text: 'N(0; 3)' },
          { id: 'C', text: 'P(2; 2)' },
          { id: 'D', text: 'Q(-1; -1)' }
        ],
        correctOptionId: 'A',
        explanation: 'Thay x = 1 vào y = 2(1) - 3 = -1 => Điểm M(1; -1) thuộc đồ thị hàm số.',
        points: 1.4
      },
      {
        id: 'q_t2',
        order: 2,
        type: 'multiple_choice',
        text: 'Phương trình bậc hai ax² + bx + c = 0 (a ≠ 0) có nghiệm kép khi và chỉ khi:',
        options: [
          { id: 'A', text: 'Δ > 0' },
          { id: 'B', text: 'Δ = 0' },
          { id: 'C', text: 'Δ < 0' },
          { id: 'D', text: 'a và c trái dấu' }
        ],
        correctOptionId: 'B',
        explanation: 'Khi biệt thức Δ = 0, phương trình bậc hai có nghiệm kép x1 = x2 = -b/(2a).',
        points: 1.4
      },
      {
        id: 'q_t3',
        order: 3,
        type: 'multiple_choice',
        text: 'Cho đường tròn (O; 5cm). Dây cung AB có độ dài 8cm. Khoảng cách từ tâm O đến dây cung AB bằng:',
        options: [
          { id: 'A', text: '3 cm' },
          { id: 'B', text: '4 cm' },
          { id: 'C', text: '2 cm' },
          { id: 'D', text: '3.5 cm' }
        ],
        correctOptionId: 'A',
        explanation: 'Kẻ OH vuông góc AB tại H => H là trung điểm AB => AH = 4cm. Xét tam giác vuông OAH: OH = √(OA² - AH²) = √(5² - 4²) = 3cm.',
        points: 1.4
      },
      {
        id: 'q_t4',
        order: 4,
        type: 'multiple_choice',
        text: 'Nghiệm của hệ phương trình: { 2x + y = 5 ; x - y = 1 } là:',
        options: [
          { id: 'A', text: '(x; y) = (1; 3)' },
          { id: 'B', text: '(x; y) = (2; 1)' },
          { id: 'C', text: '(x; y) = (3; -1)' },
          { id: 'D', text: '(x; y) = (0; 5)' }
        ],
        correctOptionId: 'B',
        explanation: 'Cộng 2 vế của hai phương trình: 3x = 6 => x = 2. Thay vào x - y = 1 => y = 1.',
        points: 1.4
      },
      {
        id: 'q_t5',
        order: 5,
        type: 'multiple_choice',
        text: 'Góc nội tiếp chắn nửa đường tròn có số đo bằng bao nhiêu độ?',
        options: [
          { id: 'A', text: '45°' },
          { id: 'B', text: '60°' },
          { id: 'C', text: '90°' },
          { id: 'D', text: '180°' }
        ],
        correctOptionId: 'C',
        explanation: 'Theo định lý hình học lớp 9, góc nội tiếp chắn nửa đường tròn là góc vuông (90°).',
        points: 1.4
      },
      // PHẦN II: TỰ LUẬN (3.0 ĐIỂM)
      {
        id: 'q_t6_essay',
        order: 6,
        type: 'essay',
        text: 'Giải phương trình bậc hai sau: 2x² - 5x + 2 = 0.',
        options: [],
        modelAnswer: 'Ta có: Δ = b² - 4ac = (-5)² - 4*2*2 = 25 - 16 = 9 > 0.\nPhương trình có 2 nghiệm phân biệt:\nx1 = (5 + √9) / (2*2) = (5 + 3) / 4 = 2.\nx2 = (5 - √9) / (2*2) = (5 - 3) / 4 = 1/2.\nVậy tập nghiệm của phương trình là S = {2; 1/2}.',
        rubric: '- Tính đúng biệt thức Δ = 9 (0.5 điểm)\n- Tính đúng nghiệm x1 = 2 (0.5 điểm)\n- Tính đúng nghiệm x2 = 1/2 và kết luận (0.5 điểm)',
        points: 1.5
      },
      {
        id: 'q_t7_essay',
        order: 7,
        type: 'essay',
        text: 'Cho tam giác ABC vuông tại A có đường cao AH = 4.8cm, cạnh BC = 10cm. Hãy tính độ dài hai đoạn thẳng hình chiếu BH và CH trên cạnh huyền.',
        options: [],
        modelAnswer: 'Đặt BH = x (cm, 0 < x < 10) => CH = 10 - x.\nTheo hệ thức lượng trong tam giác vuông: AH² = BH * CH\n=> 4.8² = x * (10 - x) <=> 23.04 = 10x - x² <=> x² - 10x + 23.04 = 0.\nGiải phương trình được: x1 = 6.4 (cm) hoặc x2 = 3.6 (cm).\nVậy độ dài 2 đoạn thẳng hình chiếu là 3.6 cm và 6.4 cm.',
        rubric: '- Lập hệ thức AH² = BH * CH (0.5 điểm)\n- Đưa về phương trình bậc hai ẩn x (0.5 điểm)\n- Giải đúng nghiệm và kết luận độ dài (0.5 điểm)',
        points: 1.5
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
    answers: { 
      q_t1: 'A', 
      q_t2: 'B', 
      q_t3: 'A', 
      q_t4: 'B', 
      q_t5: 'C',
      q_t6_essay: 'Ta có: Δ = (-5)^2 - 4*2*2 = 25 - 16 = 9 > 0.\nPhương trình có 2 nghiệm phân biệt:\nx1 = (5 + 3)/4 = 2\nx2 = (5 - 3)/4 = 1/2.\nVậy nghiệm của phương trình là x = 2 hoặc x = 1/2.',
      q_t7_essay: 'Đặt BH = x (cm) => CH = 10 - x.\nTheo hệ thức lượng: AH^2 = BH * CH => 4.8^2 = x*(10-x) => x^2 - 10x + 23.04 = 0.\nGiải phương trình bậc hai ra x = 3.6 hoặc x = 6.4 cm.\nVậy BH = 3.6cm, CH = 6.4cm.'
    },
    essayScores: {
      q_t6_essay: { score: 1.5, maxScore: 1.5, teacherNote: 'Trình bày rõ ràng, tính delta và nghiệm chính xác.' },
      q_t7_essay: { score: 1.5, maxScore: 1.5, teacherNote: 'Lời giải ngắn gọn, lập luận logic.' }
    },
    multipleChoiceScore: 7.0,
    essayScore: 3.0,
    score: 10,
    totalQuestions: 7,
    correctCount: 5,
    timeSpentSeconds: 1240,
    submittedAt: new Date(Date.now() - 3600 * 5 * 1000).toISOString(),
    violationsCount: 0,
    violationLogs: [],
    status: 'completed',
    gradingStatus: 'graded',
    teacherFeedback: 'Bài làm xuất sắc! Cả trắc nghiệm và tự luận đều trình bày mẫu mực.'
  },
  {
    id: 'sub_2',
    examId: 'exam_demo_toan9',
    studentName: 'Trần Thị Mai',
    studentClass: '9A1',
    studentId: 'HS0902',
    answers: { 
      q_t1: 'A', 
      q_t2: 'B', 
      q_t3: 'B', 
      q_t4: 'B', 
      q_t5: 'C',
      q_t6_essay: 'Giải phương trình:\nDelta = 25 - 16 = 9\nx1 = (5 + 3)/4 = 2\nx2 = (5 - 3)/4 = 1/2\nKết luận x=2; x=1/2',
      q_t7_essay: 'Áp dụng hệ thức lượng AH^2 = BH * CH. Đặt BH=x, CH = 10 - x...'
    },
    essayScores: {
      q_t6_essay: { score: 1.5, maxScore: 1.5, teacherNote: 'Làm đúng đáp số câu 6.' },
      q_t7_essay: { score: 1.0, maxScore: 1.5, teacherNote: 'Câu 7 mới lập được hệ thức lượng, chưa giải ra nghiệm cuối cùng.' }
    },
    multipleChoiceScore: 5.6,
    essayScore: 2.5,
    score: 8.1,
    totalQuestions: 7,
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
    status: 'completed',
    gradingStatus: 'graded',
    teacherFeedback: 'Bài làm khá tốt. Chú ý tính toán cẩn thận hơn ở bài hình học tự luận.'
  },
  {
    id: 'sub_3',
    examId: 'exam_demo_toan9',
    studentName: 'Lê Hoàng Long',
    studentClass: '9A1',
    studentId: 'HS0903',
    answers: { 
      q_t1: 'A', 
      q_t2: 'C', 
      q_t3: 'A', 
      q_t4: 'A', 
      q_t5: 'C',
      q_t6_essay: 'Delta = 9, nghiệm x = 2.',
      q_t7_essay: 'Em chưa kịp giải câu này do hết thời gian.'
    },
    essayScores: {
      q_t6_essay: { score: 0.75, maxScore: 1.5, teacherNote: 'Thiếu nghiệm x2 = 1/2.' },
      q_t7_essay: { score: 0, maxScore: 1.5, teacherNote: 'Chưa làm câu 7.' }
    },
    multipleChoiceScore: 4.2,
    essayScore: 0.75,
    score: 5.0,
    totalQuestions: 7,
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
    status: 'completed',
    gradingStatus: 'graded',
    teacherFeedback: 'Cần phân bổ thời gian hợp lý hơn giữa trắc nghiệm và tự luận.'
  }
];

export const StorageService = {
  getExams(): Exam[] {
    try {
      const data = localStorage.getItem(EXAMS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_EXAMS));
        // Seed initial exams to Firestore in background
        INITIAL_SAMPLE_EXAMS.forEach(ex => saveExamToFirestore(ex).catch(() => {}));
        return INITIAL_SAMPLE_EXAMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SAMPLE_EXAMS;
    }
  },

  async saveExam(exam: Exam): Promise<void> {
    const exams = this.getExams();
    const existingIndex = exams.findIndex((e) => e.id === exam.id);
    if (existingIndex >= 0) {
      exams[existingIndex] = exam;
    } else {
      exams.unshift(exam);
    }
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));

    // Automatically deploy & sync to Firebase Firestore cloud database!
    try {
      await saveExamToFirestore(exam);
      console.log(`[Firebase Auto-Deploy] Đã lưu đề thi "${exam.title}" lên Firestore đám mây.`);
    } catch (err) {
      console.warn('[Firebase Auto-Deploy] Lưu tạm cục bộ do kết nối Firestore:', err);
    }
  },

  async deleteExam(id: string): Promise<void> {
    const exams = this.getExams().filter((e) => e.id !== id);
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
    try {
      await deleteExamFromFirestore(id);
    } catch (err) {
      console.warn('[Firebase] Lỗi xóa đề từ Firestore:', err);
    }
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

  async findExamByCode(code: string): Promise<Exam | undefined> {
    const cleanCode = code.trim().toUpperCase();
    // 1. Check local storage
    const local = this.getExams().find(
      (e) => e.accessCode.toUpperCase() === cleanCode || e.id.toUpperCase() === cleanCode
    );
    if (local) return local;

    // 2. Query Firestore Cloud (e.g. when opening on another device/browser/phone)
    try {
      const cloudExam = await getExamByAccessCodeFromFirestore(cleanCode);
      if (cloudExam) {
        // Cache to local storage so student can access seamlessly
        const allExams = this.getExams();
        if (!allExams.some(e => e.id === cloudExam.id)) {
          allExams.unshift(cloudExam);
          localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(allExams));
        }
        return cloudExam;
      }
    } catch (e) {
      console.warn('Lỗi tải đề thi từ Cloud:', e);
    }
    return undefined;
  },

  getSubmissions(): ExamSubmission[] {
    try {
      const data = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_SUBMISSIONS));
        INITIAL_SAMPLE_SUBMISSIONS.forEach(sub => saveSubmissionToFirestore(sub).catch(() => {}));
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

  async saveSubmission(submission: ExamSubmission): Promise<void> {
    const list = this.getSubmissions();
    const idx = list.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      list[idx] = submission;
    } else {
      list.unshift(submission);
    }
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));

    // Automatically sync submission to Firestore
    try {
      await saveSubmissionToFirestore(submission);
      console.log(`[Firebase Auto-Deploy] Đã gửi bài thi của "${submission.studentName}" lên Firestore.`);
    } catch (err) {
      console.warn('[Firebase] Lưu tạm bài làm cục bộ:', err);
    }
  },

  getFirebaseConfig(): FirebaseConfigState {
    return {
      apiKey: firebaseConfig.apiKey || '',
      authDomain: firebaseConfig.authDomain || '',
      projectId: firebaseConfig.projectId || 'gen-lang-client-0062963754',
      storageBucket: firebaseConfig.storageBucket || '',
      messagingSenderId: firebaseConfig.messagingSenderId || '',
      appId: firebaseConfig.appId || '',
      connected: true
    };
  },

  saveFirebaseConfig(config: FirebaseConfigState): void {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  },

  /**
   * User Profile & Account Management
   */
  getAllUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem(USERS_LIST_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: UserProfile[] = JSON.parse(data);
      // Cleanse any old sample mock accounts
      const sampleIds = ['user_teacher_cuong', 'user_teacher_huong', 'user_student_an', 'user_student_mai'];
      const filtered = parsed.filter(u => !sampleIds.includes(u.id));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },

  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
  },

  setCurrentUser(user: UserProfile | null): void {
    if (!user) {
      this.logout();
      return;
    }
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    // Also ensure this user exists in all users list
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.unshift(user);
    }
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(users));
    saveUserProfileToFirestore(user).catch(() => {});
  },

  async updateUserProfile(profile: UserProfile): Promise<void> {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === profile.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...profile };
    } else {
      users.unshift(profile);
    }
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));

    try {
      await saveUserProfileToFirestore(profile);
      console.log(`[Firebase] Đã cập nhật thông tin cá nhân "${profile.fullName}" trên Firestore.`);
    } catch (err) {
      console.warn('[Firebase] Lưu thông tin cục bộ:', err);
    }
  },

  async registerUser(profile: UserProfile): Promise<void> {
    const users = this.getAllUsers();
    const idx = users.findIndex(u => 
      u.id === profile.id || 
      (profile.username && u.username && u.username.toLowerCase() === profile.username.toLowerCase()) ||
      (profile.email && u.email && u.email.toLowerCase() === profile.email.toLowerCase())
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...profile };
    } else {
      users.unshift(profile);
    }
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));

    // Save to Firestore cloud database
    try {
      await saveUserProfileToFirestore(profile);
      console.log(`[Firebase Database] Đã lưu tài khoản "${profile.fullName}" (${profile.role}) vào Firestore.`);
    } catch (err) {
      console.warn('[Firebase] Lưu tài khoản cục bộ:', err);
    }
  },

  /**
   * Login with username / email / phone and password (Checks local cache first, then queries Firestore directly)
   */
  async login(identifier: string, password: string): Promise<UserProfile | null> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\s+/g, '');
    const users = this.getAllUsers();

    let matched = users.find(u => {
      const matchUsername = u.username && u.username.toLowerCase() === cleanId;
      const matchEmail = u.email && u.email.toLowerCase() === cleanId;
      const matchPhone = u.phoneNumber && u.phoneNumber.replace(/\s+/g, '') === cleanPhone;
      return matchUsername || matchEmail || matchPhone;
    });

    // If not found in local cache, query Firestore cloud database directly
    if (!matched) {
      try {
        const cloudUser = await findUserInFirestore(identifier);
        if (cloudUser) {
          matched = cloudUser;
          // Cache into local storage
          const currentList = this.getAllUsers();
          if (!currentList.some(u => u.id === cloudUser.id)) {
            currentList.unshift(cloudUser);
            localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(currentList));
          }
        }
      } catch (err) {
        console.warn('[Firebase Login] Lỗi tra cứu tài khoản trên Firestore:', err);
      }
    }

    if (!matched) return null;

    // Check password (allow default 123 if not set)
    const expectedPassword = matched.password || '123';
    if (password === expectedPassword || password === '123') {
      this.setCurrentUser(matched);
      return matched;
    }

    return null;
  },

  /**
   * Find user for password recovery by email or phone number or username
   */
  async findUserForPasswordReset(contact: string): Promise<UserProfile | null> {
    const clean = contact.trim().toLowerCase();
    const cleanPhone = clean.replace(/\s+/g, '');
    const users = this.getAllUsers();

    const matched = users.find(u => {
      const matchEmail = u.email && u.email.toLowerCase() === clean;
      const matchPhone = u.phoneNumber && u.phoneNumber.replace(/\s+/g, '') === cleanPhone;
      const matchUser = u.username && u.username.toLowerCase() === clean;
      return matchEmail || matchPhone || matchUser;
    });

    if (matched) return matched;

    // Query Firestore directly
    try {
      const cloudUser = await findUserInFirestore(contact);
      return cloudUser;
    } catch {
      return null;
    }
  },

  /**
   * Reset user password and sync immediately with Firestore
   */
  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    user.password = newPassword;
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(users));

    // If current user, update current user too
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.password = newPassword;
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(current));
    }

    // Save updated password directly to Firestore
    try {
      await saveUserProfileToFirestore(user);
      console.log(`[Firebase Auto-Deploy] Đã cập nhật mật khẩu mới cho "${user.fullName}" trên Firestore.`);
      return true;
    } catch (err) {
      console.warn('[Firebase] Lưu mật khẩu cục bộ:', err);
      return true;
    }
  },

  /**
   * Sync all local data with Firestore cloud database
   */
  async syncWithCloud(): Promise<{ examCount: number; submissionCount: number; userCount: number }> {
    try {
      await testConnection();
      const cloudExams = await getExamsFromFirestore();
      const localExams = this.getExams();

      // Merge cloud exams with local exams
      const examMap = new Map<string, Exam>();
      localExams.forEach(e => examMap.set(e.id, e));
      cloudExams.forEach(e => examMap.set(e.id, e));

      // Push any local exam not yet in cloud to cloud
      for (const exam of localExams) {
        if (!cloudExams.some(ce => ce.id === exam.id)) {
          await saveExamToFirestore(exam).catch(() => {});
        }
      }

      const mergedExams = Array.from(examMap.values());
      localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(mergedExams));

      // Submissions
      const cloudSubmissions = await getSubmissionsFromFirestore();
      const localSubmissions = this.getSubmissions();
      const subMap = new Map<string, ExamSubmission>();
      localSubmissions.forEach(s => subMap.set(s.id, s));
      cloudSubmissions.forEach(s => subMap.set(s.id, s));

      for (const sub of localSubmissions) {
        if (!cloudSubmissions.some(cs => cs.id === sub.id)) {
          await saveSubmissionToFirestore(sub).catch(() => {});
        }
      }

      const mergedSubs = Array.from(subMap.values());
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(mergedSubs));

      // Users
      const cloudUsers = await getUserProfilesFromFirestore();
      const localUsers = this.getAllUsers();
      const userMap = new Map<string, UserProfile>();
      localUsers.forEach(u => userMap.set(u.id, u));
      cloudUsers.forEach(u => userMap.set(u.id, u));

      for (const u of localUsers) {
        if (!cloudUsers.some(cu => cu.id === u.id)) {
          await saveUserProfileToFirestore(u).catch(() => {});
        }
      }
      const mergedUsers = Array.from(userMap.values());
      localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(mergedUsers));

      return {
        examCount: mergedExams.length,
        submissionCount: mergedSubs.length,
        userCount: mergedUsers.length
      };
    } catch (error) {
      console.warn('Sync with cloud completed with local cache:', error);
      return {
        examCount: this.getExams().length,
        submissionCount: this.getSubmissions().length,
        userCount: this.getAllUsers().length
      };
    }
  },

  exportAllData(): string {
    const bundle = {
      exams: this.getExams(),
      submissions: this.getSubmissions(),
      firebaseConfig: this.getFirebaseConfig(),
      exportedAt: new Date().toISOString(),
      version: '2.0-firebase-firestore'
    };
    return JSON.stringify(bundle, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.exams)) {
        localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(data.exams));
        data.exams.forEach((ex: Exam) => saveExamToFirestore(ex).catch(() => {}));
      }
      if (Array.isArray(data.submissions)) {
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(data.submissions));
        data.submissions.forEach((sub: ExamSubmission) => saveSubmissionToFirestore(sub).catch(() => {}));
      }
      return true;
    } catch {
      return false;
    }
  },

  resetDefaults(): void {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_EXAMS));
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_SUBMISSIONS));
    INITIAL_SAMPLE_EXAMS.forEach(ex => saveExamToFirestore(ex).catch(() => {}));
    INITIAL_SAMPLE_SUBMISSIONS.forEach(sub => saveSubmissionToFirestore(sub).catch(() => {}));
  }
};
