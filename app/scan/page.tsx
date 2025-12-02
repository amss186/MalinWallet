'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ScanPage() {
  const router = useRouter();
  const [data, setData] = useState('No result');

  const handleScan = (result: any, error: any) => {
    if (result) {
      setData(result?.text);
      if (result?.text.startsWith('0x') || (result?.text.length > 30)) {
         toast.success("Adresse détectée !");
         setTimeout(() => router.back(), 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col h-screen w-screen">
      <ToastContainer theme="dark" position="top-center" />
      <div className="relative flex-1 bg-black overflow-hidden flex flex-col justify-center">
        <div className="h-full w-full object-cover">
            <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                className="w-full h-full"
                videoContainerStyle={{ paddingTop: '0', height: '100%' }}
                videoStyle={{ objectFit: 'cover', height: '100%' }}
            />
        </div>
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[50px] border-black/50"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-3xl overflow-hidden border-2 border-white/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-44 text-white font-medium text-sm bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">Visez un QR Code</div>
        </div>
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pt-12">
            <button onClick={() => router.back()} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20"><X size={24} /></button>
        </div>
      </div>
      <style jsx>{` @keyframes scan { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } } `}</style>
    </div>
  );
}


