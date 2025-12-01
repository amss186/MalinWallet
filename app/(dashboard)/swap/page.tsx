'use client';

import React, { useState, useEffect } from 'react';
import { ChainService } from '@/lib/chain';
import { WalletService } from '@/lib/wallet'; // Pour déchiffrer la clé
import { ArrowDown, Loader2, AlertCircle, Settings, Wallet } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { ethers } from 'ethers';
import 'react-toastify/dist/ReactToastify.css';

// --- LISTE DES TOKENS (Mainnet) ---
// Pour ajouter d'autres tokens, il suffit de les mettre ici
const TOKENS = {
  ETH: { symbol: 'ETH', name: 'Ethereum', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  USDC: { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
  USDT: { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  DAI: { symbol: 'DAI', name: 'Dai', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/995/small/dai.png' }
};

export default function SwapPage() {
  // State Tokens
  const [sellToken, setSellToken] = useState(TOKENS.ETH);
  const [buyToken, setBuyToken] = useState(TOKENS.USDC);
  
  // State Amounts & Data
  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // State Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  // 1. Récupération du devis (Quote) avec Debounce
  useEffect(() => {
    const fetchQuote = async () => {
      if (!sellAmount || parseFloat(sellAmount) <= 0) {
          setQuote(null);
          return;
      }

      setLoading(true);
      try {
        // Conversion propre des décimales (ex: 1 ETH -> 1000000000000000000 wei)
        const amountInBaseUnits = ethers.parseUnits(sellAmount, sellToken.decimals).toString();

        // Appel API (qui passe par ton Proxy pour les frais !)
        const data = await ChainService.getZeroXQuote(sellToken.address, buyToken.address, amountInBaseUnits);
        
        if (data && !data.error) {
            setQuote(data);
        } else {
            setQuote(null);
            // Pas d'erreur toast ici pour ne pas spammer pendant la frappe
        }
      } catch (e) {
        console.error("Quote error", e);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 600); // Délai de 600ms après la frappe
    return () => clearTimeout(timer);
  }, [sellAmount, sellToken, buyToken]);


  // 2. Fonction d'exécution du Swap (Blockchain)
  const handleSwapExecution = async () => {
    if (!password) {
        toast.error("Veuillez entrer votre mot de passe");
        return;
    }

    setIsSwapping(true);
    try {
        // A. Récupérer l'utilisateur connecté
        // Note: Dans une vraie app, utilise un Context React. Ici on fait simple avec LocalStorage.
        const uid = localStorage.getItem('malin_last_uid') || ''; // Tu devras t'assurer de stocker l'UID au login
        // Fallback: On cherche n'importe quelle clé commençant par malin_user_
        let storageKey = '';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('malin_user_')) {
                storageKey = key;
                break;
            }
        }

        if (!storageKey) throw new Error("Aucun portefeuille trouvé. Connectez-vous.");

        const userData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const activeWallet = userData.wallets?.find((w: any) => w.id === userData.activeWalletId) || userData.wallets?.[0];

        if (!activeWallet) throw new Error("Portefeuille actif introuvable.");

        // B. Déchiffrement de la Clé Privée
        const privateKey = await WalletService.decrypt(activeWallet.privateKeyEncrypted, password);
        
        // C. Connexion Blockchain
        const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`);
        const signer = new ethers.Wallet(privateKey, provider);

        // D. Préparation de la Transaction (Données reçues de 0x)
        const tx = {
            to: quote.to,
            data: quote.data,
            value: quote.value, // Pour ETH -> Token
            gasPrice: quote.gasPrice,
            gasLimit: Math.floor(parseInt(quote.estimatedGas) * 1.5) // Marge de sécurité de 50%
        };

        // E. Envoi
        const transaction = await signer.sendTransaction(tx);
        
        toast.info("Transaction envoyée ! En attente de validation...", { autoClose: 5000 });
        setShowPasswordModal(false);
        setPassword('');

        // F. Attente de confirmation
        await transaction.wait();
        
        toast.success(`Swap réussi ! Hash: ${transaction.hash.slice(0, 6)}...`);
        setSellAmount('');
        setQuote(null);

    } catch (e: any) {
        console.error("Swap failed", e);
        if (e.message.includes("Mot de passe")) {
            toast.error("Mot de passe incorrect");
        } else if (e.code === 'INSUFFICIENT_FUNDS') {
            toast.error("Fonds insuffisants pour payer le gaz (ETH)");
        } else {
            toast.error("Échec du swap: " + (e.message || "Erreur inconnue"));
        }
    } finally {
        setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-4 pb-20">
       <ToastContainer theme="dark" position="top-center" />

       <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-white">Échanger</h2>
             <div className="flex gap-2">
                <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1">
                   <Settings size={12} /> 1% Slippage
                </div>
             </div>
          </div>

          {/* INPUT: VENDRE */}
          <div className="bg-black/40 rounded-2xl p-4 mb-2 border border-transparent hover:border-white/10 transition group">
             <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Vous payez</span>
                {/* Solde simulé pour l'UI - Dans le futur, connecte ça à ChainService.getNativeBalance */}
             </div>
             <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-3xl font-bold text-white focus:outline-none w-full placeholder:text-slate-600 appearance-none"
                />
                <div className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl font-bold text-white flex items-center gap-2 transition cursor-pointer min-w-[120px] justify-between">
                   <div className="flex items-center gap-2">
                       <img src={sellToken.logo} alt={sellToken.symbol} className="w-6 h-6 rounded-full" />
                       {sellToken.symbol}
                   </div>
                </div>
             </div>
          </div>

          {/* SWITCH ARROW */}
          <div className="flex justify-center -my-5 relative z-10">
             <button 
                onClick={() => {
                    const temp = sellToken;
                    setSellToken(buyToken);
                    setBuyToken(temp);
                }}
                className="bg-[#0f172a] border border-white/10 p-2 rounded-xl text-indigo-400 hover:text-white hover:scale-110 transition shadow-lg"
             >
               <ArrowDown size={20} />
             </button>
          </div>

          {/* INPUT: RECEVOIR */}
          <div className="bg-black/40 rounded-2xl p-4 mt-2 border border-transparent hover:border-white/10 transition">
             <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Vous recevez (estimé)</span>
             </div>
             <div className="flex items-center gap-4">
                <input
                  type="text"
                  disabled
                  // Calcul propre des décimales pour l'affichage (ex: USDC 6 décimales)
                  value={quote ? parseFloat(ethers.formatUnits(quote.buyAmount, buyToken.decimals)).toFixed(4) : ''}
                  placeholder="0.0"
                  className="bg-transparent text-3xl font-bold text-indigo-400 focus:outline-none w-full placeholder:text-slate-600"
                />
                <div className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl font-bold text-white flex items-center gap-2 transition cursor-pointer min-w-[120px] justify-between">
                    <div className="flex items-center gap-2">
                       <img src={buyToken.logo} alt={buyToken.symbol} className="w-6 h-6 rounded-full" />
                       {buyToken.symbol}
                    </div>
                </div>
             </div>
          </div>

          {/* INFO & FRAIS */}
          {quote && (
            <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm space-y-2 animate-in fade-in slide-in-from-top-2">
               <div className="flex justify-between text-slate-400">
                 <span>Taux</span>
                 <span className="text-white font-medium">
                    1 {sellToken.symbol} ≈ {(parseFloat(ethers.formatUnits(quote.buyAmount, buyToken.decimals)) / parseFloat(sellAmount)).toFixed(4)} {buyToken.symbol}
                 </span>
               </div>
               <div className="flex justify-between text-slate-400">
                 <span>Network Cost (Gas)</span>
                 <span className="text-white flex items-center gap-1">
                    <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" className="w-3 h-3" />
                    {parseFloat(ethers.formatEther(BigInt(quote.estimatedGas) * BigInt(quote.gasPrice))).toFixed(5)} ETH
                 </span>
               </div>
               <div className="flex justify-between text-indigo-300 pt-2 border-t border-indigo-500/20">
                 <span className="flex items-center gap-1">Frais de service (Inclus) <AlertCircle size={12}/></span>
                 <span className="font-bold">1%</span>
               </div>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={() => setShowPasswordModal(true)}
            disabled={!quote || loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-lg font-bold rounded-xl transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Échanger maintenant'}
          </button>
       </div>

       {/* MODAL DE CONFIRMATION (MOT DE PASSE) */}
       {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <Wallet size={24} />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Confirmer le Swap</h3>
                <p className="text-slate-400 text-center text-sm mb-6">
                    Entrez votre mot de passe pour signer cette transaction de <strong>{sellAmount} {sellToken.symbol}</strong>.
                </p>

                <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe du wallet"
                    className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:border-indigo-500 focus:outline-none"
                    autoFocus
                />

                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowPasswordModal(false)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSwapExecution}
                        disabled={isSwapping || !password}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSwapping ? <Loader2 className="animate-spin" /> : 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
}

