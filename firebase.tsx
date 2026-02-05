// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOqr0_TXwerJ8LrJr8EAwq43lqcEi73K4",
  authDomain: "easywastepickup.firebaseapp.com",
  databaseURL: "https://easywastepickup-default-rtdb.firebaseio.com",
  projectId: "easywastepickup",
  storageBucket: "easywastepickup.firebasestorage.app",
  messagingSenderId: "344041964936",
  appId: "1:344041964936:web:37b363c4b07a35a1d8e63d",
  measurementId: "G-SS448RV2CJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only when supported (avoids runtime errors)
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };