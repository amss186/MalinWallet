
export type ChainType = 'BTC' | 'ETH' | 'SOL' | 'MATIC' | 'BNB' | 'AVAX' | 'DOT' | 'OTHER';

export interface Network {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number | string;
  symbol: string;
  blockExplorerUrl?: string;
  isTestnet: boolean;
  type: 'EVM' | 'SOLANA' | 'BITCOIN';
}

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  color: string;
  privateKeyEncrypted?: string; // Real encrypted storage
  type?: 'evm' | 'solana';
}

export interface DAppHistoryItem {
  url: string;
  title: string;
  lastVisited: string;
  icon?: string;
}

export interface WalletConnectSession {
  id: string;
  dappName: string;
  dappUrl: string;
  dappIcon?: string;
  chains: string[];
  connectedAt: string;
  topic: string;
}

export interface UserProfile {
  id: string;
  email: string;
  uid: string; // Firebase UID
  name: string;
  currency: string;
  language: 'en' | 'fr';
  createdAt: string;
  wallets: WalletAccount[];
  activeWalletId: string;
  contacts: Contact[];
  dappHistory: DAppHistoryItem[];
  favorites: string[]; // URLs
  wcSessions?: WalletConnectSession[]; // Active WalletConnect sessions
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  memo?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  chain: ChainType;
  networkId?: string;
  color: string;
  isCustom?: boolean;
  contractAddress?: string;
  decimals?: number;
  logoUrl?: string;
  chainId?: number;
}

export interface NFT {
  contract: { address: string };
  id: { tokenId: string };
  title: string;
  description: string;
  media: { gateway: string }[];
  metadata: { image?: string };
  balance?: number;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'buy';
  asset: string;
  amount: number;
  toFrom: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
  walletId: string;
  networkId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  sources?: { uri: string; title: string }[];
  mapLocations?: { uri: string; title: string }[];
}

export type ViewState = 'onboarding' | 'auth' | 'dashboard' | 'wallet' | 'swap' | 'earn' | 'ai-chat' | 'settings' | 'analytics' | 'learn';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

export interface StakingOption {
  id: string;
  protocol: string;
  asset: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  minDeposit: number;
  description: string;
}
    