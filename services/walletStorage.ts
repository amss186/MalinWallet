
import { IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'MalinWalletDB';
const STORE_NAME = 'wallets';

export interface WalletData {
  id: string;
  type: 'bitcoin' | 'lightning' | 'watch-only';
  label: string;
  secret: string; // Encrypted seed or private key
  preferredBalanceUnit?: string;
  chain?: 'bitcoin';
}

class WalletStorage {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
        this.dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
        });
    }
  }

  private async getDB(): Promise<IDBPDatabase> {
      if (!this.dbPromise) {
          throw new Error("Database not initialized (SSR?)");
      }
      return this.dbPromise;
  }

  async getWallets(): Promise<WalletData[]> {
    if (typeof window === 'undefined') return [];
    return (await this.getDB()).getAll(STORE_NAME);
  }

  async saveWallet(wallet: WalletData): Promise<void> {
    if (typeof window === 'undefined') return;
    await (await this.getDB()).put(STORE_NAME, wallet);
  }

  async deleteWallet(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    await (await this.getDB()).delete(STORE_NAME, id);
  }
}

export const walletStorage = new WalletStorage();
