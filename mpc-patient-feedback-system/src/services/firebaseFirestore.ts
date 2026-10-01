import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PatientFeedbackData, PatientReferralData } from '../types/feedback';
export { db };

const FEEDBACK_COLLECTION = 'patient_feedback';
const REFERRALS_COLLECTION = 'patient_referrals';

/**
 * Save new patient feedback to Firebase Cloud Firestore
 */
export async function saveFeedbackToFirebase(feedback: PatientFeedbackData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
      ...feedback,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn('Firebase Firestore saveFeedback notice:', error);
    throw error;
  }
}

/**
 * Save new patient referral to Firebase Cloud Firestore
 */
export async function saveReferralToFirebase(referral: PatientReferralData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REFERRALS_COLLECTION), {
      ...referral,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn('Firebase Firestore saveReferral notice:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time feedback submissions across all devices
 */
export function subscribeToFeedback(
  onUpdate: (data: PatientFeedbackData[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, FEEDBACK_COLLECTION), orderBy('submittedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const records: PatientFeedbackData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            ...(data as PatientFeedbackData),
            id: doc.id,
          });
        });
        onUpdate(records);
      },
      (error) => {
        console.warn('Firestore feedback listener notice:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Firestore subscription initialization notice:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to real-time referral submissions across all devices
 */
export function subscribeToReferrals(
  onUpdate: (data: PatientReferralData[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, REFERRALS_COLLECTION), orderBy('submittedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const records: PatientReferralData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            ...(data as PatientReferralData),
            id: doc.id,
          });
        });
        onUpdate(records);
      },
      (error) => {
        console.warn('Firestore referral listener notice:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Firestore referral subscription notice:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Reset / Clear all records from Firestore (Admin action)
 */
export async function clearAllFirestoreRecords(): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    const feedbackSnap = await getDocs(collection(db, FEEDBACK_COLLECTION));
    feedbackSnap.forEach((doc) => batch.delete(doc.ref));

    const referralSnap = await getDocs(collection(db, REFERRALS_COLLECTION));
    referralSnap.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
  } catch (err) {
    console.warn('Firestore clear records notice:', err);
  }
}
