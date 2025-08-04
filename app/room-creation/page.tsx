"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Copy, Check, Users, Clock, AlertCircle, Loader2 } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"
import { useRoomWebSocket } from "@/hooks/use-room-websocket"
import { useWallet } from "@/contexts/wallet-context"

function RoomCreationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [showHandshakeModal, setShowHandshakeModal] = useState(false)
  const [localGuestData, setLocalGuestData] = useState<any>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [stakeComplete, setStakeComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPlayersParam = searchParams.get("selectedPlayers")
  const formation = searchParams.get("formation")
  const bet = searchParams.get("bet")
  const stake = searchParams.get("stake")
  const tournamentId = searchParams.get("tournamentId")

  const {
    isConnected,
    roomId,
    roomStatus,
    error: roomError,
    hostData,
    guestData,
    createRoom,
    acceptHandshake,
    rejectHandshake,
    setPlayerReady,
    disconnect
  } = useRoomWebSocket()

  const { 
    address, 
    isContractReady, 
    createTournament, 
    depositStake,
    pendingStakes 
  } = useWallet()

  // Handle tournament creation and staking
  const handleCreateTournamentAndStake = useCallback(async () => {
    if (!address || !isContractReady || !stake) return

    // Parse selected players inside callback
    const selectedPlayers = selectedPlayersParam ? JSON.parse(decodeURIComponent(selectedPlayersParam)) : []

    setIsStaking(true)
    
    try {
      console.log('Creating WebSocket room for off-chain match - NO blockchain calls')
      
      // Create the WebSocket room - blockchain tournament will be created AFTER match ends
      createRoom({
        selectedPlayers,
        formation: formation || '2-2-1',
        bet: bet || 'LONG',
        stake: parseFloat(stake),
        hostAddress: address,
        tournamentId: tournamentId || ''
      })
      
      setStakeComplete(true)
    } catch (error) {
      console.error('Error creating room:', error)
      setError('Failed to create room. Please try again.')
    } finally {
      setIsStaking(false)
    }
  }, [address, isContractReady, stake, selectedPlayersParam, formation, bet, createRoom, tournamentId])

  // Create room when component mounts and wallet is ready
  useEffect(() => {
    if (isConnected && roomStatus === 'idle' && isContractReady && address && !isStaking && !stakeComplete) {
      console.log('Starting tournament creation process...')
      handleCreateTournamentAndStake()
    }
  }, [isConnected, roomStatus, isContractReady, address, handleCreateTournamentAndStake, isStaking, stakeComplete])

  // Handle room status changes
  useEffect(() => {
    if (roomStatus === 'waiting' && roomId) {
      console.log('Room created, waiting for guest to join')
    } else if (roomStatus === 'handshaking') {
      console.log('Guest joined, initiating handshake')
      setShowHandshakeModal(true)
    } else if (roomStatus === 'accepted') {
      console.log('Handshake accepted, both users connected - redirecting to tournament waiting')
      // Redirect to tournament waiting page where tournament will be created and both users will stake
      const params = new URLSearchParams({
        roomId: roomId || '',
        selectedPlayers: selectedPlayersParam || '',
        formation: formation || '',
        bet: bet || '',
        stake: stake || '',
        isHost: 'true',
        hostAddress: address || '',
        guestAddress: guestData?.hostAddress || '', // Guest address from handshake
        tournamentId: tournamentId || ''
      })
      router.push(`/tournament-waiting?${params.toString()}`)
    } else if (roomStatus === 'error') {
      console.error('Room error:', error)
    }
  }, [roomStatus, roomId, error, setPlayerReady, router, selectedPlayersParam, formation, bet, stake, tournamentId, address, guestData])

  const handleCopyRoomCode = async () => {
    if (roomId) {
      try {
        await navigator.clipboard.writeText(roomId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy room code:', err)
      }
    }
  }

  const handleAcceptHandshake = () => {
    if (roomId) {
      acceptHandshake(roomId)
      setShowHandshakeModal(false)
    }
  }

  const handleRejectHandshake = () => {
    if (roomId) {
      rejectHandshake(roomId, 'Host rejected the connection')
      setShowHandshakeModal(false)
    }
  }

  const handleBack = () => {
    disconnect()
    router.back()
  }

  if (!isConnected || isStaking || !stakeComplete) {
    return (
      <MobileFrame>
        <div className="flex flex-col h-full bg-gray-900">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {!isConnected && (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">Connecting to Server</h2>
                  <p className="text-gray-400">Please wait while we establish a connection...</p>
                </>
              )}
              {isStaking && (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">Creating Room</h2>
                  <p className="text-gray-400">
                    Setting up match room...
                  </p>
                </>
              )}
              {!stakeComplete && !isStaking && isConnected && (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">Preparing Tournament</h2>
                  <p className="text-gray-400">Setting up blockchain tournament...</p>
                </>
              )}
            </div>
          </div>
        </div>
      </MobileFrame>
    )
  }

  if (error) {
    return (
      <MobileFrame>
        <div className="flex flex-col h-full bg-gray-900">
          <div className="p-4 text-center">
            <h1 className="text-xl font-bold text-white">Room Creation Error</h1>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
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
              <h1 className="text-xl font-bold text-white">Room Created</h1>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Room Successfully Created!</h2>
            <p className="text-gray-400">Share this room code with your opponent</p>
          </div>

          {/* Room Code */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <h3 className="text-white font-semibold mb-2">Room Code</h3>
              <div className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600">
                <span className="text-white font-mono text-2xl font-bold">{roomId || 'Generating...'}</span>
              </div>
            </div>

            <Button
              onClick={handleCopyRoomCode}
              disabled={!roomId}
              className="w-full py-3 text-lg font-bold bg-button-green hover:bg-green-600 rounded-lg transition-all duration-300 mb-4"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Room Code
                </>
              )}
            </Button>
          </div>

          {/* Room Details */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Room Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Room Code:</span>
                <span className="font-semibold text-blue-400">{roomId}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Bet Type:</span>
                <span className={`font-semibold ${bet === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                  {bet}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Stake Required:</span>
                <span className="font-semibold text-yellow-400">{stake} XTZ</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Your Stake:</span>
                <span className="font-semibold text-green-400">
                  {stakeComplete ? '✅ Deposited' : '⏳ Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">How to play:</h3>
            <ol className="text-gray-300 text-sm space-y-1">
              <li>1. Copy and share the room code with your opponent</li>
              <li>2. Your opponent must stake {stake} XTZ and bet {bet} to join</li>
              <li>3. Their stake will be verified on the blockchain</li>
              <li>4. Once verified, accept the connection to start the tournament</li>
              <li>5. Winner takes all stakes from the smart contract!</li>
            </ol>
          </div>

          {/* Status */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
              {roomStatus === 'waiting' && (
                <>
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Waiting for opponent to join...</span>
                </>
              )}
              {roomStatus === 'handshaking' && (
                <>
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Opponent joined! Accept connection to continue</span>
                </>
              )}
              {roomStatus === 'accepted' && (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Connection accepted! Starting tournament...</span>
                </>
              )}
            </div>
            <p className="text-gray-500 text-xs">
              {roomStatus === 'waiting' && "You'll be notified when they join"}
              {roomStatus === 'handshaking' && "Check the modal below to accept or reject"}
              {roomStatus === 'accepted' && "Preparing tournament..."}
            </p>
          </div>
        </div>
      </div>

      {/* Handshake Modal */}
      {showHandshakeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Opponent Joined!</h2>
              <p className="text-gray-400">Someone wants to join your room. Accept to start the tournament.</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAcceptHandshake}
                className="w-full py-3 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-300"
              >
                <Check className="w-5 h-5 mr-2" />
                Accept & Start Tournament
              </Button>
              
              <Button
                onClick={handleRejectHandshake}
                variant="outline"
                className="w-full py-3 text-lg font-bold border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-300"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Reject Connection
              </Button>
            </div>
          </div>
        </div>
      )}
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function RoomCreationLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Room Creation</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function RoomCreationPage() {
  return (
    <Suspense fallback={<RoomCreationLoading />}>
      <RoomCreationContent />
    </Suspense>
  )
} 