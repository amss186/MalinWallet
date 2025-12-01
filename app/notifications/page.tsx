'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Bell, X } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();

  // Données factices pour l'UI (Tu pourras connecter ça à Firebase plus tard)
  const notifications = [
    {
      id: 1,
      title: "Solana est maintenant disponible !",
      message: "Vous pouvez désormais envoyer et recevoir des SOL directement sur Malin Wallet.",
      date: "Il y a 2 min",
      read: false,
      type: "update"
    },
    {
      id: 2,
      title: "Récompenses de Staking",
      message: "Vos récompenses ETH sont arrivées. Vous avez gagné 0.002 ETH cette semaine.",
      date: "Il y a 2 heures",
      read: false,
      type: "money"
    },
    {
      id: 3,
      title: "Mise à jour de sécurité",
      message: "Nous avons renforcé le chiffrement de votre coffre-fort local.",
      date: "Hier",
      read: true,
      type: "security"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] pb-24">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
        </div>
        <button className="p-2 text-indigo-400 hover:text-white transition">
            <Check size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 text-slate-500">
                <Bell size={48} className="mb-4 opacity-20" />
                <p>Aucune notification</p>
            </div>
        ) : (
            notifications.map((notif) => (
                <div 
                    key={notif.id} 
                    className={`relative p-5 rounded-2xl border transition cursor-pointer
                    ${notif.read ? 'bg-transparent border-transparent' : 'bg-slate-900/50 border-white/5 hover:border-indigo-500/30'}`}
                >
                    {!notif.read && (
                        <div className="absolute top-6 right-5 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    )}
                    
                    <div className="flex items-start gap-4 pr-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                            ${notif.type === 'update' ? 'bg-blue-500/10 text-blue-400' : 
                              notif.type === 'money' ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Bell size={18} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm mb-1 ${notif.read ? 'text-slate-400' : 'text-white'}`}>
                                {notif.title}
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-2 font-mono uppercase tracking-wide">
                                {notif.date}
                            </p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center">
          <button className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full text-sm text-white font-medium shadow-xl hover:bg-slate-800 transition">
              Marquer tout comme lu
          </button>
      </div>
    </div>
  );
}

