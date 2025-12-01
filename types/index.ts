// ✅ ICI : J'ai ajouté 'POLYGON' pour que l'erreur disparaisse
export type ChainType = 'ETH' | 'SOL' | 'POLYGON';

// Interface pour un Actif (Token/Coin)
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  chain: ChainType; // Utilise le type mis à jour ci-dessus
  color?: string;
  decimals: number;
  contractAddress?: string;
  logoUrl?: string;
  chainId?: number;
}

// Interface pour un Wallet stocké
export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  color: string;
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
  activeWalletId: string;
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


