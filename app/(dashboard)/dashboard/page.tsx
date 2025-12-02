
"use client";

import { useEffect, useState } from 'react';
import { WalletManager } from '@/services/walletManager';
import { BitcoinService, BitcoinAddress } from '@/services/bitcoinService';
import { WalletData } from '@/services/walletStorage';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Repeat, CreditCard, Home, Settings, Search, MessageCircle } from 'lucide-react';
import fr from '@/locales/fr.json';

export default function Dashboard() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [addresses, setAddresses] = useState<BitcoinAddress[]>([]);
  const [balanceSats, setBalanceSats] = useState<number>(0);
  const [btcPrice, setBtcPrice] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const wallets = await WalletManager.getWallets();
      if (wallets.length > 0) {
        const w = wallets[0];
        setWallet(w);

        // Generate addresses
        const addrs = BitcoinService.generateAddresses(w.secret);
        setAddresses(addrs);

        // Fetch Balances (sum of all addresses for simplicity)
        let total = 0;
        for (const addr of addrs) {
           const bal = await BitcoinService.getBalance(addr.address);
           total += bal;
        }
        setBalanceSats(total);

        // Fetch Price
        const price = await BitcoinService.getPriceEUR();
        setBtcPrice(price);
      }
    }
    load();
  }, []);

  const balanceEUR = (balanceSats / 100_000_000 * btcPrice).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-xl font-bold">
             👻
           </div>
           <div>
             <p className="text-gray-400 text-xs">@unknown2030</p>
             <h2 className="font-bold text-lg">{wallet?.label || 'Account 1'}</h2>
           </div>
        </div>
        <div className="flex gap-4">
           <Link href="/settings"><Settings className="w-6 h-6 text-gray-400" /></Link>
           <Search className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* Main Actions */}
      <div className="px-4 mt-4 space-y-3">
        <button className="w-full bg-[#8A8AFF] hover:bg-[#7a7aff] text-black font-bold py-3 rounded-2xl transition">
          {fr.add_cash}
        </button>
        <button className="w-full bg-[#1C1C1E] hover:bg-[#2c2c2e] text-white font-bold py-3 rounded-2xl transition border border-gray-800">
          {fr.deposit_crypto}
        </button>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-4 gap-4 px-4 mt-6">
        <ActionButton icon={<ArrowDownLeft />} label={fr.receive} />
        <ActionButton icon={<ArrowUpRight />} label={fr.send} />
        <ActionButton icon={<Repeat />} label={fr.swap} />
        <ActionButton icon={<CreditCard />} label={fr.buy} />
      </div>

      {/* Perps Section */}
      <div className="px-4 mt-8">
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
           {fr.perps} <span className="text-gray-500 text-sm">{'>'}</span>
        </h3>
        <div className="bg-[#1C1C1E] p-4 rounded-2xl flex items-center gap-4">
           <div className="text-purple-400">
              <Repeat className="w-8 h-8" />
           </div>
           <div>
             <p className="font-bold">Plus de force avec les perps</p>
             <p className="text-gray-400 text-sm">Échangez avec un effet de levier...</p>
           </div>
        </div>
      </div>

      {/* Tokens Section */}
      <div className="px-4 mt-8">
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
           {fr.tokens} <span className="text-gray-500 text-sm">{'>'}</span>
        </h3>

        <div className="space-y-3">
          {addresses.map((addr, idx) => (
             <div key={idx} className="bg-[#1C1C1E] p-4 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                     ₿
                   </div>
                   <div>
                     <p className="font-bold">Bitcoin</p>
                     <span className="bg-gray-700 text-xs px-2 py-0.5 rounded text-gray-300">
                       {addr.type === 'native_segwit' ? 'Native Segwit' : 'Taproot'}
                     </span>
                     <p className="text-gray-400 text-sm mt-1">{balanceSats} BTC</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-bold">€{balanceEUR}</p>
                   <p className="text-gray-400 text-sm">€0.00</p>
                </div>
             </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-full bg-[#1C1C1E] border-t border-gray-800 p-4 flex justify-around items-center">
         <Home className="w-6 h-6 text-[#8A8AFF]" />
         <CreditCard className="w-6 h-6 text-gray-500" />
         <Repeat className="w-6 h-6 text-gray-500" />
         <MessageCircle className="w-6 h-6 text-gray-500" />
         <Search className="w-6 h-6 text-gray-500" />
      </div>

    </div>
  );
}

function ActionButton({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-2xl bg-[#1C1C1E] flex items-center justify-center text-[#8A8AFF]">
        {icon}
      </div>
      <span className="text-xs font-bold text-gray-400">{label}</span>
    </div>
  );
}
