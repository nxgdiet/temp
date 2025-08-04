import { HermesClient } from "@pythnetwork/hermes-client";

// Price feed IDs mapping (symbol -> price feed ID without 0x prefix)
export const PRICE_FEED_IDS = {
  // Strikers
  "BTC": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  "ETH": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "SOL": "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  "UNI": "78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501",
  
  // Midfielders
  "OP": "385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf",
  "ARB": "3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5",
  "ATOM": "b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819",
  "APT": "03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5",
  
  // Defenders
  "SUI": "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
  "PYTH": "0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff",
  "HYPE": "4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b",
  "USDC": "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  "STETH": "846ae1bdb6300b817cee5fdee2a6da192775030db5615b94a465f53bd40850b5"
};

export interface TokenPrice {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface SquadValue {
  totalValue: number;
  tokenValues: { [tokenId: string]: number };
  percentageChange: number; // Average percentage change across all tokens
  tokenPercentageChanges: { [tokenId: string]: number }; // Individual token percentage changes
  timestamp: number;
}

export interface TournamentProgress {
  hostSquad: SquadValue;
  guestSquad: SquadValue;
  timestamp: number;
  timeRemaining: number;
}

export interface InitialPrices {
  [symbol: string]: number;
}

export interface TournamentResult {
  winner: 'host' | 'guest' | 'tie';
  hostScore: number;
  guestScore: number;
  hostPercentageChange: number;
  guestPercentageChange: number;
  finalHostValue: number;
  finalGuestValue: number;
}

class TournamentService {
  private connection: HermesClient;
  private priceCache: Map<string, TokenPrice> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 1000; // 1 second cache
  private initialPrices: InitialPrices = {}; // Store initial prices at T0 by symbol

  constructor() {
    this.connection = new HermesClient("https://hermes.pyth.network", {});
  }

  // Fetch current prices for all tokens
  async fetchCurrentPrices(): Promise<TokenPrice[]> {
    const now = Date.now();
    
    // Return cached prices if they're still fresh
    if (now - this.lastFetchTime < this.CACHE_DURATION && this.priceCache.size > 0) {
      return Array.from(this.priceCache.values());
    }

    try {
      // Get all price feed IDs
      const priceIds = Object.values(PRICE_FEED_IDS);
      
      const result = await this.connection.getLatestPriceUpdates(priceIds);
      const updates = result.parsed;

      const prices: TokenPrice[] = [];
      
      if (updates) {
        updates.forEach((update) => {
          // Find symbol for this price feed ID
          const symbol = Object.keys(PRICE_FEED_IDS).find(sym => 
            PRICE_FEED_IDS[sym as keyof typeof PRICE_FEED_IDS] === update.id
          );
          
          if (symbol) {
            const rawPrice = update.price.price;
            const expo = update.price.expo;
            const actualPrice = Number(rawPrice) * Math.pow(10, expo);
            
            const tokenPrice: TokenPrice = {
              symbol,
              price: actualPrice,
              timestamp: now
            };
            
            prices.push(tokenPrice);
            this.priceCache.set(symbol, tokenPrice);
          }
        });
      }

      this.lastFetchTime = now;
      return prices;
    } catch (error) {
      console.error("Error fetching prices:", error);
      // Return cached prices if available, otherwise empty array
      return Array.from(this.priceCache.values());
    }
  }

  // Set initial prices for the tournament (called at T0)
  setInitialPrices(prices: TokenPrice[]) {
    this.initialPrices = {};
    prices.forEach((price) => {
      this.initialPrices[price.symbol] = price.price;
    });
    console.log('Initial prices set:', this.initialPrices);
  }

  // Calculate squad value and percentage changes based on selected players
  calculateSquadValue(selectedPlayers: any[], prices: TokenPrice[]): SquadValue {
    const tokenValues: { [tokenId: string]: number } = {};
    const tokenPercentageChanges: { [tokenId: string]: number } = {};
    let totalValue = 0;
    let totalPercentageChange = 0;
    let validTokens = 0;

    console.log('Calculating squad value for players:', selectedPlayers.length);
    console.log('Available prices:', prices.map(p => p.symbol));
    console.log('Initial prices:', this.initialPrices);

    selectedPlayers.forEach((player) => {
      const tokenPrice = prices.find(p => p.symbol === player.token.symbol);
      console.log(`Processing ${player.token.symbol}:`, {
        found: !!tokenPrice,
        symbol: player.token.symbol,
        hasInitialPrice: !!this.initialPrices[player.token.symbol],
        initialPrice: this.initialPrices[player.token.symbol]
      });
      
      if (tokenPrice) {
        const currentPrice = tokenPrice.price;
        const initialPrice = this.initialPrices[player.token.symbol];
        
        tokenValues[player.token.symbol] = currentPrice;
        totalValue += currentPrice;

        // Calculate percentage change if we have initial price
        if (initialPrice && initialPrice > 0) {
          const percentageChange = ((currentPrice - initialPrice) / initialPrice) * 100;
          tokenPercentageChanges[player.token.symbol] = percentageChange;
          totalPercentageChange += percentageChange;
          validTokens++;
          console.log(`${player.token.symbol}: ${initialPrice} -> ${currentPrice} = ${percentageChange.toFixed(3)}%`);
        } else {
          console.log(`${player.token.symbol}: No initial price found`);
        }
      } else {
        console.log(`${player.token.symbol}: No current price found`);
      }
    });

    // Calculate average percentage change across all tokens
    const averagePercentageChange = validTokens > 0 ? totalPercentageChange / validTokens : 0;
    console.log(`Final result: ${validTokens} valid tokens, average change: ${averagePercentageChange.toFixed(3)}%`);

    return {
      totalValue,
      tokenValues,
      percentageChange: averagePercentageChange,
      tokenPercentageChanges,
      timestamp: Date.now()
    };
  }

  // Calculate percentage change for a squad
  calculatePercentageChange(initialValue: number, finalValue: number): number {
    if (initialValue === 0) return 0;
    return ((finalValue - initialValue) / initialValue) * 100;
  }

  // Determine tournament winner based on percentage changes
  // Both players bet the same way (LONG or SHORT) - winner is the one with better performance
  determineWinner(
    roomBet: 'LONG' | 'SHORT', // The bet type for the entire room
    hostPercentageChange: number,
    guestPercentageChange: number
  ): TournamentResult {
    let hostScore: number;
    let guestScore: number;

    if (roomBet === 'LONG') {
      // Both players are betting LONG - higher percentage increase wins
      hostScore = hostPercentageChange;
      guestScore = guestPercentageChange;
    } else {
      // Both players are betting SHORT - lower percentage decrease wins (less negative is better)
      hostScore = -hostPercentageChange; // Convert negative to positive for comparison
      guestScore = -guestPercentageChange;
    }

    let winner: 'host' | 'guest' | 'tie';
    if (hostScore > guestScore) {
      winner = 'host';
    } else if (guestScore > hostScore) {
      winner = 'guest';
    } else {
      winner = 'tie';
    }

    return {
      winner,
      hostScore,
      guestScore,
      hostPercentageChange,
      guestPercentageChange,
      finalHostValue: 0, // Will be set by caller
      finalGuestValue: 0 // Will be set by caller
    };
  }

  // Get price history for charting
  getPriceHistory(tokenId: string, duration: number = 60000): TokenPrice[] {
    // This would typically fetch from a database or cache
    // For now, we'll return a simple array
    return [];
  }
}

export const tournamentService = new TournamentService(); 