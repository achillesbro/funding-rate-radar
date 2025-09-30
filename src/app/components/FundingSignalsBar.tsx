'use client';

import { FundingTicker } from '../../types';

interface FundingSignalsBarProps {
  tickers: FundingTicker[];
}

export default function FundingSignalsBar({ tickers }: FundingSignalsBarProps) {
  if (!tickers || tickers.length === 0) {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="chip text-muted">No data available</span>
      </div>
    );
  }

  // Find top positive and negative APR
  const sortedByApr = [...tickers].sort((a, b) => (b.aprSigned || 0) - (a.aprSigned || 0));
  const topPositive = sortedByApr.find(t => (t.aprSigned || 0) > 0);
  const topNegative = [...tickers].sort((a, b) => (a.aprSigned || 0) - (b.aprSigned || 0)).find(t => (t.aprSigned || 0) < 0);

  // Find soonest "Next in" under 60 minutes
  const now = new Date().getTime();
  const soonestNext = tickers
    .filter(t => t.nextFundingTime)
    .map(t => ({
      ticker: t,
      timeUntil: new Date(t.nextFundingTime!).getTime() - now
    }))
    .filter(t => t.timeUntil > 0 && t.timeUntil < 60 * 60 * 1000) // Less than 60 minutes
    .sort((a, b) => a.timeUntil - b.timeUntil)[0];

  // Calculate coverage
  const activeAssets = new Set(tickers.map(t => t.base)).size;
  const activeVenues = new Set(tickers.map(t => t.exchange)).size;

  // Check for stale data
  const hasStaleData = tickers.some(t => t.stale);

  const formatTimeUntil = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes.toLocaleString('en-US', { useGrouping: false })}m`;
  };

  const formatApr = (apr?: number) => {
    if (apr == null) return '—';
    const sign = apr >= 0 ? '+' : '';
    return `${sign}${(apr * 100).toFixed(apr >= 10 ? 1 : 2)}%`;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4" role="status" aria-live="polite">
      {topPositive && (
        <span 
          className="chip chip--on" 
          style={{ background: 'var(--amber)', borderColor: 'var(--amber)' }}
          aria-label={`Top positive APR: ${topPositive.base} at ${topPositive.exchange} with ${formatApr(topPositive.aprSigned)}`}
        >
          Top +APR: {topPositive.base}@{topPositive.exchange} {formatApr(topPositive.aprSigned)}
        </span>
      )}
      
      {topNegative && (
        <span 
          className="chip chip--on" 
          style={{ background: 'var(--akane)', borderColor: 'var(--akane)' }}
          aria-label={`Top negative APR: ${topNegative.base} at ${topNegative.exchange} with ${formatApr(topNegative.aprSigned)}`}
        >
          Top −APR: {topNegative.base}@{topNegative.exchange} {formatApr(topNegative.aprSigned)}
        </span>
      )}
      
      {soonestNext && (
        <span 
          className="chip chip--on" 
          style={{ background: 'var(--kori)', borderColor: 'var(--kori)' }}
          aria-label={`Next funding in less than 60 minutes: ${formatTimeUntil(soonestNext.timeUntil)}`}
        >
          Next &lt; 60m: {formatTimeUntil(soonestNext.timeUntil)}
        </span>
      )}
      
      <span className="chip" aria-label={`Coverage: ${activeAssets} assets across ${activeVenues} venues`}>
        Coverage: {activeAssets} assets × {activeVenues} venues
      </span>
      
      {hasStaleData && (
        <span 
          className="chip chip--on" 
          style={{ background: 'var(--akane)', borderColor: 'var(--akane)' }}
          aria-label="Some data may be stale"
        >
          STALE
        </span>
      )}
    </div>
  );
}
