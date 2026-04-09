require('dotenv').config();

const COINGECKO_API_BASE = process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 300000; // 5 minutes in milliseconds

// In-memory caches for prices and chart data
let priceCache = {
  data: null,
  timestamp: null,
};
let chartCache = new Map();


const CRYPTO_ID_MAP = {
  bitcoin: 'bitcoin',
  btc: 'bitcoin',
  ethereum: 'ethereum',
  eth: 'ethereum',
  dogecoin: 'dogecoin',
  doge: 'dogecoin',
  cardano: 'cardano',
  ada: 'cardano',
  ripple: 'ripple',
  xrp: 'ripple',
  solana: 'solana',
  sol: 'solana',
  'binance-coin': 'binancecoin',
  bnb: 'binancecoin',
  polkadot: 'polkadot',
  dot: 'polkadot',
  litecoin: 'litecoin',
  ltc: 'litecoin',
};

// Fetch current prices for multiple cryptocurrencies from CoinGecko
async function getPrices(ids) {
  try {
    // Check if we have valid cached data
    if (priceCache.data && priceCache.timestamp) {
      const cacheAge = Date.now() - priceCache.timestamp;
      if (cacheAge < CACHE_TTL) {
        return {
          prices: priceCache.data,
          timestamp: priceCache.timestamp,
          cached: true,
        };
      }
    }

    const validIds = ids.filter(id => CRYPTO_ID_MAP[id.toLowerCase()])
      .map(id => CRYPTO_ID_MAP[id.toLowerCase()]);

    if (validIds.length === 0) {
      throw new Error('No valid cryptocurrency IDs provided');
    }

    const idsParam = validIds.join(',');

    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${idsParam}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_high_low_24h=true`,
      { timeout: 5000 }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform CoinGecko response to our format
    const prices = transformPriceData(data);
    priceCache = {
      data: prices,
      timestamp: Date.now(),
    };
    return {
      prices,
      timestamp: Date.now(),
      cached: false,
    };
  } catch (error) {
    console.error('[Error] Failed to fetch prices:', error.message);

    // Return cached data if available
    if (priceCache.data) {
      const cacheAge = Date.now() - priceCache.timestamp;
			return {
        prices: priceCache.data,
        timestamp: priceCache.timestamp,
        cached: true,
        error: error.message,
        stale: true,
      };
    }

    throw new Error('Failed to fetch cryptocurrency prices and no cache available');
  }
}

// Fetch historical price data for a cryptocurrency
async function getChartData(id, days = 30) {
  try {
    const normalizedId = CRYPTO_ID_MAP[id.toLowerCase()];
    if (!normalizedId) {
      throw new Error(`Unknown cryptocurrency: ${id}`);
    }

    // Check cache first
    const cacheKey = `${normalizedId}-${days}`;
    if (chartCache.has(cacheKey)) {
      const cached = chartCache.get(cacheKey);
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < CACHE_TTL) {
				return {
          symbol: id.toUpperCase(),
          id: normalizedId,
          days,
          data: cached.data,
          stats: cached.stats,
          cached: true,
        };
      }
    }

    // Fetch from CoinGecko API
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${normalizedId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      { timeout: 5000 }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform data to our format
    const chartData = transformChartData(data);

    const prices = chartData.map(d => d.price);
    const stats = {
      current: prices[prices.length - 1],
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    };

    const result = {
      symbol: id.toUpperCase(),
      id: normalizedId,
      days,
      data: chartData,
      stats,
      cached: false,
    };

    // Cache the result
    chartCache.set(cacheKey, {
      data: chartData,
      stats,
      timestamp: Date.now(),
    });
    return result;
  } catch (error) {
    console.error('[Error] Failed to fetch chart data:', error.message);
    throw new Error(`Failed to fetch chart data for ${id}: ${error.message}`);
  }
}

// Transform CoinGecko price response to our format
function transformPriceData(data) {
  const symbolMap = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    dogecoin: 'DOGE',
    cardano: 'ADA',
    ripple: 'XRP',
    solana: 'SOL',
    binancecoin: 'BNB',
    polkadot: 'DOT',
    litecoin: 'LTC',
  };

  return Object.entries(data).map(([id, values]) => ({
    id,
    symbol: symbolMap[id] || id.toUpperCase(),
    current_price: values.usd,
    change_24h: values.usd_24h_change,
    market_cap: values.usd_market_cap,
    market_cap_24h_change: values.usd_24h_vol,
    high_24h: values.usd_high_24h,
    low_24h: values.usd_low_24h,
  }));
}

// Transform CoinGecko chart response to our format
function transformChartData(data) {
  return data.prices.map(([timestamp, price]) => ({
    timestamp,
    date: new Date(timestamp).toISOString().split('T')[0],
    price: Math.round(price * 100) / 100, // Round to 2 decimals
  }));
}

// Get list of supported cryptocurrencies
function getSupportedCryptos() {
  return Object.keys(CRYPTO_ID_MAP);
}

module.exports = {
  getPrices,
  getChartData,
  getSupportedCryptos,
};
