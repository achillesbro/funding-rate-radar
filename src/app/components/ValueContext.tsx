'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CostItem, ValueComparison } from '../../types';
import { DEFAULT_COSTS, loadCostsFromStorage, saveCostsToStorage } from '../data/costs';
import { computeComparisons, formatMultiple, formatUSD, generateOneLineSummary } from '../../lib/math';
import { jp } from '../i18n/jpKatakana';
import CostsEditorModal from './CostsEditorModal';

interface ValueContextProps {
  className?: string;
}

type SortMode = 'amount' | 'priority' | 'edited';
type FilterType = 'oneOff' | 'monthly' | 'annual';

export default function ValueContext({ className = '' }: ValueContextProps) {
  const [amount, setAmount] = useState<number>(0);
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('amount');
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [debouncedAmount, setDebouncedAmount] = useState<number>(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load costs and state from localStorage on mount
  useEffect(() => {
    setCosts(loadCostsFromStorage());
    
    // Load persisted state
    try {
      const savedState = localStorage.getItem('fs.value.v2');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
        if (parsed.sortMode) setSortMode(parsed.sortMode);
        if (parsed.filters) setFilters(parsed.filters);
        if (parsed.pinnedItems) setPinnedItems(parsed.pinnedItems);
      }
    } catch (error) {
      console.warn('Failed to load value context state:', error);
    }
  }, []);

  // Debounce amount changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 120);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [amount]);

  // Persist state changes
  useEffect(() => {
    const state = {
      amount,
      selectedCategory,
      sortMode,
      filters,
      pinnedItems
    };
    localStorage.setItem('fs.value.v2', JSON.stringify(state));
  }, [amount, selectedCategory, sortMode, filters, pinnedItems]);

  // Filter costs by category
  const filteredCosts = useMemo(() => 
    costs.filter(cost => 
      selectedCategory === 'all' || cost.category === selectedCategory
    ), [costs, selectedCategory]
  );

  // Compute comparisons with memoization (using debounced amount)
  const comparisons = useMemo(() => 
    computeComparisons(debouncedAmount, filteredCosts, sortMode, filters, pinnedItems),
    [debouncedAmount, filteredCosts, sortMode, filters, pinnedItems]
  );

  // Generate one-line summary
  const summary = useMemo(() => 
    generateOneLineSummary(debouncedAmount, comparisons),
    [debouncedAmount, comparisons]
  );

  // Get unique categories
  const categories = useMemo(() => 
    ['all', ...Array.from(new Set(costs.map(c => c.category).filter(Boolean)))],
    [costs]
  );

  // Normalize bars to largest multiple
  const maxMultiple = useMemo(() => 
    Math.max(...comparisons.map(c => Math.abs(c.multiple))),
    [comparisons]
  );

  const handleAmountChange = useCallback((value: number) => {
    setAmount(value);
  }, []);

  const handleQuickAmount = useCallback((delta: number) => {
    setAmount(prev => prev + delta);
  }, []);

  const toggleFilter = useCallback((filter: FilterType) => {
    setFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  const togglePin = useCallback((itemId: string) => {
    setPinnedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const copySummary = useCallback(async () => {
    if (summary) {
      try {
        await navigator.clipboard.writeText(summary);
        // Could add a toast notification here
      } catch (error) {
        console.warn('Failed to copy summary:', error);
      }
    }
  }, [summary]);

  const handleSaveCosts = useCallback((newCosts: CostItem[]) => {
    setCosts(newCosts);
    saveCostsToStorage(newCosts);
  }, []);

  const isGain = debouncedAmount >= 0;
  const isNeutral = debouncedAmount === 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleQuickAmount(e.shiftKey ? 100 : 10);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleQuickAmount(e.shiftKey ? -100 : -10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickAmount]);

  // Sticky calculator visibility
  useEffect(() => {
    const handleScroll = () => {
      const element = document.querySelector('[data-value-context]');
      if (element) {
        const rect = element.getBoundingClientRect();
        setIsSticky(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={`space-y-6 ${className}`} data-value-context>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink tabular-nums">
              {jp.valueContext} <span className="text-xs text-kori">({jp.valueContextSub})</span>
            </h2>
            <div className="text-sm text-muted">
              {jp.estimates} <span className="text-xs text-kori">({jp.estimatesSub})</span>
            </div>
          </div>
          
          {/* One-line summary */}
          {summary && (
            <div className="flex items-center space-x-2">
              <div 
                className="summary-line tabular-nums flex-1"
                aria-live="polite"
                role="status"
              >
                {summary}
              </div>
              <button
                onClick={copySummary}
                className="btn--quiet text-xs px-2 py-1 focus-ring"
                aria-label="Copy summary"
              >
                📋
              </button>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Controls */}
          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2 tabular-nums">
                {jp.usdAmount} <span className="text-xs text-kori">({jp.usdAmountSub})</span>
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-surface text-ink focus:outline-none focus:border-aizome tabular-nums focus-ring"
                  placeholder="Enter amount..."
                />
                <div className="flex flex-wrap gap-1">
                  {[-1000, -100, -10, 10, 100, 1000].map(delta => (
                    <button
                      key={delta}
                      onClick={() => handleQuickAmount(delta)}
                      className="chip text-xs px-2 py-1 focus-ring"
                    >
                      {delta >= 0 ? '+' : ''}{delta >= 1000 ? '1k' : delta}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Modes */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {jp.sort} <span className="text-xs text-kori">(ソート順)</span>
              </label>
              <div className="sort-mode">
                <button
                  onClick={() => setSortMode('amount')}
                  className={sortMode === 'amount' ? 'button--active' : ''}
                >
                  {jp.sortByAmount} <span className="text-xs">({jp.sortByAmountSub})</span>
                </button>
                <button
                  onClick={() => setSortMode('priority')}
                  className={sortMode === 'priority' ? 'button--active' : ''}
                >
                  {jp.sortByPriority} <span className="text-xs">({jp.sortByPrioritySub})</span>
                </button>
                <button
                  onClick={() => setSortMode('edited')}
                  className={sortMode === 'edited' ? 'button--active' : ''}
                >
                  {jp.sortByEdited} <span className="text-xs">({jp.sortByEditedSub})</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {jp.filter} <span className="text-xs text-kori">(フィルター)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'oneOff' as FilterType, label: jp.oneOff, sublabel: jp.oneOffSub },
                  { key: 'monthly' as FilterType, label: jp.monthly, sublabel: jp.monthlySub },
                  { key: 'annual' as FilterType, label: jp.annual, sublabel: jp.annualSub }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => toggleFilter(filter.key)}
                    className={`filter-chip ${
                      filters.includes(filter.key) ? 'filter-chip--active' : ''
                    } focus-ring`}
                    role="button"
                    aria-pressed={filters.includes(filter.key)}
                  >
                    {filter.label} <span className="text-xs">({filter.sublabel})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {jp.category} <span className="text-xs text-kori">({jp.categorySub})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category || 'all')}
                    className={`chip ${
                      selectedCategory === (category || 'all') ? 'chip--on' : ''
                    } focus-ring`}
                    role="button"
                    aria-pressed={selectedCategory === (category || 'all')}
                  >
                    {category === 'all' ? 'All' : (category || 'all').charAt(0).toUpperCase() + (category || 'all').slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Costs Button */}
            <div>
              <button
                onClick={() => setIsEditorOpen(true)}
                className="btn--quiet w-full focus-ring"
              >
                {jp.editCosts} <span className="text-xs">({jp.editCostsSub})</span>
              </button>
            </div>
          </div>

          {/* Right column: Results */}
          <div className="space-y-3">
            {debouncedAmount !== 0 ? (
                <>
                  <h3 className="text-sm font-medium text-ink tabular-nums">
                    {isGain ? jp.covers : jp.costsYou} <span className="text-xs text-kori">({isGain ? jp.coversSub : jp.costsYouSub})</span>
                  </h3>
                {comparisons.length > 0 ? (
                  <div className="space-y-3">
                    {/* Pinned items first */}
                    {pinnedItems.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-kori uppercase tracking-wide">
                            {jp.fixed} ({jp.fixedSub})
                          </div>
                        {comparisons
                          .filter(comp => pinnedItems.includes(comp.item.id))
                          .map((comparison) => (
                            <ResultRow
                              key={comparison.item.id}
                              comparison={comparison}
                              isGain={isGain}
                              isNeutral={isNeutral}
                              maxMultiple={maxMultiple}
                              onTogglePin={togglePin}
                              isPinned={pinnedItems.includes(comparison.item.id)}
                            />
                          ))}
                        <div className="hr-pixel" />
                      </>
                    )}
                    
                    {/* Regular items */}
                    {comparisons
                      .filter(comp => !pinnedItems.includes(comp.item.id))
                      .slice(0, 5 - pinnedItems.length)
                      .map((comparison) => (
                        <ResultRow
                          key={comparison.item.id}
                          comparison={comparison}
                          isGain={isGain}
                          isNeutral={isNeutral}
                          maxMultiple={maxMultiple}
                          onTogglePin={togglePin}
                          isPinned={pinnedItems.includes(comparison.item.id)}
                        />
                      ))}
                  </div>
                  ) : (
                    <div className="empty-state empty-state--small">
                      <p>{jp.enterAmount} <span className="text-xs text-kori">({jp.enterAmountSub})</span></p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>{jp.enterAmount} <span className="text-xs text-kori">({jp.enterAmountSub})</span></p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Sticky mini-calculator */}
      {isSticky && (
        <div className="sticky-calculator">
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-ink focus:outline-none focus:border-aizome tabular-nums text-sm focus-ring"
              placeholder="Amount..."
            />
            {summary && (
              <>
                <div className="text-sm text-ink tabular-nums truncate max-w-xs">
                  {summary}
                </div>
                <button
                  onClick={copySummary}
                  className="btn--quiet text-xs px-2 py-1 focus-ring"
                  aria-label="Copy summary"
                >
                  📋
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Costs Editor Modal */}
      <CostsEditorModal
        isOpen={isEditorOpen}
        costs={costs}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCosts}
      />
    </>
  );
}

interface ResultRowProps {
  comparison: ValueComparison;
  isGain: boolean;
  isNeutral: boolean;
  maxMultiple: number;
  onTogglePin: (itemId: string) => void;
  isPinned: boolean;
}

function ResultRow({ 
  comparison, 
  isGain, 
  isNeutral, 
  maxMultiple, 
  onTogglePin, 
  isPinned 
}: ResultRowProps) {
  const barWidth = Math.min(100, (Math.abs(comparison.multiple) / maxMultiple) * 100);
  const isOverflow = Math.abs(comparison.multiple) > maxMultiple;
  
  return (
    <div
      className={`result ${
        isNeutral ? 'result--neutral' : isGain ? '' : 'result--loss'
      }`}
    >
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-ink tabular-nums">
            {comparison.item.label}
          </span>
          {comparison.isNiceInteger && (
            <span className="badge text-xs">~</span>
          )}
          <button
            onClick={() => onTogglePin(comparison.item.id)}
            className={`pin-button ${isPinned ? 'pin-button--pinned' : ''} focus-ring`}
            aria-label={isPinned ? 'Unpin item' : 'Pin item'}
          >
            ★
          </button>
        </div>
        <div className="tooltip">
          <div className="text-xs text-muted tabular-nums cursor-help">
            {jp.unitPrice}: {formatUSD(comparison.item.usd)} / {jp.perUnit}
          </div>
          <div className="tooltip-content">
            {jp.unitPrice} ({jp.unitPriceSub}): {formatUSD(comparison.item.usd)} / {jp.perUnit} ({jp.perUnitSub})
          </div>
        </div>
      </div>
      <div className="text-right">
        <div 
          className={`multiple tabular-nums ${
            isNeutral ? 'text-kori' : isGain ? 'text-amber' : 'text-akane'
          }`}
        >
          {formatMultiple(comparison.multiple)}
        </div>
      </div>
      <div className="col-span-2">
        <div className="bar-container">
          <div className="bar">
            <div 
              style={{ 
                width: `${barWidth}%`,
                background: isNeutral ? 'var(--kori)' : isGain ? 'var(--amber)' : 'var(--akane)'
              }}
            />
            {isOverflow && (
              <div className="bar-overflow">
                &gt;
              </div>
            )}
          </div>
          {/* Reference ticks */}
          <div className="bar-tick bar-tick--1x" />
          <div className="bar-tick bar-tick--2x" />
          <div className="bar-tick bar-tick--5x" />
        </div>
      </div>
    </div>
  );
}