// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "claritybudgets-tga72",
  "appId": "1:234902919003:web:34a2e719d00b431cd02c7e",
  "storageBucket": "claritybudgets-tga72.firebasestorage.app",
  "apiKey": "AIzaSyDMBRHcEOokh4fnOaZDcTt1x4NlonYFHGM",
  "authDomain": "claritybudgets-tga72.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "234902919003"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

try {
  enableIndexedDbPersistence(db)
} catch (err: any) {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a time.
    console.warn('Firestore persistence failed: multiple tabs open.');
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the
    // features required to enable persistence
    console.warn('Firestore persistence not available in this browser.');
  }
}
