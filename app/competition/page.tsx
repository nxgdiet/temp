"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Clock, Trophy, TrendingUp, TrendingDown } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"
import { useTournament } from "@/hooks/use-tournament"
import { TournamentChart } from "@/components/tournament-chart"
import { TournamentResult } from "@/components/tournament-result"
import { TournamentResult as TournamentResultType } from "@/lib/tournament-service"
import { useWallet } from "@/contexts/wallet-context"
import { useRoomWebSocket } from "@/hooks/use-room-websocket"

function CompetitionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showResult, setShowResult] = useState(false)
  const [isAnnouncingWinner, setIsAnnouncingWinner] = useState(false)
  const [winnerAnnounced, setWinnerAnnounced] = useState(false)

  const roomId = searchParams.get("roomId")
  const selectedPlayersParam = searchParams.get("selectedPlayers")
  const formation = searchParams.get("formation")
  const bet = searchParams.get("bet")
  const stake = searchParams.get("stake")
  const isHost = searchParams.get("isHost") === "true"
  const hostBet = searchParams.get("hostBet")
  const tournamentId = searchParams.get("tournamentId")
  const hostAddress = searchParams.get("hostAddress") || ""
  const guestAddress = searchParams.get("guestAddress") || ""
  
  const { address } = useWallet()
  const { announceWinner, roomStatus, roomInfo, getRoomInfo, winnerInfo, isConnected } = useRoomWebSocket()

  // Parse selected players
  const selectedPlayers = selectedPlayersParam ? JSON.parse(decodeURIComponent(selectedPlayersParam)) : []

  // Get bet type from WebSocket roomInfo or fallback to URL parameter
  const displayBetType = roomInfo?.betType || bet || 'UNKNOWN'
  
  // Debug: Log bet type information
  useEffect(() => {
    console.log('🎯 [DEBUG] Competition bet type info:', {
      roomInfoBetType: roomInfo?.betType,
      urlBetType: bet,
      displayBetType: displayBetType
    })
  }, [roomInfo?.betType, bet, displayBetType])

  // Get room info if not available
  useEffect(() => {
    if (roomId && !roomInfo) {
      console.log('🔍 Getting room info for competition page')
      getRoomInfo(roomId)
    }
  }, [roomId, roomInfo, getRoomInfo])

  // Debug: Log roomInfo changes
  useEffect(() => {
    console.log('🎯 [DEBUG] roomInfo changed in competition:', roomInfo)
  }, [roomInfo])

  // Ensure room info is fetched on page load for synchronization
  useEffect(() => {
    if (roomId && isConnected) {
      console.log('🔍 Ensuring room info is available for competition')
      getRoomInfo(roomId)
    }
  }, [roomId, isConnected, getRoomInfo])

  // Fallback: Get room info periodically to ensure synchronization
  useEffect(() => {
    if (roomId && isConnected) {
      const interval = setInterval(() => {
        console.log('🔄 Periodic room info sync for competition')
        getRoomInfo(roomId)
      }, 5000) // Sync every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [roomId, isConnected, getRoomInfo])

  // For demo purposes, create different squads for host and guest
  // In a real app, you'd get the guest players from the WebSocket data
  const hostPlayers = selectedPlayers
  
  // Create a different squad for guest (for testing)
  const guestPlayers = [
    // Different striker
    {
      id: "guest-striker-1",
      name: "Guest Striker 1",
      position: "striker",
      token: {
        symbol: "ETH",
        priceFeedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
      }
    },
    // Different midfielder
    {
      id: "guest-midfielder-1", 
      name: "Guest Midfielder 1",
      position: "midfielder",
      token: {
        symbol: "OP",
        priceFeedId: "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf"
      }
    },
    // Different defender
    {
      id: "guest-defender-1",
      name: "Guest Defender 1", 
      position: "defender",
      token: {
        symbol: "SUI",
        priceFeedId: "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744"
      }
    }
  ]

  // Both players bet the same way - use the room bet
  const roomBet = displayBetType as 'LONG' | 'SHORT'

  // Handle winner announcement via WebSocket
  useEffect(() => {
    if (roomStatus === 'winner_announced') {
      console.log('Winner announced via WebSocket')
      setWinnerAnnounced(true)
      
      // Store winner info in localStorage as fallback (only on client side)
      if (winnerInfo && typeof window !== 'undefined') {
        localStorage.setItem('winnerInfo', JSON.stringify(winnerInfo))
        console.log('💾 Stored winner info in localStorage:', winnerInfo)
      }
    }
  }, [roomStatus, winnerInfo])

  // Debug: Log winner announcement status
  useEffect(() => {
    console.log('🎯 [DEBUG] Winner announcement status:', {
      roomStatus,
      winnerAnnounced,
      showResult,
      winnerInfo
    })
  }, [roomStatus, winnerAnnounced, showResult, winnerInfo])

  // Debug: Log room info for synchronization
  useEffect(() => {
    console.log('🎯 [DEBUG] Room info for competition:', {
      roomInfo,
      displayBetType,
      roomBet
    })
  }, [roomInfo, displayBetType, roomBet])

  // Handle tournament completion with winner announcement
  const handleTournamentComplete = async (result: TournamentResultType) => {
    console.log('Tournament completed:', result)
    setShowResult(true)
    
    // Announce winner via WebSocket
    if (roomId && tournamentId) {
      setIsAnnouncingWinner(true)
      
      try {
        console.log('Match completed with results:', result)
        console.log('Winner:', result.winner)
        console.log('Tournament ID:', tournamentId)
        console.log('Scores:', {
          host: result.hostScore,
          guest: result.guestScore,
          hostPercentageChange: result.hostPercentageChange,
          guestPercentageChange: result.guestPercentageChange
        })
        
        // Determine winner address
        const winnerAddress = result.winner === 'host' ? hostAddress : guestAddress
        console.log('🎉 Announcing winner via WebSocket:', winnerAddress)
        
        // Announce winner via WebSocket (server will handle blockchain transaction)
        announceWinner(roomId, winnerAddress)
        
      } catch (error) {
        console.error('Error announcing winner:', error)
      } finally {
        setIsAnnouncingWinner(false)
      }
    } else {
      console.warn('Missing room ID or tournament ID for winner announcement')
    }
  }

  // Tournament hook
  const {
    isRunning,
    timeRemaining,
    progress,
    result,
    startTournament,
    stopTournament
  } = useTournament({
    hostPlayers,
    guestPlayers,
    roomBet,
    duration: 60000, // 60 seconds
    onComplete: handleTournamentComplete
  })

  // Start tournament when component mounts
  useEffect(() => {
    if (!isRunning && !showResult) {
      startTournament()
    }
  }, [isRunning, showResult, startTournament])

  const handlePlayAgain = () => {
    setShowResult(false)
    startTournament()
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  const handleDone = () => {
    // Get winner info from WebSocket state
    const winnerAddress = winnerInfo?.winnerAddress || ''
    const winnerTxHash = winnerInfo?.txHash || ''
    
    // Redirect to winner announcement page
    const params = new URLSearchParams({
      tournamentId: tournamentId || '',
      winnerAddress: winnerAddress,
      winnerTxHash: winnerTxHash,
      hostAddress: hostAddress,
      guestAddress: guestAddress,
      stakeAmount: stake || ''
    })
    router.push(`/winner-announcement?${params.toString()}`)
  }

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col bg-gray-900 text-white">
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Live Tournament</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                {Math.ceil(timeRemaining / 1000)}s
              </span>
            </div>
          </div>
          
          {/* Score Display */}
          {progress && (
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-white">
                {progress.hostSquad.percentageChange.toFixed(3)}% : {progress.guestSquad.percentageChange.toFixed(3)}%
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-xs">1m</span>
              </div>
            </div>
          )}

          {/* Player Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">Host</div>
                <div className={`text-xs font-bold ${roomBet === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                  {roomBet}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-white text-sm font-medium">Guest</div>
                <div className={`text-xs font-bold ${roomBet === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                  {roomBet}
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Chart */}
        <div className="flex-1 p-4 bg-gray-900">
          <TournamentChart
            progress={progress}
            hostBet={roomBet}
            guestBet={roomBet}
            timeRemaining={timeRemaining}
            duration={60000}
          />
        </div>

        {/* Bottom Section */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex justify-around items-center mb-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <span className="text-white text-sm font-medium">Host</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="text-white text-sm font-medium">Guest</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-base font-medium flex items-center justify-center gap-2 rounded-lg shadow-lg transition-all duration-300"
            disabled={!isRunning && !isAnnouncingWinner}
          >
            {isRunning ? 'Tournament in Progress...' : 
             isAnnouncingWinner ? 'Recording Match Results...' : 
             'Tournament Complete'}
          </Button>
        </div>

        {/* Result Screen Overlay */}
        {showResult && result && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-20">
            <TournamentResult
              result={result}
              roomBet={roomBet}
              onPlayAgain={handlePlayAgain}
              onBackToHome={handleBackToHome}
              onDone={winnerAnnounced ? handleDone : undefined}
            />
            {winnerAnnounced && (
              <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                ✅ Winner Announced
              </div>
            )}
          </div>
        )}
      </div>
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function CompetitionLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Competition</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function CompetitionPage() {
  return (
    <Suspense fallback={<CompetitionLoading />}>
      <CompetitionContent />
    </Suspense>
  )
}
