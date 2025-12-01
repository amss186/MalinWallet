'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Shield, 
  Globe, 
  Bell, 
  CreditCard, 
  Smartphone, 
  Info, 
  ChevronRight, 
  LogOut,
  Moon,
  Wallet
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { toast, ToastContainer } from 'react-toastify';

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
    toast.info("À bientôt !");
  };

  const settingsGroups = [
    {
      title: "Général",
      items: [
        { icon: Globe, label: "Devise & Langue", value: "USD / Français", action: () => {} },
        { icon: Moon, label: "Apparence", value: "Sombre", action: () => {} },
      ]
    },
    {
      title: "Sécurité & Wallet",
      items: [
        { icon: Shield, label: "Sécurité et confidentialité", sub: "Clé privée, Phrase secrète", action: () => {} },
        { icon: Wallet, label: "Gestion des portefeuilles", action: () => {} },
        { icon: Smartphone, label: "WalletConnect", sub: "Scanner un QR Code", action: () => router.push('/scan') },
      ]
    },
    {
      title: "Préférences",
      items: [
        { icon: Bell, label: "Notifications", action: () => router.push('/notifications') },
        { icon: CreditCard, label: "Moyens de paiement", action: () => {} },
      ]
    },
    {
      title: "Autres",
      items: [
        { icon: Info, label: "À propos de Malin", value: "v2.0.0", action: () => {} },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] pb-24">
      <ToastContainer theme="dark" position="bottom-center" />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto mt-2">
        
        {/* Settings Groups */}
        {settingsGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3 ml-2">{group.title}</h3>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
              {group.items.map((item, i) => (
                <button 
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition border-b border-white/5 last:border-0 active:bg-indigo-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                      <item.icon size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{item.label}</p>
                      {item.sub && <p className="text-xs text-slate-500">{item.sub}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg">{item.value}</span>}
                    <ChevronRight size={16} className="text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition flex items-center justify-center gap-2 mt-8"
        >
          <LogOut size={20} /> Déconnexion
        </button>

        <p className="text-center text-slate-600 text-xs mt-8">
          Malin Wallet • Fait avec ❤️ en Gambie
        </p>
      </div>
    </div>
  );
}

