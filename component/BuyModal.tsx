
import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Apple, ShieldCheck, ArrowDown, Loader2, CheckCircle } from 'lucide-react';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyModal: React.FC<BuyModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('EUR');
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');

  const cryptoAmount = (parseFloat(amount) / 2500).toFixed(4); // Simule ETH price 2500

  const handleBuy = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0f172a] w-full max-w-md rounded-[2rem] border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-950">
           <h3 className="text-xl font-bold text-white">Acheter Crypto</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        {step === 'input' && (
          <div className="p-6 space-y-6">
             {/* Amount Input */}
             <div className="relative">
               <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Vous payez</label>
               <div className="flex items-center gap-2">
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full bg-transparent text-4xl font-bold text-white outline-none placeholder:text-slate-700"
                 />
                 <select 
                   value={currency}
                   onChange={(e) => setCurrency(e.target.value)}
                   className="bg-slate-800 text-white px-3 py-2 rounded-xl font-bold border border-slate-700 outline-none"
                 >
                   <option value="EUR">EUR</option>
                   <option value="USD">USD</option>
                 </select>
               </div>
             </div>

             <div className="flex justify-center">
                <div className="bg-slate-800 p-2 rounded-full text-slate-400">
                  <ArrowDown size={20} />
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Vous recevez</p>
                  <p className="text-2xl font-bold text-white">≈ {cryptoAmount} ETH</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  E
                </div>
             </div>

             {/* Payment Methods */}
             <div>
               <label className="text-xs text-slate-400 font-bold uppercase mb-3 block">Moyen de paiement</label>
               <div className="grid grid-cols-2 gap-3">
                 <button className="p-4 rounded-xl border border-indigo-500 bg-indigo-500/10 flex flex-col items-center gap-2 transition hover:bg-indigo-500/20">
                    <Apple size={24} className="text-white" />
                    <span className="text-xs font-bold text-white">Apple Pay</span>
                 </button>
                 <button className="p-4 rounded-xl border border-slate-700 bg-slate-900 flex flex-col items-center gap-2 transition hover:border-slate-500">
                    <CreditCard size={24} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">Carte</span>
                 </button>
               </div>
             </div>

             <button onClick={handleBuy} className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition shadow-lg shadow-white/10">
               Payer {amount} {currency}
             </button>

             <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-500" /> Paiement sécurisé par MoonPay (Simulé)
             </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center text-center space-y-6">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <div>
               <h3 className="text-xl font-bold text-white mb-2">Traitement en cours...</h3>
               <p className="text-slate-400 text-sm">Contact avec votre banque sécurisé.</p>
             </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in">
             <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_#10b981]">
                <CheckCircle size={40} className="text-white" />
             </div>
             <div>
               <h3 className="text-2xl font-bold text-white mb-2">Achat Réussi !</h3>
               <p className="text-slate-400 text-sm mb-6">Vos {cryptoAmount} ETH ont été ajoutés à votre wallet.</p>
               <button onClick={onClose} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition">
                 Terminer
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyModal;
