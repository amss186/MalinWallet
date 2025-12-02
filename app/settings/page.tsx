'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Shield, Globe, Bell, CreditCard, 
  Smartphone, Info, ChevronRight, LogOut, Moon, Wallet, 
  Loader2, PlusCircle, Check, Sun
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { WalletService } from '@/lib/wallet';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // État local pour l'UI
  const [lang, setLang] = useState('Français');

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  // ✅ CORRECTION CRITIQUE : CRÉATION WALLET DUAL-CHAIN
  const handleAddWallet = async () => {
    setLoading(true);
    try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const storageKey = `malin_user_${uid}`;
        const storedData = localStorage.getItem(storageKey);
        if (!storedData) return;

        const userData = JSON.parse(storedData);
        
        // 1. Générer ETH
        const evmWallet = WalletService.createEVMWallet();
        // 2. Générer SOLANA
        const solWallet = WalletService.createSolanaWallet();

        // Chiffrement (On utilise le même mot de passe que le compte principal pour simplifier)
        // Note: Dans une V4, on demandera le mot de passe actuel pour déchiffrer/rechiffrer
        const encryptedKey = await WalletService.encrypt(evmWallet.privateKey, "default_password"); 

        const walletObj = {
            id: crypto.randomUUID(),
            name: `Compte ${userData.wallets.length + 1}`,
            address: evmWallet.address,       // 0x...
            solanaAddress: solWallet.address, // Base58...
            color: '#6366f1',
            privateKeyEncrypted: encryptedKey,
            mnemonic: evmWallet.mnemonic
        };

        userData.wallets.push(walletObj);
        userData.activeWalletId = walletObj.id;

        localStorage.setItem(storageKey, JSON.stringify(userData));
        
        toast.success("Portefeuille ajouté avec succès !");
        
        // On attend un peu et on redirige proprement SANS recharger la page (évite le Lock)
        setTimeout(() => router.push('/dashboard'), 800);

    } catch (e: any) {
        toast.error("Erreur: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  // Fonction factice pour simuler le changement de langue/thème
  const toggleTheme = () => {
      setDarkMode(!darkMode);
      toast.success(`Thème ${!darkMode ? 'Sombre' : 'Clair'} activé`);
  };

  const toggleLang = () => {
      setLang(lang === 'Français' ? 'English' : 'Français');
      toast.success("Langue mise à jour");
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-24 text-white">
      <ToastContainer theme="dark" position="bottom-center" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h1 className="text-xl font-bold">Paramètres</h1>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto mt-2">
        
        {/* SECTION GESTION */}
        <div>
            <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3 ml-2">Gestion</h3>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                <button onClick={handleAddWallet} disabled={loading} className="w-full flex items-center justify-between p-4 hover:bg-white/5 border-b border-white/5 transition">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                            {loading ? <Loader2 className="animate-spin" size={20}/> : <PlusCircle size={20} />}
                        </div>
                        <div className="text-left">
                            <p className="font-medium">Créer un portefeuille</p>
                            <p className="text-xs text-slate-500">ETH & Solana inclus</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600" />
                </button>
            </div>
        </div>

        {/* SECTION GENERAL */}
        <div>
            <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3 ml-2">Général</h3>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                <button onClick={toggleLang} className="w-full flex items-center justify-between p-4 hover:bg-white/5 border-b border-white/5 transition">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400"><Globe size={20} /></div>
                        <p className="font-medium">Langue</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg">{lang}</span>
                </button>
                <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">{darkMode ? <Moon size={20} /> : <Sun size={20}/>}</div>
                        <p className="font-medium">Apparence</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg">{darkMode ? 'Sombre' : 'Clair'}</span>
                </button>
            </div>
        </div>

        {/* SECTION SECURITE */}
        <div>
            <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3 ml-2">Sécurité</h3>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                <button onClick={() => toast.info("Vos clés sont chiffrées localement (AES-GCM)")} className="w-full flex items-center justify-between p-4 hover:bg-white/5 border-b border-white/5 transition">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400"><Shield size={20} /></div>
                        <div className="text-left">
                            <p className="font-medium">Mode de sécurité</p>
                            <p className="text-xs text-slate-500">Non-Custodial (Local)</p>
                        </div>
                    </div>
                    <Check size={16} className="text-green-500" />
                </button>
                <button onClick={() => router.push('/scan')} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400"><Smartphone size={20} /></div>
                        <p className="font-medium">WalletConnect</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600" />
                </button>
            </div>
        </div>

        <button onClick={handleLogout} className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition flex items-center justify-center gap-2 mt-8">
          <LogOut size={20} /> Déconnexion
        </button>
      </div>
    </div>
  );
}


