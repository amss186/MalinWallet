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
    try {
        const wallet = ethers.Wallet.createRandom();
        if (!wallet.mnemonic || !wallet.address || !wallet.privateKey) {
            throw new Error("Failed to generate wallet info");
        }
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
        };
    } catch (e: any) {
        throw new Error("Wallet generation failed: " + e.message);
    }
  },

  /**
   * Recovers a wallet from a Mnemonic Phrase
   */
  recoverWallet: (mnemonic: string) => {
    try {
      // Validate mnemonic word count
      const wordCount = mnemonic.trim().split(/\s+/).length;
      if (wordCount !== 12 && wordCount !== 24) {
          throw new Error("Invalid mnemonic length. Must be 12 or 24 words.");
      }

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
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        throw new Error("Crypto API not supported in this environment");
    }

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
        salt: salt as any,
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
    if (!data || !password) throw new Error("Missing data or password");

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
    const bufferToBase64 = (buf: ArrayBuffer | Uint8Array) => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

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

      if (!bundle.salt || !bundle.iv || !bundle.data) {
          throw new Error("Invalid encrypted bundle format");
      }

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
      console.error("Decryption error:", e);
      throw new Error("Incorrect Password or Corrupted Data");
    }
  }
};
