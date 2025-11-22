
import { API_KEYS, TOKEN_ADDRESSES, CHAIN_TOKEN_ADDRESSES, TOKEN_DECIMALS } from '../constants';

// Service 0x pour les Swaps (Même blockchain - Defaults to ETH Mainnet for this demo)
export const ZeroExService = {
  getQuote: async (sellToken: string, buyToken: string, amount: string, takerAddress?: string) => {
    // 0x expects 'ETH' for native token, or token addresses for ERC20
    let sellTokenParam = sellToken === 'ETH' ? 'ETH' : (TOKEN_ADDRESSES[sellToken] || sellToken);
    let buyTokenParam = buyToken === 'ETH' ? 'ETH' : (TOKEN_ADDRESSES[buyToken] || buyToken);

    // --- FIX: DECIMALS HANDLING ---
    // By default 18, but USDT/USDC use 6.
    const decimals = TOKEN_DECIMALS[sellToken] || 18;
    const power = Math.pow(10, decimals);
    const amountBase = (parseFloat(amount) * power).toFixed(0);

    // Default to Ethereum Mainnet 0x API
    let targetUrl = `https://api.0x.org/swap/v1/price?sellToken=${sellTokenParam}&buyToken=${buyTokenParam}&sellAmount=${amountBase}`;
    
    if (takerAddress) {
      targetUrl += `&takerAddress=${takerAddress}`;
    }

    // CRITICAL FIX: 0x API does not support direct browser calls (CORS).
    // We must route through a CORS proxy for this frontend-only application to work.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(proxyUrl, {
        headers: {
          '0x-api-key': API_KEYS.ZERO_EX
        }
      });
      
      if (!response.ok) {
        const errText = await response.text();
        // 0x often returns JSON error
        try {
            const errJson = JSON.parse(errText);
            throw new Error(`Erreur 0x: ${errJson.reason || errJson.message || 'Unknown error'}`);
        } catch (e) {
            // If it's a generic 404 or Network Error (Load Failed)
            throw new Error(`Erreur 0x (${response.status}). Vérifiez la connexion ou les tokens.`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("ZeroEx Swap Error:", error);
      if (error.message === 'Failed to fetch' || error.message === 'Load failed') {
          throw new Error("Erreur Réseau (CORS/AdBlock). L'API 0x est peut-être bloquée par votre navigateur.");
      }
      throw error;
    }
  }
};

// Service LiFi pour le Bridging (Cross-chain)
export const LiFiService = {
  getQuote: async (
    fromChain: string, 
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string // MANDATORY for LiFi
  ) => {
    if (!fromAddress) {
        throw new Error("Adresse wallet requise pour LiFi Quote");
    }

    // Mapping Chain IDs for LiFi
    const chainIds: Record<string, number> = {
      'ETH': 1,
      'MATIC': 137,
      'BSC': 56,
      'ARBITRUM': 42161,
      'OPTIMISM': 10,
      'AVAX': 43114,
      'SOL': 1151111081099710 // Solana chain ID logic is different in LiFi
    };

    const fromChainId = chainIds[fromChain] || 1;
    const toChainId = chainIds[toChain] || 137;
    
    // RESOLVE TOKEN ADDRESSES BASED ON CHAIN ID
    // Crucial Fix: Do not send ETH Mainnet address for Polygon tokens
    let fromTokenAddr = CHAIN_TOKEN_ADDRESSES[fromChainId]?.[fromToken];
    let toTokenAddr = CHAIN_TOKEN_ADDRESSES[toChainId]?.[toToken];

    // Fallbacks if not found in map (user might assume native)
    if (!fromTokenAddr) fromTokenAddr = fromToken; 
    if (!toTokenAddr) toTokenAddr = toToken;

    // Handle Decimals for LiFi too
    const decimals = TOKEN_DECIMALS[fromToken] || 18;
    const power = Math.pow(10, decimals);
    const amountBase = (parseFloat(amount) * power).toFixed(0);

    const url = `https://li.quest/v1/quote?fromChain=${fromChainId}&toChain=${toChainId}&fromToken=${fromTokenAddr}&toToken=${toTokenAddr}&fromAmount=${amountBase}&fromAddress=${fromAddress}`;

    try {
      const response = await fetch(url, {
        headers: {
          'x-lifi-api-key': API_KEYS.LIFI
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        // Try to parse JSON error for better message
        try {
            const errJson = JSON.parse(errText);
            throw new Error(`Erreur LiFi (${response.status}): ${errJson.message || errText}`);
        } catch {
            throw new Error(`Erreur LiFi (${response.status}): ${errText}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("LiFi Bridge Error details:", error);
      throw error;
    }
  }
};
