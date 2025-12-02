
"use client";

import { useState } from 'react';
import { SwapService, SwapQuote } from '@/services/swapService';
import { ArrowDown } from 'lucide-react';

export default function SwapPage() {
    const [loading, setLoading] = useState(false);
    const [quotes, setQuotes] = useState<SwapQuote[]>([]);
    const [amount, setAmount] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        // Hardcoded example: ETH -> SOL
        const results = await SwapService.getBestQuote('ethereum', 'solana', 'ETH', 'SOL', Number(amount));
        setQuotes(results);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">Auto-Bridge & Swap</h1>

            <div className="bg-[#1C1C1E] p-4 rounded-2xl mb-4">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Payer</span>
                    <span className="text-blue-400">Balance: 0.0 ETH</span>
                </div>
                <div className="flex justify-between items-center">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="bg-transparent text-3xl font-bold outline-none w-2/3"
                    />
                    <button className="bg-gray-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500"></div> ETH
                    </button>
                </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-black p-2 rounded-full border border-[#1C1C1E]">
                    <ArrowDown className="text-gray-400" />
                </div>
            </div>

            <div className="bg-[#1C1C1E] p-4 rounded-2xl mt-4">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Recevoir (Estimé)</span>
                </div>
                 <div className="flex justify-between items-center">
                    <input
                        disabled
                        placeholder="0.0"
                        value={quotes.length > 0 ? quotes[0].amountOut : ''}
                        className="bg-transparent text-3xl font-bold outline-none w-2/3 text-gray-500"
                    />
                    <button className="bg-gray-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500"></div> SOL
                    </button>
                </div>
            </div>

            <button
                onClick={handleSearch}
                disabled={!amount || loading}
                className="w-full bg-[#8A8AFF] hover:bg-[#7a7aff] text-black font-bold py-4 rounded-xl mt-6 disabled:opacity-50"
            >
                {loading ? 'Recherche de la meilleure route...' : 'Review Swap'}
            </button>

            {quotes.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h3 className="text-gray-400 font-bold uppercase text-sm">Meilleures Routes</h3>
                    {quotes.map((quote, idx) => (
                        <div key={idx} className="bg-[#1C1C1E] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">{quote.provider}</p>
                                <p className="text-xs text-green-400">
                                    ~{quote.amountOut} SOL <span className="text-gray-500">| {quote.fees} fee</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">
                                    Auto-Bridge
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
