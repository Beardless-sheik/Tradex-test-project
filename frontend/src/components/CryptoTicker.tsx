import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import TickerPrice from './TickerPrice';
import '@/styles/CryptoTicker.css';

const CryptoTicker: React.FC = () => {
  // List of cryptocurrencies to display
  const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'dogecoin', 'cardano', 'ripple', 'solana'];
  const { data: prices, isLoading, error } = useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: () => api.getCryptoPrices(CRYPTO_SYMBOLS),
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000,
    gcTime: 60000,
  });

  if (error) {
    return (
      <div className="ticker-container ticker-error">
        <div className="ticker-error-message">
          Unable to load crypto prices. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-wrapper">
      <div className="ticker-container">
        {isLoading ? (
          <div className="ticker-loading">
            <span>Loading prices...</span>
          </div>
        ) : (
          <div className="ticker-scroll">
            {/* Render prices twice for seamless loop */}
            {prices && (
              <>
                {prices.map((price) => (
                  <TickerPrice key={`${price.id}-1`} price={price} />
                ))}
                {prices.map((price) => (
                  <TickerPrice key={`${price.id}-2`} price={price} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoTicker;
