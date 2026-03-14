
// Use modular Firebase SDK
// Fix: Use namespace imports to resolve environment-specific issues with named exports
import * as fbApp from 'firebase/app';
import * as fbAuth from 'firebase/auth';
// Fix: Use namespace import for firestore to bypass environment-specific type resolution issues with named exports
import * as fbFirestore from 'firebase/firestore';
import * as fbFunctions from 'firebase/functions';
const { getFirestore } = fbFirestore as any;
const { getFunctions, httpsCallable } = fbFunctions as any;

// Destructure from namespace with any casting to satisfy compiler when named exports are not detected
const { initializeApp } = fbApp as any;
const { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateEmail,
  updatePhoneNumber,
  PhoneAuthProvider,
  RecaptchaVerifier,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider
} = fbAuth as any;

// Firebase configuration using modular SDK
const firebaseConfig = {
  apiKey: "AIzaSyB877_SYxjHEJvNPhN-xRVo6bbpp5--Sfo",
  authDomain: "valuehubagenciesltd-8da45.firebaseapp.com",
  projectId: "valuehubagenciesltd-8da45",
  storageBucket: "valuehubagenciesltd-8da45.firebasestorage.app",
  messagingSenderId: "1078269301903",
  appId: "1:1078269301903:web:74d88ceb4803640f600cfa"
};

// Initialize Firebase using the modular pattern
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Centralize exports of auth functions to be used by other components
export {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePhoneNumber,
  PhoneAuthProvider,
  RecaptchaVerifier,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  getFunctions,
  httpsCallable,
};
