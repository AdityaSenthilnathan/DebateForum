import { auth } from "@/app/firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  //navigate: NavigateFunction
) => {
  try {
    console.log(name);
    console.log(email);
    console.log(password);

    // Create a new User
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("Results:" + user);

    // Send Email Verification
    await sendEmailVerification(user);
    alert('A verification email has been sent to your address!');

    // Sign out the user
    await signOut(auth);

    // Redirect to login screen (you can use a router for this)
    // Adjust the path as needed
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};