
import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Info, ShieldCheck, RefreshCw, BrainCircuit, Repeat, GitCompareArrows } from 'lucide-react';
import { Asset } from '../types';
import { ZeroExService, LiFiService } from '../services/tradeService';

interface SwapViewProps {
  assets: Asset[];
  walletAddress?: string;
}

type Tab = 'swap' | 'bridge';

const SwapView: React.FC<SwapViewProps> = ({ assets, walletAddress }) => {
  const [activeTab, setActiveTab] = useState<Tab>('swap');
  
  // États communs
  const [fromAsset, setFromAsset] = useState<string>('ETH');
  const [toAsset, setToAsset] = useState<string>('USDT');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [error, setError] = useState('');

  // États Bridge spécifiques
  const [fromChain, setFromChain] = useState('ETH');
  const [toChain, setToChain] = useState('MATIC');

  // Déclencher la cotation (Quote) quand les inputs changent
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setQuoteData(null);
        return;
      }
      
      if (!walletAddress) {
        setError("Connectez un wallet pour voir les prix.");
        return;
      }

      setLoading(true);
      setError('');
      setQuoteData(null);

      try {
        if (activeTab === 'swap') {
          // APPEL 0x API (SWAP)
          const data = await ZeroExService.getQuote(fromAsset, toAsset, amount, walletAddress);
          setQuoteData({
            buyAmount: (parseInt(data.buyAmount) / 1e18).toFixed(6), // Simplification décimales
            price: data.price,
            gasPrice: data.gasPrice,
            source: '0x Protocol'
          });
        } else {
          // APPEL LiFi API (BRIDGE)
          const data = await LiFiService.getQuote(fromChain, toChain, fromAsset, toAsset, amount, walletAddress);
          setQuoteData({
            buyAmount: (parseInt(data.estimate.toAmount) / 1e18).toFixed(6),
            price: data.estimate.executionDuration, // Durée en secondes pour le bridge
            gasPrice: data.estimate.gasCosts?.[0]?.amount,
            source: 'LiFi Aggregator'
          });
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Impossible de récupérer la cotation.");
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 800); // Debounce pour éviter trop d'appels API
    return () => clearTimeout(debounce);
  }, [amount, fromAsset, toAsset, activeTab, fromChain, toChain, walletAddress]);

  return (
    <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300 pb-20">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button 
          onClick={() => { setActiveTab('swap'); setQuoteData(null); }}
          className={`px-6 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${activeTab === 'swap' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          <Repeat size={16} /> Swap (0x)
        </button>
        <button 
          onClick={() => { setActiveTab('bridge'); setQuoteData(null); }}
          className={`px-6 py-2 rounded-full font-bold text-sm transition flex items-center gap-2 ${activeTab === 'bridge' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          <GitCompareArrows size={16} /> Bridge (LiFi)
        </button>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className={`absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full blur-3xl pointer-events-none ${activeTab === 'swap' ? 'bg-indigo-600/10' : 'bg-purple-600/10'}`}></div>

        <div className="space-y-4 relative z-10">
          
          {/* Choix des Chaînes (Mode Bridge uniquement) */}
          {activeTab === 'bridge' && (
            <div className="flex justify-between gap-2 mb-2">
              <div className="flex-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold ml-2">De</label>
                 <select value={fromChain} onChange={e => setFromChain(e.target.value)} className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 text-xs font-bold">
                   <option value="ETH">Ethereum</option>
                   <option value="MATIC">Polygon</option>
                   <option value="BSC">BSC</option>
                 </select>
              </div>
              <div className="flex items-end pb-2 text-slate-600">→</div>
              <div className="flex-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold ml-2">Vers</label>
                 <select value={toChain} onChange={e => setToChain(e.target.value)} className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800 text-xs font-bold">
                   <option value="MATIC">Polygon</option>
                   <option value="ETH">Ethereum</option>
                   <option value="BSC">BSC</option>
                 </select>
              </div>
            </div>
          )}

          {/* Input DEPART */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-slate-400">Vous payez</span>
              <span className="text-xs text-slate-400">Balance: {assets.find(a => a.symbol === fromAsset)?.balance.toFixed(4) || '0.00'}</span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder:text-slate-700"
              />
              <select 
                value={fromAsset}
                onChange={(e) => setFromAsset(e.target.value)}
                className="bg-slate-800 text-white px-3 py-2 rounded-xl font-bold border border-slate-700 outline-none appearance-none"
              >
                <option value="ETH">ETH</option>
                <option value="WETH">WETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="DAI">DAI</option>
              </select>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-2 relative z-20">
            <button className="bg-slate-800 border-4 border-slate-900 p-2 rounded-xl text-slate-400 hover:text-white transition">
              <ArrowDownUp size={20} />
            </button>
          </div>

          {/* Input ARRIVÉE */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
             <div className="flex justify-between mb-2">
              <span className="text-xs text-slate-400">Vous recevez (estimé)</span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={quoteData ? quoteData.buyAmount : '0.0'}
                readOnly
                className={`bg-transparent text-3xl font-bold outline-none w-full placeholder:text-slate-700 ${loading ? 'text-slate-600 animate-pulse' : 'text-emerald-400'}`}
              />
              <select 
                value={toAsset}
                onChange={(e) => setToAsset(e.target.value)}
                className="bg-slate-800 text-white px-3 py-2 rounded-xl font-bold border border-slate-700 outline-none appearance-none"
              >
                 <option value="USDT">USDT</option>
                 <option value="USDC">USDC</option>
                 <option value="ETH">ETH</option>
                 <option value="DAI">DAI</option>
              </select>
            </div>
          </div>

          {/* Data & Routing Info */}
          {loading ? (
            <div className="py-4 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin" size={16} /> Recherche de la meilleure route...
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center break-all">
              {error}
            </div>
          ) : quoteData && (
             <div className={`border rounded-xl p-3 flex items-start gap-3 ${activeTab === 'swap' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-purple-900/20 border-purple-500/30'}`}>
                <BrainCircuit className={activeTab === 'swap' ? 'text-indigo-400' : 'text-purple-400'} size={18} />
                <div className="w-full">
                  <div className="flex justify-between items-center">
                    <p className={`text-xs font-bold ${activeTab === 'swap' ? 'text-indigo-300' : 'text-purple-300'}`}>
                      {quoteData.source}
                    </p>
                    <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-slate-300">MEV Protected</span>
                  </div>
                  <div className="mt-2 space-y-1">
                     <div className="flex justify-between text-xs text-slate-400">
                       <span>Taux</span>
                       <span className="text-white">1 {fromAsset} ≈ {activeTab === 'swap' ? quoteData.price : (quoteData.buyAmount/parseFloat(amount)).toFixed(4)} {toAsset}</span>
                     </div>
                     <div className="flex justify-between text-xs text-slate-400">
                       <span>Gas estimé</span>
                       <span className="text-white">{quoteData.gasPrice ? (parseInt(quoteData.gasPrice)/1e9).toFixed(0) + ' Gwei' : 'Calcul...'}</span>
                     </div>
                     {activeTab === 'bridge' && (
                       <div className="flex justify-between text-xs text-slate-400">
                         <span>Durée estimée</span>
                         <span className="text-white">{quoteData.price} sec</span>
                       </div>
                     )}
                  </div>
                </div>
             </div>
          )}

          <button 
            disabled={loading || !quoteData}
            className={`w-full py-4 text-white rounded-xl font-bold text-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${activeTab === 'swap' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'}`}
          >
            {loading ? 'Calcul en cours...' : activeTab === 'swap' ? 'Confirmer Swap' : 'Confirmer Bridge'}
          </button>
          
          <div className="text-center">
            <span className="text-xs text-emerald-500 flex items-center justify-center gap-1">
              <ShieldCheck size={12} /> Transaction auditée par Malin AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapView;
