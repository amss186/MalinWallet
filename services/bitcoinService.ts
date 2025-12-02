
import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import * as ecc from 'tiny-secp256k1';

// Initialize BIP32 factory
const bip32Factory = bip32.BIP32Factory(ecc);

export interface BitcoinAddress {
  address: string;
  type: 'native_segwit' | 'taproot';
  path: string;
}

export class BitcoinService {

  static getNetwork(isTestnet: boolean = false): bitcoin.Network {
    return isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  }

  static generateAddresses(mnemonic: string, index: number = 0): BitcoinAddress[] {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32Factory.fromSeed(seed);
    const network = this.getNetwork();

    // Native Segwit (Bech32) - BIP84 - m/84'/0'/0'/0/index
    const pathSegwit = `m/84'/0'/0'/0/${index}`;
    const childSegwit = root.derivePath(pathSegwit);
    const { address: addressSegwit } = bitcoin.payments.p2wpkh({
      pubkey: childSegwit.publicKey,
      network,
    });

    // Taproot (Bech32m) - BIP86 - m/86'/0'/0'/0/index
    // Note: bitcoinjs-lib needs to support taproot. Version ^6.0.0+ does partial support.
    // We check if payments.p2tr exists or we fallback/skip if not fully supported in this env.
    let addressTaproot = '';
    const pathTaproot = `m/86'/0'/0'/0/${index}`;
    try {
        const childTaproot = root.derivePath(pathTaproot);
        // Tweaked key derivation for Taproot is complex, simplified here:
        // Basic p2tr implementation provided by bitcoinjs-lib
        // Need to ensure the pubkey is x-only (32 bytes).
        const internalPubkey = childTaproot.publicKey.slice(1, 33);
        const { address } = bitcoin.payments.p2tr({
            internalPubkey,
            network
        });
        addressTaproot = address || '';
    } catch (e) {
        console.warn("Taproot generation failed (lib might need update or polyfill)", e);
    }

    return [
      { address: addressSegwit!, type: 'native_segwit', path: pathSegwit },
      ...(addressTaproot ? [{ address: addressTaproot, type: 'taproot', path: pathTaproot }] : [])
    ] as BitcoinAddress[];
  }

  // Fetch balance using a public API (Mempool.space is reliable for this use case)
  static async getBalance(address: string): Promise<number> {
    try {
      // Use RpcService to get the best endpoint (mocked for now as we hardcoded mempool.space structure)
      // Ideally we would adapt the adapter based on the RPC selected.
      // For this MVP, we assume the RPCs return compatible data or we just use the reliable one.
      // Let's implement the booster logic:
      const bestRpc = await import('./rpcService').then(m => m.RpcService.getFastestRpc('bitcoin'));

      // Note: mempool.space API structure is specific. If we switch to blockstream, it is similar (Electrum-like API).
      // If we switch to Blockchain.info, it is different.
      // For the "RPC Booster" feature, we will prioritize mempool-compatible APIs.

      // Fallback to mempool if specific RPC fails or returns different structure
      let baseUrl = 'https://mempool.space/api';
      if (bestRpc.includes('blockstream') || bestRpc.includes('mempool')) {
          baseUrl = bestRpc;
      }

      const response = await fetch(`${baseUrl}/address/${address}`);
      if (!response.ok) return 0;
      const data = await response.json();
      // mempool.space returns chain_stats { funded_txo_sum, spent_txo_sum }
      const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) +
                      (data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum);
      return balance; // in Satoshis
    } catch (e) {
      console.error("Error fetching BTC balance:", e);
      return 0;
    }
  }

  static async getPriceEUR(): Promise<number> {
     try {
         const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
         const data = await res.json();
         return data.bitcoin.eur;
     } catch (e) {
         return 0;
     }
  }
}
