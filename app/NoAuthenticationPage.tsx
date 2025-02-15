import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

const NoAuthenticationPage: React.FC<{ email: string }> = ({ email }) => {
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage('Verification email resent. Please check your inbox.');
      }
    } catch {
      setMessage('Failed to resend verification email. Please try again later.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMessage('You have been signed out.');
    } catch {
      setMessage('Failed to sign out. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Email Verification Required</h2>
        <p className="mb-4">Please check your email at <strong>{email}</strong> for a verification link.</p>
        <p className="mb-4">You may need to reload the page after authenticating.</p>
        <Button onClick={handleResendVerification} className="w-full">Resend Verification Email</Button>
        <Button onClick={handleSignOut} className="w-full mt-4">Sign Out</Button>
        {message && <p className="text-green-500 mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default NoAuthenticationPage;
