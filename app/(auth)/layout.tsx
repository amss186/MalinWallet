import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden p-4">
      {/* Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[128px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
         {children}
      </div>
    </div>
  );
}
