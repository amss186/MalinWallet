'use client';

import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex font-sans relative overflow-hidden">
        {/* Main Content */}
        <main className="w-full h-full relative z-10">
            {children}
        </main>
    </div>
  );
}
