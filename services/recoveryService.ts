
let secrets: any = null;

if (typeof window !== 'undefined') {
    secrets = require('secrets.js-grempe');
}

export class RecoveryService {

    /**
     * Splits a secret (mnemonic) into parts using Shamir's Secret Sharing.
     * @param secret The mnemonic or private key string.
     * @param shares The total number of shares to generate.
     * @param threshold The number of shares required to reconstruct the secret.
     */
    static splitSecret(secret: string, shares: number = 3, threshold: number = 3): string[] {
        if (!secrets) secrets = require('secrets.js-grempe');

        // Convert string to hex
        const secretHex = secrets.str2hex(secret);
        const components = secrets.share(secretHex, shares, threshold);
        return components;
    }

    /**
     * Reconstructs the secret from the shares.
     * @param sharesArray The array of shares (strings).
     */
    static combineShares(sharesArray: string[]): string {
        if (!secrets) secrets = require('secrets.js-grempe');

        try {
            const secretHex = secrets.combine(sharesArray);
            return secrets.hex2str(secretHex);
        } catch (e) {
            throw new Error("Invalid shares or recovery failed.");
        }
    }
}
