import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchBybitFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'bybit');
        const normalized = normalizeSymbol(symbolRaw, 'bybit');
        if (!normalized) continue;
        
        // Fetch funding rate history (includes current and next)
        const response = await fetch(
          `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${symbolRaw}&limit=3`,
          { next: { revalidate: 30 } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const fundingHistory = data.result?.list || [];
        
        if (fundingHistory.length === 0) continue;
        
        // Get instruments info for funding interval
        const instrumentsResponse = await fetch(
          `https://api.bybit.com/v5/market/instruments-info?category=linear&symbol=${symbolRaw}`,
          { next: { revalidate: 30 } }
        );
        
        let fundingPeriodHours = 8; // Default
        if (instrumentsResponse.ok) {
          const instrumentsData = await instrumentsResponse.json();
          const instrument = instrumentsData.result?.list?.[0];
          if (instrument?.fundingInterval) {
            fundingPeriodHours = parseInt(instrument.fundingInterval) / 60; // Convert minutes to hours
          }
        }
        
        const latest = fundingHistory[0];
        const currentRate = parseFloat(latest.fundingRate);
        const aprSigned = calculateAPR(currentRate, fundingPeriodHours);
        
        // Calculate next funding time
        const lastFundingTime = parseInt(latest.fundingRateTimestamp);
        const nextFundingTime = new Date(lastFundingTime + (fundingPeriodHours * 60 * 60 * 1000));
        
        const history = fundingHistory.map((item: any) => ({
          ts: parseInt(item.fundingRateTimestamp),
          rate: parseFloat(item.fundingRate)
        }));
        
        results.push({
          id: `bybit-${symbolRaw}`,
          exchange: 'bybit',
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
          source: 'bybit'
        });
      } catch (error) {
        console.warn(`Failed to fetch Bybit data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Bybit funding fetch failed:', error);
    return [];
  }
}
