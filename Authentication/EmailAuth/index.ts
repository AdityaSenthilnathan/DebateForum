import { auth } from "@/app/firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

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


    //create a new User
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );
    const results = userCredential.user
    console.log("Results:" + results);


    //Send Email Verification
    await sendEmailVerification(results);
    alert('A verification email has been sent to your address!');
    }
    catch(error){
        console.error(error);
    } finally {
        setLoading(false);
    }
  };