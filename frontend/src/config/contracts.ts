import HealthClaimVerifierABI from '../abis/HealthClaimVerifier.json'

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Mainnet
  1: '0x0000000000000000000000000000000000000000', // Replace with mainnet address
  
  // Arbitrum
  42161: '0x0000000000000000000000000000000000000000', // Replace with arbitrum address
  
  // Sepolia Testnet
  11155111: '0x0000000000000000000000000000000000000000', // Replace with sepolia address
  
  // Base Sepolia
  84532: '0x0000000000000000000000000000000000000000', // Replace with base sepolia address
  
  // Horizen Testnet
  845320009: '0x7EF74176B51b13e8753C1Ca5055da870a5EC63f2', // Your deployed contract
} as const

export const ABI = {
  HEALTH_CLAIM_VERIFIER: HealthClaimVerifierABI
}

// Supported chains for the application
export const SUPPORTED_CHAINS = {
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  HORIZEN_TESTNET: 845320009,
  MAINNET: 1
} as const

export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.SEPOLIA]: 'Sepolia',
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: 'Base Sepolia',
  [SUPPORTED_CHAINS.HORIZEN_TESTNET]: 'Horizen Testnet',
  [SUPPORTED_CHAINS.MAINNET]: 'Ethereum'
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES

// Get contract address for current chain
export function getContractAddress(chainId: number): string {
  const address = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  if (!address) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return address
}
