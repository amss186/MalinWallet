'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Bell } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  // Tableau vide pour commencer (plus de fake news)
  const notifications: any[] = [];

  return (
    <div className="min-h-screen bg-[#020617] pb-24 text-white">
      <div className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        <button className="p-2 text-indigo-400 hover:text-white transition"><Check size={20} /></button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        {notifications.length === 0 ? (
            <div className="text-center opacity-50">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Rien à signaler</h3>
                <p className="text-sm text-slate-400">Vous êtes à jour !</p>
            </div>
        ) : (
            notifications.map((notif) => (
               // Code d'affichage si on ajoute des notifs plus tard
               <div key={notif.id}></div>
            ))
        )}
      </div>
    </div>
  );
}


