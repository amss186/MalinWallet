'use client';

import React, { useEffect, useState } from 'react';
import { ChainService } from '@/lib/chain';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Asset, UserProfile } from '@/types';
import { 
  Send, ArrowDownLeft, RefreshCw, Plus, Copy, TrendingUp, 
  Wallet, X, Bell, Settings, ScanLine, ChevronDown, 
  History, Coins, ArrowUpRight, ArrowDownLeft as ArrowIn,
  Eye, EyeOff, Globe
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import SendModal from '@/components/SendModal';

const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-white/5 animate-pulse rounded-lg ${className}`} />
);

// --- SELECTEUR RESEAU ---
const NetworkSelector = ({ current, onSelect }: { current: string, onSelect: (n: string) => void }) => {
    const [open, setOpen] = useState(false);
    const networks = [
        { id: 'ETH', name: 'Ethereum', color: 'bg-indigo-500' },
        { id: 'SOL', name: 'Solana', color: 'bg-emerald-500' },
        { id: 'POLYGON', name: 'Polygon', color: 'bg-purple-500' }
    ];

    return (
        <div className="relative z-50">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-white hover:bg-white/20 transition">
                <Globe size={14} /> {networks.find(n => n.id === current)?.name} <ChevronDown size={12} />
            </button>
            {open && (
                <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1 w-40 shadow-2xl animate-in fade-in zoom-in-95">
                    {networks.map(n => (
                        <button 
                            key={n.id}
                            onClick={() => { onSelect(n.id); setOpen(false); }}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left hover:bg-white/10 ${current === n.id ? 'text-white bg-white/5' : 'text-slate-400'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${n.color}`}></div> {n.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface Transaction { hash: string; value: number; asset: string; direction: 'in' | 'out'; date: string; status: 'success' | 'pending'; from: string; to: string; }

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({ ethereum: 0, solana: 0, matic: 0 });
  const [currentNetwork, setCurrentNetwork] = useState('ETH');
  
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [hideBalance, setHideBalance] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const router = useRouter();

  // CHARGEMENT DONNÉES
  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const activeWallet = user.wallets.find(w => w.id === user.activeWalletId) || user.wallets[0];
            const address = activeWallet.address; // ETH par défaut

            // Prix
            const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,matic-network&vs_currencies=usd&x_cg_demo_api_key=CG-QusUvyf714GG4pRWoCpyFmyy`);
            const priceData = await priceRes.json();
            setPrices({ ethereum: priceData.ethereum?.usd || 0, solana: priceData.solana?.usd || 0, matic: priceData['matic-network']?.usd || 0 });

            let balance = 0;
            let price = priceData.ethereum?.usd || 0;

            if (currentNetwork === 'ETH') {
                const bal = await ChainService.getNativeBalance(address, 1);
                balance = parseFloat(bal);
                const tokens = await ChainService.getTokenBalances(address, 1);
                setAssets([{ id: 'eth', symbol: 'ETH', name: 'Ethereum', balance, price, change24h: 0, chain: 'ETH', decimals: 18, contractAddress: '' } as any, ...tokens]);
            } 
            else if (currentNetwork === 'SOL') {
                price = priceData.solana?.usd || 0;
                // ✅ ICI : On utilise l'adresse Solana si elle existe, sinon on avertit
                const solAddress = activeWallet.solanaAddress || address; 
                const bal = await ChainService.getSolanaBalance(solAddress); 
                balance = parseFloat(bal);
                setAssets([{ id: 'sol', symbol: 'SOL', name: 'Solana', balance, price, change24h: 0, chain: 'SOL', decimals: 9, contractAddress: '' } as any]);
            }
            else if (currentNetwork === 'POLYGON') {
                price = priceData['matic-network']?.usd || 0;
                const bal = await ChainService.getNativeBalance(address, 137);
                balance = parseFloat(bal);
                setAssets([{ id: 'matic', symbol: 'MATIC', name: 'Polygon', balance, price, change24h: 0, chain: 'POLYGON', decimals: 18, contractAddress: '' } as any]);
            }

            setTotalBalance(balance * price);
            
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, currentNetwork]);

  useEffect(() => {
      onAuthStateChanged(auth, (u) => {
          if (!u) router.push('/login');
          else {
              const data = localStorage.getItem(`malin_user_${u.uid}`);
              if (data) setUser(JSON.parse(data));
              else router.push('/onboarding');
          }
      });
  }, [router]);

  const handleBuyCrypto = () => {
    const address = user?.wallets[0]?.address || '';
    window.open(`https://changenow.io/exchange?from=eur&to=eth&amount=50&recipient=${address}&link_id=9817a72d5f2caf`, '_blank');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copié !");
  };

  const activeWallet = user?.wallets.find(w => w.id === user?.activeWalletId) || user?.wallets?.[0];
  
  // ✅ LOGIQUE AFFICHAGE ADRESSE INTELLIGENTE
  const displayAddress = (currentNetwork === 'SOL' && activeWallet?.solanaAddress) 
    ? activeWallet.solanaAddress 
    : activeWallet?.address || "";

  return (
    <div className="space-y-6 relative pb-32 md:pb-10 pt-2 min-h-screen bg-[#020617]">
       <ToastContainer theme="dark" position="top-center" />

       {/* HEADER */}
       <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
             <NetworkSelector current={currentNetwork} onSelect={setCurrentNetwork} />
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => router.push('/scan')} className="p-2.5 bg-white/5 rounded-full text-slate-300 hover:text-white border border-white/5 active:scale-95 transition"><ScanLine size={20} /></button>
             <button onClick={() => router.push('/notifications')} className="p-2.5 bg-white/5 rounded-full text-slate-300 hover:text-white border border-white/5 active:scale-95 transition"><Bell size={20} /></button>
             <button onClick={() => router.push('/settings')} className="p-2.5 bg-white/5 rounded-full text-slate-300 hover:text-white border border-white/5 active:scale-95 transition"><Settings size={20} /></button>
          </div>
       </div>

       {/* BALANCE CARD */}
       <div className={`mx-2 bg-gradient-to-br border border-white/10 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl transition-colors duration-500 ${currentNetwork === 'SOL' ? 'from-emerald-900/40 to-teal-900/40' : 'from-indigo-600/20 to-purple-900/40'}`}>
          <div className="relative z-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-2 mb-1 cursor-pointer group" onClick={() => setHideBalance(!hideBalance)}>
                <p className="text-white/60 text-sm font-medium">Solde {currentNetwork}</p>
                {hideBalance ? <EyeOff size={14} className="text-white/40" /> : <Eye size={14} className="text-white/40 group-hover:text-white" />}
             </div>

             {loading ? <Skeleton className="w-48 h-12 mb-2" /> : (
                 <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setHideBalance(!hideBalance)}>
                   {hideBalance ? '•••••••' : `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                 </h1>
             )}

             {/* ✅ ADRESSE DYNAMIQUE (ETH ou SOL) */}
             <div onClick={() => copyToClipboard(displayAddress)} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs text-white/80 cursor-pointer hover:bg-white/20 transition mb-8">
                {displayAddress.slice(0, 4)}...{displayAddress.slice(-4)} <Copy size={10} />
             </div>

             <div className="grid grid-cols-4 gap-4 w-full">
                <button onClick={() => router.push('/swap')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition"><RefreshCw size={24} /></div><span className="text-xs text-white font-medium">Swap</span></button>
                <button onClick={() => setShowReceiveModal(true)} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition"><ArrowDownLeft size={24} /></div><span className="text-xs text-white font-medium">Reçu</span></button>
                <button onClick={() => setShowSendModal(true)} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 bg-white/10 text-white border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition"><Send size={24} /></div><span className="text-xs text-white font-medium">Envoi</span></button>
                <button onClick={handleBuyCrypto} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition"><Plus size={24} /></div><span className="text-xs text-white font-medium">Achat</span></button>
             </div>
          </div>
       </div>

       {/* TABS */}
       <div className="px-4">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-4">
             <button onClick={() => setActiveTab('tokens')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'tokens' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Coins size={16} /> Jetons</button>
             <button onClick={() => setActiveTab('activity')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'activity' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><History size={16} /> Activité</button>
          </div>

          <div className="pb-24 min-h-[300px]">
            {activeTab === 'tokens' ? (
                <div className="space-y-3">
                    {loading ? [1,2].map(i => <Skeleton key={i} className="w-full h-16" />) : assets.length === 0 ? <div className="p-8 text-center border border-dashed border-slate-700 rounded-2xl"><p className="text-slate-400 text-sm">Aucun actif trouvé sur {currentNetwork}.</p></div> : assets.map((asset, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/5"><span className="font-bold text-slate-400 text-xs">{asset.symbol[0]}</span></div>
                                <div><p className="font-bold text-white">{asset.name}</p><p className="text-xs text-slate-400">{hideBalance ? '••••' : asset.balance.toFixed(4)} {asset.symbol}</p></div>
                            </div>
                            <div className="text-right"><p className="font-bold text-white">{hideBalance ? '••••••' : `$${(asset.balance * asset.price).toFixed(2)}`}</p><p className="text-xs text-slate-500">${asset.price.toFixed(2)}</p></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-slate-500 py-10">Aucune transaction récente sur {currentNetwork}.</div>
            )}
          </div>
       </div>

       {/* MODAL RECEIVE */}
       {showReceiveModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center">
                <button onClick={() => setShowReceiveModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full"><X size={20} /></button>
                <h2 className="text-xl font-bold text-white mb-2">Recevoir {currentNetwork}</h2>
                <div className="bg-white p-4 rounded-2xl mx-auto w-fit mb-6 shadow-xl shadow-white/5"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${displayAddress}`} alt="QR Code" className="w-48 h-48 rounded-lg" /></div>
                <div onClick={() => copyToClipboard(displayAddress)} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer"><p className="text-slate-300 text-xs truncate font-mono flex-1 text-left">{displayAddress}</p><Copy size={16} className="text-indigo-400" /></div>
            </div>
         </div>
       )}

       <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} activeWallet={activeWallet} ethPrice={prices.ethereum} />
    </div>
  );
}


