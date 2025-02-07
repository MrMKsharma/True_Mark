// Environment variable types
type NetworkType = 'local' | 'testnet' | 'mainnet';

// Network configuration
const NETWORK_URLS = {
  local: 'http://127.0.0.1:8080',
  testnet: 'https://fullnode.testnet.aptoslabs.com',
  mainnet: 'https://fullnode.mainnet.aptoslabs.com',
} as const;

// Validate environment variables
const validateNodeUrl = (url: string | undefined, network: NetworkType): string => {
  // If URL is provided, validate it
  if (url) {
    try {
      new URL(url);
      return url;
    } catch {
      throw new Error('VITE_NODE_URL must be a valid URL');
    }
  }
  
  // If no URL provided, use default for network
  return NETWORK_URLS[network];
};

const validateContractAddress = (address: string | undefined): string => {
  if (!address) throw new Error('VITE_CONTRACT_ADDRESS is required');
  if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
    throw new Error('VITE_CONTRACT_ADDRESS must be a valid hex address');
  }
  return address;
};

const validateNetwork = (network: string | undefined): NetworkType => {
  if (!network) return 'local';
  if (!['local', 'testnet', 'mainnet'].includes(network)) {
    throw new Error('VITE_BLOCKCHAIN_NETWORK must be one of: local, testnet, mainnet');
  }
  return network as NetworkType;
};

// Get and validate environment variables
const NETWORK = validateNetwork(import.meta.env.VITE_BLOCKCHAIN_NETWORK);
const NODE_URL = validateNodeUrl(import.meta.env.VITE_NODE_URL, NETWORK);
const CONTRACT_ADDRESS = validateContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS);

export const config = {
  NODE_URL,
  CONTRACT_ADDRESS,
  NETWORK,
} as const;

export type Config = typeof config;
