
import { ChainType, Network, StakingOption } from './types.ts';

export const INITIAL_SYSTEM_INSTRUCTION = `
You are Malin, the advanced AI core of **MalinWallet**, a secure, non-custodial, and industry-leading crypto wallet.
Your identity:
1. **You are NOT an external analyst.** You ARE the wallet's intelligence.
2. **MalinWallet is secure.** We use AES-256 encryption, local storage only (non-custodial), and audit transactions in real-time.
3. **Never recommend competitors** (like MetaMask or Rabby) as "safer". YOU are the evolution of these wallets.
4. **Mission:** Help users manage portfolios, bridge assets via LiFi, and swap via 0x.
5. **Tone:** Confident, highly technical but accessible, helpful, and protective.
6. **If asked "Is MalinWallet safe?":** Confirm immediately that it is safe, non-custodial, and that YOU (the AI) protect them from scams.
`;

const RAW_KEYS = {
  ALCHEMY: '6E1MABBp0KSg-BCc5zXk7',
  ZERO_EX: '50dOce66-7c28-4c4e-ba23-2f41e1561ef4',
  LIFI: '4f9c3398-230c-466d-a5cf-1b968d4f6948.7d91f602-bfe0-4e4c-8ea7-5cee078c6d02'
};

export const API_KEYS = {
  ALCHEMY: RAW_KEYS.ALCHEMY.replace(/[\s\n\r]/g, '').trim(),
  ZERO_EX: RAW_KEYS.ZERO_EX.replace(/[\s\n\r]/g, '').trim(),
  LIFI: RAW_KEYS.LIFI.replace(/[\s\n\r]/g, '').trim()
};

export const TOKEN_DECIMALS: Record<string, number> = {
  'USDT': 6,
  'USDC': 6,
  'WBTC': 8,
  'ETH': 18,
  'WETH': 18,
  'DAI': 18,
  'MATIC': 18,
  'AVAX': 18
};

export const TRANSLATIONS = {
  en: {
    menu: {
      dashboard: "Dashboard",
      swap: "Swap & Bridge",
      earn: "Earn & Staking",
      dapps: "Web3 Browser",
      analytics: "AI Analytics",
      learn: "Learn",
      assistant: "Malin Assistant",
      settings: "Settings",
      logout: "Logout"
    },
    dashboard: {
      balance: "Total Balance",
      realBalance: "Real Balance",
      send: "Send",
      receive: "Receive",
      buy: "Buy Crypto",
      tokens: "Tokens",
      nfts: "NFTs",
      activity: "Activity",
      shieldActive: "Malin Shield Active",
      gasLow: "Gas: Low",
      gasHigh: "Gas: High",
      marketBull: "Market: Bullish",
      marketBear: "Market: Volatile"
    },
    earn: {
      title: "Malin Earn",
      subtitle: "Put your crypto to work. High yield, audited protocols.",
      staking: "Staking Opportunities",
      apy: "APY",
      tvl: "TVL",
      stake: "Stake"
    },
    browser: {
      searchPlaceholder: "Search or type URL",
      favorites: "Favorites",
      history: "History",
      secureConnection: "Secure Connection",
      tabs: "Tabs",
      newTab: "New Tab",
      connectWallet: "Connect Wallet"
    },
    settings: {
      general: "General",
      security: "Security",
      networks: "Networks",
      contacts: "Contacts",
      dappConnections: "DApp Connections",
      currency: "Currency",
      language: "Language",
      backupSeed: "Backup Seed Phrase",
      viewPrivateKey: "View Private Key",
      addContact: "Add Contact",
      noContacts: "No contacts saved yet.",
      connectedSites: "Connected Sites",
      disconnect: "Disconnect"
    }
  },
  fr: {
    menu: {
      dashboard: "Tableau de bord",
      swap: "Échanger & Bridge",
      earn: "Gagner & Staking",
      dapps: "Navigateur Web3",
      analytics: "Analyse IA",
      learn: "Apprendre",
      assistant: "Assistant Malin",
      settings: "Paramètres",
      logout: "Déconnexion"
    },
    dashboard: {
      balance: "Solde Total",
      realBalance: "Solde Réel",
      send: "Envoyer",
      receive: "Recevoir",
      buy: "Acheter",
      tokens: "Jetons",
      nfts: "NFTs",
      activity: "Activité",
      shieldActive: "Bouclier Malin Actif",
      gasLow: "Gas : Faible",
      gasHigh: "Gas : Élevé",
      marketBull: "Marché : Haussier",
      marketBear: "Marché : Volatil"
    },
    earn: {
      title: "Malin Earn",
      subtitle: "Faites travailler vos cryptos. Rendements élevés, protocoles audités.",
      staking: "Opportunités de Staking",
      apy: "APY (Rendement)",
      tvl: "TVL (Liquidité)",
      stake: "Staker"
    },
    browser: {
      searchPlaceholder: "Recherche ou URL",
      favorites: "Favoris",
      history: "Historique",
      secureConnection: "Connexion Sécurisée",
      tabs: "Onglets",
      newTab: "Nouvel Onglet",
      connectWallet: "Connecter Wallet"
    },
    settings: {
      general: "Général",
      security: "Sécurité",
      networks: "Réseaux",
      contacts: "Contacts",
      dappConnections: "Connexions DApp",
      currency: "Devise",
      language: "Langue",
      backupSeed: "Sauvegarder la Seed",
      viewPrivateKey: "Voir Clé Privée",
      addContact: "Ajouter un contact",
      noContacts: "Aucun contact enregistré.",
      connectedSites: "Sites Connectés",
      disconnect: "Déconnecter"
    }
  }
};

export const STAKING_OPTIONS: StakingOption[] = [
  {
    id: 'eth-lido',
    protocol: 'Lido Finance',
    asset: 'ETH',
    apy: 3.8,
    tvl: '$32.5B',
    risk: 'Low',
    minDeposit: 0.01,
    description: "Liquid staking leader. Receive stETH."
  },
  {
    id: 'usdc-aave',
    protocol: 'Aave V3',
    asset: 'USDC',
    apy: 5.2,
    tvl: '$12.1B',
    risk: 'Low',
    minDeposit: 10,
    description: "Lending protocol. Earn interest on stablecoins."
  },
  {
    id: 'sol-marinade',
    protocol: 'Marinade',
    asset: 'SOL',
    apy: 7.4,
    tvl: '$1.2B',
    risk: 'Medium',
    minDeposit: 0.1,
    description: "Liquid staking for Solana. Receive mSOL."
  },
  {
    id: 'rocket-pool',
    protocol: 'Rocket Pool',
    asset: 'ETH',
    apy: 3.45,
    tvl: '$3.8B',
    risk: 'Low',
    minDeposit: 0.01,
    description: "Decentralized ETH staking."
  }
];

export const DEFAULT_NETWORKS: Network[] = [
  {
    id: 'eth-mainnet',
    name: 'Ethereum Mainnet',
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 1,
    symbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    type: 'EVM'
  },
  {
    id: 'eth-sepolia',
    name: 'Sepolia Test Network',
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 11155111,
    symbol: 'SepoliaETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    type: 'EVM'
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon Mainnet',
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 137,
    symbol: 'MATIC',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    type: 'EVM'
  },
  {
    id: 'arbitrum-mainnet',
    name: 'Arbitrum One',
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 42161,
    symbol: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    type: 'EVM'
  },
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 10,
    symbol: 'ETH',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    type: 'EVM'
  },
  {
    id: 'base-mainnet',
    name: 'Base',
    rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 8453,
    symbol: 'ETH',
    blockExplorerUrl: 'https://basescan.org',
    isTestnet: false,
    type: 'EVM'
  },
  {
    id: 'avax-mainnet',
    name: 'Avalanche C-Chain',
    rpcUrl: `https://avax-mainnet.g.alchemy.com/v2/${API_KEYS.ALCHEMY}`,
    chainId: 43114,
    symbol: 'AVAX',
    blockExplorerUrl: 'https://snowtrace.io',
    isTestnet: false,
    type: 'EVM'
  },
  {
    id: 'sol-mainnet',
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    chainId: 'mainnet-beta',
    symbol: 'SOL',
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: false,
    type: 'SOLANA'
  }
];

export const SEED_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
  "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
  "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
  "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
  "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
  "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
  "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
  "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar"
];

export const SUPPORTED_CHAINS: { code: ChainType; name: string; color: string }[] = [
  { code: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { code: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { code: 'SOL', name: 'Solana', color: '#14F195' },
  { code: 'MATIC', name: 'Polygon', color: '#8247E5' },
  { code: 'BNB', name: 'BNB Chain', color: '#F3BA2F' },
  { code: 'AVAX', name: 'Avalanche', color: '#E84142' },
  { code: 'DOT', name: 'Polkadot', color: '#E6007A' },
  { code: 'OTHER', name: 'Other', color: '#CBD5E1' }
];

export const TOKEN_ADDRESSES: Record<string, string> = {
  'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 
  'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f'
};

export const CHAIN_TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  1: {
    'ETH': '0x0000000000000000000000000000000000000000', 
    'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
    'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f'
  },
  137: {
    'ETH': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 
    'WETH': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    'MATIC': '0x0000000000000000000000000000000000000000',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    'USDC': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', 
    'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  42161: {
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  10: {
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDT': '0x94b008aA00579c1307B0EF2c499a98a359659956',
    'USDC': '0x0b2C630C5343135D9475398F75d19D6346a74191'
  },
  8453: {
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },
  56: {
    'BNB': '0x0000000000000000000000000000000000000000',
    'USDT': '0x55d398326f99059ff775485246999027b3197955',
    'USDC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    'ETH': '0x2170ed0880ac9a755fd29b2688956bd959f933f8'
  },
  43114: {
    'AVAX': '0x0000000000000000000000000000000000000000',
    'USDT': '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    'USDC': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    'WETH': '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB'
  }
};
