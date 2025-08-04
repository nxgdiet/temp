import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum, base, polygon, optimism, defineChain } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is required')
}

// 2. Set up the Ethers Adapter
const ethersAdapter = new EthersAdapter()

// 3. Configure the metadata
const metadata = {
  name: 'Token Rivals',
  description: 'Real-time cryptocurrency tournament system',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://token-rivals.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Define custom networks
const etherlink = defineChain({
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '128123'),
  caipNetworkId: `eip155:${parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '128123')}`,
  chainNamespace: 'eip155',
  name: 'Etherlink Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Tezos',
    symbol: 'XTZ',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://128123.rpc.thirdweb.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherlink Explorer',
      url: 'https://testnet.explorer.etherlink.com'
    },
  },
})

// 5. Create the AppKit instance
createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [etherlink, mainnet, arbitrum, base, polygon, optimism],
  defaultNetwork: etherlink,
  metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  chainImages: {
    [parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '128123')]: '/placeholder-logo.svg'
  }
})

export { projectId }