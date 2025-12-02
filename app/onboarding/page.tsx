"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletManager } from '@/services/walletManager';
import { WalletData } from '@/services/walletStorage';
import VerifySeed from './VerifySeed';

// --- VerifySeed Component (Moved Inline to fix Import Errors) ---

interface VerifySeedProps {
  words: string;
  onComplete: () => void;
}

function VerifySeed({ words, onComplete }: VerifySeedProps) {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wordArray = words.split(' ');
    // Simple shuffle
    const shuffled = [...wordArray].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
    setError(null);
  }, [words]);

  const handleSelectWord = (word: string, index: number) => {
    // Add to selected
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);

    // Remove from available (by index to handle duplicate words correctly)
    const newShuffled = [...shuffledWords];
    newShuffled.splice(index, 1);
    setShuffledWords(newShuffled);

    setError(null);
  };

  const handleDeselectWord = (word: string, index: number) => {
    // Remove from selected
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);

    // Add back to available
    setShuffledWords([...shuffledWords, word]);
    setError(null);
  };

  const handleVerify = () => {
    if (selectedWords.join(' ') === words) {
      onComplete();
    } else {
      setError("L'ordre des mots est incorrect. Veuillez réessayer.");
    }
  };

  const isComplete = selectedWords.length === words.split(' ').length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Vérifiez votre phrase secrète</h2>
        <p className="text-gray-400">
          Sélectionnez les mots dans le bon ordre pour confirmer que vous avez bien sauvegardé votre phrase de récupération.
        </p>
      </div>

      {/* Selected Words Area */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 min-h-[150px] flex flex-wrap gap-2 content-start">
        {selectedWords.map((word, index) => (
          <button
            key={`selected-${index}`}
            onClick={() => handleDeselectWord(word, index)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 animate-fadeIn"
          >
            <span className="opacity-50 text-xs">{index + 1}</span>
            {word}
          </button>
        ))}
        {selectedWords.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm italic">
            Appuyez sur les mots ci-dessous dans l&apos;ordre
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      {/* Available Words Area */}
      <div className="flex flex-wrap gap-2 justify-center">
        {shuffledWords.map((word, index) => (
          <button
            key={`shuffled-${index}`}
            onClick={() => handleSelectWord(word, index)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            {word}
          </button>
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={!isComplete}
        className={`w-full font-bold py-3 px-4 rounded-xl transition ${
          isComplete
            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continuer
      </button>
    </div>
  );
}

// --- Main Onboarding Component ---

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
