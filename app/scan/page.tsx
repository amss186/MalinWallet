'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Image as ImageIcon, Zap } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);

  // Simulation d'accès caméra pour l'UI
  useEffect(() => {
    // Dans le futur, on demandera ici navigator.mediaDevices.getUserMedia
    const timer = setTimeout(() => setHasPermission(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      
      {/* Camera Viewport (Simulation) */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden">
        {hasPermission ? (
            // Ici viendra le flux vidéo <video />
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center text-slate-600">
                <p>Initialisation caméra...</p>
            </div>
        ) : (
            <div className="absolute inset-0 bg-black" />
        )}

        {/* Overlay Sombre + Cadre de Scan */}
        <div className="absolute inset-0 pointer-events-none">
            {/* Dark Mask */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* Scan Box Area (Clear) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-3xl">
                {/* Coins du cadre (Blancs comme sur ton screen) */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                
                {/* Ligne de scan animée */}
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-40 text-white font-medium text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                Scanner un code QR WalletConnect
            </div>
        </div>

        {/* Header Controls */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
            <button 
                onClick={() => router.back()} 
                className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
            >
                <X size={24} />
            </button>
            <div className="flex gap-4">
                <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition">
                    <Zap size={20} /> {/* Flash */}
                </button>
            </div>
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-10 left-0 w-full flex justify-center z-10">
             <button className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                    <ImageIcon size={24} />
                </div>
                <span className="text-xs">Importer image</span>
             </button>
        </div>

      </div>
      
      <style jsx>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

