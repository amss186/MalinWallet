
import React, { useRef } from 'react';
import { Asset } from '../types.ts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WalletCardProps {
  asset: Asset;
}

const WalletCard: React.FC<WalletCardProps> = ({ asset }) => {
  const isPositive = asset.change24h >= 0;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg group hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/10 bg-slate-900/80 backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, ${asset.color}15, #0f172a 90%)`
      }}
    >
      {/* Interactive spotlight effect */}
      <div 
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.04), transparent 40%)`
        }}
      />

      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:opacity-30 group-hover:scale-150" style={{ backgroundColor: asset.color }}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md font-bold text-lg shadow-inner border border-white/10">
             {asset.symbol[0]}
           </div>
           <div>
             <h3 className="font-bold text-lg leading-tight text-white group-hover:text-indigo-100 transition-colors">{asset.name}</h3>
             <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors bg-slate-800/50 inline-block px-1.5 rounded mt-0.5 border border-white/5">{asset.chain}</p>
           </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(asset.change24h).toFixed(2)}%
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <p className="text-3xl font-bold tracking-tight">
          {asset.balance.toLocaleString()} <span className="text-lg text-white/60 font-medium">{asset.symbol}</span>
        </p>
        <p className="text-sm text-slate-400 flex items-center gap-2 group-hover:text-slate-300 transition-colors">
          ≈ ${(asset.balance * asset.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
        </p>
      </div>
    </div>
  );
};

export default WalletCard;
