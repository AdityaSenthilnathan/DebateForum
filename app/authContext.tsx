import React, { createContext, useState, useContext, ReactNode } from 'react';

type AuthContextType = {
  currentUser: any; // Type it based on your user data structure
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>; // Function to set currentUser
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>; // Function to set loading state
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null); // Replace 'any' with your user type
  const [loading, setLoading] = useState<boolean>(true);

  // Example: Simulating user authentication
  React.useEffect(() => {
    // Replace this with your actual authentication logic, e.g., Firebase
    setLoading(false); // Set loading to false after fetching user state
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
