
"use client";

import { useState } from 'react';
import { SecurityService, TokenSecurity } from '@/services/securityService';
import { Search, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ScanPage() {
    const [address, setAddress] = useState('');
    const [report, setReport] = useState<TokenSecurity | null>(null);
    const [loading, setLoading] = useState(false);

    const handleScan = async () => {
        setLoading(true);
        // Default to Ethereum (1) for demo
        const result = await SecurityService.checkToken('1', address);
        setReport(result);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6">Scanner Anti-Rug</h1>

            <div className="bg-[#1C1C1E] p-4 rounded-xl flex items-center gap-2 mb-6">
                <Search className="text-gray-400" />
                <input
                    className="bg-transparent w-full outline-none"
                    placeholder="Coller l'adresse du token..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
            </div>

            <button
                onClick={handleScan}
                className="w-full bg-blue-600 font-bold py-3 rounded-xl mb-8"
            >
                {loading ? 'Analyse en cours...' : 'Scanner le Token'}
            </button>

            {report && (
                <div className="space-y-4 animate-fade-in">
                    <div className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center ${report.trust_score > 80 ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
                        {report.trust_score > 80 ? <ShieldCheck className="w-16 h-16 text-green-500 mb-2" /> : <ShieldAlert className="w-16 h-16 text-red-500 mb-2" />}
                        <h2 className="text-3xl font-bold">{report.trust_score}/100</h2>
                        <p className="text-gray-400">{report.trust_score > 80 ? 'Token Sain' : 'Risque Élevé'}</p>
                    </div>

                    <div className="bg-[#1C1C1E] rounded-xl p-4 space-y-3">
                         <DetailItem label="Open Source" value={report.is_open_source} />
                         <DetailItem label="Mintable (Impression illimitée)" value={report.is_mintable} danger />
                         <DetailItem label="Proxy Contract" value={report.is_proxy} warning />
                         <DetailItem label="Taxe Achat" text={`${Number(report.buy_tax) * 100}%`} />
                         <DetailItem label="Taxe Vente" text={`${Number(report.sell_tax) * 100}%`} />
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, text, danger, warning }: { label: string, value?: boolean, text?: string, danger?: boolean, warning?: boolean }) {
    let statusColor = "text-gray-400";
    let statusText = text || "N/A";

    if (value !== undefined) {
        if (danger) {
             statusText = value ? "OUI (DANGER)" : "Non";
             statusColor = value ? "text-red-500" : "text-green-500";
        } else if (warning) {
             statusText = value ? "OUI (Attention)" : "Non";
             statusColor = value ? "text-yellow-500" : "text-green-500";
        } else {
             statusText = value ? "Oui" : "Non";
             statusColor = value ? "text-green-500" : "text-gray-500";
        }
    }

    return (
        <div className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
            <span className="font-bold text-gray-300">{label}</span>
            <span className={`font-mono font-bold ${statusColor}`}>{statusText}</span>
        </div>
    );
}
