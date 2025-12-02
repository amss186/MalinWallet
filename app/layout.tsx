import React from 'react';
import { Metadata } from 'next';
import '@/polyfills'; // Import polyfills
import './globals.css';

export const metadata: Metadata = {
  title: 'Malin Wallet',
  description: 'The most beautiful non-custodial wallet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#020617]">
        {children}
      </body>
    </html>
  );
}
