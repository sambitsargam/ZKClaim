import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { arbitrum, mainnet, sepolia, baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { defineChain } from 'viem'

// 0. Setup queryClient
const queryClient = new QueryClient()

const projectId = '2987b6292605d325403d9c0a4c2c3c80' 

// Define Horizen Testnet chain
const horizenTestnet = defineChain({
  id: 845320009,
  name: 'Horizen Testnet',
  network: 'horizen-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://horizen-rpc-testnet.appchain.base.org'] },
    default: { http: ['https://horizen-rpc-testnet.appchain.base.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'Horizen Explorer', url: 'https://horizen-explorer-testnet.appchain.base.org' },
    default: { name: 'Horizen Explorer', url: 'https://horizen-explorer-testnet.appchain.base.org' },
  },
  testnet: true,
})

// 2. Create wagmiConfig
const metadata = {
  name: 'ZKClaim',
  description: 'Privacy-preserving healthcare claims with zero-knowledge proofs',
  url: 'https://zkclaim.app', // Replace with your domain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [ horizenTestnet] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true // Optional - false as default
})

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
