// lib/firebase.ts

// -----------------------------------------------------------------------------
// 1. Importations : Regroupez toutes les importations nécessaires ici.
// -----------------------------------------------------------------------------
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"; // Ajout de FirebaseApp
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  Auth, // Importé pour le typage
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Firestore } from "firebase/firestore"; // Importé pour le typage
import { getAnalytics, isSupported, Analytics } from "firebase/analytics"; // Importé pour le typage


// -----------------------------------------------------------------------------
// 2. Configuration Firebase : Définition UNIQUE de la configuration de votre projet.
//    Utilisez les variables d'environnement pour maintenir la sécurité.
//    Assurez-vous que ces variables sont correctement définies dans votre fichier .env.local
//    et correspondent à votre projet 'malin-wallet'.
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
let app: FirebaseApp; // Type explicite pour 'app'
let auth: Auth; 
let db: Firestore; 

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
let analytics: Analytics | null = null; 
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
      await setDoc(doc(db, "users", userProfile.uid), userProfile, { merge: true });
    } catch (e) {
      console.error("Firestore Save Error", e);
      throw e; 
    }
  },

  getUserProfile: async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (e) {
      console.error("Firestore Get Error", e);
      throw e; 
    }
  }
};
