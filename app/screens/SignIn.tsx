import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
//import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import SignUpModal from './SignUpModal'; // Import the SignUpModal component

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false); // Manage modal visibility
  const [showError, setShowError] = useState(false);

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
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setError('Please verify your email before signing in. Check your email for a confirmation link.');
        return;
      }

      console.log('Successfully signed in with email/password');
      // You can redirect the user after successful login here
    } catch (error) {
      setError('Failed to sign in with email/password. Please check your credentials.');
      console.error('Error signing in with email/password:', error);
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
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button onClick={openSignUpModal} className="text-blue-500 hover:underline">
              Sign up
            </button>
          </p>
        </CardFooter>
      </Card>

      {/* Conditionally render the SignUpModal */}
      {isSignUpModalOpen && <SignUpModal onClose={closeSignUpModal} />}
    </div>
  );
}