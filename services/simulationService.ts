
import axios from 'axios';

// Interfaces for Simulation
export interface SimulationResult {
  success: boolean;
  finalBalanceDiff: Record<string, number>; // Token Address -> Diff
  gasUsed: number;
  gasPrice: number;
  logs: string[];
  error?: string;
}

export class SimulationService {

  /**
   * Simulates a transaction locally or via API.
   * For MVP, we simulate:
   * 1. Balance sufficiency check
   * 2. Fee estimation
   * 3. Effect on balance
   */
  static async simulateTransaction(
    from: string,
    to: string,
    amount: number,
    chain: 'bitcoin' | 'ethereum',
    currentBalance: number
  ): Promise<SimulationResult> {

    // 1. Fee Estimation
    // In a real monster wallet, we use the specific chain RPC to estimate gas
    // Here we mock a realistic fee based on chain
    let estimatedFee = 0;
    if (chain === 'bitcoin') {
        // Fetch fee rate
        try {
            const res = await axios.get('https://mempool.space/api/v1/fees/recommended');
            const feeRate = res.data.fastestFee; // sat/vB
            estimatedFee = 140 * feeRate; // Standard tx size ~140 vBytes
        } catch {
            estimatedFee = 5000; // Fallback 5000 sats
        }
    } else {
        estimatedFee = 21000 * 50; // 21000 gas * 50 gwei (mock)
    }

    // 2. Simulation Logic
    const finalBalance = currentBalance - amount - estimatedFee;
    const success = finalBalance >= 0;

    return {
        success,
        finalBalanceDiff: {
            'NATIVE': - (amount + estimatedFee)
        },
        gasUsed: chain === 'bitcoin' ? 140 : 21000,
        gasPrice: estimatedFee,
        logs: success
          ? [`Valid Transaction`, `Estimated Fee: ${estimatedFee}`, `Balance after: ${finalBalance}`]
          : [`Insufficient Funds`, `Required: ${amount + estimatedFee}`, `Available: ${currentBalance}`]
    };
  }
}
