
import React, { useState } from 'react';
import { X, Check, Search } from 'lucide-react';
import { SUPPORTED_CHAINS } from '../constants.ts';
import { Asset, ChainType } from '../types.ts';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Asset) => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [selectedChain, setSelectedChain] = useState<ChainType>('ETH');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !symbol) return;

    const chainInfo = SUPPORTED_CHAINS.find(c => c.code === selectedChain);
    
    const newAsset: Asset = {
      id: symbol.toLowerCase() + Date.now(),
      name,
      symbol: symbol.toUpperCase(),
      balance: 0,
      price: 0, // In a real app, we'd fetch this. Here we start at 0 or fetch via Gemini
      change24h: 0,
      chain: selectedChain,
      color: chainInfo?.color || '#ccc',
      isCustom: true
    };

    onAdd(newAsset);
    onClose();
    setName('');
    setSymbol('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Add Custom Asset</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Blockchain Network</label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CHAINS.map(chain => (
                <button
                  key={chain.code}
                  type="button"
                  onClick={() => setSelectedChain(chain.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedChain === chain.code 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Token Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Malin Token"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Symbol / Ticker</label>
            <input 
              type="text" 
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="e.g. MLN"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition uppercase"
              required
            />
          </div>
          
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-500">
             <p>Note: Since this is a decentralized simulation, price data for custom tokens will be emulated.</p>
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
            <Check size={18} /> Add Token
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;
