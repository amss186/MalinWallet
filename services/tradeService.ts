
import { TOKEN_ADDRESSES, CHAIN_TOKEN_ADDRESSES, TOKEN_DECIMALS } from '../constants';

// Service 0x pour les Swaps (via Proxy)
export const ZeroExService = {
  getQuote: async (sellToken: string, buyToken: string, amount: string, takerAddress?: string) => {
    let sellTokenParam = sellToken === 'ETH' ? 'ETH' : (TOKEN_ADDRESSES[sellToken] || sellToken);
    let buyTokenParam = buyToken === 'ETH' ? 'ETH' : (TOKEN_ADDRESSES[buyToken] || buyToken);

    const decimals = TOKEN_DECIMALS[sellToken] || 18;
    const power = Math.pow(10, decimals);
    const amountBase = (parseFloat(amount) * power).toFixed(0);

    // Call our internal proxy
    // /api/proxy/0x?sellToken=...
    let targetUrl = `/api/proxy/0x?sellToken=${sellTokenParam}&buyToken=${buyTokenParam}&sellAmount=${amountBase}`;
    
    if (takerAddress) {
      targetUrl += `&takerAddress=${takerAddress}`;
    }

    try {
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur 0x (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("ZeroEx Swap Error:", error);
      throw error;
    }
  }
};

// Service LiFi pour le Bridging (via Proxy)
export const LiFiService = {
  getQuote: async (
    fromChain: string, 
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string
  ) => {
    if (!fromAddress) {
        throw new Error("Adresse wallet requise pour LiFi Quote");
    }

    const chainIds: Record<string, number> = {
      'ETH': 1,
      'MATIC': 137,
      'BSC': 56,
      'ARBITRUM': 42161,
      'OPTIMISM': 10,
      'AVAX': 43114,
      'SOL': 1151111081099710
    };

    const fromChainId = chainIds[fromChain] || 1;
    const toChainId = chainIds[toChain] || 137;
    
    let fromTokenAddr = CHAIN_TOKEN_ADDRESSES[fromChainId]?.[fromToken];
    let toTokenAddr = CHAIN_TOKEN_ADDRESSES[toChainId]?.[toToken];

    if (!fromTokenAddr) fromTokenAddr = fromToken; 
    if (!toTokenAddr) toTokenAddr = toToken;

    const decimals = TOKEN_DECIMALS[fromToken] || 18;
    const power = Math.pow(10, decimals);
    const amountBase = (parseFloat(amount) * power).toFixed(0);

    const params = new URLSearchParams({
        fromChain: fromChainId.toString(),
        toChain: toChainId.toString(),
        fromToken: fromTokenAddr,
        toToken: toTokenAddr,
        fromAmount: amountBase,
        fromAddress: fromAddress
    });

    const url = `/api/proxy/lifi?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur LiFi (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("LiFi Bridge Error details:", error);
      throw error;
    }
  }
};
