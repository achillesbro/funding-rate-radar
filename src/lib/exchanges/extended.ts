import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchExtendedFunding(symbols: string[]): Promise<FundingTicker[]> {
  console.log('Extended: fetchExtendedFunding called with symbols:', symbols);
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      console.log(`Extended: Processing symbol ${symbol}`);
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'extended');
        const normalized = normalizeSymbol(symbolRaw, 'extended');
        if (!normalized) continue;
        
        // Extended uses BTC-USD format, so convert BTC to BTC-USD
        const extendedSymbol = `${symbol}-USD`;
        
        // Calculate time range for history (last 24 hours)
        const endTime = Date.now();
        const startTime = endTime - (24 * 60 * 60 * 1000);
        
        // Use the correct Starknet API endpoint for Extended
        const response = await fetch(
          `https://api.starknet.extended.exchange/api/v1/info/${extendedSymbol}/funding?startTime=${startTime}&endTime=${endTime}&limit=10`,
          { 
            next: { revalidate: 60 },
            headers: {
              'User-Agent': 'FujiScan/1.0'
            }
          }
        );
        
        if (!response.ok) {
          console.warn(`Extended API failed for ${extendedSymbol}: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        
        // Extended returns { status: 'OK', data: [...] }
        const fundingHistory = data.data || [];
        
        if (fundingHistory.length === 0) {
          console.warn(`Extended: No funding history found for symbol ${extendedSymbol}`);
          continue;
        }
        
        // Get the latest funding rate - Extended returns { m, T, f } format
        const latest = fundingHistory[fundingHistory.length - 1];
        const currentRate = parseFloat(latest.f); // f is the hourly funding rate as string
        const aprSigned = calculateAPR(currentRate, 1); // Extended uses 1h funding
        
        // Calculate next funding time (1 hour from the last funding time)
        const lastFundingTime = latest.T; // T is timestamp in ms
        const nextFundingTime = new Date(lastFundingTime + (60 * 60 * 1000));
        
        const history = fundingHistory.map((item: any) => ({
          ts: item.T, // T is timestamp in ms
          rate: parseFloat(item.f) // f is funding rate as string
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
    
    console.log('Extended: Returning results:', results.length, 'tickers');
    return results;
  } catch (error) {
    console.error('Extended funding fetch failed:', error);
    return [];
  }
}
