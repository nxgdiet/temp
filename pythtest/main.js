const { HermesClient } = require("@pythnetwork/hermes-client");

const connection = new HermesClient("https://hermes.pyth.network", {});

const priceIds = {
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
};

// Create reverse mapping for easier lookup
const idToSymbol = Object.fromEntries(
  Object.entries(priceIds).map(([symbol, id]) => [id, symbol])
);

async function fetchPrices() {
  try {
    const result = await connection.getLatestPriceUpdates(Object.values(priceIds));
    const updates = result.parsed;

    console.log("📈 Latest Prices:");
    updates.forEach((update, index) => {
      // Debug: log the actual ID format
      console.log(`Debug - Update ID: ${update.id}`);
      console.log(`Debug - Expected IDs:`, Object.values(priceIds));
      
      // Try multiple approaches to find the symbol
      let symbol = idToSymbol[update.id];
      
      // If not found, try converting to string and comparing
      if (!symbol) {
        symbol = Object.keys(priceIds).find(key => 
          priceIds[key].toLowerCase() === update.id.toLowerCase()
        );
      }
      
      // If still not found, use the index to match with the order we requested
      if (!symbol) {
        const orderedSymbols = Object.keys(priceIds);
        symbol = orderedSymbols[index] || "UNKNOWN";
      }
      
      const rawPrice = update.price.price;
      const expo = update.price.expo;

      const actualPrice = Number(rawPrice) * Math.pow(10, expo);
      console.log(`${symbol}: ${actualPrice.toFixed(2)}`);
    });

    console.log('--------------------------');
  } catch (err) {
    console.error("Error fetching prices:", err.message);
  }
}

setInterval(fetchPrices, 1000);