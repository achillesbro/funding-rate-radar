'use client';

import { SUPPORTED_ASSETS, SUPPORTED_EXCHANGES } from '../../lib/symbols';

interface ControlsProps {
  selectedAssets: string[];
  selectedExchanges: string[];
  sortBy: 'apr' | 'absApr' | 'negativesFirst';
  onAssetToggle: (asset: string) => void;
  onExchangeToggle: (exchange: string) => void;
  onSortChange: (sort: 'apr' | 'absApr' | 'negativesFirst') => void;
}

export default function Controls({
  selectedAssets,
  selectedExchanges,
  sortBy,
  onAssetToggle,
  onExchangeToggle,
  onSortChange
}: ControlsProps) {
  return (
    <div className="space-y-4">
      {/* Asset Selection */}
      <div>
        <h3 className="text-sm font-medium text-ink mb-2">Assets</h3>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_ASSETS.map(asset => (
            <button
              key={asset}
              onClick={() => onAssetToggle(asset)}
              className={`badge ${
                selectedAssets.includes(asset)
                  ? 'bg-aizome text-white border-aizome'
                  : 'hover:bg-surface'
              }`}
            >
              {asset}
            </button>
          ))}
        </div>
      </div>

      {/* Exchange Selection */}
      <div>
        <h3 className="text-sm font-medium text-ink mb-2">Exchanges</h3>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_EXCHANGES.map(exchange => (
            <button
              key={exchange}
              onClick={() => onExchangeToggle(exchange)}
              className={`badge ${
                selectedExchanges.includes(exchange)
                  ? 'bg-aizome text-white border-aizome'
                  : 'hover:bg-surface'
              }`}
            >
              {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <h3 className="text-sm font-medium text-ink mb-2">Sort by</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSortChange('apr')}
            className={`badge ${
              sortBy === 'apr'
                ? 'bg-aizome text-white border-aizome'
                : 'hover:bg-surface'
            }`}
          >
            APR
          </button>
          <button
            onClick={() => onSortChange('absApr')}
            className={`badge ${
              sortBy === 'absApr'
                ? 'bg-aizome text-white border-aizome'
                : 'hover:bg-surface'
            }`}
          >
            |APR|
          </button>
          <button
            onClick={() => onSortChange('negativesFirst')}
            className={`badge ${
              sortBy === 'negativesFirst'
                ? 'bg-aizome text-white border-aizome'
                : 'hover:bg-surface'
            }`}
          >
            Negatives First
          </button>
        </div>
      </div>
    </div>
  );
}
