"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, Check, ArrowLeft } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"

function RoomCodeDisplayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)

  const roomId = searchParams.get("roomId")
  const bet = searchParams.get("bet")
  const selectedPlayersParam = searchParams.get("selectedPlayers")
  const formation = searchParams.get("formation")

  // Check if opponent has joined (this would be handled by WebSocket in real app)
  useEffect(() => {
         // Simulate opponent joining after 3 seconds for demo purposes
     // In a real app, this would be triggered by WebSocket event
     const timer = setTimeout(() => {
       // Redirect host to competition page
       router.push(`/competition?roomId=${roomId}&bet=${bet}&selectedPlayers=${selectedPlayersParam}&formation=${formation}&isHost=true&hostBet=${bet}`)
     }, 3000)

    return () => clearTimeout(timer)
  }, [roomId, bet, selectedPlayersParam, formation, router])

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

  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Room Created</h1>
          <button 
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
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
                <span className="text-white font-mono text-2xl font-bold">{roomId}</span>
              </div>
            </div>

            <Button
              onClick={handleCopyRoomCode}
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

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">How to play:</h3>
            <ol className="text-gray-300 text-sm space-y-1">
              <li>1. Copy and share the room code with your opponent</li>
              <li>2. Your opponent will enter this code to join</li>
              <li>3. Once they join, the match will automatically start</li>
              <li>4. The player with the better performing squad wins!</li>
            </ol>
          </div>

          {/* Waiting Status */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Waiting for opponent to join...</span>
            </div>
            <p className="text-gray-500 text-xs">You&apos;ll be automatically redirected when they join</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function RoomCodeDisplayLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Room Code Display</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function RoomCodeDisplayPage() {
  return (
    <Suspense fallback={<RoomCodeDisplayLoading />}>
      <RoomCodeDisplayContent />
    </Suspense>
  )
} 