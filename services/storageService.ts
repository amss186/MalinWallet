
import { Asset, Transaction, UserProfile, WalletAccount } from '../types';
import { DEFAULT_NETWORKS } from '../constants';
import { WalletService } from '../lib/wallet';
import { SecureStorage } from './secureStorage';
import { FirebaseService } from './firebaseConfig';

const STORAGE_KEYS = {
  USER: 'malin_user_v6_secure', // Incremented version
  ASSETS: 'malin_assets_v4_real',
  TRANSACTIONS: 'malin_transactions_v4_real',
  NETWORKS: 'malin_networks_v1'
};

const DEFAULT_ASSETS: Asset[] = [
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', balance: 0.00, price: 0, change24h: 0, chain: 'ETH', color: '#627EEA', networkId: 'eth-mainnet' },
];

export const StorageService = {
  getUser: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch (e) {
      return null;
    }
  },

  saveUser: (user: UserProfile) => {
    // 1. Sauvegarde locale du Profil PUBLIC (sans clés privées si possible, mais ici on stocke les IDs)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    // 2. Sync Cloud (Profil public uniquement)
    if (user.uid) {
      FirebaseService.saveUserProfile(user);
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Création de compte sécurisée
  registerUserEncrypted: async (name: string, email: string, uid: string, passwordForEncryption: string): Promise<UserProfile> => {
    const walletId = 'wallet-' + Date.now();

    // 1. Generate Wallet using the unified WalletService
    const cryptoWallet = WalletService.createEVMWallet();

    // 2. Encrypt Key using Argon2id + AES-GCM
    const encryptedKey = await WalletService.encrypt(cryptoWallet.privateKey, passwordForEncryption);

    // 3. Store Encrypted Vault in IndexedDB (NOT LocalStorage)
    await SecureStorage.saveWallet(walletId, encryptedKey, 'evm');

    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      uid,
      name,
      email,
      currency: 'USD',
      language: 'fr',
      createdAt: new Date().toISOString(),
      wallets: [
        {
          id: walletId,
          name: 'Compte Principal',
          address: cryptoWallet.address, 
          privateKeyEncrypted: 'STORED_IN_SECURE_VAULT', // Placeholder for UI reference
          color: '#00A99D'
        }
      ],
      activeWalletId: walletId,
      contacts: [],
      dappHistory: [],
      favorites: []
    };
    
    StorageService.saveUser(newUser);
    
    // Initial assets
    const initialAssets = DEFAULT_ASSETS.map(a => ({...a}));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(initialAssets));
    
    return newUser;
  },

  // Add a new wallet (EVM or Solana)
  addWallet: async (user: UserProfile, name: string, password: string, type: 'evm' | 'solana' = 'evm'): Promise<UserProfile> => {
    let cryptoWallet;
    if (type === 'solana') {
        cryptoWallet = WalletService.createSolanaWallet();
    } else {
        cryptoWallet = WalletService.createEVMWallet();
    }

    const encryptedKey = await WalletService.encrypt(cryptoWallet.privateKey, password);
    const walletId = 'wallet-' + Date.now();

    // Store in Secure Storage
    await SecureStorage.saveWallet(walletId, encryptedKey, type);
    
    const newWallet: WalletAccount = {
      id: walletId,
      name,
      address: cryptoWallet.address,
      privateKeyEncrypted: 'STORED_IN_SECURE_VAULT',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      type: type // Ensure type is stored in profile for UI
    };
    
    const updatedUser = {
      ...user,
      wallets: [...user.wallets, newWallet],
      activeWalletId: newWallet.id
    };
    
    StorageService.saveUser(updatedUser);
    return updatedUser;
  },

  // Recover wallet private key (Requires Password)
  recoverWalletPrivateKey: async (walletId: string, password: string): Promise<string> => {
      const vault = await SecureStorage.getWallet(walletId);
      if (!vault) {
          throw new Error("Wallet data not found in secure storage");
      }
      return await WalletService.decrypt(vault.data, password);
  },

  switchWallet: (user: UserProfile, walletId: string): UserProfile => {
    const updatedUser = { ...user, activeWalletId: walletId };
    StorageService.saveUser(updatedUser);
    return updatedUser;
  },

  // --- ASSETS ---
  getAssets: (): Asset[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return data ? JSON.parse(data) : DEFAULT_ASSETS;
  },

  saveAssets: (assets: Asset[]) => {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  },

  addAsset: (asset: Asset) => {
    const assets = StorageService.getAssets();
    if (assets.find(a => a.symbol === asset.symbol && a.networkId === asset.networkId)) {
        throw new Error("Asset already exists");
    }
    const newAssets = [...assets, asset];
    StorageService.saveAssets(newAssets);
    return newAssets;
  },

  removeAsset: (id: string) => {
    const assets = StorageService.getAssets();
    const newAssets = assets.filter(a => a.id !== id);
    StorageService.saveAssets(newAssets);
    return newAssets;
  },

  // --- TRANSACTIONS ---
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  addTransaction: (tx: Transaction) => {
    const txs = StorageService.getTransactions();
    const newTxs = [tx, ...txs];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTxs));
    return newTxs;
  },

  // --- NETWORKS ---
  getNetworks: () => {
    const data = localStorage.getItem(STORAGE_KEYS.NETWORKS);
    return data ? JSON.parse(data) : DEFAULT_NETWORKS;
  },
  
  addNetwork: (network: any) => {
    const networks = StorageService.getNetworks();
    networks.push(network);
    localStorage.setItem(STORAGE_KEYS.NETWORKS, JSON.stringify(networks));
    return networks;
  }
};
