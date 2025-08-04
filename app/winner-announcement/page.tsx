"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Trophy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"
import { useRoomWebSocket } from "@/hooks/use-room-websocket"

function WinnerAnnouncementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const tournamentId = searchParams.get("tournamentId")
  const winnerAddress = searchParams.get("winnerAddress")
  const winnerTxHash = searchParams.get("winnerTxHash")
  const stakeAmount = searchParams.get("stakeAmount")

  const { winnerInfo } = useRoomWebSocket()

  // Get winner information from WebSocket, localStorage, or URL params
  const getWinnerInfo = () => {
    // First try WebSocket
    if (winnerInfo?.winnerAddress && winnerInfo?.txHash) {
      return winnerInfo
    }
    
    // Then try localStorage (only on client side)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('winnerInfo')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.winnerAddress && parsed.txHash) {
            console.log('📦 Retrieved winner info from localStorage:', parsed)
            return parsed
          }
        }
      } catch (error) {
        console.error('Error parsing localStorage winner info:', error)
      }
    }
    
    // Finally fallback to URL params
    return { winnerAddress, txHash: winnerTxHash }
  }

  const finalWinnerInfo = getWinnerInfo()
  const finalWinnerAddress = finalWinnerInfo.winnerAddress
  const finalWinnerTxHash = finalWinnerInfo.txHash

  // Check if we have any winner information
  const hasWinnerInfo = finalWinnerAddress && finalWinnerTxHash

  // Debug: Log winner info
  useEffect(() => {
    console.log('🎯 [DEBUG] Winner announcement page winner info:', {
      winnerInfo,
      urlWinnerAddress: winnerAddress,
      urlWinnerTxHash: winnerTxHash,
      finalWinnerInfo,
      finalWinnerAddress,
      finalWinnerTxHash,
      hasWinnerInfo
    })
  }, [winnerInfo, winnerAddress, winnerTxHash, finalWinnerInfo, finalWinnerAddress, finalWinnerTxHash, hasWinnerInfo])

  const handleViewTransaction = () => {
    const txHash = finalWinnerTxHash
    if (txHash) {
      const explorerUrl = `https://testnet.explorer.etherlink.com/tx/${txHash}`
      window.open(explorerUrl, '_blank')
    }
  }

  const handleBackToHome = () => {
    // Clear winner info from localStorage (only on client side)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('winnerInfo')
      console.log('🗑️ Cleared winner info from localStorage')
    }
    router.push('/')
  }

  if (error) {
    return (
      <MobileFrame>
        <div className="flex flex-col h-full bg-gray-900">
          <div className="p-4 text-center">
            <h1 className="text-xl font-bold text-white">Winner Announcement Error</h1>
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
              onClick={handleBackToHome}
              variant="outline"
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Go Home
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
          {/* Header */}
          <div className="flex items-center mb-6 relative">
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white">Tournament Complete</h1>
            </div>
          </div>

          {/* Winner Information */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg p-6 mb-6">
            
            {hasWinnerInfo ? (
              <div className="text-white">
                <p className="text-lg mb-2 text-center font-bold">Winner Address</p>
                <div className="bg-white/20 rounded p-3 mb-4">
                  <div className="text-center">
                    <div className="text-xs font-mono leading-relaxed break-all">
                      {finalWinnerAddress}
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm opacity-90">
                  Prize Amount: <span className="font-bold">{stakeAmount ? (parseFloat(stakeAmount) * 2).toFixed(4) : '0'} XTZ</span> 
                </p>
              </div>
            ) : (
              <div className="text-white">
                <p className="text-lg mb-2">⏳ Winner information is being processed...</p>
                <p className="text-sm opacity-90">
                  Please wait while the winner announcement transaction is being confirmed on the blockchain.
                </p>
              </div>
            )}
          </div>

          {/* Transaction Information */}
          {hasWinnerInfo && finalWinnerTxHash && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-lg font-semibold text-white">Winner Transaction</h3>
              </div>
              
              <Button
                onClick={handleViewTransaction}
                className="w-full bg-button-gray hover:bg-gray-600 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="w-full bg-button-green hover:bg-green-600 text-white"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function WinnerAnnouncementLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Winner Announcement</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function WinnerAnnouncementPage() {
  return (
    <Suspense fallback={<WinnerAnnouncementLoading />}>
      <WinnerAnnouncementContent />
    </Suspense>
  )
} 