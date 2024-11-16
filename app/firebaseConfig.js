import { initializeApp } from 'firebase/app';
import { getAuth, sendSignInLinkToEmail, fetchSignInMethodsForEmail, signInWithEmailLink, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCf7Hx7HYl5NciE_0F5nPlXRsvOzM38Boc",
  authDomain: "debateforum-3be19.firebaseapp.com",
  projectId: "debateforum-3be19",
  storageBucket: "debateforum-3be19.firebasestorage.app",
  messagingSenderId: "24147286853",
  appId: "1:24147286853:web:14b2cc2530daea0ed0fc2c",
  measurementId: "G-P4V0LW5SRP"
};

// Initialize Firebase app
// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

// Export the necessary functions and objects
export { db, auth, googleProvider, sendSignInLinkToEmail, fetchSignInMethodsForEmail, signInWithEmailLink };