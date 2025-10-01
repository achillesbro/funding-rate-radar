'use client';

import { useState, useEffect } from 'react';
import { FundingTicker } from '../../types';
import { formatTimeRemaining, getTimeUntilNextFunding, formatAPR } from '../../lib/math';
import { aprClass } from '../../lib/ui';
import { jp } from '../i18n/jpKatakana';
import Sparkline from './Sparkline';
import FundingRowExpand from './FundingRowExpand';

interface FundingTableProps {
  data: FundingTicker[];
  isLoading: boolean;
}

export default function FundingTable({ data, isLoading }: FundingTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render by updating a dummy state
      setExpandedRows(prev => new Set(prev));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const toggleRow = (tickerId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tickerId)) {
        newSet.delete(tickerId);
      } else {
        newSet.add(tickerId);
      }
      return newSet;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent, tickerId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleRow(tickerId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="skeleton w-16 h-4"></div>
            <div className="skeleton w-20 h-4"></div>
            <div className="skeleton w-24 h-4"></div>
            <div className="skeleton w-16 h-4"></div>
            <div className="skeleton w-20 h-4"></div>
            <div className="skeleton w-24 h-9"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">No funding data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="text-left">
                Asset
                <span className="sublabel">({jp.assetsSub})</span>
              </th>
              <th className="text-left">
                Exchange
                <span className="sublabel">({jp.exchangesSub})</span>
              </th>
              <th className="text-right" style={{ width: '9em' }} title="Annualized funding rate (simple)">
                Funding APR
                <span className="sublabel">({jp.fundingAprSub})</span>
              </th>
              <th className="text-left">
                Rate
                <span className="sublabel">({jp.rateSub})</span>
              </th>
              <th className="text-left">
                Next in
                <span className="sublabel">({jp.nextInSub})</span>
              </th>
              <th className="text-left">
                24h
                <span className="sublabel">({jp.day24Sub})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((ticker) => {
              const timeRemaining = getTimeUntilNextFunding(ticker.nextFundingTime);
              const isExpanded = expandedRows.has(ticker.id);
              
              return (
                <>
                  <tr 
                    key={ticker.id}
                    className="cursor-pointer hover:bg-opacity-50"
                    onClick={() => toggleRow(ticker.id)}
                    onKeyDown={(e) => handleKeyDown(e, ticker.id)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={`Toggle details for ${ticker.base} on ${ticker.exchange}`}
                  >
                    <td>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-ink">{ticker.base}</span>
                        {ticker.stale && (
                          <span className="badge badge--stale text-xs">STALE</span>
                        )}
                      </div>
                    </td>
                     <td>
                       <span className="text-sm text-muted">{ticker.exchange.charAt(0).toUpperCase() + ticker.exchange.slice(1)}</span>
                     </td>
                    <td className="text-right">
                      <span 
                        className={`font-semibold ${aprClass(ticker.aprSigned)}`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                        title={`Raw: ${((ticker.lastFundingRate || 0) * 100).toFixed(4)}% per ${ticker.fundingPeriodHours || 8}h period`}
                      >
                        {ticker.aprSigned ? formatAPR(ticker.aprSigned) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        {ticker.lastFundingRate !== undefined && (
                          <div className="text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {(ticker.lastFundingRate * 100).toFixed(4)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {timeRemaining ? (
                        <span 
                          className="text-sm text-ink" 
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatTimeRemaining(timeRemaining)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Sparkline data={ticker.history || []} />
                    </td>
                  </tr>
                  <FundingRowExpand 
                    ticker={ticker} 
                    isExpanded={isExpanded}
                  />
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
