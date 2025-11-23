import { ethers } from 'ethers';

// Constants for Encryption
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const DIGEST = 'SHA-256';

export const WalletService = {
  /**
   * Generates a new Random Wallet (Mnemonic & Private Key)
   * This happens entirely client-side.
   */
  createWallet: () => {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  },

  /**
   * Recovers a wallet from a Mnemonic Phrase
   */
  recoverWallet: (mnemonic: string) => {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } catch (e) {
      throw new Error("Invalid Seed Phrase");
    }
  },

  /**
   * Derives a CryptoKey from a user's password using PBKDF2
   */
  deriveKey: async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: ITERATIONS,
        hash: DIGEST
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"]
    );
  },

  /**
   * Encrypts sensitive data (Private Key/Seed)
   * Returns a JSON string containing the encrypted data, IV, and Salt.
   */
  encrypt: async (data: string, password: string): Promise<string> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await WalletService.deriveKey(password, salt);
    const enc = new TextEncoder();

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      enc.encode(data)
    );

    // Convert buffers to Base64 for storage
    const bufferToBase64 = (buf: ArrayBuffer | Uint8Array) =>
        btoa(String.fromCharCode(...new Uint8Array(buf)));

    return JSON.stringify({
      v: 1, // version
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      data: bufferToBase64(encryptedContent)
    });
  },

  /**
   * Decrypts the data using the user's password.
   */
  decrypt: async (encryptedBundle: string, password: string): Promise<string> => {
    try {
      const bundle = JSON.parse(encryptedBundle);

      const base64ToUint8 = (str: string) =>
        Uint8Array.from(atob(str), c => c.charCodeAt(0));

      const salt = base64ToUint8(bundle.salt);
      const iv = base64ToUint8(bundle.iv);
      const data = base64ToUint8(bundle.data);

      const key = await WalletService.deriveKey(password, salt);

      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        data
      );

      return new TextDecoder().decode(decryptedContent);
    } catch (e) {
      throw new Error("Incorrect Password or Corrupted Data");
    }
  }
};
