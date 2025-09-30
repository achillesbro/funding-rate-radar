import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchLighterFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'lighter');
        const normalized = normalizeSymbol(symbolRaw, 'lighter');
        if (!normalized) continue;
        
        // Fetch current funding rates
        const fundingResponse = await fetch(
          'https://mainnet.zklighter.elliot.ai/api/v1/funding-rates',
          { next: { revalidate: 30 } }
        );
        
        if (!fundingResponse.ok) continue;
        
        const fundingData = await fundingResponse.json();
        
        // Find the specific symbol in the response
        const symbolData = fundingData.find((item: any) => 
          item.symbol === symbolRaw || item.symbol === symbol
        );
        
        if (!symbolData) continue;
        
        // Fetch historical funding data
        const historyResponse = await fetch(
          `https://mainnet.zklighter.elliot.ai/api/v1/fundings?symbol=${symbolRaw}&limit=10`,
          { next: { revalidate: 30 } }
        );
        
        let history: Array<{ ts: number; rate: number }> = [];
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          history = historyData.map((item: any) => ({
            ts: item.timestamp || item.t,
            rate: parseFloat(item.fundingRate || item.rate)
          }));
        }
        
        const currentRate = parseFloat(symbolData.fundingRate || symbolData.rate);
        const aprSigned = calculateAPR(currentRate, 1); // Lighter uses 1h funding
        
        // Calculate next funding time (1 hour from now)
        const nextFundingTime = new Date(Date.now() + 60 * 60 * 1000);
        
        results.push({
          id: `lighter-${symbolRaw}`,
          exchange: 'lighter',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw,
          fundingPeriodHours: 1,
          lastFundingRate: currentRate,
          currentEstRate: currentRate,
          aprSigned,
          nextFundingTime: nextFundingTime.toISOString(),
          ts: new Date().toISOString(),
          history,
          source: 'lighter'
        });
      } catch (error) {
        console.warn(`Failed to fetch Lighter data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Lighter funding fetch failed:', error);
    return [];
  }
}
