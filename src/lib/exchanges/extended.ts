import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchExtendedFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'extended');
        const normalized = normalizeSymbol(symbolRaw, 'extended');
        if (!normalized) continue;
        
        // Extended uses BTC-USD format, so convert BTC to BTC-USD
        const extendedSymbol = `${symbol}-USD`;
        
        // Calculate time range for history (last 24 hours)
        const endTime = Date.now();
        const startTime = endTime - (24 * 60 * 60 * 1000);
        
        // Fetch funding history
        const response = await fetch(
          `https://api.extended.exchange/api/v1/info/${extendedSymbol}/funding?startTime=${startTime}&endTime=${endTime}&limit=10`,
          { next: { revalidate: 30 } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const fundingHistory = data || [];
        
        if (fundingHistory.length === 0) continue;
        
        // Get the latest funding rate
        const latest = fundingHistory[fundingHistory.length - 1];
        const currentRate = parseFloat(latest.f || latest.rate);
        const aprSigned = calculateAPR(currentRate, 1); // Extended uses 1h funding
        
        // Calculate next funding time (1 hour from the last funding time)
        const lastFundingTime = latest.T || latest.timestamp;
        const nextFundingTime = new Date(lastFundingTime + (60 * 60 * 1000));
        
        const history = fundingHistory.map((item: any) => ({
          ts: item.T || item.timestamp,
          rate: parseFloat(item.f || item.rate)
        }));
        
        results.push({
          id: `extended-${extendedSymbol}`,
          exchange: 'extended',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw: extendedSymbol,
          fundingPeriodHours: 1,
          lastFundingRate: currentRate,
          currentEstRate: currentRate,
          aprSigned,
          nextFundingTime: nextFundingTime.toISOString(),
          ts: new Date().toISOString(),
          history,
          source: 'extended'
        });
      } catch (error) {
        console.warn(`Failed to fetch Extended data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Extended funding fetch failed:', error);
    return [];
  }
}
