// layout.tsx
"use client";

import React from 'react';
import { AuthProvider, useAuth } from './authContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <body>
    <AuthProvider>
      <AuthContent>{children}</AuthContent>
    </AuthProvider>
    </body>
    </html>
  );
};

// Separate component for auth-dependent content
const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <div>Please sign in to continue.</div>;
  }

  return <>{children}</>;
};

export default Layout;
