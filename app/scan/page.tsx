'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Zap, Image as ImageIcon } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ScanPage() {
  const router = useRouter();
  const [data, setData] = useState('No result');

  const handleScan = (result: any, error: any) => {
    if (result) {
      setData(result?.text);
      // Si c'est une adresse ETH/SOL valide, on redirige vers l'envoi
      if (result?.text.startsWith('0x') || result?.text.length > 30) {
         toast.success("Adresse détectée !");
         // Ici on pourrait rediriger vers /send avec l'adresse pré-remplie
         // router.push(`/send?to=${result.text}`);
         setTimeout(() => router.back(), 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col h-screen w-screen">
      <ToastContainer theme="dark" position="top-center" />
      
      {/* Zone Caméra */}
      <div className="relative flex-1 bg-black overflow-hidden flex flex-col justify-center">
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          className="w-full h-full object-cover"
          videoContainerStyle={{ paddingTop: '0', height: '100%' }}
          videoStyle={{ objectFit: 'cover', height: '100%' }}
        />

        {/* Overlay Noir + Cadre Transparent */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[50px] border-black/50"></div>
            
            {/* Cadre central animé */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-3xl overflow-hidden border-2 border-white/30">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-44 text-white font-medium text-sm bg-black/60 px-4 py-2 rounded-full backdrop-blur-md text-center">
                {data === 'No result' ? 'Scannez un code QR' : 'Code détecté !'}
            </div>
        </div>

        {/* Header Controls */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pt-12">
            <button onClick={() => router.back()} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <X size={24} />
            </button>
            <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20">
                <Zap size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}


