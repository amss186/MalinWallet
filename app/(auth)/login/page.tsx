'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRecaptcha } from '@/lib/hooks/useRecaptcha';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { verify } = useRecaptcha();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isHuman = await verify();
    if (!isHuman) {
      toast.error("Vérification de sécurité échouée.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        toast.warning("Veuillez vérifier votre email avant de continuer.");
        // Optionally block access or allow depending on policy.
        // User wants "Perfect", so maybe block? Let's allow for now but warn.
      }
      toast.success("Connexion réussie");
      router.push('/onboarding'); // Check if wallet exists later
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) return toast.info("Entrez votre email d'abord");
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Email de réinitialisation envoyé !");
    } catch (e) {
      toast.error("Erreur lors de l'envoi");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
      <ToastContainer theme="dark" />
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
          <Sparkles className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-white">Malin Wallet</h1>
        <p className="text-slate-400">Votre porte vers le Web3</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="••••••••"
          />
          <button type="button" onClick={handleReset} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2">
            Mot de passe oublié ?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          Se connecter
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-400 text-sm">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
