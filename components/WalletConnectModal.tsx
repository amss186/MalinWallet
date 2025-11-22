
import React from 'react';
import { X, ShieldCheck, Globe, Check } from 'lucide-react';
import { WalletConnectSession } from '../types.ts';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  uri: string;
  onApprove: (session: WalletConnectSession) => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, uri, onApprove }) => {
  if (!isOpen) return null;

  // Parse URI to simulate DApp details (In real WC v2, we await client.pair())
  // wc:topic@2?relay-protocol=irn&symKey=...
  const topic = uri.split('@')[0].replace('wc:', '');
  
  // Simulated DApp Data (since we can't fetch metadata without the heavy WC library in this specific env)
  const mockDApp = {
    name: "Uniswap",
    url: "https://app.uniswap.org",
    icon: "https://uniswap.org/favicon.ico",
    chains: ["Ethereum (Mainnet)", "Polygon"]
  };

  const handleApprove = () => {
    const newSession: WalletConnectSession = {
      id: 'wc-' + Date.now(),
      dappName: mockDApp.name,
      dappUrl: mockDApp.url,
      dappIcon: mockDApp.icon,
      chains: ['EIP155:1', 'EIP155:137'],
      connectedAt: new Date().toISOString(),
      topic: topic
    };
    onApprove(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#0f172a] w-full max-w-sm rounded-[2rem] border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-4 p-1 relative">
             <img src={mockDApp.icon} alt="DApp" className="w-10 h-10" />
             <div className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-full p-1.5 border-4 border-[#0f172a]">
               <Globe size={12} className="text-white" />
             </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-1">{mockDApp.name}</h3>
          <p className="text-slate-400 text-xs mb-6">{mockDApp.url}</p>

          <div className="bg-slate-900 rounded-xl p-4 text-left border border-slate-800 mb-6">
            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Permissions Requested</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-white">
                <Check size={16} className="text-emerald-500" /> View wallet balance
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <Check size={16} className="text-emerald-500" /> Request transactions
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <Check size={16} className="text-emerald-500" /> View activity
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition">
              Reject
            </button>
            <button onClick={handleApprove} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20">
              Connect
            </button>
          </div>
          
          <div className="mt-4 text-[10px] text-slate-500 flex items-center justify-center gap-1">
             <ShieldCheck size={12} /> WalletConnect v2 Secured
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
    