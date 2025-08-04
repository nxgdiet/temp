const { ethers } = require('ethers')

// Owner's private key from test script - ONLY for owner actions
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY

const CONTRACT_CONFIG = {
  ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x26d215752f68bc2254186f9f6ff068b8c4bdfd37',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://node.ghostnet.etherlink.com'
}

const CONTRACT_ABI = [
  "function createTournament(uint256 _tournamentId, address _participant1, address _participant2) external",
  "function announceWinner(uint256 _tournamentId, address _winner) external",
  "function getTournament(uint256 _tournamentId) external view returns (tuple(uint256 tournamentId, address participant1, address participant2, address token1, address token2, address winner, uint256 amount1, uint256 amount2, bool isCompleted, uint256 timestamp))",
  "function bothParticipantsDeposited(uint256 _tournamentId) external view returns (bool)",
  "function owner() external view returns (address)"
]

class TournamentOwnerService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL)
    this.ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, this.provider)
    this.contract = new ethers.Contract(CONTRACT_CONFIG.ADDRESS, CONTRACT_ABI, this.ownerWallet)
    
    console.log('🏆 Tournament Owner Service initialized')
    console.log('📋 Contract Address:', CONTRACT_CONFIG.ADDRESS)
    console.log('🔗 RPC URL:', CONTRACT_CONFIG.RPC_URL)
    console.log('👤 Owner Address:', this.ownerWallet.address)
  }

  async createTournament(participant1, participant2, tournamentId = null) {
    try {
      console.log('🎪 Creating tournament on blockchain...')
      console.log('👥 Participants:', { participant1, participant2 })
      
      if (!participant1 || !participant2) {
        throw new Error('Both participant addresses are required')
      }

      if (!ethers.isAddress(participant1) || !ethers.isAddress(participant2)) {
        throw new Error('Invalid participant addresses provided')
      }

      if (participant1.toLowerCase() === participant2.toLowerCase()) {
        throw new Error('Participant addresses must be different')
      }

      // Use provided tournament ID or generate unique tournament ID
      const finalTournamentId = tournamentId || (Date.now() + Math.floor(Math.random() * 1000))
      console.log('🆔 Tournament ID:', finalTournamentId, tournamentId ? '(provided)' : '(generated)')

      console.log('📡 Sending createTournament transaction...')
      const tx = await this.contract.createTournament(
        finalTournamentId,
        participant1,
        participant2
      )

      console.log('⏳ Transaction sent, waiting for confirmation...')
      console.log('🔗 Transaction Hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ Tournament created successfully!')
      console.log('📊 Gas Used:', receipt.gasUsed.toString())

      return {
        success: true,
        tournamentId: finalTournamentId,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('❌ Error creating tournament:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async announceWinner(tournamentId, winnerAddress) {
    try {
      console.log('🏆 Announcing winner on blockchain...')
      console.log('🆔 Tournament ID:', tournamentId)
      console.log('🏅 Winner Address:', winnerAddress)

      if (!tournamentId || !winnerAddress) {
        throw new Error('Tournament ID and winner address are required')
      }

      if (!ethers.isAddress(winnerAddress)) {
        throw new Error('Invalid winner address provided')
      }

      console.log('📡 Sending announceWinner transaction...')
      const tx = await this.contract.announceWinner(tournamentId, winnerAddress)

      console.log('⏳ Transaction sent, waiting for confirmation...')
      console.log('🔗 Transaction Hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ Winner announced successfully!')
      console.log('📊 Gas Used:', receipt.gasUsed.toString())

      return {
        success: true,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('❌ Error announcing winner:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getTournament(tournamentId) {
    try {
      console.log('📋 Getting tournament info from blockchain...')
      console.log('🆔 Tournament ID:', tournamentId)

      const tournament = await this.contract.getTournament(tournamentId)
      
      return {
        success: true,
        tournament: {
          tournamentId: tournament.tournamentId.toString(),
          participant1: tournament.participant1,
          participant2: tournament.participant2,
          winner: tournament.winner,
          isCompleted: tournament.isCompleted,
          timestamp: tournament.timestamp.toString()
        }
      }
    } catch (error) {
      console.error('❌ Error getting tournament:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async bothParticipantsDeposited(tournamentId) {
    try {
      console.log('💰 Checking if both participants have deposited...')
      console.log('🆔 Tournament ID:', tournamentId)

      const bothDeposited = await this.contract.bothParticipantsDeposited(tournamentId)
      
      console.log('✅ Both participants deposited:', bothDeposited)
      
      return {
        success: true,
        bothDeposited
      }
    } catch (error) {
      console.error('❌ Error checking deposits:', error.message)
      return {
        success: false,
        error: error.message,
        bothDeposited: false
      }
    }
  }
}

module.exports = { TournamentOwnerService }