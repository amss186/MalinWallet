
/**
 * SERVICE CRYPTOGRAPHIQUE AES-GCM
 * Gère le chiffrement local des seeds et clés privées.
 * Rien n'est stocké en clair.
 */

export const CryptoService = {
  // Dérive une clé AES depuis le mot de passe utilisateur (PBKDF2)
  deriveKey: async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as any,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },

  // Chiffre une donnée (Seed/PrivKey) avec le mot de passe
  encryptData: async (data: string, password: string): Promise<string> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await CryptoService.deriveKey(password, salt);
    
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(data)
    );

    // Format de stockage: salt + iv + ciphertext (en base64 pour le stockage)
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    let binary = '';
    for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  },

  // Déchiffre une donnée avec le mot de passe
  decryptData: async (encryptedBase64: string, password: string): Promise<string> => {
    try {
      const combined = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
      
      // Extraire les parties
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const key = await CryptoService.deriveKey(password, salt);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
      );

      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch (e) {
      throw new Error("Mot de passe incorrect ou données corrompues");
    }
  }
};
