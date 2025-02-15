import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { sendPasswordResetEmail } from 'firebase/auth';
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
      console.log('Successfully signed in with email/password');
      // You can redirect the user after successful login here
    } catch{
      setError('Failed to sign in with email/password. Please check your credentials or create an account.');
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('');
      setIsResetModalOpen(false); // Close the reset modal after sending the email
    } catch {
      setError('Failed to send password reset email. Please try again later.');
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
        <CardFooter className="flex justify-between items-center p-4 bg-gray-50 rounded-b-md">
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
</CardFooter>
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

      {/* Conditionally render the ResetModal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handlePasswordReset} className="mr-2">Submit</Button>
              <Button onClick={closeResetModal} variant="outline">Cancel</Button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}