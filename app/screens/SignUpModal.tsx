import { useState } from "react";
import { auth } from "../firebaseConfig"; // Assuming your Firebase setup is in `firebase.js`
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { registerUser } from "@/Authentication/EmailAuth";
interface SignUpModalProps {
  onClose: () => void; // Accepting the onClose prop
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose }) => {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registerUser(name,email,password, setIsLoading);
    console.log("handlesssssss");
  };
  if (isLoading){
    return <p>Loading...</p>
  }

  return (
    <form onSubmit= {(e) => handleSubmit(e)}>
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
