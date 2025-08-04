import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider } from "firebase/auth";
import { getApp, getApps } from "firebase/app";

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  console.error('Missing Firebase environment variables');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "debateforum-3be19.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "debateforum-3be19",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "debateforum-3be19.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "24147286853",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:24147286853:web:192573977b5b38d4d0fc2c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-X1SSYP2RTE"
};

const firestoreApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const googleAuthProvider = new GoogleAuthProvider();
const auth = getAuth(firestoreApp);
const db = getFirestore(firestoreApp); // Initialize Firestore instance
const googleProvider = new GoogleAuthProvider(); // Initialize as googleProvider

export { auth, googleAuthProvider, db, googleProvider }; // Export db along with auth and provider

export const signUpUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      await updateProfile(user, { displayName });
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { displayName });
    }
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};