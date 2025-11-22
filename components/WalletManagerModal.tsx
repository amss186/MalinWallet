
import React, { useState } from 'react';
import { X, Wallet, Plus, Check } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface WalletManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSwitchWallet: (walletId: string) => void;
  onCreateWallet: (name: string) => void;
}

const WalletManagerModal: React.FC<WalletManagerModalProps> = ({ isOpen, onClose, user, onSwitchWallet, onCreateWallet }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName) return;
    onCreateWallet(newWalletName);
    setNewWalletName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Mes Portefeuilles</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
            {user.wallets.map(wallet => (
              <button
                key={wallet.id}
                onClick={() => { onSwitchWallet(wallet.id); onClose(); }}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition group ${
                  user.activeWalletId === wallet.id
                    ? 'bg-indigo-600/10 border-indigo-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: wallet.color }}>
                    <Wallet size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${user.activeWalletId === wallet.id ? 'text-white' : 'text-slate-300'}`}>{wallet.name}</p>
                    <p className="text-xs text-slate-500 font-mono truncate max-w-[150px]">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                  </div>
                </div>
                {user.activeWalletId === wallet.id && <Check className="text-indigo-400" size={20} />}
              </button>
            ))}
          </div>

          {isCreating ? (
            <form onSubmit={handleCreate} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 animate-in fade-in">
               <label className="text-xs text-slate-400 block mb-2">Nom du nouveau portefeuille</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newWalletName}
                   onChange={e => setNewWalletName(e.target.value)}
                   className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
                   placeholder="Ex: Épargne"
                   autoFocus
                 />
                 <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500">Créer</button>
                 <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 px-2 hover:text-white"><X size={18} /></button>
               </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full py-3 border border-dashed border-slate-700 text-slate-400 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus size={16} /> Ajouter un portefeuille
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletManagerModal;
