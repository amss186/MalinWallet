
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Asset } from '../types';
import { BrainCircuit, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { analyzePortfolio } from '../services/geminiService';

interface PortfolioAnalyticsProps {
  assets: Asset[];
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ assets }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter out assets with very small value for the chart to look nice
  const data = assets
    .filter(a => (a.balance * a.price) > 0)
    .map(asset => ({
      name: asset.name,
      value: asset.balance * asset.price,
      color: asset.color
    }));
    
  const hasData = data.length > 0;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePortfolio(assets);
      setAnalysis(result || "Analysis unavailable.");
    } catch (e) {
      console.error(e);
      setAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-white mb-4">AI Analytics</h2>

      {hasData ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 min-h-[300px]">
          <h3 className="text-lg font-bold text-white mb-4">Asset Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {data.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Performance / Value Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 min-h-[300px]">
           <h3 className="text-lg font-bold text-white mb-4">Asset Value</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                 <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val.toFixed(0)}`} />
                 <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                 />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      ) : (
        <div className="p-8 border border-slate-800 bg-slate-900/30 rounded-3xl text-center">
            <p className="text-slate-500">Add assets with balances to see charts.</p>
        </div>
      )}

      {/* AI Insight Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <BrainCircuit className="text-white" size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white">Deep Portfolio Intelligence</h3>
               <p className="text-sm text-slate-400">Powered by Gemini 3 Pro</p>
             </div>
          </div>
          {!analysis && (
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !hasData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </button>
          )}
        </div>

        {analysis ? (
           <div className="prose prose-invert prose-sm max-w-none bg-black/20 p-6 rounded-2xl border border-white/5">
             <div className="whitespace-pre-wrap">{analysis}</div>
             <button onClick={() => setAnalysis(null)} className="mt-4 text-xs text-indigo-400 hover:text-white">Reset Analysis</button>
           </div>
        ) : (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl">
             <TrendingUp size={40} className="mx-auto mb-3 opacity-50" />
             <p>Generate a comprehensive breakdown of your portfolio's risks and opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalytics;
