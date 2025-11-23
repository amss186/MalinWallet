import axios from 'axios';
import { Asset, NFT } from '@/types';
import { ethers } from 'ethers';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ZEROX_KEY = process.env.NEXT_PUBLIC_ZEROX_API_KEY;
const LIFI_KEY = process.env.NEXT_PUBLIC_LIFI_API_KEY;

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
   * Get Native ETH Balance using Alchemy RPC
   */
  getNativeBalance: async (address: string, chainId: number = 1): Promise<string> => {
    try {
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
   * Get Token Balances using Alchemy Token API
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

      // Fetch metadata for non-zero balances
      const assets: Asset[] = [];

      for (const token of tokenBalances) {
        // Filter out small dust if needed, but user wants precision.
        // Just skipping 0.
        if (token.tokenBalance === "0x0000000000000000000000000000000000000000000000000000000000000000") continue;

        const metadataRes = await axios.post(baseUrl, {
          jsonrpc: "2.0",
          method: "alchemy_getTokenMetadata",
          params: [token.contractAddress]
        });

        const meta = metadataRes.data.result;
        if (meta) {
          const balance = parseFloat(ethers.formatUnits(token.tokenBalance, meta.decimals));
          // Only add if meaningful balance? Or user wants everything. Let's keep all.
          assets.push({
            id: token.contractAddress,
            color: '#ccc', // default
            change24h: 0,
            chain: 'ETH',
            symbol: meta.symbol,
            name: meta.name,
            balance: balance,
            decimals: meta.decimals,
            price: 0, // Would need CoinGecko for price
            contractAddress: token.contractAddress,
            logoUrl: meta.logo,
            chainId: chainId
          });
        }
      }
      return assets;
    } catch (e) {
      console.error("Token Fetch Error", e);
      return [];
    }
  },

  /**
   * Get 0x Swap Quote
   */
  getZeroXQuote: async (sellToken: string, buyToken: string, amount: string) => {
     try {
       const url = `https://api.0x.org/swap/v1/quote?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${amount}`;
       const response = await axios.get(url, {
         headers: { '0x-api-key': ZEROX_KEY }
       });
       return response.data;
     } catch (e) {
       console.error("0x Quote Error", e);
       return null;
     }
  },

  /**
   * Get LiFi Quote (Cross-Chain capable)
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
