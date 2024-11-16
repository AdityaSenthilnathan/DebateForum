import { useState } from "react";
import { auth } from "../firebaseConfig"; // Assuming your Firebase setup is in `firebase.js`
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";

const SignUpModal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignUp = async (e) => {
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

      // Prompt user to check their email
      setVerificationSent(true);
    } catch (err) {
      setError(err.message);
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
