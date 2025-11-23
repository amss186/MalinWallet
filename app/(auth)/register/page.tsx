'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Chrome, Mail, ArrowRight } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); // New State
  const { verify } = useRecaptcha();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const isHuman = await verify();
    if (!isHuman) {
      toast.error("Bot détecté. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true); // Switch UI
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        toast.success("Compte créé avec Google !");
        router.push('/onboarding');
    } catch (error: any) {
        toast.error("Erreur Google: " + error.message);
    }
  };

  if (verificationSent) {
      return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <ToastContainer theme="dark" position="top-center" />
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/30">
                <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Vérifiez votre email</h2>
            <p className="text-slate-400 mb-6">
                Un lien de confirmation a été envoyé à <strong>{email}</strong>.
                Veuillez cliquer dessus pour activer votre compte.
            </p>
            <button
                onClick={() => router.push('/login')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
            >
                Retour à la connexion <ArrowRight size={18} />
            </button>
        </div>
      );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      <ToastContainer theme="dark" position="top-center" />
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
          <Sparkles className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-white">Rejoindre Malin</h1>
        <p className="text-slate-400">Créez votre portefeuille sécurisé</p>
      </div>

      <div className="space-y-4">
        <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl transition hover:bg-slate-200 flex items-center justify-center gap-2"
        >
            <Chrome size={20} />
            S&apos;inscrire avec Google
        </button>

        <div className="flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-slate-500 text-sm">ou email</span>
            <div className="h-px bg-white/10 flex-1"></div>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="Minimum 8 caractères"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Confirmer Mot de passe</label>
          <input
            type="password"
            required
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="Répétez le mot de passe"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          S&apos;inscrire
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-400 text-sm">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
