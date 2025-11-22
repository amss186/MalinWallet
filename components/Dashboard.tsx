
import React, { useState, useEffect, useCallback } from 'react';
import { Send, ArrowDown, Plus, Trash2, Sparkles, ArrowRightLeft, ChevronDown, RefreshCw, Eye, EyeOff, Image, Clock, Wallet, ShieldCheck, TrendingUp, Zap, MoveUpRight } from 'lucide-react';
import WalletCard from './WalletCard.tsx';
import { Asset, Transaction, UserProfile, Network, NFT } from '../types.ts';
import { StorageService } from '../services/storageService.ts';
import { ChainService } from '../services/chainService.ts';
import { TRANSLATIONS } from '../constants.ts';
import BuyModal from './BuyModal.tsx';

interface DashboardProps {
  user: UserProfile;
  assets: Asset[];
  transactions: Transaction[];
  totalBalance: number;
  portfolioSummary: string;
  onSend: () => void;
  onReceive: () => void;
  onAddAsset: () => void;
  onDeleteAsset: (id: string) => void;
}

type Tab = 'tokens' | 'nfts' | 'activity';

const Dashboard: React.FC<DashboardProps> = ({
  user,
  assets,
  transactions,
  portfolioSummary,
  onSend,
  onReceive,
  onAddAsset,
  onDeleteAsset
}) => {
  const [networks] = useState<Network[]>(StorageService.getNetworks());
  const [currentNetwork, setCurrentNetwork] = useState(networks[0]);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [realBalance, setRealBalance] = useState<string>('0.0000');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<Tab>('tokens');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  const t = TRANSLATIONS[user.language] || TRANSLATIONS.en;

  // Ticker Animation State
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerItems = [
    { icon: <Zap size={14} className="text-amber-400"/>, text: "Gas: 12 Gwei (Low)", color: "bg-amber-500/10 text-amber-400" },
    { icon: <TrendingUp size={14} className="text-emerald-400"/>, text: "Market: Bullish +2.4%", color: "bg-emerald-500/10 text-emerald-400" },
    { icon: <ShieldCheck size={14} className="text-indigo-400"/>, text: "Malin Shield: Active", color: "bg-indigo-500/10 text-indigo-400" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchRealBalance = useCallback(async () => {
    const activeWallet = user.wallets.find(w => w.id === user.activeWalletId);
    if (activeWallet && currentNetwork.rpcUrl) {
      setIsLoadingBalance(true);
      try {
          const bal = await ChainService.getBalance(activeWallet.address, currentNetwork.rpcUrl);
          setRealBalance(bal);
          
          if (activeTab === 'nfts') {
            setLoadingNFTs(true);
            const nftData = await ChainService.getNFTs(activeWallet.address, currentNetwork.id);
            setNfts(nftData);
            setLoadingNFTs(false);
          }
      } catch (e) {
          console.error(e);
          // Ne pas remettre à zéro en cas d'erreur réseau, garder le cache si possible ou 0
      } finally {
          setIsLoadingBalance(false);
      }
    }
  }, [currentNetwork, user.activeWalletId, activeTab]);

  useEffect(() => {
    fetchRealBalance();
  }, [fetchRealBalance]);

  const displayBalance = parseFloat(realBalance) || 0;

  // SVG Graph Path (Simulated Curve for aesthetic)
  const graphPath = "M0,100 C50,100 50,60 100,60 C150,60 150,90 200,90 C250,90 250,40 300,30 C350,20 350,50 400,40 L400,120 L0,120 Z";
  const linePath = "M0,100 C50,100 50,60 100,60 C150,60 150,90 200,90 C250,90 250,40 300,30 C350,20 350,50 400,40";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <BuyModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-6">
         
         {/* Network Selector */}
         <div className="relative z-30">
            <button 
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className="glass-button flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition shadow-lg"
            >
              <div className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${currentNetwork.isTestnet ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}></div>
              {currentNetwork.name}
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showNetworkMenu ? 'rotate-180' : ''}`} />
            </button>

            {showNetworkMenu && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 origin-top-left">
                <div className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-black/40">Select Network</div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {networks.map(net => (
                    <button
                      key={net.id}
                      onClick={() => { setCurrentNetwork(net); setShowNetworkMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-xs font-medium flex items-center justify-between hover:bg-white/5 transition ${currentNetwork.id === net.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'}`}
                    >
                      <span className="flex items-center gap-3">
                         <img src={`https://assets.coincap.io/assets/icons/${net.symbol.toLowerCase()}@2x.png`} 
                              onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/20'} 
                              className="w-5 h-5 rounded-full" alt="" />
                         {net.name}
                      </span>
                      {currentNetwork.id === net.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
         </div>
         
         {/* Dynamic Ticker */}
         <div className="hidden md:flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-white/5 transition-all duration-500 ${tickerItems[tickerIndex].color}`}>
               {tickerItems[tickerIndex].icon}
               {tickerItems[tickerIndex].text}
            </div>
         </div>

         {/* Address Pill */}
         <div className="text-[10px] font-mono text-slate-300 glass-button px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:text-white transition shadow-lg">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           {user.wallets.find(w => w.id === user.activeWalletId)?.address.slice(0,6)}...
           {user.wallets.find(w => w.id === user.activeWalletId)?.address.slice(-4)}
         </div>
      </div>

      {/* HOLOGRAPHIC BALANCE CARD */}
      <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-[#0B1121] border border-white/10 shadow-2xl shadow-indigo-900/20 group">
         {/* Animated Background Effects */}
         <div className="absolute top-[-50%] right-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] group-hover:bg-indigo-600/30 transition-all duration-1000"></div>
         <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px]"></div>
         
         <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-2 w-full md:w-auto">
               <div className="flex items-center gap-4 mb-4">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-widest opacity-80">{t.dashboard.realBalance}</span>
                  <button onClick={() => setIsBalanceHidden(!isBalanceHidden)} className="text-slate-500 hover:text-white transition p-1 rounded hover:bg-white/5">
                    {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={fetchRealBalance} 
                    disabled={isLoadingBalance}
                    className={`text-indigo-400 hover:text-white transition p-1 rounded hover:bg-indigo-500/20 ${isLoadingBalance ? 'opacity-50' : ''}`}
                    title="Actualiser le solde"
                  >
                     <RefreshCw className={isLoadingBalance ? "animate-spin" : ""} size={16}/>
                  </button>
               </div>

               <div className="flex items-baseline gap-2">
                 <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400 tracking-tighter drop-shadow-2xl">
                   {isBalanceHidden ? '••••••' : realBalance}
                 </h1>
                 <span className="text-2xl font-bold text-slate-500">{currentNetwork.symbol}</span>
               </div>
               
               <div className="flex items-center gap-3 mt-2">
                 <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                   <TrendingUp size={14} /> +2.45%
                 </div>
                 <span className="text-slate-400 font-medium">
                   ≈ {isBalanceHidden ? '••••' : (displayBalance * 2500).toLocaleString(undefined, {style: 'currency', currency: user.currency})}
                 </span>
               </div>
            </div>

            {/* Quick Actions Floating Capsules */}
            <div className="flex gap-3 w-full md:w-auto">
               <button onClick={onSend} className="flex-1 md:flex-none group/btn relative overflow-hidden bg-white text-slate-950 px-6 py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1s_infinite]"></div>
                  <div className="flex flex-col items-center gap-1">
                     <MoveUpRight size={24} />
                     <span className="text-xs">{t.dashboard.send}</span>
                  </div>
               </button>
               <button onClick={onReceive} className="flex-1 md:flex-none group/btn relative overflow-hidden bg-slate-800/50 border border-white/10 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 hover:scale-105 transition-all duration-300 backdrop-blur-md">
                  <div className="flex flex-col items-center gap-1">
                     <ArrowDown size={24} className="text-indigo-400" />
                     <span className="text-xs">{t.dashboard.receive}</span>
                  </div>
               </button>
               <button onClick={() => setIsBuyModalOpen(true)} className="flex-1 md:flex-none group/btn relative overflow-hidden bg-slate-800/50 border border-white/10 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 hover:scale-105 transition-all duration-300 backdrop-blur-md">
                  <div className="flex flex-col items-center gap-1">
                     <Plus size={24} className="text-purple-400" />
                     <span className="text-xs">{t.dashboard.buy}</span>
                  </div>
               </button>
            </div>
         </div>

         {/* Vector Chart overlay at bottom */}
         <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-30">
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
               <defs>
                 <linearGradient id="gradGraph" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                 </linearGradient>
               </defs>
               <path d={graphPath} fill="url(#gradGraph)" />
               <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
         </div>
      </div>

      {/* Security Shield Bar */}
      <div className="glass-panel rounded-2xl p-3 flex items-center justify-between px-6 animate-in slide-in-from-left-4 duration-700">
         <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={20} />
            <span className="text-sm text-slate-300 font-medium">Malin AI Shield is active. No threats detected.</span>
         </div>
         <button className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition">
           System Healthy
         </button>
      </div>

      {/* Tabs & Content */}
      <div className="mt-10">
        <div className="flex items-center gap-6 border-b border-white/5 mb-8 pb-1 px-2 overflow-x-auto">
          <button onClick={() => setActiveTab('tokens')} className={`pb-3 text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'tokens' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'}`}>
             <Wallet size={16}/> {t.dashboard.tokens}
          </button>
          <button onClick={() => setActiveTab('nfts')} className={`pb-3 text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'nfts' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'}`}>
             <Image size={16}/> {t.dashboard.nfts}
          </button>
          <button onClick={() => setActiveTab('activity')} className={`pb-3 text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'activity' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'}`}>
             <Clock size={16}/> {t.dashboard.activity}
          </button>
        </div>

        {activeTab === 'tokens' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {assets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Main Chain Card */}
                <WalletCard asset={{
                    id: 'native',
                    name: currentNetwork.name,
                    symbol: currentNetwork.symbol,
                    balance: parseFloat(realBalance) || 0,
                    price: 2500,
                    change24h: 1.2,
                    chain: 'ETH',
                    color: '#627EEA'
                }} />
                
                {assets.filter(a => a.id !== 'eth').map(asset => (
                  <div key={asset.id} className="relative group">
                    <WalletCard asset={asset} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white/50 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-rose-500 hover:text-white backdrop-blur-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Add Token Button Card */}
                <button 
                  onClick={onAddAsset}
                  className="rounded-[2rem] border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/20 hover:bg-indigo-500/5 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 transition-all duration-300 min-h-[180px] group"
                >
                   <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition">
                     <Plus size={24} />
                   </div>
                   <span className="font-bold text-sm">Import Token</span>
                </button>
              </div>
            ) : (
               <div className="text-center py-12">
                 <p className="text-slate-500">Aucun actif trouvé.</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             {loadingNFTs ? (
               <div className="p-20 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-4 text-indigo-500" size={32} /> Loading your collectibles...</div>
             ) : nfts.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                 {nfts.map((nft, i) => (
                   <div key={i} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition group shadow-2xl hover:-translate-y-2 duration-300">
                      <div className="aspect-square bg-slate-800 relative overflow-hidden">
                        {nft.media?.[0]?.gateway ? (
                          <img src={nft.media[0].gateway} alt={nft.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950"><Image size={32}/></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                           <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-2 rounded-xl text-xs font-bold hover:bg-white hover:text-black transition">View Details</button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900">
                        <h4 className="font-bold text-white text-sm truncate">{nft.title || `NFT #${nft.id.tokenId.slice(0,4)}`}</h4>
                        <p className="text-[10px] text-slate-500 truncate font-mono mt-1 uppercase tracking-wide">{nft.contract.address.slice(0,6)}...{nft.contract.address.slice(-4)}</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-12 border-2 border-dashed border-slate-800 rounded-3xl text-center bg-slate-900/20">
                 <Image size={48} className="mx-auto text-slate-700 mb-4" />
                 <p className="text-slate-500 text-sm font-medium">Aucun NFT détecté.</p>
                 <p className="text-xs text-slate-600 mt-1">Vos trésors numériques apparaîtront ici.</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="animate-in slide-in-from-bottom-4 duration-500">
             {transactions.length > 0 ? (
               <div className="glass-panel rounded-[2rem] overflow-hidden p-2">
                 {transactions.map((tx, idx) => (
                   <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 rounded-2xl transition cursor-pointer group">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                           tx.type === 'receive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                           tx.type === 'send' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                         }`}>
                           {tx.type === 'receive' ? <ArrowDown size={20} /> : tx.type === 'send' ? <Send size={20} /> : <ArrowRightLeft size={20} />}
                         </div>
                         <div>
                           <p className="font-bold text-white capitalize text-sm">{tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Swapped'}</p>
                           <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${tx.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.type === 'send' ? '-' : '+'}{isBalanceHidden ? '***' : tx.amount} {tx.asset}
                        </p>
                        <p className="text-[10px] text-slate-500 bg-black/30 px-2 py-0.5 rounded-full inline-block mt-1 border border-white/5">{tx.status}</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center p-20 bg-slate-900/20 rounded-[2.5rem] border border-slate-800">
                 <Clock size={48} className="mx-auto text-slate-700 mb-4" />
                 <p className="text-slate-500 text-sm font-medium">Transaction history is empty.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
