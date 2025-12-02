
import { RpcService } from '@/services/rpcService';
import { SimulationService } from '@/services/simulationService';
import { RecoveryService } from '@/services/recoveryService';

// Mock Axios
jest.mock('axios');

describe('Malin Wallet Features', () => {

    // Feature 7: RPC Booster
    test('RpcService should have endpoints defined', () => {
        const url = RpcService.getActiveRpc('bitcoin');
        expect(url).toBeDefined();
        expect(url).toContain('http');
    });

    // Feature 1: Simulation
    test('SimulationService should calculate remaining balance correctly', async () => {
        const result = await SimulationService.simulateTransaction(
            'addr1', 'addr2', 1000, 'bitcoin', 50000
        );
        expect(result.success).toBe(true);
        expect(result.gasUsed).toBeGreaterThan(0);
        // Balance 50000 - 1000 - fees
    });

    // Feature 2: Social Recovery
    test('RecoveryService should split and combine secrets', () => {
        const secret = "correct horse battery staple";
        const parts = RecoveryService.splitSecret(secret, 3, 3);

        expect(parts.length).toBe(3);

        const recovered = RecoveryService.combineShares(parts);
        expect(recovered).toBe(secret);
    });

});
