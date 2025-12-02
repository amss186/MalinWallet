
"use client";

import { useState, useEffect } from 'react';
import { WalletManager } from '@/services/walletManager';
import { WalletData } from '@/services/walletStorage';

export default function RecoveryPage() {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [shares, setShares] = useState<string[]>([]);
    const [step, setStep] = useState<'intro' | 'generate' | 'verify'>('intro');

    useEffect(() => {
        WalletManager.getWallets().then(w => {
            if (w.length > 0) setWallet(w[0]);
        });
    }, []);

    const handleGenerate = async () => {
        if (!wallet) return;

        try {
            // Dynamically import the service to avoid build-time issues with crypto/secrets.js
            const { RecoveryService } = await import('@/services/recoveryService');

            // Split into 3 shares, need 3 to recover
            const parts = RecoveryService.splitSecret(wallet.secret, 3, 3);
            setShares(parts);
            setStep('generate');
        } catch (e) {
            console.error("Failed to load recovery service", e);
            alert("Erreur lors du chargement du module de sécurité.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
             <h1 className="text-2xl font-bold mb-4">Recovery Social HALAL</h1>
             <p className="text-gray-400 mb-8">
                Récupération sans serveur. Divisez votre clé en 3 parties et confiez-les à 3 personnes de confiance.
                Le serveur ne voit rien. Votre clé ne se reconstitue que si les 3 parties sont réunies.
             </p>

             {step === 'intro' && (
                 <button
                    onClick={handleGenerate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl"
                 >
                    Générer mes clés de secours
                 </button>
             )}

             {step === 'generate' && (
                 <div className="space-y-6">
                     <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                         <h3 className="font-bold text-yellow-500 mb-2">Gardien 1</h3>
                         <p className="font-mono text-sm break-all">{shares[0]}</p>
                     </div>
                     <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                         <h3 className="font-bold text-blue-500 mb-2">Gardien 2</h3>
                         <p className="font-mono text-sm break-all">{shares[1]}</p>
                     </div>
                     <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                         <h3 className="font-bold text-green-500 mb-2">Gardien 3</h3>
                         <p className="font-mono text-sm break-all">{shares[2]}</p>
                     </div>

                     <div className="text-sm text-gray-500 mt-4">
                         ⚠️ Notez ces clés physiquement ou transmettez-les de manière sécurisée (de main à main).
                         Ne les envoyez pas par internet si possible.
                     </div>
                 </div>
             )}
        </div>
    );
}
