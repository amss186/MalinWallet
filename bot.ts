import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { WalletService } from './src/lib/wallet';
import { ChainService } from './src/lib/chain';
import fs from 'fs';
import http from 'http';
import https from 'https';

// Charger les variables
dotenv.config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("❌ ERREUR: Token manquant. Vérifie tes variables d'environnement.");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// --- BASE DE DONNÉES (JSON) ---
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

console.log("🚀 Malin Bot démarre...");

// --- COMMANDES TELEGRAM ---

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `👋 **Bienvenue sur Malin Bot !**\n\nJe suis ton wallet crypto 24/7.\n\n/create - Créer un wallet\n/balance - Voir mon solde\n/price - Prix du marché`);
});

bot.onText(/\/create/, async (msg) => {
    const chatId = msg.chat.id;
    const users = loadUsers();

    if (users[chatId]) {
        bot.sendMessage(chatId, "⚠️ Tu as déjà un wallet !");
        return;
    }

    bot.sendMessage(chatId, "🔐 Création du wallet...");

    try {
        const wallet = WalletService.createEVMWallet();
        const password = `tg_${chatId}_secret_key`; 
        const encryptedKey = await WalletService.encrypt(wallet.privateKey, password);

        saveUser(chatId, {
            address: wallet.address,
            encryptedKey: encryptedKey,
            createdAt: new Date().toISOString()
        });

        bot.sendMessage(chatId, `✅ **Wallet Créé !**\n\n📍 Adresse :\n\`${wallet.address}\`\n\n🔑 Phrase :\n\`${wallet.mnemonic}\``, { parse_mode: 'Markdown' });
    } catch (e: any) {
        bot.sendMessage(chatId, "Erreur : " + e.message);
    }
});

bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    const users = loadUsers();
    const user = users[chatId];

    if (!user) {
        bot.sendMessage(chatId, "Pas de wallet. Tape /create.");
        return;
    }

    bot.sendMessage(chatId, "🔄 Chargement...");

    try {
        const ethBalance = await ChainService.getNativeBalance(user.address);
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await res.json();
        const price = data.ethereum.usd || 0;
        const total = (parseFloat(ethBalance) * price).toFixed(2);

        bot.sendMessage(chatId, `💰 **Solde**\n${parseFloat(ethBalance).toFixed(4)} ETH\n≈ $${total}`);
    } catch (e: any) {
        bot.sendMessage(chatId, "Erreur réseau : " + e.message);
    }
});

bot.onText(/\/price/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=usd');
        const data = await res.json();
        bot.sendMessage(chatId, `📊 **Marché**\nBTC: $${data.bitcoin.usd}\nETH: $${data.ethereum.usd}\nSOL: $${data.solana.usd}`);
    } catch (e) {
        bot.sendMessage(chatId, "Erreur API.");
    }
});

// --- SERVEUR WEB & KEEP ALIVE (Pour Render) ---

const PORT = process.env.PORT || 3000;
const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL; 

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Malin Bot is alive & running!');
});

server.listen(PORT, () => {
    console.log(`🌍 Server listening on port ${PORT}`);
});

// SYSTEME ANTI-SOMMEIL (KEEP ALIVE - 5 MINUTES)
if (APP_URL) {
    console.log(`🔄 Keep-Alive activé sur : ${APP_URL}`);
    setInterval(() => {
        console.log("⏰ Pinging self to keep alive...");
        https.get(APP_URL, (res) => {
            console.log(`✅ Ping success: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`❌ Ping failed: ${err.message}`);
        });
    }, 5 * 60 * 1000); // 5 minutes (300000 ms)
} else {
    console.warn("⚠️ Attention : Pas d'URL détectée pour le Keep-Alive. Le bot risque de s'endormir.");
}


