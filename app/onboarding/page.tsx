'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { WalletService } from '@/lib/wallet';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, Copy, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Step 1: Generate Wallet
  useEffect(() => {
    if (step === 1) {
      const wallet = WalletService.createWallet();
      if (wallet.mnemonic) {
        setMnemonic(wallet.mnemonic);
        setPrivateKey(wallet.privateKey);
        setAddress(wallet.address);
      }
    }
  }, [step]);

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
    if (encryptionPassword.length < 8) {
      toast.error("Le mot de passe de chiffrement doit faire au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      // 1. Encrypt Private Key
      const encryptedKey = await WalletService.encrypt(privateKey, encryptionPassword);

      // 2. Save to Firestore (User Profile)
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        createdAt: new Date().toISOString(),
        wallets: [{
          id: 'wallet-1',
          name: 'Compte Principal',
          address: address,
          encryptedPrivateKey: encryptedKey,
          color: '#6366f1'
        }],
        activeWalletAddress: address,
        settings: { currency: 'USD', language: 'fr' }
      });

      toast.success("Portefeuille créé et sécurisé !");
      router.push('/dashboard');

    } catch (e: any) {
      toast.error("Erreur de sauvegarde: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <ToastContainer theme="dark" />
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-indigo-400' : 'text-slate-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${step >= i ? 'bg-indigo-500/20 border-indigo-500' : 'border-slate-600'}`}>
                {i}
              </div>
              {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="text-center space-y-6">
            <Shield className="w-16 h-16 text-indigo-400 mx-auto" />
            <h2 className="text-3xl font-bold text-white">Sécurisez votre Portefeuille</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Nous allons générer votre phrase secrète. C&apos;est la <strong>SEULE</strong> façon de récupérer vos fonds si vous perdez votre mot de passe.
            </p>
            <button onClick={() => setStep(2)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition">
              Générer ma phrase secrète
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold text-white">Votre Phrase de Récupération</h2>
               <button onClick={() => copyToClipboard(mnemonic)} className="p-2 text-indigo-400 hover:bg-white/5 rounded-lg transition">
                 <Copy size={20} />
               </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {mnemonic.split(' ').map((word, i) => (
                <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3 text-center">
                  <span className="text-slate-500 text-xs mr-2">{i+1}</span>
                  <span className="text-white font-mono">{word}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-bold mb-1">Attention !</p>
                <p>Ne partagez jamais cette phrase. Quiconque la possède a accès à tous vos fonds. Écrivez-la sur papier et stockez-la en lieu sûr.</p>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
              <input type="checkbox" className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-transparent" checked={savedConfirmed} onChange={(e) => setSavedConfirmed(e.target.checked)} />
              <span className="text-slate-300">J&apos;ai sauvegardé ma phrase secrète en lieu sûr</span>
            </label>

            <button
              disabled={!savedConfirmed}
              onClick={() => setStep(3)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
               <h2 className="text-2xl font-bold text-white">Chiffrement du Coffre-fort</h2>
               <p className="text-slate-400 mt-2">
                 Créez un mot de passe fort pour chiffrer votre clé privée avant qu&apos;elle soit sauvegardée dans le cloud.
               </p>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe de chiffrement</label>
               <div className="relative">
                 <input
                   type={showPassword ? "text" : "password"}
                   value={encryptionPassword}
                   onChange={(e) => setEncryptionPassword(e.target.value)}
                   className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10"
                   placeholder="Utilisez un mot de passe unique"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-3 text-slate-400 hover:text-white"
                 >
                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
               </div>
               <p className="text-xs text-slate-500 mt-2">Ce mot de passe sera demandé à chaque connexion sur un nouvel appareil.</p>
            </div>

            <button
              onClick={handleFinalize}
              disabled={loading || encryptionPassword.length < 8}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
              Terminer et Accéder au Wallet
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
