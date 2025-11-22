
import { Asset } from '../types';

// Ce service est déprécié pour les mises à jour simulées.
// Les prix en temps réel doivent provenir d'une API Oracle (Chainlink) ou DEX (0x) intégrée dans Dashboard.
export const MarketService = {
  // No more fake updates.
  // Real-time updates are handled by ChainService RPC calls and 0x API for price quotes.
};
