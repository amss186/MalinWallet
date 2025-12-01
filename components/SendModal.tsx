'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, ScanLine, Loader2, ArrowRight, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { WalletService } from '@/lib/wallet';
import { ChainService } from '@/lib/chain';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallet: any;
  ethPrice: number;
}

export default function SendModal({ isOpen, onClose, activeWallet, ethPrice }: SendModalProps) {
  const [step, setStep] = useState(1); // 1: Form, 2: Password, 3: Success
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [gasFee, setGasFee] = useState('0.00');
  const [txHash, setTxHash] = useState('');

  // Réinitialiser au feremtur
  useEffect(() => {
    if (!isOpen) {
        setStep(1);
        setToAddress('');
        setAmount('');
        setPassword('');
    }
  }, [isOpen]);

  // Estimer le Gas quand l'adresse change
  useEffect(() => {
    const estimate = async () => {
        if (ethers.isAddress(toAddress) && parseFloat(amount) > 0) {
            // Simulation simple (21000 gaz standard)
            // Dans une V2 on fera provider.estimateGas()
            const fee = (21000 * 0.00000005).toFixed(5); // ~Approx
            setGasFee(fee);
        }
    };
    estimate();
  }, [toAddress, amount]);

  const handleSend = async () => {
    if (!password) return toast.error("Mot de passe requis");
    
    setLoading(true);
    try {
        // 1. DÉCHIFFREMENT
        const privateKey = await WalletService.decrypt(activeWallet.privateKeyEncrypted, password);
        
        // 2. CONNEXION BLOCKCHAIN
        const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`);
        const signer = new ethers.Wallet(privateKey, provider);

        // 3. PRÉPARATION TRANSACTION
        const tx = {
            to: toAddress,
            value: ethers.parseEther(amount)
        };

        // 4. ENVOI
        toast.info("Signature en cours...");
        const transaction = await signer.sendTransaction(tx);
        
        setTxHash(transaction.hash);
        setStep(3); // Écran succès
        toast.success("Envoyé !");

    } catch (e: any) {
        console.error(e);
        if (e.message.includes("Mot de passe")) {
            toast.error("Mot de passe incorrect");
        } else if (e.code === "INSUFFICIENT_FUNDS") {
            toast.error("Fonds insuffisants pour le gas");
        } else {
            toast.error("Erreur: " + e.message.slice(0, 50));
        }
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send size={20} className="text-indigo-400" /> Envoyer ETH
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition">
                <X size={20} />
            </button>
        </div>

        <div className="p-6">
            {step === 1 && (
                <div className="space-y-6">
                    {/* Input Adresse */}
                    <div>
                        <label className="text-sm text-slate-400 mb-1.5 block ml-1">Adresse Destinataire</label>
                        <div className="relative">
                            <input 
                                value={toAddress}
                                onChange={(e) => setToAddress(e.target.value)}
                                className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 pr-12 font-mono text-sm"
                                placeholder="0x..."
                            />
                            <button className="absolute right-3 top-3 text-indigo-400 hover:text-white">
                                <ScanLine size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Input Montant */}
                    <div>
                        <label className="text-sm text-slate-400 mb-1.5 block ml-1">Montant</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-bold text-lg"
                                placeholder="0.0"
                            />
                            <div className="absolute right-3 top-3 bg-white/10 px-2 py-1 rounded text-xs text-white font-bold">ETH</div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                            <span className="text-slate-500">≈ ${(parseFloat(amount || '0') * ethPrice).toFixed(2)} USD</span>
                            <span className="text-slate-500">Max: {activeWallet ? 'Dispo' : '0'}</span>
                        </div>
                    </div>

                    {/* Gas Info */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="text-indigo-300 flex items-center gap-1"><AlertCircle size={12}/> Frais de réseau estimés</span>
                        <span className="text-white font-mono">~{gasFee} ETH</span>
                    </div>

                    <button 
                        onClick={() => setStep(2)}
                        disabled={!toAddress || !amount || parseFloat(amount) <= 0}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuer <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <Wallet size={32} className="text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Confirmer l&apos;envoi</h3>
                        <p className="text-slate-400 text-sm mt-1">Vous allez envoyer <span className="text-white font-bold">{amount} ETH</span> à</p>
                        <p className="text-indigo-400 text-xs font-mono mt-1 bg-indigo-500/10 py-1 px-2 rounded-lg inline-block">
                            {toAddress.slice(0,6)}...{toAddress.slice(-4)}
                        </p>
                    </div>

                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe du wallet"
                        className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-center tracking-widest"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold">Retour</button>
                        <button 
                            onClick={handleSend}
                            disabled={loading || !password}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Signer & Envoyer'}
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="text-center py-6 animate-in zoom-in">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                        <Send size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Envoyé !</h3>
                    <p className="text-slate-400 text-sm mb-6">La transaction a été diffusée sur le réseau Ethereum.</p>
                    
                    <a 
                        href={`https://etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        className="text-indigo-400 text-sm hover:text-white underline mb-6 block"
                    >
                        Voir sur Etherscan
                    </a>

                    <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold">
                        Fermer
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

