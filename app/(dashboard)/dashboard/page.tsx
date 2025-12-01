'use client';

import React, { useEffect, useState } from 'react';
import { ChainService } from '@/lib/chain';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Asset, UserProfile } from '@/types';
import { 
  Send, ArrowDownLeft, RefreshCw, Plus, Copy, TrendingUp, 
  Wallet, X, Bell, Settings, ScanLine, ChevronDown, 
  History, Coins, ArrowUpRight, ArrowDownLeft as ArrowIn 
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Interface pour l'historique
interface Transaction {
  hash: string;
  value: number;
  asset: string;
  direction: 'in' | 'out';
  date: string;
  status: 'success' | 'pending';
  from: string;
  to: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]); // Nouvel état Historique
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({ ethereum: 0, solana: 0 });
  
  // Gestion des Onglets (Tokens vs Activity)
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const router = useRouter();

  // 1. PRIX LIVE
  const fetchPrices = async () => {
    try {
        const apiKey = 'CG-QusUvyf714GG4pRWoCpyFmyy'; 
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        setPrices({ ethereum: data.ethereum?.usd || 0, solana: data.solana?.usd || 0 });
        return data;
    } catch (e) { return { ethereum: 3600, solana: 150 }; }
  };

  // 2. RECUPERATION HISTORIQUE (Alchemy)
  const fetchHistory = async (address: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      const url = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
      
      // Appel API Alchemy: AssetTransfers (Sorties)
      const res = await axios.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [{
          fromBlock: "0x0",
          toBlock: "latest",
          fromAddress: address, // Sorties (Sent)
          category: ["external", "erc20"],
          maxCount: "0xa" // 10 dernières
        }]
      });

      // Appel API Alchemy: AssetTransfers (Entrées)
      const resIn = await axios.post(url, {
        jsonrpc: "2.0",
        id: 2,
        method: "alchemy_getAssetTransfers",
        params: [{
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: address, // Entrées (Received)
          category: ["external", "erc20"],
          maxCount: "0xa"
        }]
      });

      const sent = res.data.result?.transfers || [];
      const received = resIn.data.result?.transfers || [];

      // Fusion et formatage
      const allTx = [
        ...sent.map((tx: any) => ({ ...tx, direction: 'out' })),
        ...received.map((tx: any) => ({ ...tx, direction: 'in' }))
      ].sort((a, b) => parseInt(b.blockNum) - parseInt(a.blockNum)); // Plus récent d'abord

      const formattedHistory: Transaction[] = allTx.map((tx: any) => ({
        hash: tx.hash,
        value: tx.value || 0,
        asset: tx.asset || 'ETH',
        direction: tx.direction,
        date: 'Récemment', // Alchemy ne donne pas la date exacte sans appel sup, on simplifie
        status: 'success',
        from: tx.from,
        to: tx.to
      }));

      setHistory(formattedHistory);
    } catch (e) {
      console.error("History Error", e);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) { router.push('/login'); return; }

        const uid = currentUser.uid;
        const storageKey = `malin_user_${uid}`;
        const storedData = localStorage.getItem(storageKey);

        if (!storedData) { router.push('/onboarding'); return; }

        try {
          const userData = JSON.parse(storedData) as UserProfile;
          setUser(userData);
          const activeWallet = userData.wallets.find(w => w.id === userData.activeWalletId) || userData.wallets[0];
          
          if (activeWallet && activeWallet.address) {
            const livePrices = await fetchPrices();
            const ethPrice = livePrices.ethereum?.usd || 0;
            const ethBalStr = await ChainService.getNativeBalance(activeWallet.address);
            const ethBalance = parseFloat(ethBalStr);
            const tokens = await ChainService.getTokenBalances(activeWallet.address);

            // Charger l'historique en arrière-plan
            fetchHistory(activeWallet.address);

            const ethAsset: Asset = {
              id: 'eth', symbol: 'ETH', name: 'Ethereum', balance: ethBalance,
              price: ethPrice, change24h: 0, chain: 'ETH', color: '#627eea', decimals: 18, contractAddress: ''
            } as any;

            setAssets([ethAsset, ...tokens]);
            // Calcul du total avec le prix réel
            setTotalBalance((ethBalance * ethPrice));
          }
        } catch (e) { toast.error("Erreur de chargement"); } finally { setLoading(false); }
      });
    };
    initDashboard();
  }, [router]);

  const handleBuyCrypto = () => {
    const address = user?.wallets[0]?.address || '';
    const affiliateID = '9817a72d5f2caf'; 
    window.open(`https://changenow.io/exchange?from=eur&to=eth&amount=50&recipient=${address}&link_id=${affiliateID}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copié !");
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
    );
  }

  const activeAddress = user?.wallets.find(w => w.id === user?.activeWalletId)?.address || "";
  const walletName = user?.wallets.find(w => w.id === user?.activeWalletId)?.name || "Main Wallet";

  return (
    <div className="space-y-6 relative pb-32 md:pb-10 pt-2 min-h-screen bg-[#020617]">
       <ToastContainer theme="dark" position="top-center" />

       {/* HEADER */}
       <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/10">
                {walletName[0].toUpperCase()}
             </div>
             <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Compte Actif</p>
                <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                   <p className="text-white font-bold text-sm">{walletName}</p>
                   <ChevronDown size={14} className="text-slate-500" />
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => router.push('/scan')} className="p-2.5 bg-white/5 rounded-full text-slate-300 hover:text-white border border-white/5 active:scale-95 transition"><ScanLine size={20} /></button>
             <button onClick={() => router.push('/notifications')} className="p-2.5 bg-white/5 rounded-full text-slate-300 hover:text-white border border-white/5 active:scale-95 transition relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#020617]"></span>
             </button>
             <button onClick={() => router.push('/settings')} className="p-2.5 bg-white/5 rounded-full text-slate-300 hover:text-white border border-white/5 active:scale-95 transition"><Settings size={20} /></button>
          </div>
       </div>

       {/* BALANCE CARD */}
       <div className="mx-2 bg-gradient-to-br from-indigo-600/20 to-purple-900/40 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col items-center text-center">
             <p className="text-indigo-200 text-sm font-medium mb-1">Solde Total</p>
             <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter">
               ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h1>
             <div 
                onClick={() => copyToClipboard(activeAddress)}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs text-indigo-200 cursor-pointer hover:bg-white/20 transition mb-8"
             >
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)} <Copy size={10} />
             </div>

             <div className="grid grid-cols-4 gap-4 w-full">
                {/* Actions Principales */}
                <button onClick={() => router.push('/swap')} className="flex flex-col items-center gap-2 group">
                   <div className="w-14 h-14 bg-white text-indigo-950 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition">
                      <RefreshCw size={24} />
                   </div>
                   <span className="text-xs text-white font-medium">Swap</span>
                </button>
                <button onClick={() => setShowReceiveModal(true)} className="flex flex-col items-center gap-2 group">
                   <div className="w-14 h-14 bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition">
                      <ArrowDownLeft size={24} />
                   </div>
                   <span className="text-xs text-white font-medium">Reçu</span>
                </button>
                <button onClick={() => toast.info("Envoyer: Bientôt disponible")} className="flex flex-col items-center gap-2 group">
                   <div className="w-14 h-14 bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition">
                      <Send size={24} />
                   </div>
                   <span className="text-xs text-white font-medium">Envoi</span>
                </button>
                <button onClick={handleBuyCrypto} className="flex flex-col items-center gap-2 group">
                   <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-active:scale-95 transition">
                      <Plus size={24} />
                   </div>
                   <span className="text-xs text-white font-medium">Achat</span>
                </button>
             </div>
          </div>
       </div>

       {/* --- ONGLETS (TABS) --- */}
       <div className="px-4">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-4">
             <button 
               onClick={() => setActiveTab('tokens')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'tokens' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
                <Coins size={16} /> Jetons
             </button>
             <button 
               onClick={() => setActiveTab('activity')}
               className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'activity' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
                <History size={16} /> Activité
             </button>
          </div>

          {/* CONTENU ONGLETS */}
          <div className="pb-24 min-h-[300px]">
            {activeTab === 'tokens' ? (
                /* LISTE DES JETONS */
                <div className="space-y-3">
                    {assets.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-700 rounded-2xl">
                        <p className="text-slate-400 text-sm">Aucun actif trouvé.</p>
                        <button onClick={handleBuyCrypto} className="text-indigo-400 text-sm mt-2 font-bold">Acheter maintenant</button>
                    </div>
                    ) : (
                    assets.map((asset, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                    {asset.symbol === 'ETH' ? <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" className="w-6 h-6" /> : <span className="font-bold text-slate-400 text-xs">{asset.symbol[0]}</span>}
                                </div>
                                <div>
                                    <p className="font-bold text-white">{asset.name}</p>
                                    <p className="text-xs text-slate-400">{asset.balance.toFixed(4)} {asset.symbol}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-white">${(asset.balance * asset.price).toFixed(2)}</p>
                                <p className="text-xs text-slate-500">${asset.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))
                    )}
                </div>
            ) : (
                /* LISTE HISTORIQUE (NOUVEAU) */
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                            <History size={48} className="mb-4 opacity-20" />
                            <p>Aucune transaction récente</p>
                        </div>
                    ) : (
                        history.map((tx, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-white/5 transition cursor-pointer"
                                onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.direction === 'in' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                                        {tx.direction === 'in' ? <ArrowIn size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{tx.direction === 'in' ? 'Reçu' : 'Envoyé'}</p>
                                        <p className={`text-xs ${tx.status === 'success' ? 'text-green-500' : 'text-amber-500'}`}>{tx.status}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${tx.direction === 'in' ? 'text-green-400' : 'text-white'}`}>
                                        {tx.direction === 'in' ? '+' : '-'}{tx.value.toFixed(4)} {tx.asset}
                                    </p>
                                    <p className="text-xs text-slate-500">{tx.date}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
          </div>
       </div>

       {/* MODAL RECEIVE */}
       {showReceiveModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center">
                <button onClick={() => setShowReceiveModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-2">Recevoir</h2>
                <div className="bg-white p-4 rounded-2xl mx-auto w-fit mb-6 shadow-xl shadow-white/5">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${activeAddress}`} alt="QR Code" className="w-48 h-48 rounded-lg" />
                </div>
                <div onClick={() => copyToClipboard(activeAddress)} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer">
                    <p className="text-slate-300 text-xs truncate font-mono flex-1 text-left">{activeAddress}</p>
                    <Copy size={16} className="text-indigo-400" />
                </div>
            </div>
         </div>
       )}
    </div>
  );
}

