
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider } from "firebase/auth";
import { getApp, getApps } from "firebase/app";
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "debateforum-3be19.firebaseapp.com",
    projectId: "debateforum-3be19",
    storageBucket: "debateforum-3be19.appspot.com",
    messagingSenderId: "24147286853",
    appId: "1:24147286853:web:192573977b5b38d4d0fc2c",
    measurementId: "G-X1SSYP2RTE"
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