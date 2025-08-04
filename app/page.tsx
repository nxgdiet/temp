"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, X } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"
import Image from "next/image"

// Crypto token data for different positions with Stable Price Feed IDs
const strikerTokens = [
  { id: 1, name: "Bitcoin", symbol: "BTC", priceFeedId: "0xe62d2Ef8EA160056a8766A30bA6f992EBebB96756b72dc658afedf0f4a415b43", color: "from-yellow-400 to-orange-500" },
  { id: 2, name: "Ethereum", symbol: "ETH", priceFeedId: "0xff6152fBEe7142801C93CaDf6BE5be676d7c6A0d25126d665480874634fd0ace", color: "from-green-400 to-blue-500" },
  { id: 3, name: "Solana", symbol: "SOL", priceFeedId: "0xef0d147356BaD7903B93b8938D5a90db84E1FB83d0c6c7bc0f4cfac8c280b56d", color: "from-green-400 to-blue-500" },
  { id: 4, name: "Uniswap", symbol: "UNI", priceFeedId: "0x78d102B683898091b1c83925cDd73EE4619bD77D568bf00ba737b456ba171501", color: "from-pink-500 to-red-500" },
]

const midfielderTokens = [
  { id: 5, name: "Optimism", symbol: "OP", priceFeedId: "0x385f210A326A0f5ccc1fa44107203eee4F5EfF21cecfe711544d2d59165e9bdf", color: "from-red-400 to-orange-500" },
  { id: 6, name: "Arbitrum", symbol: "ARB", priceFeedId: "0x3fa4243B35a76bc73347A000dE53DD4a72e61549ebab8a791e344b3b9c1adcf5", color: "from-blue-500 to-cyan-500" },
  { id: 7, name: "Cosmos", symbol: "ATOM", priceFeedId: "0xb00b5BEb14E59B2f3733E0bC838D4FbA8CbB1030439983d037e7222c4e612819", color: "from-blue-400 to-indigo-500" },
  { id: 8, name: "Aptos", symbol: "APT", priceFeedId: "0x03ae13A34F453016c0664a00e2c48B4c79f4EA918b37509f5372ae51f0af00d5", color: "from-green-400 to-blue-500" },
]

const defenderTokens = [
  { id: 9, name: "Sui", symbol: "SUI", priceFeedId: "0x23d720C6ABc011CfF4398546dF57c4D025CE6a1eaf77f804fc7f920a6dc65744", color: "from-green-400 to-teal-500" },
  { id: 10, name: "Pyth Network", symbol: "PYTH", priceFeedId: "0x0bbf2E65a946e795E2D6E654Bd1B444C909F55b18a1e5df1c3922d06719579ff", color: "from-green-500 to-blue-600" },
  { id: 11, name: "Hype", symbol: "HYPE", priceFeedId: "0x4279255f4141D6d23b9E9E65319Fb29a0Cf3A17fff20fbc530d2a603eb6cd98b", color: "from-green-400 to-blue-600" },
  { id: 12, name: "USD Coin", symbol: "USDC", priceFeedId: "0xeaa03AE63Bb1B796077f8e5951115826f4Afd4Be21ed0cfc2798d1f9a9e9c94a", color: "from-blue-400 to-cyan-500" },
  { id: 13, name: "Lido Staked ETH", symbol: "STETH", priceFeedId: "0x846a1b144e778cc93A9EDDF8c98aB7B3B419BEBFb5615b94a465f53bd40850b5", color: "from-green-400 to-emerald-500" },
]

type Token = {
  id: number
  name: string
  symbol: string
  priceFeedId: string
  color: string
}

type SelectedPlayer = {
  position: "ST" | "MF" | "CB"
  token: Token
  slotId: string
}

type Formation = {
  strikers: number
  midfielders: number
  defenders: number
  layout: { position: "ST" | "MF" | "CB"; count: number; className: string }[]
}

const formations: { [key: string]: Formation } = {
  "2-2-1": {
    strikers: 1,
    midfielders: 2,
    defenders: 2,
    layout: [
      { position: "ST", count: 1, className: "flex justify-center w-full" },
      { position: "MF", count: 2, className: "flex justify-around w-full gap-x-4" },
      { position: "CB", count: 2, className: "flex justify-around w-full gap-x-4" },
    ],
  },
  "0-2-3": {
    strikers: 3,
    midfielders: 2,
    defenders: 0,
    layout: [
      { position: "ST", count: 3, className: "flex justify-around w-full gap-x-2" },
      { position: "MF", count: 2, className: "flex justify-around w-full gap-x-4" },
    ],
  },
  "3-2-0": {
    strikers: 0,
    midfielders: 2,
    defenders: 3,
    layout: [
      { position: "MF", count: 2, className: "flex justify-around w-full gap-x-4" },
      { position: "CB", count: 3, className: "flex justify-around w-full gap-x-4" },
    ],
  },
  "0-0-5": {
    strikers: 5,
    midfielders: 0,
    defenders: 0,
    layout: [
      { position: "ST", count: 3, className: "flex justify-around w-full gap-x-2" },
      { position: "ST", count: 2, className: "flex justify-around w-full gap-x-4" },
    ],
  },
}

const getTokensForPosition = (position: "ST" | "MF" | "CB"): Token[] => {
  switch (position) {
    case "ST":
      return strikerTokens
    case "MF":
      return midfielderTokens
    case "CB":
      return defenderTokens
    default:
      return []
  }
}

// Get the image filename based on token symbol
const getImageSrc = (symbol: string) => {
  const imageMap: { [key: string]: string } = {
    'BTC': '/BTC.png',
    'ETH': '/eth.png',
    'SOL': '/SOL.png',
    'UNI': '/UNI.png',
    'OP': '/optimism.png',
    'ARB': '/arb.png',
    'ATOM': '/atom.png',
    'APT': '/apt.png',
    'SUI': '/sui.png',
    'PYTH': '/PYTH.png',
    'HYPE': '/HYPE.png',
    'USDC': '/USDC.png',
    'STETH': '/steth.png'
  }
  return imageMap[symbol] || `/${symbol}.png`
}

const TokenCard = ({ token, onClick, isDisabled }: { token: Token; onClick: () => void; isDisabled?: boolean }) => {
  return (
    <div 
      onClick={isDisabled ? undefined : onClick}
      className={`bg-gray-800 rounded-lg p-3 transition-all duration-200 border ${
        isDisabled 
          ? 'cursor-not-allowed opacity-50 border-gray-600' 
          : 'cursor-pointer hover:bg-gray-700 border-gray-700 hover:border-green-500'
      }`}
    >
      <div className="w-full h-25 rounded-md bg-gray-700 mb-3 flex items-center justify-center relative overflow-hidden">
        <Image
          src={getImageSrc(token.symbol)}
          alt={token.name}
          width={96}
          height={96}
          className="w-full h-full object-cover object-top"
        />
        {isDisabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">SELECTED</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-white font-semibold text-sm truncate">{token.name}</h3>
        <p className="text-gray-400 text-xs font-mono">{token.priceFeedId.slice(0, 8)}...</p>
      </div>
    </div>
  )
}

const PlayerSlot = ({ position, slotId, onClick, selectedPlayer, onRemove }: { 
  position: "ST" | "MF" | "CB"; 
  slotId: string; 
  onClick: (position: "ST" | "MF" | "CB", slotId: string) => void;
  selectedPlayer?: SelectedPlayer;
  onRemove: (slotId: string) => void;
}) => {
  let positionColorClass = ""
  switch (position) {
    case "ST":
      positionColorClass = "bg-position-st"
      break
    case "MF":
      positionColorClass = "bg-position-mf"
      break
    case "CB":
      positionColorClass = "bg-position-cb"
      break
  }

  const getPositionColor = (position: "ST" | "MF" | "CB") => {
    switch (position) {
      case "ST":
        return "bg-red-500"
      case "MF":
        return "bg-blue-500"
      case "CB":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-20 h-20 bg-player-slot-bg rounded-md p-2 text-white text-xs font-medium text-center flex-shrink-0 border border-gray-600 shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
      {selectedPlayer ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mb-1 overflow-hidden">
            <Image
              src={getImageSrc(selectedPlayer.token.symbol)}
              alt={selectedPlayer.token.name}
              width={40}
              height={40}
              className="w-full h-full object-cover object-center rounded-full"
            />
          </div>
          <span className="text-xs truncate w-full">{selectedPlayer.token.name}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onRemove(slotId)
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <button onClick={() => onClick(position, slotId)} className="flex flex-col items-center justify-center w-full h-full">
          <Plus className="w-6 h-6 mb-1 text-green-400" />
          <span>ADD TOKEN</span>
        </button>
      )}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-4 rounded-sm flex items-center justify-center text-white text-[10px] font-bold ${positionColorClass} shadow-sm`}
      >
        {position}
      </div>
    </div>
  )
}

function FantasyFootballGameContent() {
  const [activeFormation, setActiveFormation] = useState("2-2-1")
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<"ST" | "MF" | "CB" | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Clear selected players when formation changes
  const handleFormationChange = (newFormation: string) => {
    setActiveFormation(newFormation)
    // Only clear players that are not valid for the new formation
    setSelectedPlayers(prevPlayers => {
      const newFormationData = formations[newFormation]
      return prevPlayers.filter(player => {
        // Keep players that are still valid for the new formation
        if (player.position === "ST" && newFormationData.strikers > 0) return true
        if (player.position === "MF" && newFormationData.midfielders > 0) return true
        if (player.position === "CB" && newFormationData.defenders > 0) return true
        return false
      })
    })
  }

  // Initialize formation from URL params if available (for direct links)
  useEffect(() => {
    const formation = searchParams.get("formation")
    if (formation && formations[formation]) {
      setActiveFormation(formation)
    }
  }, [searchParams])

  const handleEnterTournament = () => {
    const selectedPlayersParam = encodeURIComponent(JSON.stringify(selectedPlayers))
    router.push(`/tournament-entry?selectedPlayers=${selectedPlayersParam}&formation=${activeFormation}`)
  }

  const handlePlayerSlotClick = (position: "ST" | "MF" | "CB", slotId: string) => {
    setSelectedPosition(position)
    setSelectedSlotId(slotId)
    setShowTokenModal(true)
  }

  const removePlayer = (slotId: string) => {
    setSelectedPlayers(prevPlayers => prevPlayers.filter(player => player.slotId !== slotId))
  }

  const handleTokenSelect = (token: Token) => {
    if (selectedPosition && selectedSlotId) {
      // Check if this token is already selected in another slot
      const isTokenAlreadySelected = selectedPlayers.some(player => 
        player.token.id === token.id && player.slotId !== selectedSlotId
      )
      
      if (isTokenAlreadySelected) {
        // Token is already selected, don't proceed
        return
      }
      
      // Create updated players list
      const updatedPlayers = selectedPlayers.filter(player => player.slotId !== selectedSlotId)
      const newPlayer: SelectedPlayer = {
        position: selectedPosition,
        token,
        slotId: selectedSlotId
      }
      const newSelectedPlayers = [...updatedPlayers, newPlayer]
      
      // Update the state immediately to reflect the selection
      setSelectedPlayers(newSelectedPlayers)
      
      // Close the modal
      setShowTokenModal(false)
      setSelectedPosition(null)
      setSelectedSlotId(null)
    }
  }

  const isEnterTournamentButtonDisabled = selectedPlayers.length === 0

  const currentFormation = formations[activeFormation]

  return (
    <MobileFrame>
      <div className="h-full flex flex-col bg-gray-900">
        {/* Formation Tabs */}
        <div className="flex justify-around p-2 bg-mobile-frame-dark border-b border-gray-800 shadow-inner">
          {Object.keys(formations).map((formationKey) => (
            <Button
              key={formationKey}
              variant="ghost"
              onClick={() => handleFormationChange(formationKey)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFormation === formationKey
                  ? "bg-gradient-to-r from-tab-active-green to-green-600 text-mobile-frame-dark shadow-lg"
                  : "text-tab-inactive-text hover:bg-gray-700 hover:text-white"
              }`}
            >
              {formationKey}
            </Button>
          ))}
        </div>

        {/* Football Pitch */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
          <div className="relative w-full h-full bg-pitch-green rounded-lg overflow-hidden flex flex-col justify-around items-center p-4 border-4 border-green-700 shadow-2xl">
            {/* Pitch Lines */}
            <div className="absolute inset-0 border-2 border-pitch-line-white rounded-lg"></div>
            <div className="absolute w-full h-1 border-t-2 border-pitch-line-white top-1/2 -translate-y-1/2"></div>
            <div className="absolute w-20 h-20 border-2 border-pitch-line-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-24 h-16 border-2 border-pitch-line-white top-0 left-1/2 -translate-x-1/2 rounded-b-lg"></div>
            <div className="absolute w-24 h-16 border-2 border-pitch-line-white bottom-0 left-1/2 -translate-x-1/2 rounded-t-lg"></div>
            {/* Player Slots */}
            {currentFormation.layout.map((row, rowIndex) => (
              <div key={rowIndex} className={`${row.className} flex-1 flex items-center`}>
                {Array.from({ length: row.count }).map((_, playerIndex) => {
                  // Create unique slot ID that includes formation info
                  const slotId = `${activeFormation}-${row.position}-${playerIndex}`
                  const selectedPlayer = selectedPlayers.find(p => p.slotId === slotId)
                  return (
                    <PlayerSlot
                      key={slotId}
                      position={row.position}
                      slotId={slotId}
                      onClick={handlePlayerSlotClick}
                      selectedPlayer={selectedPlayer}
                      onRemove={removePlayer}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-mobile-frame-dark border-t border-gray-800 shadow-inner">
          <Button
            className={`w-full py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
              isEnterTournamentButtonDisabled
                ? "bg-button-disabled cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-button-green to-green-600 hover:from-green-600 hover:to-button-green"
            }`}
            onClick={handleEnterTournament}
            disabled={isEnterTournamentButtonDisabled}
          >
            {isEnterTournamentButtonDisabled ? "Select players to continue" : "Enter Tournament"}
          </Button>
        </div>
      </div>

      {/* Token Selection Modal */}
      {showTokenModal && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                Select {selectedPosition === "ST" ? "Striker" : selectedPosition === "MF" ? "Midfielder" : "Defender"} Token
              </h2>
              <button 
                onClick={() => {
                  setShowTokenModal(false)
                  setSelectedPosition(null)
                  setSelectedSlotId(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Token Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {getTokensForPosition(selectedPosition).map((token) => {
                  const isAlreadySelected = selectedPlayers.some(player => 
                    player.token.id === token.id && player.slotId !== selectedSlotId
                  )
                  return (
                    <TokenCard 
                      key={token.id} 
                      token={token} 
                      onClick={() => handleTokenSelect(token)}
                      isDisabled={isAlreadySelected}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </MobileFrame>
  )
}

// Loading component for Suspense fallback
function FantasyFootballGameLoading() {
  return (
    <MobileFrame>
      <div className="flex flex-col h-full bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Loading Fantasy Football</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  )
}

export default function FantasyFootballGame() {
  return (
    <Suspense fallback={<FantasyFootballGameLoading />}>
      <FantasyFootballGameContent />
    </Suspense>
  )
}
