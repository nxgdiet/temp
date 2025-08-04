"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Trophy, Check, AlertCircle, Loader2, DollarSign } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"
import { useWallet } from "@/contexts/wallet-context"
import { useRoomWebSocket } from "@/hooks/use-room-websocket"

function TournamentWaitingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isStaking, setIsStaking] = useState(false)
  const [stakeComplete, setStakeComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverTournamentId, setServerTournamentId] = useState<number | null>(null)

  const roomId = searchParams.get("roomId")
  const bet = searchParams.get("bet")
  const stake = searchParams.get("stake")
  const isHost = searchParams.get("isHost") === "true"
  const hostAddress = searchParams.get("hostAddress") || ""
  const guestAddress = searchParams.get("guestAddress") || ""
  const selectedPlayersParam = searchParams.get("selectedPlayers")
  const formation = searchParams.get("formation")

  const { address, depositStake, isContractReady } = useWallet()

  // Use existing WebSocket connection from room flow
  const { 
    isConnected: wsConnected, 
    tournamentId: wsServerTournamentId, 
    error: wsError, 
    roomStatus, 
    roomInfo,
    sendStakeCompleted,
    getRoomInfo
  } = useRoomWebSocket()

  // Get bet type from WebSocket roomInfo or fallback to URL parameter
  const displayBetType = roomInfo?.betType || bet || 'UNKNOWN'
  
  // Debug: Log bet type information
  useEffect(() => {
    console.log('🎯 [DEBUG] Bet type info:', {
      roomInfoBetType: roomInfo?.betType,
      urlBetType: bet,
      displayBetType: displayBetType
    })
  }, [roomInfo?.betType, bet, displayBetType])

  // Get room info if not available
  useEffect(() => {
    if (wsConnected && roomId && !roomInfo) {
      console.log('🔍 Getting room info for tournament waiting page')
      getRoomInfo(roomId)
    }
  }, [wsConnected, roomId, roomInfo, getRoomInfo])

  // Debug: Log roomInfo changes
  useEffect(() => {
    console.log('🎯 [DEBUG] roomInfo changed in tournament waiting:', roomInfo)
  }, [roomInfo])

  // Function to send stake completion to server using existing WebSocket
  const sendStakeCompletion = useCallback((txHash: string) => {
    if (!wsConnected || !roomId) {
      console.error('Cannot send stake completion - WebSocket not connected or no room ID')
      return
    }
    
    console.log('Sending stake completion via existing WebSocket connection')
    sendStakeCompleted(roomId, txHash)
  }, [wsConnected, roomId, sendStakeCompleted])

  // Listen for tournament creation from existing WebSocket connection
  useEffect(() => {
    console.log('Tournament waiting page loaded')
    console.log('Waiting for server to create tournament with addresses:', { hostAddress, guestAddress })
    console.log('WebSocket connected:', wsConnected)
    console.log('Current tournament ID from WebSocket:', wsServerTournamentId)
    console.log('Current room status:', roomStatus)
    console.log('Room ID from URL:', roomId)
    
    // Check if tournament ID is already in URL (from previous page navigation)
    const urlTournamentId = searchParams.get("tournamentId")
    if (urlTournamentId && !serverTournamentId) {
      console.log('✅ Found tournament ID in URL:', urlTournamentId)
      setServerTournamentId(parseInt(urlTournamentId))
      setError(null)
    }
    
    // Update tournament ID when received from WebSocket
    if (wsServerTournamentId && !serverTournamentId) {
      console.log('✅ Tournament created by server:', wsServerTournamentId)
      setServerTournamentId(wsServerTournamentId)
      setError(null)
      
      // Update URL with tournament ID
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('tournamentId', wsServerTournamentId.toString())
      window.history.replaceState({}, '', newUrl.toString())
    }
    
    // Handle WebSocket errors
    if (wsError && wsError.includes('tournament')) {
      console.error('❌ Tournament creation failed:', wsError)
      setError(`Tournament creation failed: ${wsError}`)
    }
    
    // Debug: Log all WebSocket state changes
    console.log('🔍 [DEBUG] WebSocket state changed:', {
      connected: wsConnected,
      roomStatus,
      tournamentId: wsServerTournamentId,
      error: wsError,
      roomId
    })
  }, [hostAddress, guestAddress, wsConnected, wsServerTournamentId, wsError, roomStatus, roomId, searchParams, serverTournamentId])

  // Add timeout for tournament creation
  useEffect(() => {
    if (!serverTournamentId && !error) {
      const timeout = setTimeout(() => {
        console.log('⏰ Tournament creation timeout - checking if we missed the message')
        // Try to get room info to see if tournament was created
        if (wsConnected && roomId) {
          console.log('🔍 Requesting room info to check tournament status')
          getRoomInfo(roomId)
        }
      }, 15000) // 15 seconds timeout
      
      return () => clearTimeout(timeout)
    }
  }, [serverTournamentId, error, wsConnected, roomId, getRoomInfo])

  // Handle WebSocket disconnection
  useEffect(() => {
    if (!wsConnected && !serverTournamentId) {
      console.log('⚠️ WebSocket disconnected while waiting for tournament creation')
      setError('Connection lost. Please refresh the page to reconnect.')
    }
  }, [wsConnected, serverTournamentId])

  // Handle room status changes for stake verification
  useEffect(() => {
    if (roomStatus === 'ready_for_competition' && serverTournamentId) {
      console.log('🚀 Both players have staked - redirecting to competition')
      
      // Redirect to competition page
      const params = new URLSearchParams({
        roomId: roomId || '',
        selectedPlayers: selectedPlayersParam || '',
        formation: formation || '',
        bet: bet || '',
        stake: stake || '',
        isHost: isHost.toString(),
        hostBet: bet || '',
        tournamentId: serverTournamentId.toString(),
        hostAddress: hostAddress,
        guestAddress: guestAddress
      })
      router.push(`/competition?${params.toString()}`)
    }
  }, [roomStatus, serverTournamentId, roomId, selectedPlayersParam, formation, bet, stake, isHost, hostAddress, guestAddress, router])

  const handleStake = async () => {
    if (!serverTournamentId || !stake || !isContractReady) return
    
    setIsStaking(true)
    
    try {
      console.log(`💰 Staking ${stake} XTZ for tournament ${serverTournamentId}`)
      
      const result = await depositStake(serverTournamentId, stake)
      
      if (!result.success) {
        throw new Error('Failed to stake XTZ')
      }
      
      console.log('✅ Stake successful!')
      setStakeComplete(true)
      
      // Send stake completion to server for verification
      if (result.txHash) {
        sendStakeCompletion(result.txHash)
      }
      
      // Don't auto-redirect anymore - wait for server verification that both players have staked
      
    } catch (error) {
      console.error('Error staking:', error)
      setError(`Failed to stake: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStaking(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (error) {
    return (
      <MobileFrame>
        <div className="flex flex-col h-full bg-gray-900">
          <div className="p-4 text-center">
            <h1 className="text-xl font-bold text-white">Tournament Setup Error</h1>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <Alert className="max-w-md border-red-500">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          </div>
          <div className="p-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </MobileFrame>
    )
  }

  return (
    <MobileFrame>
      <div className="h-full overflow-y-auto bg-gray-900">
        <div className="p-4">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white">Tournament Setup</h1>
            </div>
          </div>

          {/* Tournament Creation Status */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-lg font-semibold text-white">Tournament Setup</h2>
            </div>
            
            {!serverTournamentId ? (
              <div className="flex items-center gap-3 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Server is creating tournament on blockchain...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-green-400">
                <Check className="w-5 h-5" />
                <span>Tournament created successfully by server!</span>
              </div>
            )}
            
            {serverTournamentId && (
              <div className="mt-3 p-3 bg-gray-700 rounded text-sm">
                <span className="text-gray-400">Tournament ID: </span>
                <span className="text-white font-mono">{serverTournamentId}</span>
              </div>
            )}
          </div>

          {/* Player Information */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Host:</span>
                <span className="text-white font-mono text-sm">{hostAddress.slice(0, 6)}...{hostAddress.slice(-4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Guest:</span>
                <span className="text-white font-mono text-sm">{guestAddress.slice(0, 6)}...{guestAddress.slice(-4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Bet Type:</span>
                <span className={`font-semibold ${displayBetType === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                  {displayBetType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Stake Amount:</span>
                <span className="text-yellow-400 font-semibold">{stake} XTZ</span>
              </div>
            </div>
          </div>

          {/* Staking Section */}
          {serverTournamentId && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-500" />
                <h2 className="text-lg font-semibold text-white">Stake Your XTZ</h2>
              </div>
              
              {stakeComplete ? (
                <div className="mb-4">
                  <div className="flex items-center gap-3 text-green-400 mb-3">
                    <Check className="w-5 h-5" />
                    <span>Stake deposited successfully!</span>
                  </div>
                  {roomStatus !== 'ready_for_competition' && (
                    <div className="flex items-center gap-3 text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Waiting for opponent to stake...</span>
                    </div>
                  )}
                  {roomStatus === 'ready_for_competition' && (
                    <div className="flex items-center gap-3 text-green-400">
                      <Check className="w-5 h-5" />
                      <span>Both players staked! Starting competition...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-400 mb-3">
                    Deposit {stake} XTZ to the tournament contract to participate.
                  </p>
                  <Button
                    onClick={handleStake}
                    disabled={isStaking || !isContractReady}
                    className={`w-full py-3 text-lg font-bold rounded-lg transition-all duration-300 ${
                      !isStaking && isContractReady
                        ? "bg-button-green hover:bg-green-600" 
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {isStaking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Staking {stake} XTZ...
                      </>
                    ) : (
                      `Stake ${stake} XTZ`
                    )}
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Both players must stake before the match can begin. The server will verify both stakes on the blockchain.
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">How it works:</h3>
            <ol className="text-gray-300 text-sm space-y-1">
              <li>1. Server creates tournament on blockchain with both player addresses (prevents duplicates)</li>
              <li>2. Both players stake their XTZ to the same tournament contract</li>
              <li>3. Server verifies both stakes on the blockchain before allowing competition</li>
              <li>4. Once both stakes are confirmed by the contract, the match begins</li>
              <li>5. Winner gets both stakes from the smart contract</li>
            </ol>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function TournamentWaitingLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Tournament Waiting</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function TournamentWaitingPage() {
  return (
    <Suspense fallback={<TournamentWaitingLoading />}>
      <TournamentWaitingContent />
    </Suspense>
  )
} 