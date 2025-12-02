export type ChainType = 'ETH' | 'SOL' | 'POLYGON';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  chain: ChainType;
  color?: string;
  decimals: number;
  contractAddress?: string;
  logoUrl?: string;
  chainId?: number;
}

export interface WalletAccount {
  id: string;
  name: string;
  address: string;        // Adresse ETH (0x...)
  solanaAddress?: string; // ✅ NOUVEAU : Adresse Solana (Optionnel pour compatibilité)
  color: string;
  privateKeyEncrypted: string;
  mnemonic?: string;
}

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


