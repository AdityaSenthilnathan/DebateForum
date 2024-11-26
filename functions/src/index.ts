/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sendgrid = require('@sendgrid/mail');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set your SendGrid API key
sendgrid.setApiKey('YOUR_SENDGRID_API_KEY');

// Function to send PIN email
exports.sendPinCodeEmail = functions.auth.user().onCreate((user: { email: any; uid: any; }) => {
  const email = user.email;
  const pin = Math.floor(100000 + Math.random() * 900000).toString(); // Generate PIN code
  
  // Create the email content
  const msg = {
    to: email,
    from: 'your-email@example.com', // Your email or SendGrid verified email
    subject: 'Your Confirmation PIN',
    text: `Hello, your confirmation PIN code is: ${pin}`,
  };

  // Send email via SendGrid
  sendgrid.send(msg)
    .then(() => {
      console.log('PIN sent successfully');
      // Store the PIN in Firestore for later verification
      return admin.firestore().collection('pinCodes').doc(user.uid).set({
        pin: pin,
        emailVerified: false,
      });
    })
    .catch((error: any) => {
      console.error('Error sending email:', error);
    });
});

