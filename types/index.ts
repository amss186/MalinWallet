// Définition des types de chaînes acceptées (C'est ça qui corrige l'erreur POLYGON)
export type ChainType = 'ETH' | 'SOL' | 'POLYGON';

// Interface pour un Actif (Token/Coin)
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number; // On utilise number pour faciliter les calculs dans le Dashboard
  price: number;
  change24h: number;
  chain: ChainType; 
  color?: string;
  decimals: number;
  contractAddress?: string;
  logoUrl?: string;
  chainId?: number;
}

// Interface pour un Wallet stocké
export interface WalletAccount {
  id: string; // Ajouté pour gérer plusieurs wallets proprement
  name: string;
  address: string;
  color: string;
  // C'est le nom que j'utilise dans SendModal et WalletService
  privateKeyEncrypted: string; 
  mnemonic?: string; // Optionnel
}

// Interface pour le Profil Utilisateur
export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  name: string;
  currency: string;
  language: string;
  createdAt: string;
  wallets: WalletAccount[];
  activeWalletId: string; // On utilise l'ID pour trouver le wallet actif
  contacts: any[]; 
  dappHistory: any[]; 
  favorites: any[]; 
}

export interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
}


