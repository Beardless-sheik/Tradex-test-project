import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';

interface ChartPopoverProps {
  symbol: string;
  children: React.ReactNode;
}

const ChartPopover: React.FC<ChartPopoverProps> = ({ symbol, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['cryptoChart', symbol],
    queryFn: () => api.getChartData(symbol, 30),
    enabled: isOpen,
    staleTime: 300000,
    gcTime: 600000,
  });

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX,
      });
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            className="w-96 rounded-lg border border-slate-700 bg-slate-950/98 backdrop-blur-md shadow-2xl"
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
            }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="text-sm text-slate-400">Loading chart...</div>
              </div>
            ) : chartData ? (
              <div className="p-6 space-y-4">
                {/* Header with Title and Price */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">
                        {chartData.symbol}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {chartData.id.toUpperCase()}/USD
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-100">
                        {formatPrice(chartData.stats.current)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 24h Change Indicator */}
                <div className="flex items-center gap-2">
                  {chartData.stats.current >= chartData.stats.min ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <span className="text-red-400">▼</span>
                      <span className="text-sm font-semibold text-red-400">
                        -3.45% 24h
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="text-green-400">▲</span>
                      <span className="text-sm font-semibold text-green-400">
                        +3.45% 24h
                      </span>
                    </div>
                  )}
                </div>

                {/* Chart */}
                <div className="w-full h-56 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.data}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#94a3b8' }}
                        interval={Math.floor(chartData.data.length / 5)}
                        tickFormatter={formatDate}
                      />
                      <YAxis
                        stroke="#475569"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#94a3b8' }}
                        domain="dataMin"
                        width={50}
                        tickFormatter={(value) =>
                          value > 1000
                            ? `$${(value / 1000).toFixed(0)}k`
                            : `$${value.toFixed(0)}`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                        }}
                        labelStyle={{
                          color: '#cbd5e1',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                        formatter={(value: number) => [
                          formatPrice(value),
                          'Price',
                        ]}
                        labelFormatter={(label) => `${label}`}
                        cursor={{ stroke: '#0ea5e9', strokeWidth: 1.5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#ef4444"
                        dot={false}
                        strokeWidth={2.5}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Row - 24h Low and High */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">24h Low</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {formatPrice(chartData.stats.min)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">24h High</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {formatPrice(chartData.stats.max)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>,
          document.body
        )}
    </>
  );
};

export default ChartPopover;

