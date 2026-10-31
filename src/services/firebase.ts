import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Exam, ExamSubmission, UserProfile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore as required by Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or network is limited.");
    }
    // If doc doesn't exist, getDocFromServer still succeeded reaching server
    return true;
  }
}

// Recursively strip undefined values so Firestore setDoc never fails
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized as T;
}

// Exam operations
export async function getExamsFromFirestore(): Promise<Exam[]> {
  const path = 'exams';
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    const exams: Exam[] = [];
    snapshot.forEach((d) => {
      exams.push(d.data() as Exam);
    });
    return exams;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveExamToFirestore(exam: Exam): Promise<void> {
  const path = `exams/${exam.id}`;
  try {
    const cleanExam = sanitizeForFirestore(exam);
    await setDoc(doc(db, 'exams', exam.id), cleanExam, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExamFromFirestore(examId: string): Promise<void> {
  const path = `exams/${examId}`;
  try {
    await deleteDoc(doc(db, 'exams', examId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getExamByIdFromFirestore(examId: string): Promise<Exam | null> {
  const path = `exams/${examId}`;
  try {
    const snapshot = await getDoc(doc(db, 'exams', examId));
    if (snapshot.exists()) {
      return snapshot.data() as Exam;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getExamByAccessCodeFromFirestore(code: string): Promise<Exam | null> {
  const path = 'exams';
  try {
    const cleanCode = code.trim().toUpperCase();
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as Exam;
      if (
        (data.accessCode && data.accessCode.toUpperCase() === cleanCode) ||
        (data.id && data.id.toUpperCase() === cleanCode)
      ) {
        return data;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Submissions operations
export async function saveSubmissionToFirestore(submission: ExamSubmission): Promise<void> {
  const path = `submissions/${submission.id}`;
  try {
    const cleanSubmission = sanitizeForFirestore(submission);
    await setDoc(doc(db, 'submissions', submission.id), cleanSubmission, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getSubmissionsFromFirestore(examId?: string): Promise<ExamSubmission[]> {
  const path = 'submissions';
  try {
    const snapshot = await getDocs(collection(db, path));
    const submissions: ExamSubmission[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as ExamSubmission;
      if (!examId || data.examId === examId) {
        submissions.push(data);
      }
    });
    return submissions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteSubmissionsForExamFromFirestore(examId: string): Promise<void> {
  const path = 'submissions';
  try {
    const snapshot = await getDocs(collection(db, path));
    const toDelete: Promise<void>[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as ExamSubmission;
      if (data.examId === examId) {
        toDelete.push(deleteDoc(doc(db, 'submissions', d.id)));
      }
    });
    await Promise.all(toDelete);
  } catch (error) {
    console.warn('[Firebase] Lỗi xóa submissions theo examId:', error);
  }
}

// Real-time listener for Exams
export function subscribeToExams(callback: (exams: Exam[]) => void): () => void {
  const path = 'exams';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const exams: Exam[] = [];
      snapshot.forEach((d) => {
        exams.push(d.data() as Exam);
      });
      callback(exams);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Real-time listener for Submissions
export function subscribeToSubmissions(examId: string | undefined, callback: (submissions: ExamSubmission[]) => void): () => void {
  const path = 'submissions';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const submissions: ExamSubmission[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ExamSubmission;
        if (!examId || data.examId === examId) {
          submissions.push(data);
        }
      });
      callback(submissions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// User Profile operations (Teachers and Students)
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const cleanProfile = sanitizeForFirestore(profile);
    await setDoc(doc(db, 'users', profile.id), cleanProfile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getUserProfilesFromFirestore(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snapshot = await getDocs(collection(db, path));
    const list: UserProfile[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as UserProfile);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToUserProfiles(callback: (profiles: UserProfile[]) => void): () => void {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const profiles: UserProfile[] = [];
      snapshot.forEach((d) => {
        profiles.push(d.data() as UserProfile);
      });
      callback(profiles);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Find user in Firestore by credential (username, email, or phone)
export async function findUserInFirestore(identifier: string): Promise<UserProfile | null> {
  const path = 'users';
  try {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\s+/g, '');
    const snapshot = await getDocs(collection(db, path));
    for (const docSnap of snapshot.docs) {
      const u = docSnap.data() as UserProfile;
      if (
        (u.username && u.username.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.phoneNumber && u.phoneNumber.replace(/\s+/g, '') === cleanPhone)
      ) {
        return u;
      }
    }
    return null;
  } catch (error) {
    console.warn('[Firebase] Lỗi tìm tài khoản trong Firestore:', error);
    return null;
  }
}

// Check if username or email already exists in Firestore database
export async function checkCredentialExistsInFirestore(username: string, email?: string): Promise<{ exists: boolean; reason?: string }> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const snapshot = await getDocs(collection(db, 'users'));
    for (const docSnap of snapshot.docs) {
      const u = docSnap.data() as UserProfile;
      if (u.username && u.username.toLowerCase() === cleanUser) {
        return { exists: true, reason: `Tên tài khoản "${username}" đã có người đăng ký trong Database.` };
      }
      if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) {
        return { exists: true, reason: `Email "${email}" đã được sử dụng cho tài khoản khác trong Database.` };
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}


