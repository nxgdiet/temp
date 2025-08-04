# 🚀 TokenRivals - Bet on Your Favorite Tokens Going Bullish! (or Bearish 👀) 📈📉

## 🎮 Overview

Build your dream crypto squad, challenge other traders, and watch your predictions play out in 60 seconds of pure adrenaline. Go LONG when you're bullish or SHORT when you're bearish - every match is a chance to prove your trading instincts! 🚀

Built on Etherlink with live Pyth price feeds, TokenRivals combines fantasy football mechanics with real-time cryptocurrency trading. Choose your tokens, pick your direction, and let the market decide who's the ultimate crypto trader! 💎

**Ready to bet on your favorite tokens?** Let's go! 🎮🔥

## 🎮 Game Flow

<img width="1920" height="1080" alt="Add a subheading (14)" src="https://github.com/user-attachments/assets/825d4483-0845-42c8-a345-122b967e66fb" />


### 1. Squad Building Phase
- **Token Selection**: Players choose from 13 different cryptocurrencies organized by position:
  - **Strikers (4 tokens)**: BTC, ETH, SOL, UNI 
  - **Midfielders (4 tokens)**: OP, ARB, ATOM, APT
  - **Defenders (5 tokens)**: SUI, PYTH, HYPE, USDC, STETH

- **Formation Selection**: Choose from multiple tactical formations:
  - 2-2-1
  - 0-2-3
  - 3-2-0
  - 0-0-5

### 2. Tournament Entry
- **Betting Direction**: Players select either LONG or SHORT position
- **Stake Amount**: Deposit XTZ (Tezos) as tournament entry fee
- **Room Creation**: Host creates a room and shares room code with opponent
- **Opponent Joining**: Guest joins using room code with matching stake amount

### 3. Blockchain Integration
- **Smart Contract Creation**: Server creates tournament on Etherlink blockchain
- **Escrow System**: Both players stake XTZ into TournamentEscrow contract
- **Verification**: Server verifies both stakes before competition begins

### 4. Live Competition
- **Real-time Price Feeds**: Pyth Network provides live cryptocurrency prices
- **60-Second Matches**: Fast-paced tournaments with real-time price tracking
- **Performance Calculation**: Squad performance based on token price movements
- **Winner Determination**: Player with better performance in chosen direction wins

### 5. Prize Distribution
- **Smart Contract Payout**: Winner receives both stakes from escrow contract
- **Transaction Verification**: All transactions recorded on Etherlink blockchain
- **Explorer Integration**: Direct links to Etherlink explorer for transparency

## 🔗 Etherlink Smart Contract

**Deployed Contract Address**: [`0x26D215752f68bc2254186F9f6FF068b8C4BdFd37`](https://testnet.explorer.etherlink.com/address/0x26D215752f68bc2254186F9f6FF068b8C4BdFd37?tab=index)

### TournamentEscrow.sol Features

```solidity
// Core contract functionality
- createTournament(): Owner creates tournament with two participants
- depositEscrow(): Players stake XTZ or ERC20 tokens
- announceWinner(): Owner announces winner and distributes prizes
- emergencyWithdraw(): Safety mechanism for tournament cancellation
```

### Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Restricted access to tournament management
- **Escrow System**: Secure fund holding during tournaments
- **Emergency Withdrawals**: Player protection mechanisms

## 📊 Pyth Price Feed Integration

### Real-time Data Sources
- **Hermes Client**: Direct connection to Pyth Network
- **13 Token Coverage**: Comprehensive cryptocurrency selection
- **Sub-second Updates**: Real-time price movements
- **High Accuracy**: Institutional-grade price feeds

### Price Feed IDs
```javascript
// Strikers - High volatility tokens
BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
SOL: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
UNI: "0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501"

// Midfielders - Balanced performance
OP: "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf"
ARB: "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5"
ATOM: "0xb00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819"
APT: "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5"

// Defenders - Stability tokens
SUI: "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744"
PYTH: "0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff"
HYPE: "0x4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b"
USDC: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
STETH: "0x846ae1bdb6300b817cee5fdee2a6da192775030db5615b94a465f53bd40850b5"
```

### Performance Calculation
- **Percentage Change Tracking**: Real-time calculation of token performance
- **Squad Aggregation**: Average performance across selected tokens
- **Direction-based Scoring**: LONG/SHORT position affects scoring logic
- **Timestamp Synchronization**: Precise timing for fair competition

## 🚀 Transaction Drivers on Etherlink

### High-Frequency Trading Activity
1. **Tournament Creation**: Each match creates multiple on-chain transactions
2. **Stake Deposits**: Two transactions per tournament (host + guest)
3. **Winner Announcement**: Final transaction for prize distribution
4. **Emergency Withdrawals**: Safety mechanism transactions

### Network Benefits
- **Gas Fee Revenue**: Consistent transaction volume for Etherlink
- **User Adoption**: Gamified introduction to the Etherlink eco-system
- **Cross-chain Bridges**: Potential integration with other Tezos networks

## 🗺️ Future Roadmap

### Phase 1: Etherlink Mainnet Migration
- **Smart Contract Deployment**: Deploy to Etherlink mainnet
- **Security Audits**: Comprehensive contract auditing
- **Performance Optimization**: Gas optimization for mainnet
- **User Migration**: Seamless transition from testnet

### Phase 2: Token Expansion
- **DeFi Tokens**: Add popular DeFi protocols (AAVE, COMP, CRV)
- **Layer 2 Tokens**: Integrate L2 ecosystem tokens (MATIC, ARB, OP)
- **Meme Coins**: Include trending meme tokens for volatility
- **Stablecoins**: Add more stablecoin options (DAI, FRAX, USDT)

### Phase 3: Advanced Features
- **Tournament Leagues**: Seasonal competitions with leaderboards
- **NFT Integration**: Player avatars and collectible cards
- **Staking Rewards**: Long-term token staking for platform rewards
- **Cross-chain Tournaments**: Multi-chain competition support

### Phase 4: Ecosystem Growth
- **Mobile App**: Native iOS/Android applications
- **Tournament Sponsorships**: Corporate-sponsored tournaments
- **Educational Platform**: Trading tutorials and strategy guides

## 🌐 Web3 Community Attraction

### User Acquisition Strategies
- **Gamification**: Fantasy sports appeal to traditional gamers
- **Educational Value**: Learn trading through gameplay
- **Social Features**: Room sharing and tournament spectating
- **Reward Systems**: Achievement badges and leaderboards

### Community Building
- **Discord Integration**: Real-time community engagement
- **Tournament Streaming**: Live tournament broadcasts
- **Strategy Sharing**: Community-driven trading strategies
- **Governance Participation**: DAO structure for platform decisions

### Cross-Platform Integration
- **Social Media**: Tournament result sharing
- **Streaming Platforms**: Twitch/YouTube integration
- **Mobile Gaming**: App store presence
- **Web3 Wallets**: Multi-wallet support

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component library
- **Ethers.js**: Ethereum/Tezos interaction

### Backend Infrastructure
- **WebSocket Server**: Real-time communication
- **Node.js**: Server-side JavaScript runtime
- **Tournament Service**: Game logic and price calculations
- **Blockchain Integration**: Etherlink Smart contract interaction

### Blockchain Integration
- **Etherlink**: Tezos EVM compatibility
- **Pyth Network**: Oracle price feeds
- **Smart Contracts**: Solidity-based escrow system
- **Wallet Integration**: MetaMask and other Web3 wallets

### Smart Contract Security
- **Multi-sig Wallets**: Secure fund management
- **Timelock Contracts**: Delayed execution for safety
- **Emergency Pauses**: Circuit breakers for critical issues
- **Regular Audits**: Continuous security assessment

## 🎯 Conclusion

TokenRivals represents a paradigm shift in Web3 gaming, combining the excitement of fantasy sports.By leveraging Etherlink's high-performance infrastructure and Pyth Network's reliable price feeds, the platform creates a unique competitive environment that drives meaningful blockchain adoption.

---
