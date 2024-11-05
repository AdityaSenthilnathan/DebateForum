// components/Layout.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-500 text-white p-4">
        <h1 className="text-2xl font-bold">
          <Link to="/">Debate Forum</Link>
        </h1>
        <nav className="mt-2">
          <Link to="/" className="mr-4">Home</Link>
          <Link to="/profile" className="mr-4">Profile</Link>
        </nav>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children} {/* Render the page content here */}
      </main>

      <footer className="bg-gray-800 text-white text-center p-4">
        <p>© {new Date().getFullYear()} Debate Forum. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
