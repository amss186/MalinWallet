
import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Globe, ExternalLink, Lock, ChevronLeft, ChevronRight, RotateCw, X, Plus, LayoutTemplate, History, Star, Zap, ShieldCheck, ScanLine } from 'lucide-react';
import { UserProfile, DAppHistoryItem } from '../types';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS } from '../constants';

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  icon?: string;
  isLoading: boolean;
}

interface DAppsViewProps {
  onWalletConnect?: (uri: string) => void;
}

const FEATURED_DAPPS = [
  { name: 'Pulse AI Lab', url: 'https://pulseailab.me', category: 'AI', risk: 'Low', desc: 'Advanced AI Analytics', color: 'from-purple-500 to-indigo-600' },
  { name: 'Uniswap', url: 'https://app.uniswap.org', category: 'DeFi', risk: 'Low', desc: 'Swap tokens', color: 'from-pink-500 to-rose-500' },
  { name: 'OpenSea', url: 'https://opensea.io', category: 'NFT', risk: 'Low', desc: 'NFT Marketplace', color: 'from-blue-400 to-blue-600' },
  { name: 'Aave', url: 'https://app.aave.com', category: 'Lending', risk: 'Low', desc: 'Earn interest', color: 'from-teal-400 to-emerald-600' },
  { name: 'Lido', url: 'https://lido.fi', category: 'Staking', risk: 'Low', desc: 'Liquid Staking', color: 'from-orange-400 to-red-500' },
  { name: 'Curve', url: 'https://curve.fi', category: 'DeFi', risk: 'Low', desc: 'Stablecoin Exchange', color: 'from-slate-500 to-slate-700' },
];

const DAppsView: React.FC<DAppsViewProps> = ({ onWalletConnect }) => {
  const user = StorageService.getUser();
  const t = user ? (TRANSLATIONS[user.language] || TRANSLATIONS.en) : TRANSLATIONS.en;

  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: 'tab-1', url: '', title: t.browser.newTab, isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [showTabsOverview, setShowTabsOverview] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'safe'>('idle');
  
  // WalletConnect State
  const [isWCInputOpen, setIsWCInputOpen] = useState(false);
  const [wcUri, setWcUri] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTabId, activeTab.url]);

  const createTab = (url: string = '') => {
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      url,
      title: url ? new URL(url).hostname : t.browser.newTab,
      isLoading: !!url
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setShowTabsOverview(false);
    if (url) navigate(newTab.id, url);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      createTab(''); // Ensure one tab exists
    } else {
      setTabs(newTabs);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
  };

  const navigate = (tabId: string, urlStr: string) => {
    let finalUrl = urlStr;
    if (!urlStr.startsWith('http') && urlStr.includes('.')) {
      finalUrl = 'https://' + urlStr;
    } else if (!urlStr.startsWith('http')) {
       // Search
       finalUrl = `https://www.google.com/search?q=${encodeURIComponent(urlStr)}`;
    }

    setScanStatus('scanning');
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, url: finalUrl, title: finalUrl, isLoading: true } : t));
    
    // Simulate AI Scan & Loading
    setTimeout(() => {
      setScanStatus('safe');
      setTabs(prev => prev.map(t => t.id === tabId ? { 
        ...t, 
        isLoading: false, 
        title: finalUrl.includes('http') ? new URL(finalUrl).hostname : 'Search' 
      } : t));
      
      setTimeout(() => setScanStatus('idle'), 2000);
    }, 1500);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate(activeTabId, urlInput);
    }
  };

  const handleConnectWC = () => {
    if (wcUri && onWalletConnect) {
      onWalletConnect(wcUri);
      setIsWCInputOpen(false);
      setWcUri('');
    }
  };

  const renderTabsOverview = () => (
    <div className="absolute inset-0 z-50 bg-[#0f172a]/95 backdrop-blur-2xl p-6 animate-in slide-in-from-bottom-10">
       <div className="flex justify-between items-center mb-8">
         <h2 className="text-2xl font-bold text-white">{t.browser.tabs} ({tabs.length})</h2>
         <div className="flex gap-3">
            <button onClick={() => setShowTabsOverview(false)} className="text-slate-400 hover:text-white font-medium">Done</button>
         </div>
       </div>
       <div className="grid grid-cols-2 gap-6 overflow-y-auto max-h-[75vh] p-2">
         {tabs.map(tab => (
           <div 
             key={tab.id} 
             onClick={() => { setActiveTabId(tab.id); setShowTabsOverview(false); }}
             className={`relative aspect-[3/4] rounded-3xl border p-4 flex flex-col transition-all duration-300 group cursor-pointer shadow-2xl ${activeTabId === tab.id ? 'border-indigo-500 bg-slate-800 scale-105' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
           >
             <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden mb-3 relative border border-white/5">
                <div className="w-full h-3 bg-slate-800 mb-2 flex items-center px-1 gap-1">
                   <div className="w-1 h-1 rounded-full bg-red-500"></div>
                   <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                   <div className="w-1 h-1 rounded-full bg-green-500"></div>
                </div>
                <div className="p-2">
                    <div className="w-full h-2 bg-slate-800 rounded mb-2 opacity-50"></div>
                    <div className="w-2/3 h-2 bg-slate-800 rounded opacity-30"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 overflow-hidden">
                  {tab.url ? <Globe size={12} className="text-indigo-400 shrink-0"/> : <Plus size={12} className="text-slate-400 shrink-0"/>}
                  <span className="text-xs text-white font-bold truncate">{tab.title || 'New Tab'}</span>
               </div>
               <button onClick={(e) => closeTab(tab.id, e)} className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition">
                 <X size={12} />
               </button>
             </div>
           </div>
         ))}
         
         <button onClick={() => createTab('')} className="aspect-[3/4] rounded-3xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-900/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 transition">
            <Plus size={32} />
            <span className="font-bold text-sm">New Tab</span>
         </button>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-[#0f172a] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 relative animate-in zoom-in-95 duration-500">
      {showTabsOverview && renderTabsOverview()}
      
      {/* WalletConnect UI Overlay */}
      {isWCInputOpen && (
         <div className="absolute top-20 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-indigo-500 shadow-2xl animate-in fade-in slide-in-from-top-5">
            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                 <ScanLine size={18} /> WalletConnect v2
               </div>
               <button onClick={() => setIsWCInputOpen(false)}><X size={18} className="text-slate-400"/></button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Paste a WalletConnect URI (wc:...) to connect to a DApp.</p>
            <div className="flex gap-2">
               <input 
                 value={wcUri}
                 onChange={e => setWcUri(e.target.value)}
                 placeholder="wc:8a5e5bd..." 
                 className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 text-xs text-white"
               />
               <button onClick={handleConnectWC} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Connect</button>
            </div>
         </div>
      )}

      {/* AI Security Scan Overlay */}
      {scanStatus === 'scanning' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-indigo-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-bold border border-indigo-500 shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in">
           <RotateCw className="animate-spin text-indigo-300" size={14} />
           <span>Malin AI is scanning smart contracts...</span>
        </div>
      )}
      {scanStatus === 'safe' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-emerald-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs font-bold border border-emerald-500 shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in animate-out fade-out duration-1000 delay-1000">
           <ShieldCheck className="text-emerald-300" size={14} />
           <span>Safe. No malicious code detected.</span>
        </div>
      )}

      {/* Modern Browser Header */}
      <div className="bg-[#0b1121] p-3 flex items-center gap-3 border-b border-slate-800 z-20">
        <button 
           onClick={() => setIsWCInputOpen(!isWCInputOpen)}
           className="w-10 h-10 flex items-center justify-center bg-indigo-600/10 hover:bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30 transition"
           title="WalletConnect"
        >
           <ScanLine size={18} />
        </button>
        <div className="flex-1 bg-slate-800/50 rounded-2xl h-10 flex items-center px-4 relative group focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/50 transition border border-slate-700/50">
          <div className="text-slate-400 mr-3">
            {activeTab.url.startsWith('https') ? <Lock size={14} className="text-emerald-400" /> : <Search size={16}/>}
          </div>
          <input 
            className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-500 font-medium"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t.browser.searchPlaceholder}
            onFocus={(e) => e.target.select()}
          />
          {activeTab.isLoading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ml-2"></div>}
        </div>
        <button 
          onClick={() => setShowTabsOverview(true)}
          className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-800/50 rounded-xl text-sm font-bold text-white hover:bg-slate-700 transition shadow-lg"
        >
          {tabs.length}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#020617] relative">
        {activeTab.url ? (
          <>
             {activeTab.isLoading && (
               <div className="absolute top-0 left-0 w-full h-1 bg-indigo-900/50 overflow-hidden z-20">
                 <div className="w-1/3 h-full bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-loading-bar"></div>
               </div>
             )}
             <iframe 
               src={activeTab.url} 
               className="w-full h-full border-0 bg-white"
               sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
               title="Web3 Browser"
             />
             <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl text-white px-4 py-2 flex justify-between items-center border-t border-white/5 text-[10px] font-medium">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck size={12} />
                  <span>Encrypted Connection</span>
                </div>
                <a 
                  href={activeTab.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  External <ExternalLink size={10} />
                </a>
             </div>
          </>
        ) : (
          /* New Tab - App Store Style */
          <div className="h-full overflow-y-auto p-6 pb-24 custom-scrollbar">
             <div className="flex flex-col items-center justify-center mt-8 mb-12">
               <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-4">
                 <Globe size={32} className="text-white" />
               </div>
               <h2 className="text-3xl font-bold text-white">Malin Browser</h2>
               <p className="text-slate-400 text-sm mt-1 font-medium">Explore the Decentralized Web Safely</p>
             </div>
             
             {/* Quick Actions */}
             <div className="flex gap-3 mb-8 justify-center">
                <button onClick={() => setIsWCInputOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                  <ScanLine size={16} className="text-indigo-400" /> WalletConnect
                </button>
             </div>

             <div className="flex items-center gap-2 mb-4">
               <Zap size={16} className="text-amber-400 fill-amber-400" />
               <h3 className="text-white font-bold text-sm uppercase tracking-wide">Featured DApps</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-10">
               {FEATURED_DAPPS.map((dapp, idx) => (
                 <div 
                   key={idx}
                   onClick={() => navigate(activeTabId, dapp.url)}
                   className="bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-800 p-4 rounded-2xl cursor-pointer transition group relative overflow-hidden"
                 >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${dapp.color}`}></div>
                    <div className="flex items-start justify-between mb-3">
                       <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dapp.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                         {dapp.name[0]}
                       </div>
                       <div className="bg-black/30 px-2 py-1 rounded text-[10px] text-slate-300 font-medium border border-white/5">{dapp.category}</div>
                    </div>
                    <h4 className="text-white font-bold text-sm group-hover:text-indigo-300 transition">{dapp.name}</h4>
                    <p className="text-slate-500 text-xs mt-1">{dapp.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Controls */}
      <div className="bg-[#0b1121] p-3 flex justify-between items-center border-t border-slate-800 pb-safe px-8">
         <button onClick={() => window.history.back()} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"><ChevronLeft size={24} /></button>
         <button onClick={() => createTab('')} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 transition hover:scale-110 active:scale-95">
           <Plus size={24} />
         </button>
         <button onClick={() => window.history.forward()} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"><ChevronRight size={24} /></button>
      </div>
    </div>
  );
};

export default DAppsView;
    