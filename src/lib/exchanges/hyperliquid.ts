import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR, inferPeriodHoursFromHistory } from '../math';

export async function fetchHyperliquidFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'hyperliquid');
        const normalized = normalizeSymbol(symbolRaw, 'hyperliquid');
        if (!normalized) continue;
        
        // Fetch funding history (8h computed, hourly paid)
        const response = await fetch(
          `https://api.hyperliquid.xyz/info`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'fundingHistory',
              coin: symbolRaw,
              startTime: Date.now() - (24 * 60 * 60 * 1000), // Last 24h
              endTime: Date.now()
            }),
            next: { revalidate: 30 }
          }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const fundingHistory = data || [];
        
        if (fundingHistory.length === 0) continue;
        
        // Get current funding rate from the latest entry
        const latest = fundingHistory[fundingHistory.length - 1];
        const currentRate = parseFloat(latest.fundingRate);
        
        // Hyperliquid returns hourly funding rates in their API response
        // The funding rate shown is already the hourly rate, not the 8h period rate
        const fundingPeriodHours = 1; // Hyperliquid API returns hourly rates
        
        const aprSigned = calculateAPR(currentRate, fundingPeriodHours);
        
        // Calculate next funding time (1h from last)
        const lastFundingTime = latest.time;
        const nextFundingTime = new Date(lastFundingTime + (fundingPeriodHours * 60 * 60 * 1000));
        
        const history = fundingHistory.map((item: any) => ({
          ts: item.time,
          rate: parseFloat(item.fundingRate)
        }));
        
        results.push({
          id: `hyperliquid-${symbolRaw}`,
          exchange: 'hyperliquid',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw,
          fundingPeriodHours,
          lastFundingRate: currentRate,
          currentEstRate: currentRate,
          aprSigned,
          nextFundingTime: nextFundingTime.toISOString(),
          ts: new Date().toISOString(),
          history,
          source: 'hyperliquid'
        });
      } catch (error) {
        console.warn(`Failed to fetch Hyperliquid data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Hyperliquid funding fetch failed:', error);
    return [];
  }
}
