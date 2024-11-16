// utils/emailService.js

export const sendEmailVerificationCode = async (email, code) => {
    try {
      // Example implementation using a hypothetical external service/API
      // Replace this with actual API/service call logic
  
      // This is just a placeholder for demonstration purposes
      console.log(`Sending PIN ${code} to email ${email}`);
  
      // Simulated API call delay
      return new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      throw new Error('Failed to send email. Please try again.');
    }
  };
  