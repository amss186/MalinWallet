
"use client";

import Link from 'next/link';
import { ArrowLeft, ChevronRight, Shield, Globe, Banknote, HelpCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('Français (FR)');
  const [currency, setCurrency] = useState('EUR');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 flex items-center gap-4 border-b border-gray-800">
        <button onClick={() => router.back()}>
           <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Paramètres</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* General */}
        <section>
          <h2 className="text-gray-500 font-bold mb-2 uppercase text-sm">Général</h2>
          <div className="bg-[#1C1C1E] rounded-xl overflow-hidden">
             <SettingsItem icon={<Globe className="text-blue-400" />} label="Langue" value={lang} />
             <SettingsItem icon={<Banknote className="text-green-400" />} label="Devise" value={currency} />
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="text-gray-500 font-bold mb-2 uppercase text-sm">Sécurité</h2>
          <div className="bg-[#1C1C1E] rounded-xl overflow-hidden">
             <SettingsItem icon={<Shield className="text-red-400" />} label="Chiffrer le stockage" />
             <SettingsItem icon={<Shield className="text-red-400" />} label="Authentification (PIN)" value="Désactivé" />
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-gray-500 font-bold mb-2 uppercase text-sm">À Propos</h2>
          <div className="bg-[#1C1C1E] rounded-xl overflow-hidden">
             <SettingsItem icon={<Info className="text-gray-400" />} label="À propos" />
             <SettingsItem icon={<HelpCircle className="text-gray-400" />} label="Aide & Support" />
          </div>
        </section>

        <div className="text-center text-gray-600 text-sm mt-8">
           Malin Wallet v2.1.0<br/>
           Based on BlueWallet Logic
        </div>

      </div>
    </div>
  );
}

function SettingsItem({ icon, label, value }: { icon: any, label: string, value?: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0 hover:bg-gray-800 transition cursor-pointer">
      <div className="flex items-center gap-3">
         {icon}
         <span className="font-bold">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        {value && <span>{value}</span>}
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}
