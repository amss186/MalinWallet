
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  Sparkles, 
  LogOut,
  BarChart2,
  GraduationCap,
  Menu,
  ChevronDown,
  Globe,
  Settings,
  TrendingUp
} from 'lucide-react';
import AIChat from './components/AIChat';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import LearningHub from './components/LearningHub';
import AuthScreen from './components/AuthScreen';
import AddAssetModal from './components/AddAssetModal';
import ReceiveModal from './components/ReceiveModal';
import SendModal from './components/SendModal';
import WalletManagerModal from './components/WalletManagerModal';
import WalletConnectModal from './components/WalletConnectModal'; // Import WC Modal
import Dashboard from './components/Dashboard';
import SwapView from './components/SwapView';
import DAppsView from './components/DAppsView';
import SettingsView from './components/SettingsView';
import EarnView from './components/EarnView';
import { ViewState, Asset, Transaction, UserProfile, WalletConnectSession } from './types';
import { StorageService } from './services/storageService';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('auth');
  const [portfolioSummary, setPortfolioSummary] = useState('');
  
  // Modals State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // WalletConnect State
  const [isWCModalOpen, setIsWCModalOpen] = useState(false);
  const [wcUri, setWcUri] = useState('');

  // Data State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Localization Helper
  const t = user ? (TRANSLATIONS[user.language] || TRANSLATIONS.en) : TRANSLATIONS.en;

  // Initialization
  useEffect(() => {
    const storedUser = StorageService.getUser();
    if (storedUser) {
      setUser(storedUser);
      loadUserData();
      setView('dashboard');
    } else {
      setView('auth');
    }
  }, []);

  const loadUserData = () => {
    setAssets(StorageService.getAssets());
    setTransactions(StorageService.getTransactions());
  };

  const handleAuthenticated = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    loadUserData();
    setView('dashboard');
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setView('auth');
  };

  // --- Action Handlers ---

  const handleAddAsset = (newAsset: Asset) => {
    try {
      const updated = StorageService.addAsset(newAsset);
      setAssets(updated);
    } catch (e) {
      alert("Cet actif existe déjà");
    }
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("Voulez-vous masquer cet actif ?")) {
      const updated = StorageService.removeAsset(id);
      setAssets(updated);
    }
  };

  const handleSend = (assetId: string, amount: number, to: string) => {
    if (!user) return;

    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      const newBalance = asset.balance - amount;
      const updatedAssets = assets.map(a => a.id === assetId ? {...a, balance: newBalance} : a);
      setAssets(updatedAssets);
      StorageService.saveAssets(updatedAssets);

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'send',
        asset: asset.symbol,
        amount: amount,
        toFrom: to,
        date: new Date().toISOString(),
        status: 'completed',
        walletId: user.activeWalletId,
        networkId: 'eth-mainnet'
      };
      const updatedTxs = StorageService.addTransaction(newTx);
      setTransactions(updatedTxs);
    }
  };

  const handleSwitchWallet = (walletId: string) => {
    if (!user) return;
    const updatedUser = StorageService.switchWallet(user, walletId);
    setUser(updatedUser);
    loadUserData(); 
  };

  const handleCreateWallet = async (name: string) => {
    if (!user) return;
    // Simulated encrypted key generation
    const updatedUser = await StorageService.addWallet(user, name, "session-key-simulated");
    setUser(updatedUser);
  };

  // WalletConnect Handler
  const handleWalletConnect = (uri: string) => {
    setWcUri(uri);
    setIsWCModalOpen(true);
  };

  const handleApproveSession = (session: WalletConnectSession) => {
    if (!user) return;
    const updatedUser = { 
      ...user, 
      wcSessions: [...(user.wcSessions || []), session] 
    };
    StorageService.saveUser(updatedUser);
    setUser(updatedUser);
    alert(`Connected to ${session.dappName}`);
  };

  const TotalBalance = assets.reduce((acc, curr) => acc + (curr.balance * curr.price), 0);
  const activeWallet = user?.wallets.find(w => w.id === user.activeWalletId) || user?.wallets[0];

  if (view === 'auth' || !user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const NavButton = ({ v, icon: Icon, label }: { v: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => setView(v)} 
      className={`relative p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 ${view === v ? 'text-indigo-400 bg-white/5 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <Icon size={24} strokeWidth={view === v ? 2.5 : 2} />
      {view === v && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_5px_#6366f1]"></div>}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white flex font-sans relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* AMBIENT BACKGROUND ANIMATION */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[128px] animate-blob"></div>
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col border-r border-white/5 p-6 fixed h-full bg-[#020617]/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
             <Sparkles size={20} className="text-white" />
           </div>
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Malin</h1>
             <p className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">Vault OS v1.0</p>
           </div>
        </div>

        {/* Wallet Switcher */}
        <button 
          onClick={() => setIsWalletManagerOpen(true)}
          className="mb-8 w-full bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-white/10 transition group shadow-inner"
        >
           <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ backgroundColor: activeWallet?.color }}>
                {activeWallet?.name[0]}
              </div>
              <div className="text-left truncate">
                <p className="font-bold text-sm truncate text-white group-hover:text-indigo-200 transition">{activeWallet?.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Actif</p>
              </div>
           </div>
           <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition" />
        </button>
        
        <nav className="space-y-2 flex-1">
           {[
             { id: 'dashboard', icon: LayoutDashboard, label: t.menu.dashboard },
             { id: 'swap', icon: ArrowRightLeft, label: t.menu.swap },
             { id: 'earn', icon: TrendingUp, label: t.menu.earn },
             { id: 'wallet', icon: Globe, label: t.menu.dapps },
             { id: 'analytics', icon: BarChart2, label: t.menu.analytics },
             { id: 'learn', icon: GraduationCap, label: t.menu.learn }
           ].map((item) => (
             <button 
                key={item.id}
                onClick={() => setView(item.id as ViewState)} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${view === item.id ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             >
               <item.icon size={20} className={view === item.id ? 'text-indigo-400' : 'opacity-70'} /> 
               {item.label}
             </button>
           ))}

           <button onClick={() => setIsChatOpen(true)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 mt-6 shadow-lg shadow-indigo-900/40 border border-indigo-400/20 group`}>
             <Sparkles size={20} className="group-hover:rotate-12 transition" /> {t.menu.assistant}
           </button>
        </nav>

        <div className="border-t border-white/5 pt-6 flex flex-col gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 text-slate-400 hover:text-white transition px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-lg">
             <Settings size={18} /> {t.menu.settings}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-rose-400 transition px-4 py-2 text-sm font-medium hover:bg-rose-500/10 rounded-lg">
             <LogOut size={18} /> {t.menu.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 max-w-7xl mx-auto w-full pb-32 md:pb-8 relative z-10">
         {/* Mobile Header */}
         <div className="md:hidden flex justify-between items-center mb-8 sticky top-0 z-30 py-2 bg-[#020617]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="text-white" size={18} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">MalinWallet</h1>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition">
              <Settings size={20} />
            </button>
         </div>

         {view === 'dashboard' && (
           <Dashboard 
             user={user} 
             assets={assets} 
             transactions={transactions} 
             totalBalance={TotalBalance}
             portfolioSummary={portfolioSummary}
             onSend={() => setIsSendOpen(true)}
             onReceive={() => setIsReceiveOpen(true)}
             onAddAsset={() => setIsAddAssetOpen(true)}
             onDeleteAsset={handleDeleteAsset}
           />
         )}

         {view === 'analytics' && <PortfolioAnalytics assets={assets} />}
         {view === 'learn' && <LearningHub />}
         {view === 'swap' && <SwapView assets={assets} walletAddress={activeWallet?.address} />}
         {view === 'earn' && <EarnView />}
         {view === 'wallet' && <DAppsView onWalletConnect={handleWalletConnect} />}
      </main>

      {/* Mobile Floating Nav (Dynamic Island Style) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 flex justify-around items-center shadow-2xl shadow-black/50">
           <NavButton v="dashboard" icon={LayoutDashboard} label="Home" />
           <NavButton v="swap" icon={ArrowRightLeft} label="Swap" />
           
           <button 
              onClick={() => setIsChatOpen(true)}
              className="relative -top-6 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl w-16 h-16 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 border-[6px] border-[#020617] hover:scale-105 transition active:scale-95"
            >
             <Sparkles size={28} />
           </button>

           <NavButton v="earn" icon={TrendingUp} label="Earn" />
           <NavButton v="wallet" icon={Globe} label="DApps" />
        </div>
      </div>

      {/* Modals */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AddAssetModal isOpen={isAddAssetOpen} onClose={() => setIsAddAssetOpen(false)} onAdd={handleAddAsset} />
      
      {activeWallet && (
        <ReceiveModal 
          isOpen={isReceiveOpen} 
          onClose={() => setIsReceiveOpen(false)} 
          wallet={activeWallet} 
        />
      )}
      
      <SendModal 
        isOpen={isSendOpen} 
        onClose={() => setIsSendOpen(false)} 
        assets={assets}
        onSend={handleSend}
      />

      <WalletManagerModal 
        isOpen={isWalletManagerOpen} 
        onClose={() => setIsWalletManagerOpen(false)} 
        user={user!}
        onSwitchWallet={handleSwitchWallet}
        onCreateWallet={handleCreateWallet}
      />

      <WalletConnectModal 
        isOpen={isWCModalOpen}
        onClose={() => setIsWCModalOpen(false)}
        uri={wcUri}
        onApprove={handleApproveSession}
      />

      {isSettingsOpen && (
        <SettingsView 
          user={user!}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateUser={(u) => setUser(u)}
        />
      )}

    </div>
  );
};

export default App;
    