'use client';

import React, { useEffect, useState } from 'react';
import { ChainService } from '@/lib/chain';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Asset, UserProfile, WalletAccount } from '@/types';
import { WalletService } from '@/lib/wallet';
import { Wallet, Send, ArrowDownLeft, RefreshCw, Plus, Download, X, QrCode, Copy, ExternalLink, CreditCard } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Form States
  const [importInput, setImportInput] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // User is logged in, check LocalStorage for wallet
      const uid = currentUser.uid;
      const storageKey = `malin_user_${uid}`;
      const storedData = localStorage.getItem(storageKey);

      if (!storedData) {
        // Logged in but no wallet -> Go to onboarding
        router.push('/onboarding');
        return;
      }

      try {
        const userData = JSON.parse(storedData) as UserProfile;
        setUser(userData);

        if (!userData.wallets || userData.wallets.length === 0) {
             router.push('/onboarding');
             return;
        }

        let address = "";
        if (userData.activeWalletId) {
            const wallet = userData.wallets.find(w => w.id === userData.activeWalletId);
            if (wallet) address = wallet.address;
        }

        if (!address && (userData as any).activeWalletAddress) {
            address = (userData as any).activeWalletAddress;
        }

        if (address) {
            // Fetch Native Balance (ETH)
            const ethBalPromise = ChainService.getNativeBalance(address);

            // Fetch ERC-20 Tokens
            const tokensPromise = ChainService.getTokenBalances(address);

            const [ethBal, tokens] = await Promise.all([ethBalPromise, tokensPromise]);

            // Hardcoded ETH price for demo - ideally fetch from CoinGecko
            const ethPrice = 2200;

            const ethAsset: Asset = {
              id: 'eth',
              symbol: 'ETH',
              name: 'Ethereum',
              balance: parseFloat(ethBal),
              price: ethPrice,
              change24h: 0,
              chain: 'ETH',
              color: '#627eea',
              decimals: 18
            } as any;

            // Combine
            const allAssets = [ethAsset, ...tokens];
            setAssets(allAssets);

            // Calculate Total
            // Token prices are 0 by default in current API implementation, so total is mostly ETH
            // To fix this we'd need a price oracle
            const tokensVal = tokens.reduce((acc, t) => acc + (t.balance * t.price), 0);
            setTotalBalance((parseFloat(ethBal) * ethPrice) + tokensVal);
        }
      } catch (e) {
        console.error(e);
        toast.error("Erreur de chargement des données locales");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleImportWallet = async () => {
    if (!importInput || !encryptionPassword) {
        toast.error("Veuillez remplir tous les champs");
        return;
    }

    if (encryptionPassword.length < 8) {
        toast.error("Le mot de passe doit faire au moins 8 caractères");
        return;
    }

    setIsImporting(true);
    try {
        // 1. Recover Wallet
        let wallet;
        if (importInput.trim().includes(' ')) {
             wallet = WalletService.recoverWallet(importInput);
        } else {
             const { ethers } = await import('ethers');
             const w = new ethers.Wallet(importInput);
             wallet = { address: w.address, privateKey: w.privateKey };
        }

        if (!wallet) throw new Error("Wallet invalide");

        // 2. Encrypt Private Key
        const encryptedKey = await WalletService.encrypt(wallet.privateKey, encryptionPassword);

        // 3. Save to LocalStorage
        if (!auth.currentUser) throw new Error("User not authenticated");

        const uid = auth.currentUser.uid;
        const storageKey = `malin_user_${uid}`;
        const storedData = localStorage.getItem(storageKey);

        let userData: UserProfile;
        if (storedData) {
             userData = JSON.parse(storedData);
        } else {
             throw new Error("Profil utilisateur introuvable");
        }

        const newWallet: WalletAccount = {
            id: crypto.randomUUID(),
            name: `Wallet Importé ${userData.wallets.length + 1}`,
            address: wallet.address,
            color: '#10b981', // Emerald for imported
            privateKeyEncrypted: encryptedKey
        };

        userData.wallets.push(newWallet);
        userData.activeWalletId = newWallet.id; // Switch to imported wallet

        localStorage.setItem(storageKey, JSON.stringify(userData));

        toast.success("Wallet importé et activé !");
        setShowImportModal(false);
        setImportInput('');
        setEncryptionPassword('');
        window.location.reload();

    } catch (e: any) {
        toast.error("Erreur d'importation: " + e.message);
    } finally {
        setIsImporting(false);
    }
  };

  const getActiveWalletAddress = () => {
      if (!user) return "";
      const w = user.wallets.find(w => w.id === user.activeWalletId);
      return w ? w.address : "";
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Adresse copiée !");
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-400">Synchronisation du coffre-fort...</p>
            </div>
        </div>
    );
  }

  const activeAddress = getActiveWalletAddress();

  return (
    <div className="space-y-8 relative pb-20">
       <ToastContainer theme="dark" position="top-center" />

       {/* --- MODALS --- */}

       {/* Import Modal */}
       {showImportModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Importer un Wallet</h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Phrase Secrète ou Clé Privée</label>
                        <textarea
                            value={importInput}
                            onChange={(e) => setImportInput(e.target.value)}
                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 text-sm h-24"
                            placeholder="Entrez vos 12 mots ou votre clé privée..."
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Nouveau mot de passe de chiffrement</label>
                        <input
                            type="password"
                            value={encryptionPassword}
                            onChange={(e) => setEncryptionPassword(e.target.value)}
                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                            placeholder="Pour sécuriser cette clé"
                        />
                    </div>

                    <button
                        onClick={handleImportWallet}
                        disabled={isImporting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                        {isImporting ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
                        Importer
                    </button>
                </div>
            </div>
         </div>
       )}

       {/* Receive Modal */}
       {showReceiveModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl relative text-center">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-2">Recevoir ETH</h2>
                <p className="text-slate-400 text-sm mb-6">Scanner pour payer</p>

                <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6">
                    {/* Placeholder for QR Code - In real app use 'qrcode.react' */}
                    <div className="w-48 h-48 bg-slate-200 flex items-center justify-center">
                        <QrCode className="text-slate-900 w-full h-full" />
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                    <p className="text-slate-300 text-xs truncate font-mono">{activeAddress}</p>
                    <button onClick={() => copyToClipboard(activeAddress)} className="text-indigo-400 hover:text-white transition">
                        <Copy size={16} />
                    </button>
                </div>

                <p className="text-slate-500 text-xs mt-4">
                    Envoyez uniquement des actifs Ethereum (ERC-20) à cette adresse.
                </p>
            </div>
         </div>
       )}

       {/* Buy Modal (Placeholder) */}
       {showBuyModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl relative text-center">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Acheter Crypto</h2>
                <p className="text-slate-400 text-sm mb-6">
                    Choisissez un partenaire pour acheter des cryptos par carte bancaire.
                </p>

                <div className="space-y-3">
                    <button className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-xl flex items-center justify-between group transition">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                            <div className="text-left">
                                <p className="font-bold text-white">MoonPay</p>
                                <p className="text-xs text-slate-400">Carte, Apple Pay</p>
                            </div>
                        </div>
                        <ExternalLink size={18} className="text-slate-500 group-hover:text-white" />
                    </button>

                    <button className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-xl flex items-center justify-between group transition">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                            <div className="text-left">
                                <p className="font-bold text-white">Ramp Network</p>
                                <p className="text-xs text-slate-400">Virement, Carte</p>
                            </div>
                        </div>
                        <ExternalLink size={18} className="text-slate-500 group-hover:text-white" />
                    </button>
                </div>

                <p className="text-slate-500 text-xs mt-6">
                    Service fourni par des tiers. Des frais peuvent s&apos;appliquer.
                </p>
            </div>
         </div>
       )}

       {/* --- MAIN CONTENT --- */}

       {/* Header / Total Balance */}
       <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                 <p className="text-indigo-200 font-medium">Solde Total Estimé</p>
                 <div className="flex gap-2">
                     <button
                       onClick={() => setShowImportModal(true)}
                       className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-lg text-indigo-200 transition"
                     >
                        <Download size={14} /> Importer
                     </button>
                     <button
                       onClick={() => {
                           auth.signOut();
                           router.push('/login');
                       }}
                       className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-xs px-3 py-1.5 rounded-lg text-red-200 transition border border-red-500/20"
                     >
                        Déconnexion
                     </button>
                 </div>
             </div>
             <h1 className="text-5xl font-bold text-white mb-6">
               ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h1>

             <div className="flex gap-4 flex-wrap">
                <button className="flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg shadow-white/5">
                   <Send size={20} /> Envoyer
                </button>
                <button
                    onClick={() => setShowReceiveModal(true)}
                    className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition backdrop-blur-md border border-white/10"
                >
                   <ArrowDownLeft size={20} /> Recevoir
                </button>
                <button
                    onClick={() => setShowBuyModal(true)}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/20"
                >
                   <Plus size={20} /> Acheter
                </button>
             </div>
          </div>

          {/* Background Decor */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none"></div>
       </div>

       {/* Assets List */}
       <div>
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Vos Actifs</h2>
            <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white">
               <RefreshCw size={20} />
            </button>
         </div>

         <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            {assets.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Aucun actif trouvé sur ce réseau.</div>
            ) : (
              assets.map((asset, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition last:border-0 cursor-pointer">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden relative border border-indigo-500/30">
                         {asset.contractAddress ? (
                             <span className="font-bold text-indigo-400">{asset.symbol[0]}</span>
                         ) : (
                             <span className="font-bold text-indigo-400">{asset.symbol[0]}</span>
                         )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{asset.name}</p>
                        <p className="text-xs text-slate-400">{asset.balance.toFixed(4)} {asset.symbol}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-white">
                        ${(asset.balance * asset.price).toFixed(2)}
                      </p>
                      <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {asset.change24h > 0 ? '+' : ''}{asset.change24h}%
                      </p>
                   </div>
                </div>
              ))
            )}
         </div>
       </div>
    </div>
  );
}
