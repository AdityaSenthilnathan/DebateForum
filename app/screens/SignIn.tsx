import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic from next/dynamic
import { useRouter } from 'next/router'; // Import useRouter from next/router
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Correct import path for firebaseConfig
const SignUpModal = dynamic(() => import('./SignUpModal'), { ssr: false }); // Dynamically import SignUpModal

const ErrorMessage = ({ message }: { message: string }) => (
  <p className="text-red-500">{message}</p>
);

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false); // Manage modal visibility
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); // Manage reset modal visibility
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // Add successMessage state
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Only set timer for non-verification error messages
    if (error && !error.includes('verify your email')) {
      timer = setTimeout(() => {
        setError('');
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error]);

  // Handle Sign In with Email/Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form from refreshing the page
    setError(''); // Reset error state
    setResetEmailSent(false); // Reset the reset email sent state
    setVerificationEmailSent(false); // Reset the verification email sent state

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        router.push('/verify-email'); // Redirect to VerifyEmail page
        return;
      }

      setSuccessMessage('Successfully signed in!');
      // Handle successful sign in here (e.g., redirect)
      
    } catch (error: unknown) {
      // Improve error message handling
      if (error instanceof Error) {
        setError(error.message || 'Failed to sign in. Please check your credentials.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
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
    } catch (error: unknown) {
      setError('Failed to send password reset email. Please try again later.');
    }
  };

  // Handle Resend Verification Email
  const handleResendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email to resend the verification link.');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await signOut(auth);
      setVerificationEmailSent(true);
      setError('');
    } catch (error: unknown) {
      setError('Failed to resend verification email. Please try again later.');
      console.error('Error resending verification email:', error);
    }
  };

  // Toggle Modal
  const toggleModal = (setModalState: React.Dispatch<React.SetStateAction<boolean>>, state: boolean) => {
    setModalState(state);
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
            {error && <ErrorMessage message={error} />}
            {successMessage && <p className="text-green-500">{successMessage}</p>} {/* Display success message */}
            {resetEmailSent && <p className="text-green-500">Password reset email sent. Please check your inbox.</p>}
            {verificationEmailSent && <p className="text-green-500">Verification email sent. Please check your inbox.</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email" // Add autocomplete attribute
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
                autoComplete="current-password" // Add autocomplete attribute
              />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 bg-gray-50 rounded-b-md">
          <p className="text-md text-gray-600">
            <button onClick={() => toggleModal(setIsSignUpModalOpen, true)} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
              Sign up
            </button>
          </p>
          <p className="text-md text-gray-600">
            <button onClick={() => toggleModal(setIsResetModalOpen, true)} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
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
            <SignUpModal onClose={() => toggleModal(setIsSignUpModalOpen, false)} />
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
                autoComplete="email" // Add autocomplete attribute
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handlePasswordReset} className="mr-2">Submit</Button>
              <Button onClick={() => toggleModal(setIsResetModalOpen, false)} variant="outline">Cancel</Button>
            </div>
            {error && <ErrorMessage message={error} />}
          </div>
        </div>
      )}

      {/* Conditionally render the Resend Verification Email option */}
      {error.includes('verify your email') && (
        <div className="mt-4">
          <Button onClick={handleResendVerificationEmail} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold">
            Resend Verification Email
          </Button>
        </div>
      )}
    </div>
  );
}