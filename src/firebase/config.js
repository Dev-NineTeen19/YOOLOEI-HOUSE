import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// การตั้งค่า Firebase ของโครงการ horpak-baanrao-c0a17
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCmtbdJY3lim6DGu4oB37e8OlBhWf_L9BU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "horpak-baanrao-c0a17.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "horpak-baanrao-c0a17",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "horpak-baanrao-c0a17.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1042274801697",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1042274801697:web:546c82c42948c94f4f2b60",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T7E90H8PBX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
