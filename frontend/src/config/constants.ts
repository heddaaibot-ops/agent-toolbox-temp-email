export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
export const MONAD_RPC_URL = import.meta.env.VITE_MONAD_RPC_URL;
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '10143');

export const MONAD_TESTNET = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: [MONAD_RPC_URL],
  blockExplorerUrls: ['https://testnet.monadscan.io'],
};

export const PRICE_PER_HOUR_USDC = 0.1; // $0.1 per hour in USDC
export const PRICE_PER_HOUR_MON = 0.001; // 0.001 MON per hour
