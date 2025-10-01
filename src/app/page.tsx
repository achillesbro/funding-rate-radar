'use client';

import { useState, useEffect, useMemo } from 'react';
// import useSWR from 'swr';
import { FundingTicker } from '../types';
import { SUPPORTED_ASSETS, SUPPORTED_EXCHANGES } from '../lib/symbols';
import FundingControls from './components/FundingControls';
import FundingTable from './components/FundingTable';
import FundingSignalsBar from './components/FundingSignalsBar';
import ValueContext from './components/ValueContext';
import ParallaxBackground from './components/ParallaxBackground';
import SnowCanvas from './components/SnowCanvas';
import { jp } from './i18n/jpKatakana';


// Fetcher function for SWR
const fetcher = async (url: string): Promise<{ data: FundingTicker[]; meta?: { stale?: boolean } }> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch funding data');
  }
  const data = await response.json();
  return data;
};

export default function Home() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(SUPPORTED_ASSETS);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(SUPPORTED_EXCHANGES);
  const [sortBy, setSortBy] = useState<'apr' | 'absApr' | 'negativesFirst'>('absApr');
  const [quickFilters, setQuickFilters] = useState({
    negativesOnly: false,
    nextUnder1h: false,
    pinned: false,
  });

  // Build API URL with current filters
  const apiUrl = `/api/funding?assets=${selectedAssets.join(',')}&exchanges=${selectedExchanges.join(',')}`;

  // Fetch funding data with useEffect
  const [data, setData] = useState<{ data: FundingTicker[]; meta?: { stale?: boolean } } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after mounting
    if (typeof window === 'undefined' || !mounted) return;
    
    const fetchData = async (isInitialLoad = false) => {
      try {
        // Only show loading on initial load to prevent flickering
        if (isInitialLoad) {
          setIsLoading(true);
        }
        setError(null);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch funding data: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err as Error);
        // Set fallback data on error
        setData({
          data: [],
          meta: { stale: true }
        });
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    };

    fetchData(true); // Initial load with loading state
    
    // Set up interval for refreshing data - update every 60 seconds (1 minute)
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [apiUrl, mounted]);


  // Filter and sort data based on current options - memoized to prevent unnecessary re-calculations
  const filteredAndSortedData = useMemo(() => {
    if (!data?.data) return [];
    
    return [...data.data]
    .filter((ticker) => {
      // Apply quick filters
      if (quickFilters.negativesOnly && (ticker.aprSigned || 0) >= 0) return false;
      
      if (quickFilters.nextUnder1h) {
        if (!ticker.nextFundingTime) return false;
        const now = new Date().getTime();
        const nextFunding = new Date(ticker.nextFundingTime).getTime();
        const timeUntil = nextFunding - now;
        if (timeUntil <= 0 || timeUntil >= 60 * 60 * 1000) return false; // Not within 1 hour
      }
      
      if (quickFilters.pinned) {
        // For now, we don't have a pinned field, so this filter does nothing
        // In a real implementation, you'd check ticker.pinned
      }
      
      return true;
    })
    .sort((a, b) => {
      const aprA = a.aprSigned || 0;
      const aprB = b.aprSigned || 0;

      switch (sortBy) {
        case 'apr':
          return aprB - aprA;
        case 'absApr':
          return Math.abs(aprB) - Math.abs(aprA);
        case 'negativesFirst':
          if (aprA < 0 && aprB >= 0) return -1;
          if (aprA >= 0 && aprB < 0) return 1;
          return Math.abs(aprB) - Math.abs(aprA);
        default:
          return 0;
      }
    });
  }, [data?.data, quickFilters, sortBy]);

  const handleAssetToggle = (asset: string) => {
    setSelectedAssets(prev =>
      prev.includes(asset)
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleExchangeToggle = (exchange: string) => {
    setSelectedExchanges(prev =>
      prev.includes(exchange)
        ? prev.filter(e => e !== exchange)
        : [...prev, exchange]
    );
  };

  return (
    <div className="min-h-screen">
      <ParallaxBackground />
      {/* Snow effect above background, below content */}
      <SnowCanvas zIndex={5} />
      {/* Header with Fuji silhouette */}
      <header className="header-fuji pt-8 pb-6">
        <div className="max-w-6xl mx-auto px-4">
           <div className="flex items-center justify-end">
             <div className="text-center">
               <img 
                 src="/FujiScan-logo-wide.png" 
                 alt="FujiScan Logo" 
                 className="w-52 h-29 rounded-xl"
               />
               <div className="text-sm text-ink mt-2">
                 Made by <a href="https://x.com/0xachilles" target="_blank" rel="noopener noreferrer" className="text-aizome hover:text-amber transition-colors duration-200">@0xachilles</a>
               </div>
             </div>
           </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 space-y-6 py-8 bg-transparent">
        {/* Value Context Section */}
        <div className="glass p-6">
          <ValueContext />
        </div>

        {/* Pixel Divider */}
        <div className="hr-pixel"></div>

        {/* Funding Radar Section */}
        <div className="glass p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-ink">
              Funding Rates <span className="text-xs text-kori">({jp.fundingRadarSub})</span>
            </h2>
          </div>
          <FundingSignalsBar tickers={filteredAndSortedData} />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <FundingControls
                selectedAssets={selectedAssets}
                selectedExchanges={selectedExchanges}
                sortBy={sortBy}
                onAssetToggle={handleAssetToggle}
                onExchangeToggle={handleExchangeToggle}
                onSortChange={setSortBy}
                onQuickFiltersChange={setQuickFilters}
              />
            </div>
            <div className="lg:col-span-3">
              <FundingTable data={filteredAndSortedData} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 glass-footer">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted">
            <p>Funding data updates every 30 seconds. Values are estimates.</p>
            {data?.meta?.stale || false && (
              <p className="mt-1 text-akane">
                Some data may be stale due to exchange API issues.
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
