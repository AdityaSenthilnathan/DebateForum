// page.tsx
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
  const { currentUser, loading } = useAuth(); // Now you can safely use useAuth

  if (loading) return <div>Loading...</div>; // Show loading while fetching auth state

  return (
    <>{!currentUser ? <SignIn /> : <ForumPage />}</> // Show SignIn if no user is authenticated
  );
};


export default Page;
