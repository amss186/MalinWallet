"use client";

import { useState, useEffect } from 'react';

interface VerifySeedProps {
  words: string;
  onComplete: () => void;
}

export function VerifySeed({ words, onComplete }: VerifySeedProps) {
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
            Appuyez sur les mots ci-dessous dans l'ordre
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
