
import { Asset, Transaction, UserProfile, WalletAccount, Contact } from '../types';
import { DEFAULT_NETWORKS } from '../constants';
import { ChainService } from './chainService';
import { FirebaseService } from './firebaseConfig';
import { CryptoService } from './cryptoService';

const STORAGE_KEYS = {
  USER: 'malin_user_v5_encrypted', // New version
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
    // 1. Sauvegarde locale (complète avec clés chiffrées)
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
    const cryptoWallet = ChainService.generateWallet(); 

    // CHIFFREMENT DE LA CLÉ PRIVÉE
    const encryptedKey = await CryptoService.encryptData(cryptoWallet.privateKey, passwordForEncryption);

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
          privateKeyEncrypted: encryptedKey, // Stockage sécurisé
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

  // Legacy method wrapper for compatibility if needed, but registerUserEncrypted is preferred
  registerUser: (name: string, email: string, uid: string): UserProfile => {
    // Fallback unsafe if password not provided (should be avoided)
    const walletId = 'wallet-' + Date.now();
    const cryptoWallet = ChainService.generateWallet(); 
    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      uid,
      name,
      email,
      currency: 'USD',
      language: 'fr',
      createdAt: new Date().toISOString(),
      wallets: [{
          id: walletId,
          name: 'Compte Principal',
          address: cryptoWallet.address, 
          privateKeyEncrypted: cryptoWallet.privateKey, // Unsafe fallback
          color: '#00A99D'
      }],
      activeWalletId: walletId,
      contacts: [],
      dappHistory: [],
      favorites: []
    };
    StorageService.saveUser(newUser);
    return newUser;
  },

  addWallet: async (user: UserProfile, name: string, password: string): Promise<UserProfile> => {
    const cryptoWallet = ChainService.generateWallet();
    const encryptedKey = await CryptoService.encryptData(cryptoWallet.privateKey, password);
    
    const newWallet: WalletAccount = {
      id: 'wallet-' + Date.now(),
      name,
      address: cryptoWallet.address,
      privateKeyEncrypted: encryptedKey,
      color: '#'+Math.floor(Math.random()*16777215).toString(16)
    };
    
    const updatedUser = {
      ...user,
      wallets: [...user.wallets, newWallet],
      activeWalletId: newWallet.id
    };
    
    StorageService.saveUser(updatedUser);
    return updatedUser;
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
