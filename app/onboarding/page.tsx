'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { WalletService } from '@/lib/wallet';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, Copy, AlertTriangle, Eye, EyeOff, Loader2, ChevronRight, Lock, Key, Download } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import 'react-toastify/dist/ReactToastify.css';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [importMode, setImportMode] = useState(false); // New state for import
  const [importInput, setImportInput] = useState('');

  const router = useRouter();

  // Check Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserChecked(true);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const generateWallet = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const wallet = WalletService.createWallet();
      if (wallet.mnemonic) {
        setMnemonic(wallet.mnemonic);
        setPrivateKey(wallet.privateKey);
        setAddress(wallet.address);
        setStep(2);
      } else {
          toast.error("Erreur lors de la génération du portefeuille.");
      }
    } catch (error: any) {
      toast.error("Erreur de génération: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async () => {
      if (!importInput) return;
      setIsGenerating(true);
      try {
          // Check if input is Mnemonic or Private Key
          let wallet;
          if (importInput.includes(' ')) {
              // Assume Mnemonic
              wallet = WalletService.recoverWallet(importInput);
              setMnemonic(importInput); // Store mnemonic if available
          } else {
              // Assume Private Key: use ethers dynamically
              const { ethers } = await import('ethers');
              const w = new ethers.Wallet(importInput);
              wallet = { address: w.address, privateKey: w.privateKey, mnemonic: null };
          }

          if (wallet) {
              setPrivateKey(wallet.privateKey);
              setAddress(wallet.address);
              setStep(3); // Skip step 2 (Display Seed) since they already know it
          }
      } catch (e: any) {
          toast.error("Clé invalide: " + e.message);
      } finally {
          setIsGenerating(false);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  const handleFinalize = async () => {
    if (!auth.currentUser) {
      toast.error("Vous devez être connecté");
      router.push('/login');
      return;
    }

    if (!privateKey) {
      toast.error("Erreur critique: Clé privée manquante.");
      setStep(1);
      return;
    }

    if (encryptionPassword.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères");
      return;
    }

    if (encryptionPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSaving(true);
    try {
      // ---------- DEBUG / SAFEGUARD WRAPPER ----------
      let encryptedKey: string | null = null;

      const encryptWithTimeout = async (pk: string, pwd: string, ms = 10000) => {
        return Promise.race([
          (async () => {
            console.log('[DEBUG] Starting WalletService.encrypt()');
            const res = await WalletService.encrypt(pk, pwd);
            console.log('[DEBUG] WalletService.encrypt resolved:', res ? 'ok' : res);
            return res;
          })(),
          new Promise((_r, rej) => setTimeout(() => rej(new Error('ENCRYPT_TIMEOUT')), ms))
        ]);
      };

      try {
        // Try the original encrypt with a timeout
        encryptedKey = await encryptWithTimeout(privateKey, encryptionPassword, 12000);
      } catch (encError: any) {
        console.error('[DEBUG] WalletService.encrypt failed or timed out:', encError);

        // Fallback: try WebCrypto AES-GCM to check environment and avoid total block
        try {
          console.log('[DEBUG] Trying SubtleCrypto AES-GCM fallback...');
          const enc = new TextEncoder();
          const pwKey = await crypto.subtle.importKey(
            'raw',
            enc.encode(encryptionPassword),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
          );
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const derived = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            pwKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt']
          );
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derived, enc.encode(privateKey));
          // compose salt + iv + ct as base64
          const blob = new Uint8Array(salt.byteLength + iv.byteLength + ct.byteLength);
          blob.set(new Uint8Array(salt), 0);
          blob.set(new Uint8Array(iv), salt.byteLength);
          blob.set(new Uint8Array(ct), salt.byteLength + iv.byteLength);
          const b64 = btoa(String.fromCharCode(...blob));
          encryptedKey = `aes-fallback:${b64}`;
          console.log('[DEBUG] SubtleCrypto fallback success');
        } catch (fallbackErr) {
          console.error('[DEBUG] SubtleCrypto fallback failed:', fallbackErr);
          throw new Error('Échec du chiffrement (WalletService et fallback). Voir console.');
        }
      }
      // ---------- END DEBUG WRAPPER ----------

      const userRef = doc(db, "users", auth.currentUser.uid);

      const walletData = {
        id: crypto.randomUUID(),
        name: 'Compte Principal',
        address: address,
        encryptedPrivateKey: encryptedKey,
        color: '#6366f1',
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        updatedAt: new Date().toISOString(),
        wallets: [walletData],
        activeWalletAddress: address,
        settings: { currency: 'USD', language: 'fr' }
      }, { merge: true });

      setStep(4);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur inconnue lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userChecked) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <ToastContainer theme="dark" position="top-center" />

      <div className="max-w-2xl w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-center mb-10 relative z-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                ${step >= i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}
              `}>
                {step > i ? <CheckCircle size={18} /> : i}
              </div>
              {i < 3 && (
                <div className={`w-16 h-1 rounded transition-colors duration-300 mx-2 ${step > i ? 'bg-indigo-600' : 'bg-slate-800'}`}></div>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1: Introduction / Choice */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center space-y-8"
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-500/30">
                <Shield className="w-10 h-10 text-indigo-400" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-3">Sécurisez votre Portefeuille</h2>
                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                  Vous pouvez créer un nouveau portefeuille ou importer un portefeuille existant.
                </p>
              </div>

              {!importMode ? (
                  <>
                     <div className="bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700/50 max-w-md mx-auto">
                        <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                            <span>Génération 100% hors ligne et locale</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-slate-300">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                            <span>Clé privée chiffrée par votre mot de passe</span>
                        </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4 justify-center">
                        <button
                            onClick={generateWallet}
                            disabled={isGenerating}
                            className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all w-full overflow-hidden"
                        >
                            <span className="flex items-center justify-center gap-2">
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Key className="w-5 h-5" />}
                            {isGenerating ? 'Génération...' : 'Créer un nouveau wallet'}
                            </span>
                        </button>

                        <button
                            onClick={() => setImportMode(true)}
                            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-all w-full"
                        >
                            Importer un wallet existant
                        </button>
                    </div>
                  </>
              ) : (
                  <div className="space-y-4 max-w-md mx-auto">
                      <div className="text-left">
                          <label className="text-sm font-medium text-slate-300 mb-1 block">Phrase de récupération ou Clé Privée</label>
                          <textarea
                             value={importInput}
                             onChange={(e) => setImportInput(e.target.value)}
                             className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition h-32"
                             placeholder="Entrez vos 12 mots ou votre clé privée (0x...)"
                          />
                      </div>
                      <div className="flex gap-3">
                           <button
                             onClick={() => setImportMode(false)}
                             className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
                           >
                             Annuler
                           </button>
                           <button
                             onClick={handleImport}
                             disabled={!importInput || isGenerating}
                             className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                           >
                              {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                              Importer
                           </button>
                      </div>
                  </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Seed Phrase Display (Only if generated) */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-bold text-white">Votre Phrase Secrète</h2>
                    <p className="text-sm text-slate-400">Notez ces mots dans l&apos;ordre exact.</p>
                 </div>
                 <button
                  onClick={() => copyToClipboard(mnemonic)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition border border-indigo-500/20"
                 >
                   <Copy size={16} />
                   <span className="text-sm font-medium">Copier</span>
                 </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {mnemonic.split(' ').map((word, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-black/40 border border-slate-700 rounded-lg p-3 text-center hover:border-indigo-500/50 transition">
                      <span className="absolute top-1 left-2 text-[10px] text-slate-600 font-mono">{i+1}</span>
                      <span className="text-white font-mono font-medium">{word}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 w-6 h-6" />
                <div className="text-sm text-amber-200/90">
                  <p className="font-bold mb-1">Avertissement de sécurité</p>
                  <p>Ne prenez pas de capture d&apos;écran. Écrivez cette phrase sur papier et cachez-la. Si vous la perdez, vos fonds sont perdus à jamais.</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5 group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 bg-transparent"
                      checked={savedConfirmed}
                      onChange={(e) => setSavedConfirmed(e.target.checked)}
                    />
                  </div>
                  <span className="text-slate-300 text-sm pt-0.5 group-hover:text-white transition">Je certifie avoir copié et sauvegardé ma phrase de récupération en lieu sûr.</span>
                </label>

                <button
                  disabled={!savedConfirmed}
                  onClick={() => setStep(3)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  Continuer <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Encryption Password */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-500/30">
                    <Lock className="w-8 h-8 text-indigo-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Chiffrez votre Clé Privée</h2>
                 <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
                   Ce mot de passe servira à chiffrer votre clé privée avant qu&apos;elle ne soit envoyée sur nos serveurs. Nous ne pouvons pas le réinitialiser.
                 </p>
              </div>

              <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
                   <div className="relative group">
                     <input
                       type={showPassword ? "text" : "password"}
                       value={encryptionPassword}
                       onChange={(e) => setEncryptionPassword(e.target.value)}
                       className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-10"
                       placeholder="8 caractères minimum"
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-3 text-slate-500 hover:text-white transition"
                     >
                       {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmer le mot de passe</label>
                   <div className="relative group">
                     <input
                       type={showPassword ? "text" : "password"}
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       className={`w-full bg-slate-950/50 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 transition pr-10
                         ${confirmPassword && encryptionPassword !== confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'}
                       `}
                       placeholder="Répétez le mot de passe"
                     />
                   </div>
                   {confirmPassword && encryptionPassword !== confirmPassword && (
                     <p className="text-red-400 text-xs mt-1">Les mots de passe ne correspondent pas.</p>
                   )}
                 </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFinalize}
                  disabled={isSaving || encryptionPassword.length < 8 || encryptionPassword !== confirmPassword}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                  Terminer la configuration
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Tout est prêt !</h2>
              <p className="text-slate-400">Votre portefeuille a été créé et chiffré avec succès.</p>
              <p className="text-slate-500 text-sm mt-4">Redirection vers votre tableau de bord...</p>
              <div className="mt-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
