'use client'

// Import the wagmi configuration to initialize AppKit
import '@/lib/wagmi'
import { useAppKit } from '@reown/appkit/react'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wallet, Check, AlertCircle, Loader2 } from 'lucide-react'

interface WalletConnectionProps {
  requireConnection?: boolean
  showBalance?: boolean
  className?: string
}

export function WalletConnection({ 
  requireConnection = false, 
  showBalance = true, 
  className = "" 
}: WalletConnectionProps) {
  const { open } = useAppKit()
  const { 
    isConnected, 
    address, 
    userBalance, 
    networkInfo, 
    isContractReady,
    isConnecting 
  } = useWallet()

  const handleConnect = () => {
    open()
  }

  if (!isConnected) {
    return (
      <div className={`space-y-4 ${className}`}>
        {requireConnection && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-400">
              Please connect your wallet to continue
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full py-3 text-lg font-bold bg-button-green hover:bg-green-600 rounded-lg transition-all duration-300"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Connection Status */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-400">Wallet Connected</span>
          </div>
          <Button 
            onClick={handleConnect}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Change
          </Button>
        </div>
        
        <div className="space-y-1 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Address:</span>
            <span className="font-mono text-xs">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}
            </span>
          </div>
          
          {showBalance && (
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="font-semibold text-green-400">
                {parseFloat(userBalance).toFixed(4)} XTZ
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Network:</span>
            <span className="text-blue-400">
              {networkInfo?.name || 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Contract:</span>
            <span className={isContractReady ? 'text-green-400' : 'text-red-400'}>
              {isContractReady ? 'Ready' : 'Not Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Warning for wrong network */}
      {networkInfo && networkInfo.chainId !== parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '128123') && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            Please switch to Etherlink Testnet (Chain ID: {process.env.NEXT_PUBLIC_CHAIN_ID || '128123'}) to use this application
          </AlertDescription>
        </Alert>
      )}

      {/* Warning for low balance */}
      {parseFloat(userBalance) < 0.01 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            Your balance is low. You may need more XTZ to participate in tournaments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}