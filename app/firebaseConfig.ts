
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "debateforum-3be19.firebaseapp.com",
    projectId: "debateforum-3be19",
    storageBucket: "debateforum-3be19.appspot.com",
    messagingSenderId: "24147286853",
    appId: "1:24147286853:web:192573977b5b38d4d0fc2c",
    measurementId: "G-X1SSYP2RTE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleAuthProvider = new GoogleAuthProvider();
export { auth, db, googleAuthProvider };

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