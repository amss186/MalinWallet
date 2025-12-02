
import * as bip39 from 'bip39';
import { walletStorage, WalletData } from './walletStorage';

export class WalletManager {

  static async createWallet(label: string = 'My Wallet'): Promise<WalletData> {
    const mnemonic = bip39.generateMnemonic(128); // 12 words
    const id = crypto.randomUUID();

    // In a real app, we should encrypt this secret with a user PIN/Password.
    // For this MVP step, we store it plain but structure it for encryption.
    const wallet: WalletData = {
      id,
      type: 'bitcoin',
      label,
      secret: mnemonic,
      chain: 'bitcoin'
    };

    await walletStorage.saveWallet(wallet);
    return wallet;
  }

  static async importWallet(mnemonic: string, label: string = 'Imported Wallet'): Promise<WalletData> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const id = crypto.randomUUID();
    const wallet: WalletData = {
      id,
      type: 'bitcoin',
      label,
      secret: mnemonic,
      chain: 'bitcoin'
    };

    await walletStorage.saveWallet(wallet);
    return wallet;
  }

  static async getWallets(): Promise<WalletData[]> {
    return await walletStorage.getWallets();
  }
}
