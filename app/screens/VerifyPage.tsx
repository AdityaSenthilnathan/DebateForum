import { useEffect } from 'react';
import { useRouter } from 'next/router'; // If using Next.js, or useHistory for React Router
import { auth, signInWithEmailLink } from '../firebaseConfig';

const VerifyPage = () => {
  const router = useRouter();

  useEffect(() => {
    const completeSignUp = async () => {
      const email = window.localStorage.getItem('emailForSignUp');

      // Check if the URL is a sign-in email link
      const isSignInLink = auth.isSignInWithEmailLink(window.location.href);

      if (isSignInLink) {
        try {
          // Complete sign-in using the email and the current URL's code
          await signInWithEmailLink(auth, email!, window.location.href);
          window.localStorage.removeItem('emailForSignUp');
          // Redirect to the next step after successful sign-up
          router.push('/dashboard'); // Or wherever you want the user to go after sign-up
        } catch (error) {
          console.error('Error completing sign-up:', error);
        }
      } else {
        console.error('Invalid sign-in link');
      }
    };

    completeSignUp();
  }, [router]);

  return <div>Verifying your email...</div>;
};

export default VerifyPage;
