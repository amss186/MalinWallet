
import axios from 'axios';

interface RpcEndpoint {
  name: string;
  url: string;
  latency?: number;
}

export class RpcService {
  private static endpoints: Record<string, RpcEndpoint[]> = {
    bitcoin: [
      { name: 'Mempool', url: 'https://mempool.space/api' },
      { name: 'Blockstream', url: 'https://blockstream.info/api' },
      // Bitcoin RPCs are often not public JSON-RPC in the same way as EVM/Solana,
      // but for this MVP we use API wrappers like mempool.space.
      // We can also add public Electrum servers if we were using an Electrum client.
      // For now, we simulate multiple API providers for Bitcoin Data.
      { name: 'Blockchain.info', url: 'https://blockchain.info' }
    ],
    ethereum: [
      { name: 'Cloudflare', url: 'https://cloudflare-eth.com' },
      { name: 'PublicNode', url: 'https://ethereum.publicnode.com' },
      { name: 'Ankr', url: 'https://rpc.ankr.com/eth' },
      { name: 'Llama', url: 'https://eth.llamarpc.com' },
    ],
    solana: [
      { name: 'Solana Mainnet', url: 'https://api.mainnet-beta.solana.com' },
      { name: 'Ankr Solana', url: 'https://rpc.ankr.com/solana' },
      { name: 'GenesysGo', url: 'https://genesysgo.net' }
    ]
  };

  private static activeRpc: Record<string, RpcEndpoint> = {};

  static async getFastestRpc(chain: string): Promise<string> {
    const endpoints = this.endpoints[chain];
    if (!endpoints) throw new Error(`Chain ${chain} not supported`);

    // Race them to find the fastest
    // We do a simple HEAD request or similar to check latency
    const promises = endpoints.map(async (ep) => {
       const start = performance.now();
       try {
           // Simple ping
           await axios.get(ep.url, { timeout: 2000 });
           const latency = performance.now() - start;
           return { ...ep, latency };
       } catch (e) {
           return { ...ep, latency: 99999 };
       }
    });

    const results = await Promise.all(promises);
    results.sort((a, b) => (a.latency || 99999) - (b.latency || 99999));

    const fastest = results[0];
    this.activeRpc[chain] = fastest;
    console.log(`[RPC Booster] Switched to fastest RPC for ${chain}: ${fastest.name} (${Math.round(fastest.latency!)}ms)`);

    return fastest.url;
  }

  static getActiveRpc(chain: string) {
      return this.activeRpc[chain]?.url || this.endpoints[chain][0].url;
  }
}
