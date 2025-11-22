
import React from 'react';
import { X, Copy, Share2, QrCode } from 'lucide-react';
import { WalletAccount } from '../types';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletAccount;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose, wallet }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    alert("Adresse copiée !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Recevoir</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
            {/* VRAI QR CODE GÉNÉRÉ */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${wallet.address}`} 
              alt="Wallet Address QR" 
              className="w-[180px] h-[180px]"
            />
          </div>

          <p className="text-sm text-slate-400 mb-2">Adresse {wallet.name}</p>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 mb-6">
            <code className="text-xs text-white font-mono truncate select-all">{wallet.address}</code>
            <button onClick={handleCopy} className="p-2 hover:bg-slate-800 rounded-lg text-indigo-400 transition">
              <Copy size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-500 max-w-[250px]">
            Scannez ce QR code pour envoyer des fonds sur ce réseau.
          </p>

          <div className="flex gap-3 w-full mt-6">
             <button onClick={handleCopy} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition text-sm">
               Copier l'adresse
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;
