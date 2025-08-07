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

// Get list of supported chain IDs
export const SUPPORTED_CHAIN_IDS = Object.values(SUPPORTED_CHAINS)

// Get contract address for current chain
export function getContractAddress(chainId) {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId
  const address = CONTRACT_ADDRESSES[numericChainId]
  
  if (!address) {
    console.warn(`Chain ID ${numericChainId} not supported. Available chains:`, Object.keys(CONTRACT_ADDRESSES))
    
    // Provide helpful error message for common cases
    if (numericChainId === 1) {
      throw new Error(`
        Ethereum Mainnet detected but not supported.
        Please switch to one of these supported networks:
        - Horizen Testnet (Chain ID: 845320009)
      `)
    }
    
    throw new Error(`Unsupported chain ID: ${numericChainId}. Supported chains: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`)
  }
  
  return address
}
