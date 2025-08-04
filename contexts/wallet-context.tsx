'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { tournamentContract } from '@/lib/tournament-contract'

// Import the wagmi configuration to initialize AppKit
import '@/lib/wagmi'
import { useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'

interface WalletContextType {
  // Wallet connection state
  isConnected: boolean
  address: string | undefined
  isConnecting: boolean
  
  // Contract interaction state
  isContractReady: boolean
  userBalance: string
  networkInfo: { chainId: number; name: string } | null
  
  // Tournament state
  pendingStakes: Map<number, { amount: string; status: 'pending' | 'confirmed' | 'failed' }>
  
  // Functions
  connectWallet: () => Promise<boolean>
  disconnectWallet: () => void
  refreshBalance: () => Promise<void>
  createTournament: (participant1: string, participant2: string) => Promise<{ success: boolean, tournamentId?: number, txHash?: string }>
  depositStake: (tournamentId: number, amountInXtz: string) => Promise<{ success: boolean, txHash?: string }>
  checkUserDeposit: (tournamentId: number) => Promise<boolean>
  announceWinner: (tournamentId: number, winnerAddress: string) => Promise<{ success: boolean, txHash?: string }>
  getTournament: (tournamentId: number) => Promise<any>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected: appKitConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const { disconnect } = useDisconnect()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [isContractReady, setIsContractReady] = useState(false)
  const [userBalance, setUserBalance] = useState('0')
  const [networkInfo, setNetworkInfo] = useState<{ chainId: number; name: string } | null>(null)
  const [pendingStakes, setPendingStakes] = useState(new Map())

  // Initialize contract when wallet connects
  useEffect(() => {
    const initializeContract = async () => {
      if (appKitConnected && address) {
        console.log('Wallet connected, initializing contract...')
        const success = await tournamentContract.connectWallet()
        setIsContractReady(success)
        
        if (success) {
          await refreshBalance()
          const network = await tournamentContract.getNetworkInfo()
          setNetworkInfo(network)
          
          // Setup event listeners
          tournamentContract.setupEventListeners({
            onEscrowDeposited: (tournamentId, participant, amount) => {
              if (participant.toLowerCase() === address.toLowerCase()) {
                console.log(`Stake confirmed for tournament ${tournamentId}`)
                setPendingStakes(prev => {
                  const updated = new Map(prev)
                  const existing = updated.get(tournamentId)
                  if (existing) {
                    updated.set(tournamentId, { ...existing, status: 'confirmed' })
                  }
                  return updated
                })
              }
            },
            onTournamentCompleted: (tournamentId, winner, totalPayout) => {
              console.log(`Tournament ${tournamentId} completed. Winner: ${winner}`)
              // Handle tournament completion
            }
          })
        }
      } else {
        setIsContractReady(false)
        setUserBalance('0')
        setNetworkInfo(null)
        tournamentContract.removeEventListeners()
      }
    }

    initializeContract()
    
    return () => {
      if (!appKitConnected) {
        tournamentContract.removeEventListeners()
      }
    }
  }, [appKitConnected, address])

  // Periodic balance refresh when connected
  useEffect(() => {
    if (appKitConnected && address && isContractReady) {
      // Initial balance fetch
      refreshBalance()
      
      // Set up periodic balance refresh every 10 seconds
      const balanceInterval = setInterval(() => {
        refreshBalance()
      }, 10000)
      
      return () => clearInterval(balanceInterval)
    }
  }, [appKitConnected, address, isContractReady])

  // Handle disconnection state properly
  useEffect(() => {
    if (!appKitConnected) {
      // Clean up state when disconnected
      setIsContractReady(false)
      setUserBalance('0')
      setNetworkInfo(null)
      setPendingStakes(new Map())
      tournamentContract.removeEventListeners()
    }
  }, [appKitConnected])

  const connectWallet = async (): Promise<boolean> => {
    setIsConnecting(true)
    try {
      // AppKit handles the connection UI
      // We just need to wait for the connection to be established
      return appKitConnected
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      // Actually disconnect from AppKit
      await disconnect()
      
      // Clean up local state
      tournamentContract.removeEventListeners()
      setIsContractReady(false)
      setUserBalance('0')
      setNetworkInfo(null)
      setPendingStakes(new Map())
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const refreshBalance = async () => {
    if (address && isContractReady) {
      try {
        const balance = await tournamentContract.getUserBalance(address)
        setUserBalance(balance)
      } catch (error) {
        console.error('Error fetching balance:', error)
        setUserBalance('0')
      }
    }
  }

  const createTournament = async (participant1: string, participant2: string) => {
    if (!isContractReady) {
      return { success: false }
    }
    
    return await tournamentContract.createTournament(participant1, participant2)
  }

  const depositStake = async (tournamentId: number, amountInXtz: string) => {
    if (!isContractReady || !address) {
      return { success: false }
    }

    // Mark as pending
    setPendingStakes(prev => {
      const updated = new Map(prev)
      updated.set(tournamentId, { amount: amountInXtz, status: 'pending' })
      return updated
    })

    try {
      const result = await tournamentContract.depositStake(tournamentId, amountInXtz)
      
      if (!result.success) {
        // Mark as failed
        setPendingStakes(prev => {
          const updated = new Map(prev)
          const existing = updated.get(tournamentId)
          if (existing) {
            updated.set(tournamentId, { ...existing, status: 'failed' })
          }
          return updated
        })
      }
      
      // Update balance after transaction
      await refreshBalance()
      
      return result
    } catch (error) {
      console.error('Error depositing stake:', error)
      setPendingStakes(prev => {
        const updated = new Map(prev)
        const existing = updated.get(tournamentId)
        if (existing) {
          updated.set(tournamentId, { ...existing, status: 'failed' })
        }
        return updated
      })
      return { success: false }
    }
  }

  const checkUserDeposit = async (tournamentId: number): Promise<boolean> => {
    if (!isContractReady || !address) {
      return false
    }

    const escrow = await tournamentContract.checkDeposit(tournamentId, address)
    return escrow?.isDeposited || false
  }

  const announceWinner = async (tournamentId: number, winnerAddress: string) => {
    if (!isContractReady) {
      return { success: false }
    }
    
    return await tournamentContract.announceWinner(tournamentId, winnerAddress)
  }

  const getTournament = async (tournamentId: number) => {
    if (!isContractReady) {
      return null
    }
    
    return await tournamentContract.getTournament(tournamentId)
  }

  const value: WalletContextType = {
    // Wallet connection state
    isConnected: appKitConnected,
    address,
    isConnecting,
    
    // Contract interaction state
    isContractReady,
    userBalance,
    networkInfo,
    
    // Tournament state
    pendingStakes,
    
    // Functions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    createTournament,
    depositStake,
    checkUserDeposit,
    announceWinner,
    getTournament
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export { WalletContext }