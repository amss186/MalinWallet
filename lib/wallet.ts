import { ethers } from 'ethers';
import { argon2id } from 'hash-wasm';
import { Keypair } from '@solana/web3.js';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const TAG_LENGTH = 128; // bits

export const WalletService = {
  /**
   * Generates a new Random EVM Wallet
   */
  createEVMWallet: () => {
    try {
        const wallet = ethers.Wallet.createRandom();
        if (!wallet.mnemonic || !wallet.address || !wallet.privateKey) {
            throw new Error("Failed to generate wallet info");
        }
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
            type: 'evm'
        };
    } catch (e: any) {
        throw new Error("EVM Wallet generation failed: " + e.message);
    }
  },

  /**
   * Generates a new Random Solana Wallet
   */
  createSolanaWallet: () => {
    try {
      const keypair = Keypair.generate();
      return {
        address: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('hex'), // Storing as hex for consistency
        type: 'solana'
      };
    } catch (e: any) {
      throw new Error("Solana Wallet generation failed: " + e.message);
    }
  },

  /**
   * Recovers a wallet from a Mnemonic Phrase (EVM)
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
        mnemonic: mnemonic,
        type: 'evm'
      };
    } catch (e) {
      throw new Error("Invalid Seed Phrase");
    }
  },

  /**
   * Derives a 256-bit Key from a user's password using Argon2id (via WASM)
   */
  deriveKey: async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
    const derivedHex = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations: 256,
      memorySize: 512,
      hashLength: 32,
      outputType: 'hex'
    });

    return new Uint8Array(
      derivedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
  },

  /**
   * Encrypts sensitive data using AES-256-GCM with Argon2id derived key
   */
  encrypt: async (data: string, password: string): Promise<string> => {
    if (!data || !password) throw new Error("Missing data or password");

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const keyBytes = await WalletService.deriveKey(password, salt);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer, // Cast to satisfy TS if needed, or create slice
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    const enc = new TextEncoder();

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      key,
      enc.encode(data)
    );

    const bufferToBase64 = (buf: ArrayBuffer | Uint8Array) => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    return JSON.stringify({
      v: 2,
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      data: bufferToBase64(encryptedContent)
    });
  },

  /**
   * Decrypts the data
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

      if (bundle.v !== 2) {
         if (bundle.v === 1) {
             throw new Error("Legacy wallet format. Please re-import or update.");
         }
      }

      const keyBytes = await WalletService.deriveKey(password, salt);

      const key = await window.crypto.subtle.importKey(
        "raw",
        keyBytes.buffer as ArrayBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );

      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
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
