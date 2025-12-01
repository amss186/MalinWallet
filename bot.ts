import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { WalletService } from './src/lib/wallet';
import { ChainService } from './src/lib/chain';
import fs from 'fs';

// Charge les variables d'environnement (.env.local)
dotenv.config({ path: '.env.local' });

// TON TOKEN (Je l'ai mis en dur ici pour simplifier le test, mais idéalement il va dans .env)
const token = "8445450793:AAE2Q2pgmqgtJFAWFwtMFFZLzHqx4MFUU1s";

console.log("🚀 Démarrage de Malin Bot...");

const bot = new TelegramBot(token, { polling: true });

// Mini base de données locale pour le bot (bot_users.json)
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

// --- COMMANDES ---

// 1. START
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from?.first_name || "Ami";
    
    bot.sendMessage(chatId, `👋 **Salut ${name} !**\n\nBienvenue sur **Malin Bot**, ton assistant crypto.\n\nCommandes :\n🆕 /create - Créer un wallet\n💰 /balance - Voir mon solde\n📈 /price - Prix du marché`);
});

// 2. CREATE WALLET
bot.onText(/\/create/, async (msg) => {
    const chatId = msg.chat.id;
    const users = loadUsers();

    if (users[chatId]) {
        bot.sendMessage(chatId, "⚠️ Tu as déjà un wallet ! Tape /balance pour le voir.");
        return;
    }

    bot.sendMessage(chatId, "🔐 Génération de ton coffre-fort sécurisé...");

    try {
        // Création Wallet EVM
        const wallet = WalletService.createEVMWallet();
        
        // Mot de passe temporaire basé sur l'ID Telegram (Simple pour la démo)
        const password = `tg_${chatId}_secret`; 
        const encryptedKey = await WalletService.encrypt(wallet.privateKey, password);

        saveUser(chatId, {
            address: wallet.address,
            encryptedKey: encryptedKey,
            createdAt: new Date().toISOString()
        });

        bot.sendMessage(chatId, `✅ **Wallet Créé avec succès !**\n\n📍 Ton adresse :\n\`${wallet.address}\`\n\n🔑 Ta phrase secrète (Garde-la précieusement) :\n\`${wallet.mnemonic}\``, { parse_mode: 'Markdown' });

    } catch (e: any) {
        bot.sendMessage(chatId, "❌ Erreur : " + e.message);
    }
});

// 3. BALANCE
bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    const users = loadUsers();
    const user = users[chatId];

    if (!user) {
        bot.sendMessage(chatId, "Tu n'as pas de wallet. Tape /create pour commencer.");
        return;
    }

    bot.sendMessage(chatId, "🔄 Vérification sur la Blockchain...");

    try {
        // Appel Blockchain via ton Service existant
        const ethBalance = await ChainService.getNativeBalance(user.address);
        
        // Prix via CoinGecko
        const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const priceData = await priceRes.json();
        const ethPrice = priceData.ethereum.usd || 0;
        
        const totalUsd = (parseFloat(ethBalance) * ethPrice).toFixed(2);

        bot.sendMessage(chatId, `💰 **Ton Solde**\n\n💎 **${parseFloat(ethBalance).toFixed(4)} ETH**\n💵 ≈ $${totalUsd}\n\n📍 Adresse:\n\`${user.address}\``, { parse_mode: 'Markdown' });

    } catch (e: any) {
        bot.sendMessage(chatId, "Erreur réseau : " + e.message);
    }
});

// 4. PRICE
bot.onText(/\/price/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=usd');
        const data = await res.json();
        
        bot.sendMessage(chatId, `📊 **Marché Crypto**\n\n🟠 BTC: $${data.bitcoin.usd}\n🔵 ETH: $${data.ethereum.usd}\n🟣 SOL: $${data.solana.usd}`);
    } catch (e) {
        bot.sendMessage(chatId, "Erreur API Prix.");
    }
});


