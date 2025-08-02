import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import SignUpModal from './SignUpModal'; // Import the SignUpModal component

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false); // Manage modal visibility
  const [showError, setShowError] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); // Manage reset modal visibility
  const [resetEmail, setResetEmail] = useState(''); // Email for password reset
  const [isResetting, setIsResetting] = useState(false); // Loading state for reset

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000); // Hide error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle Sign In with Email/Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Successfully signed in with email/password');
      // You can redirect the user after successful login here
    } catch (error) {
      setError('Failed to sign in with email/password. Please check your credentials.');
      console.error('Error signing in with email/password:', error);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setError('Please enter your email to reset your password.');
      return;
    }
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsResetting(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      setResetEmail('');
      setIsResetModalOpen(false);
      
      // Show success message for 5 seconds
      setTimeout(() => {
        setResetEmailSent(false);
      }, 5000);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // More specific error messages
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many requests. Please try again later.');
          break;
        default:
          setError('Failed to send password reset email. Please try again later.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Open Sign Up Modal
  const openSignUpModal = () => {
    setIsSignUpModalOpen(true);  // Set the modal state to open
  };

  // Close Sign Up Modal
  const closeSignUpModal = () => {
    setIsSignUpModalOpen(false); // Set the modal state to closed
  };

  // Open Reset Modal
  const openResetModal = () => {
    setIsResetModalOpen(true); // Set the reset modal state to open
  };

  // Close Reset Modal
  const closeResetModal = () => {
    setIsResetModalOpen(false); // Set the reset modal state to closed
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome to DebateHub</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            {error && showError && <p className="text-red-500">{error}</p>}
            {resetEmailSent && <p className="text-green-500">Password reset email sent. Please check your inbox.</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </CardContent>
        {/* <CardFooter className="flex justify-between items-center p-4 bg-gray-50 rounded-b-md">
          <p className="text-md text-gray-600">
            <button onClick={openSignUpModal} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
              Sign up
            </button>
          </p>
          <p className="text-md text-gray-600">
            <button onClick={openResetModal} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
              Forgot Password?
            </button>
          </p>
        </CardFooter> */}
      </Card>

      {/* Conditionally render the SignUpModal */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
            <SignUpModal onClose={closeSignUpModal} />
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={(e) => {
            // Close modal when clicking outside the content
            if (e.target === e.currentTarget) {
              closeResetModal();
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reset Password</h2>
              <button 
                onClick={closeResetModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isResetting}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
              
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting}
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePasswordReset();
                    }
                  }}
                />
              </div>
              
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  onClick={closeResetModal} 
                  variant="outline"
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePasswordReset}
                  disabled={isResetting || !resetEmail}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isResetting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}