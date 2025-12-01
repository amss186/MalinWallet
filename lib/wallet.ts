import { ethers } from 'ethers';
import { argon2id } from 'hash-wasm';
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

const ALGORITHM = 'AES-GCM';
const TAG_LENGTH = 128;

// --- DÉTECTION INTELLIGENTE DE L'ENVIRONNEMENT ---
const getCrypto = () => {
  // 1. Si on est dans le navigateur (Chrome/Mobile)
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  // 2. Si on est sur le Bot (Node.js)
  // @ts-ignore
  return globalThis.crypto; 
};

// --- UTILITAIRES HYBRIDES (WEB + NODE) ---
const toHex = (buffer: Uint8Array) => Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');

const fromBase64 = (str: string) => {
    if (typeof window !== 'undefined') {
        return Uint8Array.from(atob(str), c => c.charCodeAt(0));
    } else {
        return new Uint8Array(Buffer.from(str, 'base64'));
    }
};

const toBase64 = (bytes: Uint8Array) => {
    if (typeof window !== 'undefined') {
        return btoa(String.fromCharCode(...bytes));
    } else {
        return Buffer.from(bytes).toString('base64');
    }
};

export const WalletService = {
  // 1. Génération EVM
  createEVMWallet: () => {
    try {
        const wallet = ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase || "",
            type: 'evm'
        };
    } catch (e: any) { throw new Error("Erreur EVM: " + e.message); }
  },

  // 2. Génération Solana
  createSolanaWallet: () => {
    try {
      const keypair = Keypair.generate();
      return {
        address: keypair.publicKey.toBase58(),
        privateKey: bs58.encode(keypair.secretKey),
        type: 'solana'
      };
    } catch (e: any) { throw new Error("Erreur Solana: " + e.message); }
  },

  // 3. Récupération
  recoverWallet: (input: string) => {
    try {
      const cleanInput = input.trim();
      if (cleanInput.includes(' ')) {
         const wallet = ethers.Wallet.fromPhrase(cleanInput);
         return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: cleanInput, type: 'evm' };
      } 
      else if (cleanInput.startsWith('0x')) {
         const wallet = new ethers.Wallet(cleanInput);
         return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: null, type: 'evm' };
      }
      else {
         try {
             const secretKey = bs58.decode(cleanInput);
             if (secretKey.length === 64) {
                 const keypair = Keypair.fromSecretKey(secretKey);
                 return { address: keypair.publicKey.toBase58(), privateKey: cleanInput, mnemonic: null, type: 'solana' };
             }
         } catch (err) {
             const wallet = new ethers.Wallet("0x" + cleanInput);
             return { address: wallet.address, privateKey: wallet.privateKey, mnemonic: null, type: 'evm' };
         }
      }
      throw new Error("Format inconnu");
    } catch (e) { throw new Error("Clé invalide"); }
  },

  // 4. Dérivation Argon2id
  deriveKey: async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
    const derivedHex = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations: 256,
      memorySize: 4096,
      hashLength: 32,
      outputType: 'hex'
    });
    return new Uint8Array(derivedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  },

  // 5. Chiffrement (Universal)
  encrypt: async (data: string, password: string): Promise<string> => {
    const crypto = getCrypto();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyBytes = await WalletService.deriveKey(password, salt);
    const key = await crypto.subtle.importKey("raw", keyBytes.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    
    // Encoder text compatible node/web
    const enc = new TextEncoder(); 
    const encryptedContent = await crypto.subtle.encrypt({ name: ALGORITHM, iv, tagLength: TAG_LENGTH }, key, enc.encode(data));

    return JSON.stringify({
      v: 2,
      salt: toBase64(salt),
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(encryptedContent))
    });
  },

  // 6. Déchiffrement (Universal)
  decrypt: async (encryptedBundle: string, password: string): Promise<string> => {
    try {
      const crypto = getCrypto();
      const bundle = JSON.parse(encryptedBundle);
      const salt = fromBase64(bundle.salt);
      const iv = fromBase64(bundle.iv);
      const data = fromBase64(bundle.data);

      const keyBytes = await WalletService.deriveKey(password, salt);
      const key = await crypto.subtle.importKey("raw", keyBytes.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);

      const decryptedContent = await crypto.subtle.decrypt({ name: ALGORITHM, iv, tagLength: TAG_LENGTH }, key, data);
      
      const dec = new TextDecoder();
      return dec.decode(decryptedContent);
    } catch (e) {
      console.error("Decryption error:", e);
      throw new Error("Mot de passe incorrect");
    }
  }
};


