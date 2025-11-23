import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex font-sans relative overflow-hidden selection:bg-indigo-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[128px] animate-blob"></div>
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      <Sidebar />

      <main className="flex-1 md:ml-72 p-4 md:p-8 max-w-7xl mx-auto w-full pb-32 md:pb-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
