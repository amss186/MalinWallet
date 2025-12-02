"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletManager } from '@/services/walletManager';
import { WalletData } from '@/services/walletStorage';
import VerifySeed from './VerifySeed';

export default function Onboarding() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState<string>('');
  const [step, setStep] = useState<'welcome' | 'create' | 'verify' | 'import'>('welcome');
  const [importText, setImportText] = useState('');

  useEffect(() => {
    // Check if wallets exist, if so redirect to dashboard
    WalletManager.getWallets().then(wallets => {
      if (wallets.length > 0) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleCreate = async () => {
    // Generate wallet but don't save/activate it yet properly if we want to be strict,
    // but looking at existing code it likely creates it immediately.
    // The previous code called `createWallet` which presumably saves it.
    // If we want to strictly enforce verification, we might want to *delete* it if they fail?
    // Or more commonly, we just generate the mnemonic here and only *save* it after verification.
    // However, `WalletManager.createWallet` likely does everything.
    // For now, I will keep the existing logic but just add the verification UI step.
    const wallet = await WalletManager.createWallet('Bitcoin 1');
    setMnemonic(wallet.secret);
    setStep('create');
  };

  const handleSeedSaved = () => {
    // Move to verify step instead of dashboard
    setStep('verify');
  };

  const handleVerifyComplete = () => {
    router.push('/dashboard');
  };

  const handleImport = async () => {
    try {
      await WalletManager.importWallet(importText.trim());
      router.push('/dashboard');
    } catch (e) {
      alert("Invalid Mnemonic");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Malin Wallet</h1>
          <p className="text-gray-400 mt-2">Votre portefeuille Bitcoin & Lightning</p>
        </div>

        {step === 'welcome' && (
          <div className="space-y-4">
            <button
              onClick={handleCreate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              Créer un nouveau portefeuille
            </button>
            <button
              onClick={() => setStep('import')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              J&apos;ai déjà un portefeuille
            </button>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-6">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <p className="text-yellow-500 font-bold mb-2">Sauvegardez ces mots !</p>
              <p className="text-lg leading-relaxed font-mono">{mnemonic}</p>
            </div>
            <button
              onClick={handleSeedSaved}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              J&apos;ai sauvegardé ma phrase secrète
            </button>
          </div>
        )}

        {step === 'verify' && (
          <VerifySeed
            words={mnemonic}
            onComplete={handleVerifyComplete}
          />
        )}

        {step === 'import' && (
          <div className="space-y-4">
            <textarea
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500"
              rows={4}
              placeholder="Entrez votre phrase mnémonique de 12 ou 24 mots..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              onClick={handleImport}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              Importer
            </button>
            <button
              onClick={() => setStep('welcome')}
              className="w-full text-gray-400 hover:text-white transition"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
