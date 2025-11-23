'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowRightLeft,
  TrendingUp,
  Globe,
  BarChart2,
  GraduationCap,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      }
    };
    fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'swap', icon: ArrowRightLeft, label: 'Swap', path: '/swap' },
    { id: 'earn', icon: TrendingUp, label: 'Earn', path: '/earn' },
    { id: 'dapps', icon: Globe, label: 'DApps', path: '/dapps' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { id: 'learn', icon: GraduationCap, label: 'Learn', path: '/learn' },
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
              {userProfile?.wallets[0]?.name[0] || 'M'}
            </div>
            <div className="text-left truncate">
              <p className="font-bold text-sm truncate text-white group-hover:text-indigo-200 transition">
                {userProfile?.wallets[0]?.name || 'Main Wallet'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {userProfile ? `${userProfile.activeWalletAddress.slice(0,6)}...${userProfile.activeWalletAddress.slice(-4)}` : 'Loading...'}
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
