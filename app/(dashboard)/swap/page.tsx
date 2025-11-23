'use client';

import React, { useState, useEffect } from 'react';
import { ChainService } from '@/lib/chain';
import { ArrowDown, Loader2, AlertCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';

export default function SwapPage() {
  const [sellToken, setSellToken] = useState('ETH');
  const [buyToken, setBuyToken] = useState('USDC');
  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Debounce quote fetching
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (parseFloat(sellAmount) > 0) {
        setLoading(true);
        // 0x API expects base units for sellAmount (e.g. Wei), but for this UI demo we'll use ChainService wrapper
        // Note: ChainService.getZeroXQuote implementation in this demo context might need adjustment for decimals.
        // For now, we pass the raw amount assuming the user enters full units and we handle decimals in a real app.
        // Let's assume 18 decimals for ETH.
        const weiAmount = (parseFloat(sellAmount) * 1e18).toString();

        const data = await ChainService.getZeroXQuote(sellToken, buyToken, weiAmount);
        setQuote(data);
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [sellAmount, sellToken, buyToken]);

  return (
    <div className="max-w-lg mx-auto mt-10">
       <ToastContainer theme="dark" />
       <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-white">Swap</h2>
             <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30">
               Powered by 0x
             </div>
          </div>

          {/* Sell Input */}
          <div className="bg-black/20 rounded-2xl p-4 mb-2 border border-transparent hover:border-white/10 transition">
             <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm">Vous payez</span>
                <span className="text-slate-400 text-sm">Solde: 0.00</span>
             </div>
             <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-3xl font-bold text-white focus:outline-none w-full placeholder:text-slate-600"
                />
                <button className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-bold text-white flex items-center gap-2 transition">
                   <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" alt="ETH" className="w-6 h-6 rounded-full" />
                   ETH
                </button>
             </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-4 relative z-10">
             <button className="bg-[#020617] border border-white/10 p-2 rounded-xl text-indigo-400 hover:text-white hover:scale-110 transition shadow-lg">
               <ArrowDown size={20} />
             </button>
          </div>

          {/* Buy Input */}
          <div className="bg-black/20 rounded-2xl p-4 mt-2 border border-transparent hover:border-white/10 transition">
             <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm">Vous recevez</span>
             </div>
             <div className="flex items-center gap-4">
                <input
                  type="text"
                  disabled
                  value={quote ? (parseInt(quote.buyAmount) / 1e6).toFixed(4) : ''} // Assuming USDC (6 decimals)
                  placeholder="0.0"
                  className="bg-transparent text-3xl font-bold text-indigo-400 focus:outline-none w-full placeholder:text-slate-600"
                />
                <button className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-bold text-white flex items-center gap-2 transition">
                   <img src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png" alt="USDC" className="w-6 h-6 rounded-full" />
                   USDC
                </button>
             </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm space-y-1">
               <div className="flex justify-between text-slate-300">
                 <span>Taux</span>
                 <span className="text-white">1 ETH = {(parseInt(quote.buyAmount) / 1e6 / parseFloat(sellAmount)).toFixed(2)} USDC</span>
               </div>
               <div className="flex justify-between text-slate-300">
                 <span>Gas Estimé</span>
                 <span className="text-white">${(quote.estimatedGas * 0.00000003 * 2200).toFixed(2)}</span>
               </div>
            </div>
          )}

          <button
            disabled={!quote || loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-lg font-bold rounded-xl transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Échanger maintenant'}
          </button>
       </div>
    </div>
  );
}
