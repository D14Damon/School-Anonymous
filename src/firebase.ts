import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  increment,
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAffDlg4OwEJw-wpuZ4F8GEr6FWSSk59Ro",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "school-anonymous-40b2a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "school-anonymous-40b2a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "school-anonymous-40b2a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "285638960908",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:285638960908:web:b136c53990cb3e95f5cb29"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
};
export type { FirebaseUser };
