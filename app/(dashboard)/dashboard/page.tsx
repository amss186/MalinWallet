'use client';

import React, { useEffect, useState } from 'react';
import { ChainService } from '@/lib/chain';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Asset, UserProfile } from '@/types';
import { Wallet, Send, ArrowDownLeft, RefreshCw, Plus } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // 1. Get User Profile
        const userRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const userData = snap.data() as UserProfile;
          setUser(userData);
          const address = userData.activeWalletId

          // 2. Fetch Real Chain Data
          // Native ETH
          const ethBal = await ChainService.getNativeBalance(address);

          // Tokens (Alchemy)
          const tokens = await ChainService.getTokenBalances(address);

          // Combine
          const ethAsset: Asset = {
            symbol: 'ETH',
            name: 'Ethereum',
            balance: parseFloat(ethBal),
            decimals: 18,
            price: 0, // Need price feed later
            chainId: 1,
            logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
          };

          const allAssets = [ethAsset, ...tokens];
          setAssets(allAssets);

          // Calculate Total (Mock Price for now as we don't have CoinGecko API key configured yet)
          // In a real production app, we would fetch prices here.
          setTotalBalance(parseFloat(ethBal) * 2200); // Mock ETH Price $2200
        }
      } catch (e) {
        console.error(e);
        toast.error("Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-indigo-500 animate-pulse">Chargement des données blockchain...</div>;
  }

  return (
    <div className="space-y-8">
       <ToastContainer theme="dark" />

       {/* Header / Total Balance */}
       <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          <div className="relative z-10">
             <p className="text-indigo-200 font-medium mb-2">Solde Total Estimé</p>
             <h1 className="text-5xl font-bold text-white mb-6">
               ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h1>

             <div className="flex gap-4">
                <button className="flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition">
                   <Send size={20} /> Envoyer
                </button>
                <button className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition backdrop-blur-md">
                   <ArrowDownLeft size={20} /> Recevoir
                </button>
                <button className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition backdrop-blur-md">
                   <Plus size={20} /> Acheter
                </button>
             </div>
          </div>

          {/* Background Decor */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
       </div>

       {/* Assets List */}
       <div>
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Vos Actifs</h2>
            <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white">
               <RefreshCw size={20} />
            </button>
         </div>

         <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {assets.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Aucun actif trouvé sur ce réseau.</div>
            ) : (
              assets.map((asset, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition last:border-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                        {asset.logoUrl ? <img src={asset.logoUrl} alt={asset.name || asset.symbol} /> : <span className="font-bold text-indigo-400">{asset.symbol[0]}</span>}
                      </div>
                      <div>
                        <p className="font-bold text-white">{asset.name}</p>
                        <p className="text-xs text-slate-400">{asset.balance} {asset.symbol}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-white">
                        ${(parseFloat(asset.balance) * (asset.symbol === 'ETH' ? 2200 : 1)).toFixed(2)}
                      </p>
                   </div>
                </div>
              ))
            )}
         </div>
       </div>
    </div>
  );
}
