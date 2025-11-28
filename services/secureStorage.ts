import { openDB, DBSchema } from 'idb';

interface WalletVault {
  id: string;
  data: string; // Encrypted JSON string of the private key / seed
  type: 'evm' | 'solana';
}

interface MalinDB extends DBSchema {
  vaults: {
    key: string;
    value: WalletVault;
  };
}

const DB_NAME = 'malin-wallet-db';
const STORE_NAME = 'vaults';

export const SecureStorage = {
  async getDB() {
    return openDB<MalinDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  },

  async saveWallet(id: string, encryptedData: string, type: 'evm' | 'solana' = 'evm') {
    const db = await SecureStorage.getDB();
    await db.put(STORE_NAME, {
      id,
      data: encryptedData,
      type
    });
  },

  async getWallet(id: string): Promise<WalletVault | undefined> {
    const db = await SecureStorage.getDB();
    return await db.get(STORE_NAME, id);
  },

  async deleteWallet(id: string) {
    const db = await SecureStorage.getDB();
    await db.delete(STORE_NAME, id);
  },

  async getAllWallets(): Promise<WalletVault[]> {
    const db = await SecureStorage.getDB();
    return await db.getAll(STORE_NAME);
  }
};
