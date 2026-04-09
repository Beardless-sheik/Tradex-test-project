const cryptoPriceService = require('../services/cryptoPriceService');

/**
 * GET /api/crypto/prices
 * Fetch current prices for multiple cryptocurrencies
 * Query params: ?symbols=bitcoin,ethereum,dogecoin
 */
const getPrices = async (req, res) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        error: 'Missing required query parameter',
        message: 'Please provide "symbols" parameter (e.g., ?symbols=bitcoin,ethereum,dogecoin)',
      });
    }

    const symbolsList = symbols.split(',').map(s => s.trim().toLowerCase());

    if (symbolsList.length === 0) {
      return res.status(400).json({
        error: 'Invalid query parameter',
        message: 'symbols parameter cannot be empty',
      });
    }

    const result = await cryptoPriceService.getPrices(symbolsList);

    res.status(200).json({
      success: true,
      data: result.prices,
      timestamp: result.timestamp,
      cached: result.cached,
      stale: result.stale || false,
      error: result.error || null,
    });
  } catch (error) {
    console.error('[Controller] Error fetching prices:', error);

    res.status(503).json({
      success: false,
      error: 'Failed to fetch cryptocurrency prices',
      message: error.message,
      timestamp: Date.now(),
    });
  }
};

/**
 * GET /api/crypto/chart/:symbol
 * Fetch historical price data for a cryptocurrency
 * Query params: ?days=30
 */
const getChartData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;

    if (!symbol) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Please provide symbol in URL',
      });
    }

    // Validate days parameter
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        error: 'Invalid query parameter',
        message: 'days parameter must be a number between 1 and 365',
      });
    }

    // Get chart data from service
    const result = await cryptoPriceService.getChartData(symbol, daysNum);

    res.status(200).json({
      success: true,
      symbol: result.symbol,
      id: result.id,
      days: result.days,
      data: result.data,
      stats: result.stats,
      cached: result.cached,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Controller] Error fetching chart data:', error);

    // Check if it's a "not found" error
    if (error.message.includes('Unknown cryptocurrency')) {
      return res.status(404).json({
        success: false,
        error: 'Cryptocurrency not found || Check supported cryptocurrencies',
        message: error.message,
      });
    }

    res.status(503).json({
      success: false,
      error: 'Failed to fetch chart data',
      message: error.message,
      timestamp: Date.now(),
    });
  }
};

/**
 * GET /api/crypto/supported
 * Get list of supported cryptocurrencies
 */
const getSupportedCryptos = (req, res) => {
  try {
    const supported = cryptoPriceService.getSupportedCryptos();

    res.status(200).json({
      success: true,
      supported,
      count: supported.length,
    });
  } catch (error) {
    console.error('[Controller] Error getting supported cryptos:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get supported cryptocurrencies',
      message: error.message,
    });
  }
};

module.exports = {
  getPrices,
  getChartData,
  getSupportedCryptos,
};
