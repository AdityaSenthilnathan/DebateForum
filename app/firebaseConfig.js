// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Make sure to import Firestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCf7Hx7HYl5NciE_0F5nPlXRsvOzM38Boc",
    authDomain: "debateforum-3be19.firebaseapp.com",
    projectId: "debateforum-3be19",
    storageBucket: "debateforum-3be19.firebasestorage.app",
    messagingSenderId: "24147286853",
    appId: "1:24147286853:web:14b2cc2530daea0ed0fc2c",
    measurementId: "G-P4V0LW5SRP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and Auth
const db = getFirestore(app)



export { db, auth, googleProvider };