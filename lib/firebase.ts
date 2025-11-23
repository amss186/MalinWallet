// lib/firebase.ts

// -----------------------------------------------------------------------------
// 1. Importations : Regroupez toutes les importations nécessaires ici.
// -----------------------------------------------------------------------------
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User, // N'oubliez pas d'importer 'User' si vous l'utilisez
  Auth, // Importez Auth si vous typiez explicitement
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Firestore } from "firebase/firestore"; // Importez Firestore si vous typiez explicitement
import { getAnalytics, isSupported, Analytics } from "firebase/analytics"; // Importez Analytics si vous typiez explicitement


// -----------------------------------------------------------------------------
// 2. Configuration Firebase : Définition UNIQUE de la configuration de votre projet.
//    Utilisez les variables d'environnement pour maintenir la sécurité.
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Doit être "malin-wallet"
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Pour Google Analytics
};


// -----------------------------------------------------------------------------
// 3. Initialisation UNIQUE de l'application Firebase (Singleton Pattern).
//    C'est ici que l'application Firebase, l'authentification et Firestore sont initialisées.
// -----------------------------------------------------------------------------
let app;
let auth: Auth; // Typage explicite pour Auth
let db: Firestore; // Typage explicite pour Firestore

// Utilisation du modèle Singleton pour s'assurer que Firebase n'est initialisé qu'une seule fois.
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Récupère l'application Firebase existante
}

auth = getAuth(app);
db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// -----------------------------------------------------------------------------
// 4. Initialisation conditionnelle d'Analytics (pour le côté client uniquement).
// -----------------------------------------------------------------------------
let analytics: Analytics | null = null; // Typage explicite pour Analytics
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((e) => {
    console.error("Firebase Analytics initialization failed:", e);
  });
}


// -----------------------------------------------------------------------------
// 5. Exportations des instances Firebase pour utilisation dans votre application.
// -----------------------------------------------------------------------------
export { app, auth, db, googleProvider, analytics };


// -----------------------------------------------------------------------------
// 6. FirebaseService : Regroupez vos fonctions d'interaction avec Firebase ici.
//    Elles utilisent les instances 'auth' et 'db' qui ont été initialisées ci-dessus.
// -----------------------------------------------------------------------------
export const FirebaseService = {
  authInstance: auth, // Accès direct à l'instance d'authentification
  dbInstance: db,     // Accès direct à l'instance Firestore

  // Authentification Google
  signInWithGoogle: async () => {
    // 'auth' est déjà initialisé globalement, donc pas besoin de le vérifier
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  },

  // Création Compte Email
  registerEmail: async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(userCredential.user);
    return userCredential.user;
  },

  // Login Email avec Check Vérification
  loginEmail: async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    if (!userCredential.user.emailVerified) {
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
    await sendPasswordResetEmail(auth, email);
  },

  // --- FIRESTORE (Stockage des profils utilisateurs) ---
  
  saveUserProfile: async (userProfile: any) => {
    try {
      // Utilisez l'instance 'db' déjà initialisée
      await setDoc(doc(db, "users", userProfile.uid), userProfile, { merge: true });
    } catch (e) {
      console.error("Firestore Save Error", e);
      throw e; // Renvoyez l'erreur pour que l'appelant puisse la gérer
    }
  },

  getUserProfile: async (uid: string) => {
    try {
      // Utilisez l'instance 'db' déjà initialisée
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (e) {
      console.error("Firestore Get Error", e);
      throw e; // Renvoyez l'erreur
    }
  }
};
