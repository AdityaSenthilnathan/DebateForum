// authContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { auth } from './firebaseConfig';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>; // To update the current user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Update display name function
export const updateUserName = async (newName: string) => {
  const { currentUser } = useAuth(); // Assuming you're inside a component that has the current user

  if (currentUser) {
    try {
      await updateProfile(currentUser, { displayName: newName });
      console.log('Display name updated successfully');
    } catch (error) {
      console.error('Error updating display name:', error);
    }
  }
};
