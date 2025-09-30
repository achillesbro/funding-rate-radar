'use client';

import { memo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: Array<{ ts: number; rate: number }>;
  className?: string;
}

const Sparkline = memo(function Sparkline({ data, className = '' }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full h-8 flex items-center justify-center text-muted text-xs ${className}`}>
        No data
      </div>
    );
  }

  // Sort data by timestamp and take last 6 points
  const sortedData = data
    .sort((a, b) => a.ts - b.ts)
    .slice(-6)
    .map((item, index) => ({
      x: index,
      rate: item.rate,
      isPositive: item.rate >= 0
    }));

  if (sortedData.length < 2) {
    return (
      <div className={`w-full h-8 flex items-center justify-center text-muted text-xs ${className}`}>
        Insufficient data
      </div>
    );
  }

  return (
    <div className={`w-full h-9 ${className}`} style={{ height: '36px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData}>
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--aizome)"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default Sparkline;
