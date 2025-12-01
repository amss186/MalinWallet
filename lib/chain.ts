import axios from 'axios';
import { Asset } from '@/types';
import { ethers } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
// On retire les clés privées d'ici, elles sont gérées côté serveur ou proxy
const LIFI_KEY = process.env.NEXT_PUBLIC_LIFI_API_KEY;

// RPC Solana public (ou met ton RPC Helius si tu en as un)
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const NETWORKS = {
  ETH_MAINNET: 1,
  ETH_SEPOLIA: 11155111,
  POLYGON: 137,
};

// Alchemy RPC Endpoints
const getRpcUrl = (chainId: number) => {
  switch (chainId) {
    case NETWORKS.ETH_MAINNET: return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;
    case NETWORKS.POLYGON: return `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;
    case NETWORKS.ETH_SEPOLIA: return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;
    default: return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;
  }
};

export const ChainService = {

  /**
   * 1. ETHEREUM & EVM BALANCE
   */
  getNativeBalance: async (address: string, chainId: number = 1): Promise<string> => {
    try {
      if (!address) return "0.0";
      // Utilisation directe d'axios pour éviter d'instancier un provider lourd si pas nécessaire
      const response = await axios.post(getRpcUrl(chainId), {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"]
      });

      if (response.data.result) {
        return ethers.formatEther(response.data.result);
      }
      return "0.0";
    } catch (e) {
      console.error("Balance Fetch Error", e);
      return "0.0";
    }
  },

  /**
   * 2. SOLANA BALANCE (NOUVEAU)
   * Permet d'afficher le solde SOL
   */
  getSolanaBalance: async (address: string): Promise<string> => {
    try {
      if (!address) return "0.0";
      const connection = new Connection(SOLANA_RPC);
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toFixed(4);
    } catch (e) {
      console.error("Solana Balance Error", e);
      return "0.0";
    }
  },

  /**
   * 3. TOKEN BALANCES (Alchemy)
   */
  getTokenBalances: async (address: string, chainId: number = 1): Promise<Asset[]> => {
    try {
      const baseUrl = chainId === 137
         ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
         : `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;

      const response = await axios.post(baseUrl, {
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        params: [address, "erc20"]
      });

      const tokenBalances = response.data.result?.tokenBalances || [];
      const assets: Asset[] = [];

      // Optimisation : On filtre les soldes à 0 pour éviter les requêtes inutiles
      const activeTokens = tokenBalances.filter((t: any) => 
        t.tokenBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      );

      // Pour éviter de bloquer l'app mobile, on limite aux 10 premiers tokens pour l'instant
      // Dans le futur : ajouter une pagination
      for (const token of activeTokens.slice(0, 10)) {
        try {
            const metadataRes = await axios.post(baseUrl, {
            jsonrpc: "2.0",
            method: "alchemy_getTokenMetadata",
            params: [token.contractAddress]
            });

            const meta = metadataRes.data.result;
            if (meta && meta.decimals) {
            const balance = parseFloat(ethers.formatUnits(token.tokenBalance, meta.decimals));
            // On n'ajoute que si le solde est positif
            if (balance > 0) {
                assets.push({
                    id: token.contractAddress,
                    color: '#ccc',
                    change24h: 0,
                    chain: chainId === 137 ? 'POLYGON' : 'ETH',
                    symbol: meta.symbol || 'UNK',
                    name: meta.name || 'Unknown',
                    balance: balance,
                    decimals: meta.decimals,
                    price: 0, // Sera mis à jour par le composant UI via CoinGecko
                    contractAddress: token.contractAddress,
                    logoUrl: meta.logo,
                    chainId: chainId
                });
            }
            }
        } catch (err) {
            console.warn("Failed to fetch metadata for", token.contractAddress);
        }
      }
      return assets;
    } catch (e) {
      console.error("Token Fetch Error", e);
      return [];
    }
  },

  /**
   * 4. SWAP QUOTE (MONÉTISÉ)
   * Redirige vers notre Proxy API pour injecter les frais (1%)
   */
  getZeroXQuote: async (sellToken: string, buyToken: string, amount: string) => {
     try {
       // IMPORTANT : On appelle notre propre route API, pas 0x directement
       const url = `/api/proxy/0x?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${amount}`;
       const response = await axios.get(url);
       return response.data;
     } catch (e) {
       console.error("0x Quote Error", e);
       return null;
     }
  },

  /**
   * 5. LiFi Quote (Cross-Chain)
   */
  getLiFiQuote: async (fromChain: string, toChain: string, fromToken: string, toToken: string, amount: string, fromAddress: string) => {
    try {
      const url = 'https://li.quest/v1/quote';
      const response = await axios.get(url, {
        params: {
          fromChain,
          toChain,
          fromToken,
          toToken,
          fromAmount: amount,
          fromAddress
        },
        headers: {
            'x-lifi-api-key': LIFI_KEY
        }
      });
      return response.data;
    } catch (e) {
      console.error("LiFi Quote Error", e);
      return null;
    }
  }
};


