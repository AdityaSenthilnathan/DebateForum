"use client";

import React from 'react';
import { AuthProvider, useAuth } from './authContext'; // Import useAuth hook
import SignIn from './screens/SignIn'; // Import SignIn component
import ForumPage from './screens/ForumPage'; // Import ForumPage component

const MainContent: React.FC = () => {
  const { currentUser, loading, setCurrentUser } = useAuth(); // Access auth state and updater

  if (loading) return <div>Loading...</div>; // Show loading while fetching auth state

  return (
    <>
      {!currentUser ? (
        <SignIn
          onSignIn={() => {
            // Simulate setting user after successful sign-in (you would replace this with your auth logic)
            setCurrentUser({ id: '123', name: 'User' }); // Example user data
          }}
        />
      ) : (
        <ForumPage />
      )}
    </>
  );
};

const Page: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default Page;
