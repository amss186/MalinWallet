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
  Wallet,
  LucideIcon // Import du type pour TypeScript
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- DÉFINITION DES TYPES POUR ÉVITER LES ERREURS ---
interface SettingsItem {
  icon: LucideIcon;
  label: string;
  action: () => void;
  value?: string; // Optionnel
  sub?: string;   // Optionnel
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  // On type explicitement le tableau
  const settingsGroups: SettingsGroup[] = [
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
        { icon: Shield, label: "Sécurité", sub: "Clé privée, Phrase secrète", action: () => {} },
        { icon: Wallet, label: "Portefeuilles", action: () => {} },
        { icon: Smartphone, label: "WalletConnect", sub: "Scanner un QR Code", action: () => router.push('/scan') },
      ]
    },
    {
      title: "Préférences",
      items: [
        { icon: Bell, label: "Notifications", action: () => router.push('/notifications') },
      ]
    },
    {
      title: "Info",
      items: [
        { icon: Info, label: "Version Malin", value: "v2.0.0", action: () => {} },
      ]
    }
  ];

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
                      <p className="font-medium">{item.label}</p>
                      {/* TypeScript est content maintenant car 'sub' est marqué optionnel (?) */}
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

        <button 
          onClick={handleLogout}
          className="w-full p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition flex items-center justify-center gap-2 mt-8 active:scale-95"
        >
          <LogOut size={20} /> Déconnexion
        </button>
        
        <p className="text-center text-slate-600 text-xs mt-8 pb-10">
          Malin Wallet • Fait avec ❤️ par Amss
        </p>
      </div>
    </div>
  );
}


