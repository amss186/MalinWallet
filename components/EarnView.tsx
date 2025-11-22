
import React, { useState } from 'react';
import { TrendingUp, ShieldCheck, AlertCircle, ChevronRight, Info, Check, Percent } from 'lucide-react';
import { STAKING_OPTIONS, TRANSLATIONS } from '../constants.ts';
import { UserProfile, Asset } from '../types.ts';
import { StorageService } from '../services/storageService.ts';

interface EarnViewProps {}

const EarnView: React.FC<EarnViewProps> = () => {
  const user = StorageService.getUser();
  const t = user ? (TRANSLATIONS[user.language] || TRANSLATIONS.en) : TRANSLATIONS.en;
  const [amount, setAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);

  const activeOption = STAKING_OPTIONS.find(o => o.id === selectedOption);
  const estimatedEarnings = activeOption && amount ? (parseFloat(amount) * (activeOption.apy / 100)).toFixed(4) : '0.00';

  const handleStake = () => {
    if (!amount || !activeOption) return;
    setIsStaking(true);
    // Simulation de la transaction de staking
    setTimeout(() => {
      setIsStaking(false);
      alert(`Successfully staked ${amount} ${activeOption.asset} on ${activeOption.protocol}! You are now earning ${activeOption.apy}% APY.`);
      setAmount('');
      setSelectedOption(null);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      {/* Header Banner */}
      <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 p-8 mb-8 shadow-2xl shadow-indigo-900/30">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
         <div className="relative z-10">
           <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-bold mb-4 border border-white/20">
              <Percent size={14} /> DeFi Yield Active
           </div>
           <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{t.earn.title}</h1>
           <p className="text-indigo-100 font-medium max-w-md">{t.earn.subtitle}</p>
         </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <TrendingUp className="text-emerald-400" /> {t.earn.staking}
      </h2>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STAKING_OPTIONS.map((option) => (
          <div 
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
            className={`relative group cursor-pointer rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${selectedOption === option.id ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
          >
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg ${option.asset === 'ETH' ? 'bg-blue-500' : option.asset === 'USDC' ? 'bg-blue-400' : 'bg-purple-500'}`}>
                      {option.asset[0]}
                   </div>
                   <div>
                      <h3 className="font-bold text-white text-lg">{option.protocol}</h3>
                      <p className="text-xs text-slate-400 font-medium">{option.asset} Staking</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-emerald-400">{option.apy}%</p>
                   <p className="text-[10px] text-slate-500 uppercase font-bold">APY</p>
                </div>
             </div>
             
             <p className="text-sm text-slate-400 mb-4 leading-relaxed border-b border-white/5 pb-4">{option.description}</p>
             
             <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-slate-300">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span>{option.risk} Risk</span>
                </div>
                <span className="text-slate-500">TVL: {option.tvl}</span>
             </div>

             {selectedOption === option.id && (
                <div className="absolute top-4 right-4 bg-indigo-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in">
                   <Check size={14} />
                </div>
             )}
          </div>
        ))}
      </div>

      {/* Staking Action Panel */}
      {activeOption && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 p-6 z-50 animate-in slide-in-from-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                 <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Montant à Staker ({activeOption.asset})</label>
                 <div className="relative">
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min ${activeOption.minDeposit}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{activeOption.asset}</span>
                 </div>
              </div>
              
              <div className="flex-1 w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div>
                    <p className="text-xs text-slate-500 mb-1">Gains Estimés (1 An)</p>
                    <p className="text-xl font-bold text-emerald-400">+{estimatedEarnings} {activeOption.asset}</p>
                 </div>
                 <div className="text-right text-xs text-slate-500">
                    <p>Taux actuel: {activeOption.apy}%</p>
                    <p>Protocol: {activeOption.protocol}</p>
                 </div>
              </div>

              <button 
                onClick={handleStake}
                disabled={isStaking || !amount}
                className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                 {isStaking ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <TrendingUp size={20} />}
                 {t.earn.stake} {activeOption.asset}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default EarnView;
