// pages/verify.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, signInWithEmailLink } from '../firebaseConfig';

const VerifyPage = () => {
  const router = useRouter();

  useEffect(() => {
    const completeSignUp = async () => {
      const email = window.localStorage.getItem('emailForSignUp');
      const isSignInLink = auth.isSignInWithEmailLink(window.location.href);

      if (isSignInLink) {
        try {
          await signInWithEmailLink(auth, email!, window.location.href);
          window.localStorage.removeItem('emailForSignUp');
          // Redirect to the appropriate page after successful sign-in
          router.push('/dashboard');
        } catch (error) {
          console.error('Error completing sign-up:', error);
        }
      }
    };

    completeSignUp();
  }, [router]);

  return <div>Verifying your email...</div>;
};

export default VerifyPage;
