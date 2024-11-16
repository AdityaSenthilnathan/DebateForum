import { useState } from "react";
import { auth } from "../firebaseConfig"; // Assuming your Firebase setup is in `firebase.js`
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";

interface SignUpModalProps {
  onClose: () => void; // Accepting the onClose prop
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Create user account with email and password (but do not store additional data yet)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Sign out user immediately after sending the verification email
      await signOut(auth);

      // Set verification sent flag
      setVerificationSent(true);

      // Optionally, close the modal after successful signup
      setTimeout(() => {
        onClose(); // Close the modal after some time (optional)
      }, 2000); // 2-second delay before closing
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message); // Access the error message if it's an instance of Error
      } else {
        setError("An unknown error occurred."); // Fallback for unknown error types
      }
    }
  };

  if (verificationSent) {
    return (
      <div>
        <h2>Verification email sent!</h2>
        <p>Please check your email and click the verification link to complete your sign-up process.</p>
        <p>Once verified, you can log in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Sign Up</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default SignUpModal;
