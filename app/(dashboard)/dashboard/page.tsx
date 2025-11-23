'use client';

import React, { useEffect, useState } from 'react';
import { ChainService } from '@/lib/chain';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Asset, UserProfile } from '@/types';
import { WalletService } from '@/lib/wallet';
import { Wallet, Send, ArrowDownLeft, RefreshCw, Plus, Download, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const userData = snap.data() as UserProfile;
          setUser(userData);

          let address = "";
          if (userData.activeWalletId) {
             const wallet = userData.wallets.find(w => w.id === userData.activeWalletId);
             if (wallet) address = wallet.address;
          }

          if (!address && (userData as any).activeWalletAddress) {
              address = (userData as any).activeWalletAddress;
          }

          if (address) {
             const ethBal = await ChainService.getNativeBalance(address);

             const ethAsset: Asset = {
                id: 'eth',
                symbol: 'ETH',
                name: 'Ethereum',
                balance: parseFloat(ethBal),
                price: 2200,
                change24h: 0,
                chain: 'ETH',
                color: '#627eea',
                decimals: 18
             } as any;

             setAssets([ethAsset]);
             setTotalBalance(parseFloat(ethBal) * 2200);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        if (importInput.includes(' ')) {
             wallet = WalletService.recoverWallet(importInput);
        } else {
             const { ethers } = await import('ethers');
             const w = new ethers.Wallet(importInput);
             wallet = { address: w.address, privateKey: w.privateKey };
        }

        if (!wallet) throw new Error("Wallet invalide");

        // 2. Encrypt Private Key
        const encryptedKey = await WalletService.encrypt(wallet.privateKey, encryptionPassword);

        // 3. Save to Firestore
        const userRef = doc(db, "users", auth.currentUser!.uid);
        const newWallet = {
            id: crypto.randomUUID(),
            name: `Wallet Importé ${user?.wallets.length ? user.wallets.length + 1 : 1}`,
            address: wallet.address,
            encryptedPrivateKey: encryptedKey,
            color: '#10b981', // Emerald for imported
            createdAt: new Date().toISOString()
        };

        await updateDoc(userRef, {
            wallets: arrayUnion(newWallet)
        });

        toast.success("Wallet importé avec succès !");
        setShowImportModal(false);
        setImportInput('');
        setEncryptionPassword('');
        // Reload page to reflect changes (simple way)
        window.location.reload();

    } catch (e: any) {
        toast.error("Erreur d'importation: " + e.message);
    } finally {
        setIsImporting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-indigo-500 animate-pulse">Chargement des données blockchain...</div>;
  }

  return (
    <div className="space-y-8 relative">
       <ToastContainer theme="dark" position="top-center" />

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

       {/* Header / Total Balance */}
       <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                 <p className="text-indigo-200 font-medium">Solde Total Estimé</p>
                 <button
                   onClick={() => setShowImportModal(true)}
                   className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-lg text-indigo-200 transition"
                 >
                    <Download size={14} /> Importer un wallet
                 </button>
             </div>
             <h1 className="text-5xl font-bold text-white mb-6">
               ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h1>

             <div className="flex gap-4 flex-wrap">
                <button className="flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition">
                   <Send size={20} /> Envoyer
                </button>
                <button className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition backdrop-blur-md">
                   <ArrowDownLeft size={20} /> Recevoir
                </button>
                <button className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition backdrop-blur-md">
                   <Plus size={20} /> Acheter
                </button>
             </div>
          </div>

          {/* Background Decor */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
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
                <div key={idx} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition last:border-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden relative">
                        {/* Fixed img tag to Image component */}
                         {asset.contractAddress ? (
                             <span className="font-bold text-indigo-400">{asset.symbol[0]}</span>
                         ) : (
                             // Fallback for native ETH logo or similar if URL is valid
                             // Using a simple text fallback if URL logic is complex or invalid
                             <span className="font-bold text-indigo-400">{asset.symbol[0]}</span>
                         )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{asset.name}</p>
                        <p className="text-xs text-slate-400">{asset.balance} {asset.symbol}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-white">
                        ${(asset.balance * asset.price).toFixed(2)}
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
