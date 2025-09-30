'use client';

import { FundingTicker } from '../../types';

interface FundingRowExpandProps {
  ticker: FundingTicker;
  isExpanded: boolean;
}

export default function FundingRowExpand({ ticker, isExpanded }: FundingRowExpandProps) {
  if (!isExpanded) return null;

  // Get last ~8 funding prints with timestamps
  const recentHistory = (ticker.history || [])
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8);

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRate = (rate: number) => {
    return (rate * 100).toFixed(4) + '%';
  };

  // Venue-specific notes
  const getVenueNote = (exchange: string, fundingPeriodHours: number) => {
    switch (exchange) {
      case 'hyperliquid':
        return 'Hyperliquid: 8h computed, paid hourly';
      case 'binance':
        return `Binance: ${fundingPeriodHours}h settlement`;
      case 'bybit':
        return `Bybit: ${fundingPeriodHours}h settlement`;
      case 'okx':
        return `OKX: ${fundingPeriodHours}h settlement`;
      default:
        return `${fundingPeriodHours}h settlement interval`;
    }
  };

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div className="glass-sub p-4 m-2 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Funding History */}
            <div>
              <h4 className="text-sm font-semibold text-ink mb-2">Recent Funding History</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentHistory.length > 0 ? (
                  recentHistory.map((entry, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-muted">{formatTimestamp(entry.ts)}</span>
                      <span className={`font-mono ${entry.rate >= 0 ? 'text-amber' : 'text-akane'}`}>
                        {formatRate(entry.rate)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted">No history available</div>
                )}
              </div>
            </div>

            {/* Settlement Info */}
            <div>
              <h4 className="text-sm font-semibold text-ink mb-2">Settlement Info</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="chip text-xs">
                    {ticker.fundingPeriodHours}h interval
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {getVenueNote(ticker.exchange, ticker.fundingPeriodHours)}
                </div>
                {ticker.stale && (
                  <div className="text-xs text-akane">
                    ⚠️ Data may be stale due to API issues
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
