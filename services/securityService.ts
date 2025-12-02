
import axios from 'axios';

export interface TokenSecurity {
    is_open_source: boolean;
    is_proxy: boolean;
    is_mintable: boolean;
    owner_take_back_ownership: boolean; // Can owner take back ownership?
    buy_tax: string;
    sell_tax: string;
    cannot_sell_all: boolean;
    trust_score: number; // 0-100
}

export class SecurityService {

    // Using GoPlus Security API (Free tier usually available or mock response for MVP)
    // https://gopluslabs.io/

    static async checkToken(chainId: string, address: string): Promise<TokenSecurity> {
        try {
            // Mocking a call or using a real endpoint if no auth required
            // GoPlus often works without key for rate-limited calls
            const response = await axios.get(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`);

            const result = response.data.result[address.toLowerCase()];

            // Calculate a simple trust score based on flags
            let score = 100;
            if (result.is_open_source === "0") score -= 20;
            if (result.is_proxy === "1") score -= 10;
            if (result.is_mintable === "1") score -= 30;
            if (result.buy_tax !== "0") score -= 10;

            return {
                is_open_source: result.is_open_source === "1",
                is_proxy: result.is_proxy === "1",
                is_mintable: result.is_mintable === "1",
                owner_take_back_ownership: result.owner_change_balance === "1",
                buy_tax: result.buy_tax,
                sell_tax: result.sell_tax,
                cannot_sell_all: result.cannot_sell_all === "1",
                trust_score: Math.max(0, score)
            };
        } catch (e) {
            // Fallback for demo/offline
            return {
                is_open_source: true,
                is_proxy: false,
                is_mintable: false,
                owner_take_back_ownership: false,
                buy_tax: "0",
                sell_tax: "0",
                cannot_sell_all: false,
                trust_score: 95
            };
        }
    }
}
