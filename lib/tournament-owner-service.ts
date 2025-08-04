import { ethers } from 'ethers'

// Owner's private key from test script - ONLY for owner actions
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY

const CONTRACT_CONFIG = {
  ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
}

const CONTRACT_ABI = [
  "function createTournament(uint256 _tournamentId, address _participant1, address _participant2) external",
  "function announceWinner(uint256 _tournamentId, address _winner) external",
  "function getTournament(uint256 _tournamentId) external view returns (tuple(uint256 tournamentId, address participant1, address participant2, address token1, address token2, address winner, uint256 amount1, uint256 amount2, bool isCompleted, uint256 timestamp))",
  "function bothParticipantsDeposited(uint256 _tournamentId) external view returns (bool)",
  "function owner() external view returns (address)"
]

export class TournamentOwnerService {
  private provider: ethers.JsonRpcProvider
  private ownerWallet: ethers.Wallet
  private contract: ethers.Contract

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL)
    this.ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY!, this.provider)
    this.contract = new ethers.Contract(CONTRACT_CONFIG.ADDRESS, CONTRACT_ABI, this.ownerWallet)
    
    console.log('🔑 Tournament Owner Service initialized')
    console.log('Owner address:', this.ownerWallet.address)
  }

  async createTournament(participant1: string, participant2: string): Promise<{ success: boolean, tournamentId?: number, txHash?: string, error?: string }> {
    try {
      // Generate unique tournament ID
      const tournamentId = Date.now() + Math.floor(Math.random() * 1000)
      
      console.log(`🏆 Creating tournament ${tournamentId} as owner`)
      console.log('Participants:', { participant1, participant2 })
      
      const tx = await this.contract.createTournament(
        tournamentId,
        participant1,
        participant2
      )
      
      console.log(`Transaction hash: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`✅ Tournament ${tournamentId} created successfully!`)
      console.log(`Gas used: ${receipt.gasUsed.toString()}`)
      
      return {
        success: true,
        tournamentId,
        txHash: tx.hash
      }
    } catch (error) {
      console.error('❌ Error creating tournament:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async announceWinner(tournamentId: number, winnerAddress: string): Promise<{ success: boolean, txHash?: string, error?: string }> {
    try {
      console.log(`🎉 Announcing winner ${winnerAddress} for tournament ${tournamentId} as owner`)
      
      // Pre-flight checks
      const tournament = await this.contract.getTournament(tournamentId)
      const bothDeposited = await this.contract.bothParticipantsDeposited(tournamentId)
      
      console.log('Pre-flight checks:')
      console.log('- Tournament exists:', tournament.tournamentId.toString())
      console.log('- Is completed:', tournament.isCompleted)
      console.log('- Both deposited:', bothDeposited)
      console.log('- Participant1:', tournament.participant1)
      console.log('- Participant2:', tournament.participant2)
      console.log('- Winner:', winnerAddress)
      
      if (tournament.isCompleted) {
        return { success: false, error: 'Tournament already completed' }
      }
      
      if (!bothDeposited) {
        return { success: false, error: 'Both participants must deposit before announcing winner' }
      }
      
      if (winnerAddress.toLowerCase() !== tournament.participant1.toLowerCase() && 
          winnerAddress.toLowerCase() !== tournament.participant2.toLowerCase()) {
        return { success: false, error: 'Winner must be one of the tournament participants' }
      }
      
      const tx = await this.contract.announceWinner(tournamentId, winnerAddress)
      console.log(`Transaction hash: ${tx.hash}`)
      
      const receipt = await tx.wait()
      console.log(`✅ Winner announced successfully!`)
      console.log(`Gas used: ${receipt.gasUsed.toString()}`)
      
      return {
        success: true,
        txHash: tx.hash
      }
    } catch (error) {
      console.error('❌ Error announcing winner:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getTournament(tournamentId: number) {
    try {
      const tournament = await this.contract.getTournament(tournamentId)
      return {
        tournamentId: tournament.tournamentId,
        participant1: tournament.participant1,
        participant2: tournament.participant2,
        token1: tournament.token1,
        token2: tournament.token2,
        winner: tournament.winner,
        amount1: tournament.amount1,
        amount2: tournament.amount2,
        isCompleted: tournament.isCompleted,
        timestamp: tournament.timestamp
      }
    } catch (error) {
      console.error('Error getting tournament:', error)
      return null
    }
  }

  async verifyOwnership(): Promise<boolean> {
    try {
      const contractOwner = await this.contract.owner()
      const isOwner = contractOwner.toLowerCase() === this.ownerWallet.address.toLowerCase()
      console.log('Owner verification:', { contractOwner, ourAddress: this.ownerWallet.address, isOwner })
      return isOwner
    } catch (error) {
      console.error('Error verifying ownership:', error)
      return false
    }
  }
}

// Export singleton instance
export const tournamentOwnerService = new TournamentOwnerService()