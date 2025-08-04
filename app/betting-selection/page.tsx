"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"
import { WalletConnection } from "@/components/wallet-connection"
import { useWallet } from "@/contexts/wallet-context"

function BettingSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedBet, setSelectedBet] = useState<"SHORT" | "LONG" | null>(null)
  const [stakeAmount, setStakeAmount] = useState<string>("")
  
  const { userBalance, isConnected, isContractReady } = useWallet()

  const handleBetSelection = (bet: "SHORT" | "LONG") => {
    setSelectedBet(bet)
  }

  const handleCreateRoom = () => {
    if (!selectedBet || !stakeAmount || parseFloat(stakeAmount) <= 0) return
    
    console.log('Creating room - staking will happen in waiting room after opponent joins')
    
    // Generate tournament ID that will be used throughout the entire flow
    const tournamentId = Date.now() + Math.floor(Math.random() * 1000)
    console.log('Generated tournament ID:', tournamentId)
    
    // Navigate to room creation, staking will happen later
    const selectedPlayersParam = searchParams.get("selectedPlayers")
    const formation = searchParams.get("formation")
    
    router.push(`/room-creation?bet=${selectedBet}&stake=${stakeAmount}&selectedPlayers=${selectedPlayersParam}&formation=${formation}&tournamentId=${tournamentId}`)
  }

  const handleJoinRoom = () => {
    if (!selectedBet || !stakeAmount || parseFloat(stakeAmount) <= 0) return
    
    console.log('Joining room - staking will happen in waiting room after room details are fetched')
    
    // Navigate to room join page, staking will happen later
    const selectedPlayersParam = searchParams.get("selectedPlayers")
    const formation = searchParams.get("formation")
    
    router.push(`/room-join?bet=${selectedBet}&stake=${stakeAmount}&selectedPlayers=${selectedPlayersParam}&formation=${formation}`)
  }

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow positive numbers with up to 4 decimal places (for ETH precision)
    if (value === "" || /^\d*\.?\d{0,4}$/.test(value)) {
      setStakeAmount(value)
    }
  }

  const canProceed = selectedBet && stakeAmount && parseFloat(stakeAmount) > 0 && isConnected && isContractReady

  return (
    <MobileFrame>
      <div className="h-full overflow-y-auto bg-gray-900">
        <div className="p-4">
          {/* Header with back button */}
          <div className="flex items-center mb-6 relative">
            <button 
              onClick={() => router.back()}
              className="absolute left-0 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white">Choose Your Bet</h1>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Select Your Position & Stake</h2>
            <p className="text-gray-400">Connect wallet and choose your betting direction with XTZ stake</p>
          </div>

          {/* Wallet Connection - Only show if not connected */}
          {!isConnected && (
            <div className="mb-6">
              <WalletConnection requireConnection={true} showBalance={false} />
            </div>
          )}

          {/* Stake Amount Input */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-white">Stake Amount</h3>
            </div>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter XTZ stake (e.g., 0.01)"
                value={stakeAmount}
                onChange={handleStakeChange}
                disabled={!isConnected || !isContractReady}
                className="text-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                XTZ
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <p className="text-gray-400">
                This XTZ will be staked in the smart contract
              </p>
              {isConnected && (
                <p className="text-gray-300">
                  Balance: {parseFloat(userBalance).toFixed(4)} XTZ
                </p>
              )}
            </div>
            {stakeAmount && parseFloat(stakeAmount) > parseFloat(userBalance) && (
              <p className="text-red-400 text-sm mt-1">
                Insufficient balance
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Long Option */}
            <div 
              onClick={() => handleBetSelection("LONG")}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedBet === "LONG" 
                  ? "border-green-500 bg-green-500 bg-opacity-10" 
                  : "border-gray-600 bg-gray-800 hover:border-gray-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">LONG</h3>
                    <p className="text-gray-400">Bet on price going UP</p>
                  </div>
                </div>
                {selectedBet === "LONG" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Short Option */}
            <div 
              onClick={() => handleBetSelection("SHORT")}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedBet === "SHORT" 
                  ? "border-red-500 bg-red-500 bg-opacity-10" 
                  : "border-gray-600 bg-gray-800 hover:border-gray-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">SHORT</h3>
                    <p className="text-gray-400">Bet on price going DOWN</p>
                  </div>
                </div>
                {selectedBet === "SHORT" && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 mt-8">
            <Button
              onClick={handleCreateRoom}
              disabled={!canProceed}
              className={`w-full py-3 text-lg font-bold rounded-lg transition-all duration-300 ${
                canProceed
                  ? "bg-button-green hover:bg-green-600" 
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              Create Room {stakeAmount && parseFloat(stakeAmount) > 0 ? `(${stakeAmount} XTZ)` : ''}
            </Button>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function BettingSelectionLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Betting Selection</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function BettingSelectionPage() {
  return (
    <Suspense fallback={<BettingSelectionLoading />}>
      <BettingSelectionContent />
    </Suspense>
  )
} 