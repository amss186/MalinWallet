'use client';

import React, { useEffect, useState } from 'react';
import { ChainService } from '@/lib/chain';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Asset, UserProfile } from '@/types';
import { 
  Send, 
  ArrowDownLeft, 
  RefreshCw, 
  Plus, 
  Copy, 
  TrendingUp, 
  Wallet, 
  X,
  Bell,
  Settings,
  ScanLine,
  ChevronDown
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({ ethereum: 0, solana: 0 });

  // Modals States
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const router = useRouter();

  // 1. CHARGEMENT DES PRIX
  const fetchPrices = async () => {
    try {
        const apiKey = 'CG-QusUvyf714GG4pRWoCpyFmyy'; 
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        setPrices({
            ethereum: data.ethereum?.usd || 0,
            solana: data.solana?.usd || 0
        });
        return data;
    } catch (e) {
        console.error("Erreur prix:", e);
        return { ethereum: 3600, solana: 150 };
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          router.push('/login');
          return;
        }

        const uid = currentUser.uid;
        const storageKey = `malin_user_${uid}`;
        const storedData = localStorage.getItem(storageKey);

        if (!storedData) {
          router.push('/onboarding');
          return;
        }

        try {
          const userData = JSON.parse(storedData) as UserProfile;
          setUser(userData);

          const activeWallet = userData.wallets.find(w => w.id === userData.activeWalletId) || userData.wallets[0];
          
          if (activeWallet && activeWallet.address) {
            
            const livePrices = await fetchPrices();
            const ethPrice = livePrices.ethereum?.usd || 0;

            const ethBalStr = await ChainService.getNativeBalance(activeWallet.address);
            const ethBalance = parseFloat(ethBalStr);

            let solBalance = 0; 
            // const solBalStr = await ChainService.getSolanaBalance(activeWallet.solanaAddress); 

            const tokens = await ChainService.getTokenBalances(activeWallet.address);

            const ethAsset: Asset = {
              id: 'eth',
              symbol: 'ETH',
              name: 'Ethereum',
              balance: ethBalance,
              price: ethPrice,
              change24h: 0,
              chain: 'ETH',
              color: '#627eea',
              decimals: 18,
              contractAddress: ''
            } as any;

            const allAssets = [ethAsset, ...tokens];
            setAssets(allAssets);

            let total = (ethBalance * ethPrice) + (solBalance * (livePrices.solana?.usd || 0));
            setTotalBalance(total);
          }
        } catch (e) {
          console.error(e);
          toast.error("Erreur de chargement");
        } finally {
          setLoading(false);
        }
      });
    };

    initDashboard();
  }, [router]);

  // FONCTION ACHAT (Affiliation)
  const handleBuyCrypto = () => {
    const address = user?.wallets[0]?.address || '';
    const affiliateID = '9817a72d5f2caf'; 
    const buyUrl = `https://changenow.io/exchange?from=eur&to=eth&amount=50&recipient=${address}&link_id=${affiliateID}`;
    window.open(buyUrl, '_blank');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copié !");
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        </div>
    );
  }

  const activeAddress = user?.wallets.find(w => w.id === user?.activeWalletId)?.address || "";
  const walletName = user?.wallets.find(w => w.id === user?.activeWalletId)?.name || "Main Wallet";

  return (
    <div className="space-y-6 relative pb-32 md:pb-10 pt-2">
       <ToastContainer theme="dark" position="top-center" />

       {/* --- NOUVEAU HEADER MOBILE (Top Bar) --- */}
       <div className="flex items-center justify-between px-2">
          {/* Gauche: Info User */}
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 ring-2 ring-white/10">
                {walletName[0].toUpperCase()}
             </div>
             <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Compte Actif</p>
                <div className="flex items-center gap-1">
                   <p className="text-white font-bold text-sm">{walletName}</p>
                   <ChevronDown size={14} className="text-slate-500" />
                </div>
             </div>
          </div>

          {/* Droite: Actions (Scan, Notif, Settings) */}
          <div className="flex items-center gap-2">
             <button 
                onClick={() => router.push('/scan')}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition border border-white/5 active:scale-95"
             >
                <ScanLine size={20} />
             </button>
             <button 
                onClick={() => router.push('/notifications')}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition border border-white/5 active:scale-95 relative"
             >
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#020617]"></span>
             </button>
             <button 
                onClick={() => router.push('/settings')}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition border border-white/5 active:scale-95"
             >
                <Settings size={20} />
             </button>
          </div>
       </div>

       {/* --- CARTE SOLDE (Balance Card) --- */}
       <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-md shadow-2xl mx-1">
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-2">
                    <p className="text-indigo-200 font-medium text-sm">Valeur Totale</p>
                    <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp size={10} /> +2.4%
                    </div>
                 </div>
                 <button onClick={() => copyToClipboard(activeAddress)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-lg text-indigo-200 transition backdrop-blur-md">
                    <Copy size={12} /> {activeAddress.slice(0, 4)}...{activeAddress.slice(-4)}
                 </button>
             </div>
             
             <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
               ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h1>
             <div className="flex gap-4 text-slate-400 text-xs sm:text-sm mb-8 font-mono">
                <p>ETH: <span className="text-indigo-300">${prices.ethereum.toLocaleString()}</span></p>
                <p>SOL: <span className="text-purple-300">${prices.solana.toLocaleString()}</span></p>
             </div>

             <div className="grid grid-cols-3 gap-3">
                <button onClick={() => router.push('/swap')} className="flex flex-col items-center justify-center gap-2 bg-white text-indigo-950 h-16 sm:h-20 rounded-2xl font-bold hover:bg-indigo-50 transition shadow-lg shadow-white/5 active:scale-95">
                   <Send size={22} /> <span className="text-[10px] sm:text-xs">Envoyer</span>
                </button>
                <button onClick={() => setShowReceiveModal(true)} className="flex flex-col items-center justify-center gap-2 bg-white/10 text-white h-16 sm:h-20 rounded-2xl font-bold hover:bg-white/20 transition backdrop-blur-md border border-white/10 active:scale-95">
                   <ArrowDownLeft size={22} /> <span className="text-[10px] sm:text-xs">Recevoir</span>
                </button>
                <button onClick={handleBuyCrypto} className="flex flex-col items-center justify-center gap-2 bg-indigo-600 text-white h-16 sm:h-20 rounded-2xl font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30 active:scale-95">
                   <Plus size={22} /> <span className="text-[10px] sm:text-xs">Acheter</span>
                </button>
             </div>
          </div>
          <div className="absolute right-[-10%] top-[-20%] h-[150%] w-[60%] bg-gradient-to-l from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none blur-3xl rounded-full"></div>
       </div>

       {/* --- LISTE ACTIFS --- */}
       <div className="px-1">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet size={18} className="text-indigo-400"/> Vos Actifs
            </h2>
            <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white">
               <RefreshCw size={16} />
            </button>
         </div>

         <div className="space-y-3 pb-24">
            {assets.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-700 rounded-2xl bg-white/5">
                  <p className="text-slate-400 text-sm">Aucun actif trouvé.</p>
                  <button onClick={handleBuyCrypto} className="text-indigo-400 text-sm mt-2 hover:underline font-bold">
                      Acheter maintenant
                  </button>
              </div>
            ) : (
              assets.map((asset, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition cursor-pointer active:bg-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                         {asset.symbol === 'ETH' ? <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" className="w-5 h-5" /> : <span className="font-bold text-slate-400 text-xs">{asset.symbol[0]}</span>}
                      </div>
                      <div>
                        <p className="font-bold text-white">{asset.name}</p>
                        <p className="text-xs text-slate-400">{asset.balance.toFixed(4)} {asset.symbol}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-white">
                        ${(asset.balance * asset.price).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        ${asset.price.toFixed(2)}
                      </p>
                   </div>
                </div>
              ))
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

