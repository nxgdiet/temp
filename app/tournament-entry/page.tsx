"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Users, Clipboard } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"

function TournamentEntryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roomId, setRoomId] = useState("")
  const [showJoinForm, setShowJoinForm] = useState(false)

  const selectedPlayersParam = searchParams.get("selectedPlayers")
  const formation = searchParams.get("formation")

  const handleCreateNewRoom = () => {
    router.push(`/betting-selection?selectedPlayers=${selectedPlayersParam}&formation=${formation}`)
  }

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      // Navigate to room join page with the room code
      router.push(`/room-join?selectedPlayers=${selectedPlayersParam}&formation=${formation}&roomCode=${roomId.trim()}`)
    }
  }

  const handlePasteRoomId = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRoomId(text)
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <button 
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Enter Tournament</h1>
          <div className="w-6 h-6"></div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Choose Your Path</h2>
            <p className="text-gray-400">Create a new room or join an existing one</p>
          </div>

          {!showJoinForm ? (
            <div className="space-y-4">
              {/* Create New Room Option */}
              <div 
                onClick={handleCreateNewRoom}
                className="p-6 rounded-lg border-2 border-gray-600 bg-gray-800 hover:border-green-500 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Create New Room</h3>
                    <p className="text-gray-400">Start a fresh match and invite others</p>
                  </div>
                </div>
              </div>

              {/* Join Existing Room Option */}
              <div 
                onClick={() => setShowJoinForm(true)}
                className="p-6 rounded-lg border-2 border-gray-600 bg-gray-800 hover:border-blue-500 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Join Existing Room</h3>
                    <p className="text-gray-400">Enter a room ID to join a match</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Back Button */}
              <button 
                onClick={() => setShowJoinForm(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to options</span>
              </button>

              {/* Join Form */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Join Room</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Room ID</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room ID"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Button
                        onClick={handlePasteRoomId}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700"
                      >
                        <Clipboard className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomId.trim()}
                    className={`w-full py-3 text-lg font-bold rounded-lg transition-all duration-300 ${
                      roomId.trim()
                        ? "bg-button-green hover:bg-green-600"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Join Room
                  </Button>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">How to join:</h4>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. Ask the room creator for their room ID</li>
                    <li>2. Paste or type the room ID above</li>
                    <li>3. Click &quot;Join Room&quot; to enter the match</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function TournamentEntryLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Tournament Entry</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function TournamentEntryPage() {
  return (
    <Suspense fallback={<TournamentEntryLoading />}>
      <TournamentEntryContent />
    </Suspense>
  )
} 