// Mock fetch before importing the service
global.fetch = jest.fn();

describe('cryptoPriceService', () => {
  let cryptoPriceService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    cryptoPriceService = require('../src/services/cryptoPriceService');
  });

  describe('getPrices - Happy Path', () => {
    it('should fetch prices for valid cryptocurrencies', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          bitcoin: {
            usd: 45000,
            usd_24h_change: -2.5,
            usd_market_cap: 900000000000,
            usd_24h_vol: 30000000000,
            usd_high_24h: 46000,
            usd_low_24h: 44000,
          },
          ethereum: {
            usd: 2500,
            usd_24h_change: 1.2,
            usd_market_cap: 300000000000,
            usd_24h_vol: 15000000000,
            usd_high_24h: 2600,
            usd_low_24h: 2400,
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await cryptoPriceService.getPrices(['bitcoin', 'ethereum']);

      expect(global.fetch).toHaveBeenCalled();
      expect(result.prices).toHaveLength(2);
      expect(result.cached).toBe(false);
    });

    it('should handle alias cryptocurrency symbols', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          bitcoin: {
            usd: 45000,
            usd_24h_change: -2.5,
            usd_market_cap: 900000000000,
            usd_24h_vol: 30000000000,
            usd_high_24h: 46000,
            usd_low_24h: 44000,
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await cryptoPriceService.getPrices(['btc']);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0].symbol).toBe('BTC');
    });

    it('should include all required price fields', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          bitcoin: {
            usd: 45000,
            usd_24h_change: -2.5,
            usd_market_cap: 900000000000,
            usd_24h_vol: 30000000000,
            usd_high_24h: 46000,
            usd_low_24h: 44000,
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await cryptoPriceService.getPrices(['bitcoin']);

      const price = result.prices[0];
      expect(price).toHaveProperty('id');
      expect(price).toHaveProperty('symbol');
      expect(price).toHaveProperty('current_price');
      expect(price).toHaveProperty('change_24h');
      expect(price).toHaveProperty('market_cap');
      expect(price).toHaveProperty('high_24h');
      expect(price).toHaveProperty('low_24h');
    });

    it('should use cache when data is fresh', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          bitcoin: {
            usd: 45000,
            usd_24h_change: -2.5,
            usd_market_cap: 900000000000,
            usd_24h_vol: 30000000000,
            usd_high_24h: 46000,
            usd_low_24h: 44000,
          },
        }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result1 = await cryptoPriceService.getPrices(['bitcoin']);
      expect(result1.cached).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const result2 = await cryptoPriceService.getPrices(['bitcoin']);
      expect(result2.cached).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPrices - Error Handling', () => {
    it('should throw when API fails with no cache', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        cryptoPriceService.getPrices(['bitcoin'])
      ).rejects.toThrow('Failed to fetch cryptocurrency prices and no cache available');
    });
  });

  describe('getChartData - Happy Path', () => {
    it('should handle cryptocurrency aliases', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          prices: [[1609459200000, 0.25]],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await cryptoPriceService.getChartData('doge', 30);

      expect(result.symbol).toBe('DOGE');
      expect(result.id).toBe('dogecoin');
    });

    it('should format dates correctly in chart data', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          prices: [
            [1609459200000, 28000],
            [1609545600000, 29000],
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await cryptoPriceService.getChartData('bitcoin', 30);

      expect(result.data[0]).toHaveProperty('date');
      expect(result.data[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should cache chart data correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          prices: [[1609459200000, 28000]],
        }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result1 = await cryptoPriceService.getChartData('bitcoin', 30);
      expect(result1.cached).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const result2 = await cryptoPriceService.getChartData('bitcoin', 30);
      expect(result2.cached).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should support different day ranges', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          prices: [[1609459200000, 28000]],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await cryptoPriceService.getChartData('bitcoin', 7);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=7'),
        expect.any(Object)
      );
      expect(result.days).toBe(7);
    });
  });

  describe('getChartData - Error Handling', () => {
    it('should throw error for unknown cryptocurrency', async () => {
      await expect(
        cryptoPriceService.getChartData('unknowncoin', 30)
      ).rejects.toThrow('Unknown cryptocurrency');
    });

    it('should throw on API network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network Timeout'));

      await expect(
        cryptoPriceService.getChartData('bitcoin', 30)
      ).rejects.toThrow('Failed to fetch chart data');
    });

    it('should throw on HTTP errors from API', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(
        cryptoPriceService.getChartData('bitcoin', 30)
      ).rejects.toThrow('CoinGecko API error');
    });
  });

  describe('getSupportedCryptos', () => {
    it('should return a list of supported cryptocurrencies', () => {
      const supported = cryptoPriceService.getSupportedCryptos();

      expect(Array.isArray(supported)).toBe(true);
      expect(supported.length).toBeGreaterThan(0);
    });

    it('should include major cryptocurrencies', () => {
      const supported = cryptoPriceService.getSupportedCryptos();

      expect(supported).toContain('bitcoin');
      expect(supported).toContain('ethereum');
      expect(supported).toContain('dogecoin');
      expect(supported).toContain('cardano');
    });

    it('should include cryptocurrency aliases', () => {
      const supported = cryptoPriceService.getSupportedCryptos();

      expect(supported).toContain('btc');
      expect(supported).toContain('eth');
      expect(supported).toContain('doge');
      expect(supported).toContain('ada');
    });

    it('should not have duplicates', () => {
      const supported = cryptoPriceService.getSupportedCryptos();
      const uniqueSupported = new Set(supported);

      expect(supported.length).toBe(uniqueSupported.size);
    });
  });
});

