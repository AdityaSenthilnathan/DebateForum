"use client";

import React from 'react';
import { AuthProvider } from './authContext'; // Import AuthProvider
import Layout from './layout'; // Layout component
import SignIn from './screens/SignIn'; // SignIn component
import ForumPage from './screens/ForumPage'; // ForumPage component
import { useAuth } from './authContext'; // useAuth hook to access auth state

const Page: React.FC = () => {
  return (
    <AuthProvider> {/* Wrap your entire app here */}
      <Layout>
        <MainContent />
      </Layout>
    </AuthProvider>
  );
};

const MainContent: React.FC = () => {
  const { currentUser, loading, setCurrentUser } = useAuth(); // Access auth state and updater

  if (loading) return <div>Loading...</div>; // Show loading while fetching auth state

  // Handle sign-in logic after successful sign-in
  const handleSignIn = () => {
    setCurrentUser(true); // Update currentUser state (you can replace `true` with actual user info if needed)
  };

  return (
    <>
      {!currentUser ? (
        <SignIn onSignIn={handleSignIn} /> // Pass handleSignIn to SignIn component
      ) : (
        <ForumPage /> // Show ForumPage if the user is authenticated
      )}
    </>
  );
};

export default Page;
