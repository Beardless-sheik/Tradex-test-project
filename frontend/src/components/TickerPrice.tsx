import React, { memo } from 'react';
import ChartPopover from './ChartPopover';

interface Price {
  id: string;
  symbol: string;
  current_price: number;
  change_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
}

interface TickerPriceProps {
  price: Price;
}

const TickerPrice = memo(({ price }: TickerPriceProps) => {
  const isPositive = price.change_24h >= 0;
  const formattedPrice = price.current_price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const changeDisplay = Math.abs(price.change_24h).toFixed(2);

  return (
    <ChartPopover symbol={price.id}>
      <div className="ticker-price-item">
        <div className="ticker-symbol">{price.symbol}</div>
        <div className="ticker-price">${formattedPrice}</div>
        <div className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-arrow">{isPositive ? '▲' : '▼'}</span>
          <span>{changeDisplay}%</span>
        </div>
      </div>
    </ChartPopover>
  );
});

TickerPrice.displayName = 'TickerPrice';

export default TickerPrice;
