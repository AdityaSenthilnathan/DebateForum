// layout.tsx
"use client";
import './globals.css';
import React from 'react';
import { AuthProvider, useAuth } from './authContext';
import SignIn from './screens/SignIn';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* Wrapping AuthContent with children, allowing conditional rendering */}
          <AuthContent>{children}</AuthContent>
        </AuthProvider>
      </body>
    </html>
  );
};

// Separate component for auth-dependent content
const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Handle loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not logged in, show the SignIn screen
  if (!currentUser) {
    return (
      <SignIn
        onSignIn={() => {
          // Handle the sign-in process here
          console.log('User signed in');
        }}
      />
    );
  }

  // If the user is logged in, display the children components (app content)
  return <>{children}</>;
};

export default Layout;
