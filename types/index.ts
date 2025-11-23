export interface WalletAccount {
  address: string;
  name: string;
  encryptedPrivateKey: string; // JSON string with iv, salt, data
}

export interface UserProfile {
  uid: string;
  email: string;
  wallets: WalletAccount[];
  activeWalletAddress: string;
  settings: {
    currency: string;
    language: string;
  };
}

export interface Asset {
  symbol: string;
  name: string;
  balance: string; // Using string for precision (BigNumber)
  decimals: number;
  price: number;
  logoUrl?: string;
  contractAddress?: string;
  chainId: number;
}

export interface NFT {
  contract: string;
  tokenId: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'ERC721' | 'ERC1155';
}
