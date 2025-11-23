// lib/firebase.ts

// -----------------------------------------------------------------------------
// 1. Importations : Regroupez toutes les importations nécessaires ici.
// -----------------------------------------------------------------------------
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  Auth, 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";


// -----------------------------------------------------------------------------
// 2. Configuration Firebase : Définition UNIQUE de la configuration de votre projet.
//    Ces valeurs doivent provenir de vos variables d'environnement.
//    Assurez-vous qu'elles sont correctement définies dans votre .env.local (local)
//    et dans les variables d'environnement de votre projet Vercel (déploiement).
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


// -----------------------------------------------------------------------------
// 3. Initialisation UNIQUE de l'application Firebase (Singleton Pattern).
//    Typage explicite des instances pour TypeScript.
// -----------------------------------------------------------------------------
let app: FirebaseApp;
let auth: Auth; 
let db: Firestore; 
let googleProvider: GoogleAuthProvider; // Déclarez la variable ici pour la rendre globale dans le fichier

try {
  console.log("Firebase Init: Checking existing apps...");
  if (getApps().length === 0) {
    console.log("Firebase Init: No existing app found. Initializing with config:", firebaseConfig);
    // Vérification de la configuration avant l'initialisation
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("Firebase Init Error: Missing critical config values (apiKey or projectId). Check your .env.local or Vercel Environment Variables.");
      // Optionnel: Vous pouvez lancer une erreur ici pour bloquer l'application
      // throw new Error("Firebase configuration is incomplete.");
    }
    app = initializeApp(firebaseConfig);
    console.log("Firebase Init: App initialized successfully.");
  } else {
    app = getApp(); // Récupère l'application Firebase existante
    console.log("Firebase Init: Using existing app instance.");
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider(); // Initialisation après avoir initialisé l'app
  
  console.log("Firebase Init: Auth and Firestore instances obtained.");

} catch (e) {
  console.error("Firebase Initialization Error caught:", e);
  // Re-lancer l'erreur si elle est critique
  throw new Error("Failed to initialize Firebase. Check console for details.");
}


// -----------------------------------------------------------------------------
// 4. Initialisation conditionnelle d'Analytics (pour le côté client uniquement).
// -----------------------------------------------------------------------------
let analytics: Analytics | null = null; 
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics: Initialized.");
    } else {
      console.log("Firebase Analytics: Not supported in this environment.");
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
  authInstance: auth, 
  dbInstance: db,     

  signInWithGoogle: async () => {
    try {
      console.log("FirebaseService: Attempting Google sign-in.");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("FirebaseService: Google sign-in successful.", result.user.uid);
      return result;
    } catch (e) {
      console.error("FirebaseService Error: Google sign-in failed.", e);
      throw e;
    }
  },

  registerEmail: async (email: string, pass: string) => {
    try {
      console.log("FirebaseService: Attempting email registration for", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(userCredential.user);
      console.log("FirebaseService: Email registration successful and verification email sent.", userCredential.user.uid);
      return userCredential.user;
    } catch (e) {
      console.error("FirebaseService Error: Email registration failed for", email, e);
      throw e;
    }
  },

  loginEmail: async (email: string, pass: string) => {
    try {
      console.log("FirebaseService: Attempting email login for", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (!userCredential.user.emailVerified) {
        console.warn("FirebaseService: User logged in but email not verified.", userCredential.user.uid);
        return { user: userCredential.user, verified: false };
      }
      console.log("FirebaseService: Email login successful and verified.", userCredential.user.uid);
      return { user: userCredential.user, verified: true };
    } catch (e) {
      console.error("FirebaseService Error: Email login failed for", email, e);
      throw e;
    }
  },

  resendVerification: async (user: User) => {
    try {
      console.log("FirebaseService: Resending verification email for", user.email);
      await sendEmailVerification(user);
      console.log("FirebaseService: Verification email sent.");
    } catch (e) {
      console.error("FirebaseService Error: Failed to resend verification email for", user.email, e);
      throw e;
    }
  },

  resetPassword: async (email: string) => {
    try {
      console.log("FirebaseService: Sending password reset email for", email);
      await sendPasswordResetEmail(auth, email);
      console.log("FirebaseService: Password reset email sent.");
    } catch (e) {
      console.error("FirebaseService Error: Failed to send password reset email for", email, e);
      throw e;
    }
  },

  saveUserProfile: async (userProfile: any) => {
    try {
      console.log("FirebaseService: Saving user profile for UID:", userProfile.uid);
      await setDoc(doc(db, "users", userProfile.uid), userProfile, { merge: true });
      console.log("FirebaseService: User profile saved successfully for UID:", userProfile.uid);
    } catch (e) {
      console.error("FirebaseService Error: Firestore save user profile failed for UID:", userProfile.uid, e);
      throw e; 
    }
  },

  getUserProfile: async (uid: string) => {
    try {
      console.log("FirebaseService: Getting user profile for UID:", uid);
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("FirebaseService: User profile found for UID:", uid);
        return docSnap.data();
      }
      console.log("FirebaseService: No user profile found for UID:", uid);
      return null;
    } catch (e) {
      console.error("FirebaseService Error: Firestore get user profile failed for UID:", uid, e);
      throw e; 
    }
  }
};
