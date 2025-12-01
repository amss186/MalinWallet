'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowRightLeft,
  TrendingUp,
  Globe,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeAddress, setActiveAddress] = useState<string>('');

  useEffect(() => {
    // On écoute l'auth Firebase juste pour avoir l'UID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // CORRECTION MAJEURE : On lit le LocalStorage, pas Firestore
        // C'est ici que sont stockées les clés (Non-Custodial)
        const storageKey = `malin_user_${user.uid}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData) as UserProfile;
            setUserProfile(parsedData);

            // Trouver l'adresse active
            if (parsedData.activeWalletId && parsedData.wallets) {
                const activeWallet = parsedData.wallets.find(w => w.id === parsedData.activeWalletId);
                if (activeWallet) {
                    setActiveAddress(activeWallet.address);
                }
            }
          } catch (e) {
            console.error("Erreur lecture LocalStorage Sidebar", e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'swap', icon: ArrowRightLeft, label: 'Swap', path: '/swap' },
    { id: 'earn', icon: TrendingUp, label: 'Earn', path: '/earn' },
    { id: 'dapps', icon: Globe, label: 'DApps', path: '/dapps' },
  ];

  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-white/5 p-6 fixed h-full bg-[#020617]/50 backdrop-blur-xl z-20">
      <div className="flex items-center gap-3 mb-10 px-2">
         <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
           <Sparkles size={20} className="text-white" />
         </div>
         <div>
           <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Malin</h1>
           <p className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">Vault OS v2.0</p>
         </div>
      </div>

      {/* Wallet Switcher */}
      <button
        className="mb-8 w-full bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-white/10 transition group shadow-inner"
      >
         <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-lg bg-indigo-600">
              {/* Initiale du Wallet */}
              {userProfile?.wallets && userProfile.wallets.length > 0 
                ? userProfile.wallets[0].name[0].toUpperCase() 
                : 'M'}
            </div>
            <div className="text-left truncate">
              <p className="font-bold text-sm truncate text-white group-hover:text-indigo-200 transition">
                {userProfile?.wallets && userProfile.wallets.length > 0
                    ? userProfile.wallets[0].name 
                    : 'Loading...'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeAddress 
                    ? `${activeAddress.slice(0,6)}...${activeAddress.slice(-4)}` 
                    : '...'}
              </p>
            </div>
         </div>
         <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition" />
      </button>

      <nav className="space-y-2 flex-1">
         {menuItems.map((item) => {
           const isActive = pathname === item.path;
           return (
             <Link
                key={item.id}
                href={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             >
               <item.icon size={20} className={isActive ? 'text-indigo-400' : 'opacity-70'} />
               {item.label}
             </Link>
           );
         })}
      </nav>

      <div className="border-t border-white/5 pt-6 flex flex-col gap-2">
        <button className="flex items-center gap-3 text-slate-400 hover:text-white transition px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">
           <Settings size={18} /> Settings
        </button>
        <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-rose-400 transition px-4 py-2 text-sm font-medium hover:bg-rose-500/10 rounded-lg">
           <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

