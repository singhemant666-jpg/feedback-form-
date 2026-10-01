import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import configJson from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(configJson);
export const auth = getAuth(app);
export const db = getFirestore(app);
