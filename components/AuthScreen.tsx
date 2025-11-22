
import React, { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, Fingerprint, CheckCircle, Eye, EyeOff, AlertTriangle, RefreshCw, ChevronLeft } from 'lucide-react';
import { StorageService } from '../services/storageService.ts';
import { FirebaseService } from '../services/firebaseConfig.ts';
import { UserProfile } from '../types.ts';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Block state for unverified emails
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // 1. Authentification Firebase Réelle
      const { user: firebaseUser, verified } = await FirebaseService.loginEmail(email, password);
      
      if (!verified) {
         setNeedsVerification(true);
         setUnverifiedUser(firebaseUser);
         setLoading(false);
         return;
      }

      // 2. Récupération du profil local
      const storedUser = StorageService.getUser();
      
      if (storedUser && storedUser.uid === firebaseUser.uid) {
        // Succès Local + Cloud
        onAuthenticated(storedUser);
      } else {
        // Cas: Nouvel appareil. Tenter de récupérer depuis Firestore.
        const cloudProfile = await FirebaseService.getUserProfile(firebaseUser.uid);
        if (cloudProfile) {
          // En production: On demanderait de déchiffrer le blob ici.
          StorageService.saveUser(cloudProfile as UserProfile);
          onAuthenticated(cloudProfile as UserProfile);
        } else {
          setError("Compte introuvable sur cet appareil. Le mode multi-device nécessite l'importation de la Seed.");
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Email ou mot de passe incorrect.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Trop de tentatives. Réessayez plus tard.");
      } else {
        setError("Erreur de connexion: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // 1. Création Compte Firebase
      const firebaseUser = await FirebaseService.registerEmail(email, password);
      
      // 2. Génération Wallet Crypté (AES-256) & Stockage Local/Cloud
      // Note: Le mot de passe est utilisé pour dériver la clé de chiffrement.
      await StorageService.registerUserEncrypted(name, email, firebaseUser.uid, password);
      
      // 3. Passage à l'écran de vérification
      setUnverifiedUser(firebaseUser);
      setNeedsVerification(true);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé.");
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit faire au moins 6 caractères.");
      } else {
        setError("Erreur inscription: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez entrer votre email.");
      return;
    }
    setLoading(true);
    try {
      await FirebaseService.resetPassword(email);
      setSuccessMessage("Email de réinitialisation envoyé ! Vérifiez vos spams.");
      setError('');
    } catch (err: any) {
      setError("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (unverifiedUser) {
      setLoading(true);
      try {
        await FirebaseService.resendVerification(unverifiedUser);
        setSuccessMessage("Email renvoyé !");
      } catch (e: any) {
        setError("Erreur d'envoi: " + e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- RENDER: EMAIL VERIFICATION GATE ---
  if (needsVerification) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
         <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-full bg-indigo-900/10 animate-pulse"></div>
         </div>

         <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl text-center relative z-10">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400 animate-in zoom-in border border-amber-500/30">
               <Mail size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Vérification Requise</h2>
            <p className="text-slate-400 mb-6 leading-relaxed text-sm">
               Un lien de confirmation a été envoyé à <br/>
               <span className="text-white font-bold bg-slate-800 px-2 py-1 rounded mt-2 inline-block">{email}</span>.
            </p>
            <p className="text-slate-500 text-xs mb-8">
               Pour votre sécurité, l'accès au wallet est bloqué tant que votre email n'est pas vérifié.
            </p>
            
            {successMessage && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm flex items-center gap-2 justify-center">
                <CheckCircle size={16} /> {successMessage}
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => { setNeedsVerification(false); setIsLogin(true); setSuccessMessage(''); setError(''); }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-indigo-600/20"
              >
                J'ai vérifié mon email, me connecter
              </button>
              <button 
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Renvoyer l'email"}
              </button>
            </div>
         </div>
       </div>
    );
  }

  // --- RENDER: MAIN AUTH ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[150px] animate-blob"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[150px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-in slide-in-from-top-8 duration-700">
           <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)] border border-white/10">
              <Sparkles size={40} className="text-white" />
           </div>
           <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
             MalinWallet
           </h1>
           <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Bank-Grade Security • No Simulation</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
           
           {isForgotPassword ? (
             <form onSubmit={handleForgotPassword} className="relative z-10 space-y-5">
                <button type="button" onClick={() => setIsForgotPassword(false)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2">
                  <ChevronLeft size={16} /> Retour
                </button>
                <h3 className="text-xl font-bold text-white">Réinitialiser le mot de passe</h3>
                <p className="text-slate-400 text-sm">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                
                <div className="relative group">
                  <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition" />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition"
                    required
                  />
                </div>

                {successMessage && <div className="text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{successMessage}</div>}
                {error && <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</div>}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </button>
             </form>
           ) : (
             <>
               {/* Tabs */}
               <div className="flex justify-center gap-8 mb-8 border-b border-white/5 pb-1 relative z-10">
                  <button onClick={() => setIsLogin(true)} className={`pb-3 text-sm font-bold transition-all ${isLogin ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>Connexion</button>
                  <button onClick={() => setIsLogin(false)} className={`pb-3 text-sm font-bold transition-all ${!isLogin ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>Créer un compte</button>
               </div>

               <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5 relative z-10">
                  {!isLogin && (
                    <div className="relative group">
                      <Fingerprint size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition" />
                      <input 
                        type="text" 
                        placeholder="Nom (Profil Public)" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition"
                        required={!isLogin}
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition" />
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mot de passe Maître" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white outline-none focus:border-indigo-500 transition"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3 text-rose-400 text-xs font-medium animate-in slide-in-from-top-2">
                       <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                       <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : (isLogin ? "Accéder au Wallet" : "Créer mon Wallet")}
                    {!loading && <ArrowRight size={20} />}
                  </button>
               </form>

               {isLogin && (
                 <button 
                   type="button" 
                   onClick={() => setIsForgotPassword(true)}
                   disabled={loading}
                   className="mt-6 w-full text-center text-xs text-slate-500 hover:text-indigo-400 transition"
                 >
                   Mot de passe oublié ?
                 </button>
               )}
             </>
           )}
        </div>
        
        <div className="mt-8 text-center">
           <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
             <ShieldCheck size={12} /> Chiffrement AES-256 • Zero-Knowledge
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
