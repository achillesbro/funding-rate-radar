'use client';

import { useState, useEffect } from 'react';
import { SUPPORTED_ASSETS, SUPPORTED_EXCHANGES } from '../../lib/symbols';
import { jp } from '../i18n/jpKatakana';
import { loadControlsState, saveControlsState } from '../lib/storage';

interface FundingControlsProps {
  selectedAssets: string[];
  selectedExchanges: string[];
  sortBy: 'apr' | 'absApr' | 'negativesFirst';
  onAssetToggle: (asset: string) => void;
  onExchangeToggle: (exchange: string) => void;
  onSortChange: (sort: 'apr' | 'absApr' | 'negativesFirst') => void;
  onQuickFiltersChange?: (filters: {
    negativesOnly: boolean;
    nextUnder1h: boolean;
    pinned: boolean;
  }) => void;
}

export default function FundingControls({
  selectedAssets,
  selectedExchanges,
  sortBy,
  onAssetToggle,
  onExchangeToggle,
  onSortChange,
  onQuickFiltersChange,
}: FundingControlsProps) {
  const [quickFilters, setQuickFilters] = useState({
    negativesOnly: false,
    nextUnder1h: false,
    pinned: false,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const savedState = loadControlsState();
    if (savedState.quickFilters) {
      setQuickFilters(savedState.quickFilters);
      if (onQuickFiltersChange) {
        onQuickFiltersChange(savedState.quickFilters);
      }
    }
  }, [onQuickFiltersChange]);

  // Save state when it changes
  useEffect(() => {
    saveControlsState({
      selectedAssets,
      selectedExchanges,
      sortBy,
      quickFilters,
    });
  }, [selectedAssets, selectedExchanges, sortBy, quickFilters]);

  const handleQuickFilterToggle = (filter: keyof typeof quickFilters) => {
    const newFilters = {
      ...quickFilters,
      [filter]: !quickFilters[filter],
    };
    setQuickFilters(newFilters);
    if (onQuickFiltersChange) {
      onQuickFiltersChange(newFilters);
    }
  };

  return (
    <>
      {/* Mobile: Collapsible Filters Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-surface border border-border rounded-lg text-ink hover:bg-opacity-80 transition-colors"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium">Filters</span>
            <span className="text-xs text-kori">({jp.filterSub})</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Mobile: Collapsible Content */}
        {isExpanded && (
          <div className="mt-3 p-4 bg-surface-2 bg-opacity-50 rounded-lg border border-border space-y-4">
            {/* Assets */}
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">
                Assets <span className="text-xs text-kori">({jp.assetsSub})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_ASSETS.map((asset) => (
                  <button
                    key={asset}
                    className={`chip chip--mobile ${selectedAssets.includes(asset) ? 'chip--on' : ''}`}
                    onClick={() => onAssetToggle(asset)}
                    role="button"
                    aria-pressed={selectedAssets.includes(asset)}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Exchanges */}
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">
                Exchanges <span className="text-xs text-kori">({jp.exchangesSub})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_EXCHANGES.map((exchange) => (
                  <button
                    key={exchange}
                    className={`chip chip--mobile ${selectedExchanges.includes(exchange) ? 'chip--on' : ''}`}
                    onClick={() => onExchangeToggle(exchange)}
                    role="button"
                    aria-pressed={selectedExchanges.includes(exchange)}
                  >
                    {exchange}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">
                Sort <span className="text-xs text-kori">({jp.sortSub})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'apr' as const, label: 'Funding APR', sublabel: jp.fundingAprSub },
                  { key: 'absApr' as const, label: '|APR|', sublabel: jp.absAprSub },
                ].map((option) => (
                  <button
                    key={option.key}
                    className={`chip chip--mobile ${sortBy === option.key ? 'chip--on' : ''}`}
                    onClick={() => onSortChange(option.key)}
                    role="button"
                    aria-pressed={sortBy === option.key}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">
                Quick Filters <span className="text-xs text-kori">({jp.filterSub})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`chip chip--mobile ${quickFilters.negativesOnly ? 'chip--on' : ''}`}
                  onClick={() => handleQuickFilterToggle('negativesOnly')}
                  role="button"
                  aria-pressed={quickFilters.negativesOnly}
                >
                  Negatives only
                </button>
                <button
                  className={`chip chip--mobile ${quickFilters.nextUnder1h ? 'chip--on' : ''}`}
                  onClick={() => handleQuickFilterToggle('nextUnder1h')}
                  role="button"
                  aria-pressed={quickFilters.nextUnder1h}
                >
                  Next &lt; 1h
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Always Visible Controls */}
      <div className="hidden md:block space-y-6">
        {/* Assets */}
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">
            Assets <span className="text-xs text-kori">({jp.assetsSub})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_ASSETS.map((asset) => (
              <button
                key={asset}
                className={`chip ${selectedAssets.includes(asset) ? 'chip--on' : ''}`}
                onClick={() => onAssetToggle(asset)}
                role="button"
                aria-pressed={selectedAssets.includes(asset)}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>

        {/* Exchanges */}
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">
            Exchanges <span className="text-xs text-kori">({jp.exchangesSub})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_EXCHANGES.map((exchange) => (
              <button
                key={exchange}
                className={`chip ${selectedExchanges.includes(exchange) ? 'chip--on' : ''}`}
                onClick={() => onExchangeToggle(exchange)}
                role="button"
                aria-pressed={selectedExchanges.includes(exchange)}
              >
                {exchange}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">
            Sort <span className="text-xs text-kori">({jp.sortSub})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'apr' as const, label: 'Funding APR', sublabel: jp.fundingAprSub },
              { key: 'absApr' as const, label: '|APR|', sublabel: jp.absAprSub },
            ].map((option) => (
              <button
                key={option.key}
                className={`chip ${sortBy === option.key ? 'chip--on' : ''}`}
                onClick={() => onSortChange(option.key)}
                role="button"
                aria-pressed={sortBy === option.key}
              >
                {option.label} <span className="text-xs">({option.sublabel})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">
            Quick Filters <span className="text-xs text-kori">({jp.filterSub})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              className={`chip ${quickFilters.negativesOnly ? 'chip--on' : ''}`}
              onClick={() => handleQuickFilterToggle('negativesOnly')}
              role="button"
              aria-pressed={quickFilters.negativesOnly}
            >
              Negatives only <span className="text-xs">({jp.negativesFirstSub})</span>
            </button>
            <button
              className={`chip ${quickFilters.nextUnder1h ? 'chip--on' : ''}`}
              onClick={() => handleQuickFilterToggle('nextUnder1h')}
              role="button"
              aria-pressed={quickFilters.nextUnder1h}
            >
              Next &lt; 1h <span className="text-xs">({jp.nextInSub})</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
