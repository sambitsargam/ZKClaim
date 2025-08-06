import HealthClaimVerifierABI from '../abis/HealthClaimVerifier.json'

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Horizen Testnet
  845320009: '0x55e5B3A258d3F4f3a74883E34741DA0159093c2B',
}

export const ABI = {
  HEALTH_CLAIM_VERIFIER: HealthClaimVerifierABI
}

// Supported chains for the application
export const SUPPORTED_CHAINS = {
  HORIZEN_TESTNET: 845320009
}

export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.HORIZEN_TESTNET]: 'Horizen Testnet'
}

// Get contract address for current chain
export function getContractAddress(chainId) {
  const address = CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return address
}
