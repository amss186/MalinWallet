
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Send, ShieldAlert, Fuel, Sparkles } from 'lucide-react';
import { Asset } from '../types';
import { ChainService } from '../services/chainService';
import { getFastResponse } from '../services/geminiService';
import { DEFAULT_NETWORKS } from '../constants';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSend: (assetId: string, amount: number, to: string) => void;
}

const SendModal: React.FC<SendModalProps> = ({ isOpen, onClose, assets, onSend }) => {
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Gas & Security State
  const [gasPrice, setGasPrice] = useState('0');
  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null);
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);

  useEffect(() => {
    const updateGas = async () => {
      // Use default ETH mainnet RPC for gas estimation in this demo
      const rpc = DEFAULT_NETWORKS[0].rpcUrl;
      const price = await ChainService.getGasPrice(rpc);
      setGasPrice(price);
    };
    if(isOpen) updateGas();
  }, [isOpen]);

  const analyzeRisk = async () => {
    if (!address) return;
    setIsCheckingRisk(true);
    try {
      // Mock calling AI
      const analysis = await getFastResponse(`Analyze this eth address for risk: ${address}. Is it a known scam? Short yes/no.`);
      setRiskAnalysis(analysis);
    } catch (e) {
      setRiskAnalysis("Risk check failed.");
    } finally {
      setIsCheckingRisk(false);
    }
  };

  if (!isOpen) return null;

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!selectedAsset || isNaN(numAmount) || numAmount <= 0 || numAmount > selectedAsset.balance) {
      alert("Solde insuffisant ou montant invalide");
      return;
    }

    setLoading(true);
    // Simulation délai réseau
    setTimeout(() => {
      onSend(selectedAssetId, numAmount, address);
      setLoading(false);
      onClose();
      setAmount('');
      setAddress('');
    }, 1500);
  };

  // Estimation coût en USD (fixe ETH price pour l'exemple)
  const estimatedFeeUsd = (parseInt(gasPrice) * 21000 / 1e9 * 2500).toFixed(2); 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Envoyer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Asset Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Actif</label>
            <div className="grid grid-cols-3 gap-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedAssetId === asset.id 
                      ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold text-white text-sm">{asset.symbol}</div>
                  <div className="text-xs text-slate-400">{asset.balance.toFixed(4)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Adresse du destinataire</label>
            <div className="relative">
              <input 
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-white outline-none focus:border-indigo-500 transition font-mono text-sm"
                required
              />
              {address.length > 20 && !riskAnalysis && (
                 <button 
                   type="button" 
                   onClick={analyzeRisk}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300"
                   title="Vérifier l'adresse avec l'IA"
                 >
                    {isCheckingRisk ? <span className="animate-spin">...</span> : <Sparkles size={16} />}
                 </button>
              )}
            </div>
            {riskAnalysis && (
               <div className="mt-2 text-xs p-2 bg-indigo-900/30 border border-indigo-500/30 rounded text-indigo-300 flex items-start gap-2">
                 <ShieldAlert size={14} className="mt-0.5"/>
                 {riskAnalysis}
               </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
             <div className="flex justify-between mb-2">
               <label className="block text-xs font-medium text-slate-400">Montant</label>
               <button 
                  type="button" 
                  onClick={() => selectedAsset && setAmount(selectedAsset.balance.toString())}
                  className="text-xs text-indigo-400 font-bold"
               >
                 MAX: {selectedAsset?.balance.toFixed(4)}
               </button>
             </div>
             <div className="relative">
               <input 
                 type="number" 
                 value={amount}
                 onChange={e => setAmount(e.target.value)}
                 placeholder="0.00"
                 className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition text-lg font-bold"
                 step="0.000001"
                 required
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                 {selectedAsset?.symbol}
               </span>
             </div>
          </div>

          {/* Gas Info */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
             <div className="flex items-center gap-2 text-slate-400">
                <Fuel size={14} />
                <span>Gas Estimé ({gasPrice} Gwei)</span>
             </div>
             <span className="text-white font-medium">~${estimatedFeeUsd}</span>
          </div>

          <button 
            type="submit" 
            disabled={loading || !selectedAsset || selectedAsset.balance === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Envoi en cours...' : 'Confirmer l\'envoi'}
            {!loading && <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendModal;