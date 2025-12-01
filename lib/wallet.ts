import { ethers } from 'ethers';
import { argon2id } from 'hash-wasm';
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

const ALGORITHM = 'AES-GCM';
const TAG_LENGTH = 128; // bits

// --- UTILITAIRES COMPATIBLES NAVIGATEUR (Remplacement de Buffer) ---
const toHex = (buffer: Uint8Array) => Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
const fromBase64 = (str: string) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

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
   * Generates a new Random Solana Wallet (Mobile Safe)
   */
  createSolanaWallet: () => {
    try {
      const keypair = Keypair.generate();
      return {
        address: keypair.publicKey.toBase58(),
        // Utilisation de bs58 pour encoder la clé secrète (Standard Solana)
        privateKey: bs58.encode(keypair.secretKey),
        type: 'solana'
      };
    } catch (e: any) {
      throw new Error("Solana Wallet generation failed: " + e.message);
    }
  },

  /**
   * Recovers a wallet from a Mnemonic Phrase (EVM) or Private Key
   */
  recoverWallet: (input: string) => {
    try {
      const cleanInput = input.trim();
      
      // Cas A : Phrase Secrète (Mnemonic)
      if (cleanInput.includes(' ')) {
         const wallet = ethers.Wallet.fromPhrase(cleanInput);
         return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: cleanInput,
            type: 'evm'
         };
      } 
      // Cas B : Clé privée EVM (commence par 0x)
      else if (cleanInput.startsWith('0x')) {
         const wallet = new ethers.Wallet(cleanInput);
         return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: null, type: 'evm' };
      }
      // Cas C : Clé privée Solana (Base58)
      else {
         try {
             const secretKey = bs58.decode(cleanInput);
             if (secretKey.length === 64) {
                 const keypair = Keypair.fromSecretKey(secretKey);
                 return { 
                     address: keypair.publicKey.toBase58(), 
                     privateKey: cleanInput, 
                     mnemonic: null, 
                     type: 'solana' 
                 };
             }
         } catch (err) {
             // Fallback: Peut-être une clé EVM sans le 0x
             const wallet = new ethers.Wallet("0x" + cleanInput);
             return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: null, type: 'evm' };
         }
      }
      throw new Error("Format de clé non reconnu");
    } catch (e) {
      throw new Error("Clé invalide ou malformée");
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
      memorySize: 4096, // Augmenté à 4MB pour plus de sécurité (compatible mobile)
      hashLength: 32,
      outputType: 'hex'
    });

    return new Uint8Array(
      derivedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
  },

  /**
   * Encrypts sensitive data using AES-256-GCM with Argon2id derived key
   * (Uses Native Web Crypto API - No Buffer)
   */
  encrypt: async (data: string, password: string): Promise<string> => {
    if (!data || !password) throw new Error("Missing data or password");

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const keyBytes = await WalletService.deriveKey(password, salt);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer,
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

    return JSON.stringify({
      v: 2,
      salt: toBase64(salt),
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(encryptedContent))
    });
  },

  /**
   * Decrypts the data
   * (Uses Native Web Crypto API - No Buffer)
   */
  decrypt: async (encryptedBundle: string, password: string): Promise<string> => {
    try {
      const bundle = JSON.parse(encryptedBundle);

      if (!bundle.salt || !bundle.iv || !bundle.data) {
          throw new Error("Invalid encrypted bundle format");
      }

      const salt = fromBase64(bundle.salt);
      const iv = fromBase64(bundle.iv);
      const data = fromBase64(bundle.data);

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
      throw new Error("Mot de passe incorrect ou données corrompues");
    }
  }
};

