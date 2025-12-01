'use client';

import React, { useState, useEffect } from 'react';
import { WalletService } from '@/lib/wallet';
import { auth } from '@/lib/firebase';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LockGuard({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const checkWallet = () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
         setIsLocked(false); 
         return;
      }

      const storageKey = `malin_user_${uid}`;
      const storedData = localStorage.getItem(storageKey);

      if (storedData) {
        setHasWallet(true);
        setIsLocked(true);
      } else {
        setHasWallet(false);
        setIsLocked(false);
      }
    };

    const timer = setTimeout(checkWallet, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;

    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Utilisateur non connecté");

      const storageKey = `malin_user_${uid}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) throw new Error("Aucune donnée trouvée");

      const userData = JSON.parse(storedData);
      const activeWallet = userData.wallets.find((w: any) => w.id === userData.activeWalletId) || userData.wallets[0];

      if (!activeWallet) throw new Error("Wallet introuvable");

      await WalletService.decrypt(activeWallet.privateKeyEncrypted, password);

      setIsLocked(false);
      toast.success("Wallet déverrouillé");
    } catch (error) {
      console.error(error);
      toast.error("Mot de passe incorrect");
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        
        <div className="flex justify-center mb-8">
           <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center ring-1 ring-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              <Lock className="w-10 h-10 text-indigo-400" />
           </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
          <p className="text-slate-400">Votre coffre-fort est chiffré localement.</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe du Wallet</label>
            <div className="relative">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-lg text-center tracking-widest"
                    placeholder="••••••••"
                    autoFocus
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
                <>
                    Déverrouiller <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            {/* CORRECTION ICI : n'est -> n&apos;est */}
            <button 
                onClick={() => window.location.href = '/login'}
                className="text-slate-500 text-xs hover:text-white transition"
            >
                Ce n&apos;est pas vous ? Déconnexion
            </button>
        </div>
      </div>
    </div>
  );
}


