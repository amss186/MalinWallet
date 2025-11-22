
// IMPORTANT : C'est ici que vous devez mettre vos vraies clés API Firebase.
// Safe check for process.env to prevent browser crash
const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return "";
};

const API_KEY = getEnvVar('REACT_APP_FIREBASE_API_KEY') || "VOTRE_API_KEY_ICI";

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "malinwallet-app.firebaseapp.com",
  projectId: "malinwallet-app",
  storageBucket: "malinwallet-app.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:00000000000000"
};

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

let app: any;
let auth: any;
let db: any;

try {
  // Singleton pattern to prevent initialization errors
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase Initialization Error:", e);
}

export const FirebaseService = {
  authInstance: auth,
  
  // Authentification Google
  signInWithGoogle: async () => {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  },

  // Création Compte Email
  registerEmail: async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    // Envoi immédiat de l'email de vérification
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  },

  // Login Email avec Check Vérification
  loginEmail: async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    // Vérification si l'email est validé par l'utilisateur
    if (!userCredential.user.emailVerified) {
      // On ne bloque pas ici, on renvoie l'info au composant UI pour qu'il bloque l'accès
      return { user: userCredential.user, verified: false };
    }
    return { user: userCredential.user, verified: true };
  },

  // Renvoyer Email de vérification
  resendVerification: async (user: User) => {
    await sendEmailVerification(user);
  },

  // Mot de passe oublié
  resetPassword: async (email: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    await sendPasswordResetEmail(auth, email);
  },

  // --- FIRESTORE (Stockage Blob Chiffré) ---
  
  saveUserProfile: async (userProfile: any) => {
    if (!db) return;
    try {
      // Sauvegarde des données chiffrées et publiques.
      await setDoc(doc(db, "users", userProfile.uid), userProfile, { merge: true });
    } catch (e) {
      console.error("Firestore Save Error", e);
    }
  },

  getUserProfile: async (uid: string) => {
    if (!db) return null;
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }
};
    