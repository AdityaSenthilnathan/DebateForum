// components/SignIn.tsx
import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // Adjust the path according to your project structure
import { doc, setDoc } from 'firebase/firestore';

const SignIn: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const [name, setName] = useState('');
  const provider = new GoogleAuthProvider();

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user details in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name || user.displayName,
        email: user.email,
        posts: 0,
        comments: 0,
        answered: 0,
      });

      onSignIn(); // Trigger sign-in callback
    } catch (error) {
      console.error("Error during sign in: ", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Sign In</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 border p-2 rounded"
      />
      <button onClick={handleSignIn} className="bg-blue-500 text-white py-2 px-4 rounded">
        Sign in with Google
      </button>
    </div>
  );
};

export default SignIn;
