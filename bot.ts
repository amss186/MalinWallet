import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { WalletService } from './src/lib/wallet';
import { ChainService } from './src/lib/chain';
import fs from 'fs';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// TON TOKEN TELEGRAM
const token = "8445450793:AAE2Q2pgmqgtJFAWFwtMFFZLzHqx4MFUU1s";

const bot = new TelegramBot(token, { polling: true });

// Base de données locale pour les utilisateurs du bot
const DB_FILE = 'bot_users.json';

const loadUsers = () => {
    if (!fs.existsSync(DB_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) { return {}; }
};

const saveUser = (chatId: number, data: any) => {
    const users = loadUsers();
    users[chatId] = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

console.log("🚀 Malin Bot est en ligne !");

// --- COMMANDES DU BOT ---

// 1. START
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from?.first_name || "Ami";

    bot.sendMessage(chatId, `🚀 **Bienvenue sur Malin Bot, ${username} !**\n\nJe suis ton portefeuille crypto sécurisé sur Telegram.\n\nCommandes disponibles :\n🆕 /create - Créer un nouveau wallet\n💰 /balance - Voir mon solde\n📈 /price - Voir les prix du marché`, { parse_mode: 'Markdown' });
});

// 2. CREATE WALLET
bot.onText(/\/create/, async (msg) => {
    const chatId = msg.chat.id;
    const users = loadUsers();

    if (users[chatId]) {
        bot.sendMessage(chatId, "⚠️ Tu as déjà un wallet configuré ! Utilise /balance.");
        return;
    }

    bot.sendMessage(chatId, "🔐 Génération de ton wallet sécurisé... Patientez.");

    try {
        const wallet = WalletService.createEVMWallet();
        
        // Mot de passe temporaire basé sur l'ID
        const password = `pwd_${chatId}_secure`; 
        const encryptedKey = await WalletService.encrypt(wallet.privateKey, password);

        saveUser(chatId, {
            address: wallet.address,
            encryptedKey: encryptedKey,
            createdAt: new Date().toISOString()
        });

        bot.sendMessage(chatId, `✅ **Wallet Créé !**\n\n📍 Ton adresse ETH :\n\`${wallet.address}\`\n\n🔑 Ta phrase secrète (A NOTER ET SUPPRIMER) :\n\`${wallet.mnemonic}\`\n\n⚠️ Supprime ce message après avoir noté tes mots !`, { parse_mode: 'Markdown' });

    } catch (e: any) {
        bot.sendMessage(chatId, "Erreur création : " + e.message);
    }
});

// 3. BALANCE & PRIX
bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    const users = loadUsers();
    const user = users[chatId];

    if (!user) {
        bot.sendMessage(chatId, "Tu n'as pas de wallet. Tape /create d'abord.");
        return;
    }

    bot.sendMessage(chatId, "🔍 Recherche des fonds sur la Blockchain...");

    try {
        const ethBalance = await ChainService.getNativeBalance(user.address);
        
        // Prix via CoinGecko
        const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const priceData = await priceRes.json();
        const ethPrice = priceData.ethereum.usd;
        
        const totalUsd = (parseFloat(ethBalance) * ethPrice).toFixed(2);

        bot.sendMessage(chatId, `💰 **Ton Portefeuille**\n\n💎 **${parseFloat(ethBalance).toFixed(4)} ETH**\n💵 ≈ $${totalUsd}\n\n📍 Adresse: \`${user.address}\``, { parse_mode: 'Markdown' });

    } catch (e: any) {
        bot.sendMessage(chatId, "Erreur réseau : " + e.message);
    }
});

// 4. PRICE CHECKER
bot.onText(/\/price/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=usd');
        const data = await res.json();
        
        const message = `📊 **Marché Crypto**\n\n` +
                        `🟠 Bitcoin: $${data.bitcoin.usd}\n` +
                        `🔵 Ethereum: $${data.ethereum.usd}\n` +
                        `🟣 Solana: $${data.solana.usd}`;
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, "Impossible de récupérer les prix.");
    }
});

🔥 Lancement Final
 * Remplace le code dans src/lib/wallet.ts.
 * Remplace le code dans bot.ts.
 * Pousse sur GitHub (pour réparer le site Vercel).
 * Lance ton bot sur ton téléphone :
   npm run bot




