import { getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const VITE_FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: "debateforum-3be19.firebaseapp.com",
  projectId: "debateforum-3be19",
  storageBucket: "debateforum-3be19.appspot.com", // Updated this to match standard naming
  messagingSenderId: "24147286853",
  appId: "1:24147286853:web:192573977b5b38d4d0fc2c",
  measurementId: "G-X1SSYP2RTE"
};

// Initialize Firebase
const firestoreApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
const googleAuthProvider = new GoogleAuthProvider();
const auth = getAuth(firestoreApp);
const db = getFirestore(firestoreApp); // Initialize Firestore instance
const googleProvider = new GoogleAuthProvider(); // Initialize as googleProvider
export { auth, googleAuthProvider, db, googleProvider}; // Export db along with auth and provider
