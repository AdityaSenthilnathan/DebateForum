"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth'; // Ensure correct import from Firebase
import { auth } from './firebaseConfig';

// Define the AuthContextType properly
interface AuthContextType {
  currentUser: User | null;  // Current user can either be a User or null
  loading: boolean;           // Loading state for when auth state is being fetched
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // User or null
  const [loading, setLoading] = useState<boolean>(true);  // Track loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);  // Set the user when auth state changes
      setLoading(false);      // Set loading to false after state is fetched
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}  {/* Pass down children components */}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context state
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
