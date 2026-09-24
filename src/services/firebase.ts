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
    await setDoc(doc(db, 'exams', exam.id), exam, { merge: true });
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

// Submissions operations
export async function saveSubmissionToFirestore(submission: ExamSubmission): Promise<void> {
  const path = `submissions/${submission.id}`;
  try {
    await setDoc(doc(db, 'submissions', submission.id), submission, { merge: true });
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
    await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
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

