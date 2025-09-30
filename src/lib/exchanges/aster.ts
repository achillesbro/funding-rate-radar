import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchAsterFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'aster');
        const normalized = normalizeSymbol(symbolRaw, 'aster');
        if (!normalized) continue;
        
        // Aster uses BTCUSDT format
        const asterSymbol = `${symbol}USDT`;
        
        // Fetch premium index (current funding rate)
        const premiumResponse = await fetch(
          `https://fapi.asterdex.com/fapi/v1/premiumIndex?symbol=${asterSymbol}`,
          { next: { revalidate: 30 } }
        );
        
        if (!premiumResponse.ok) continue;
        
        const premiumData = await premiumResponse.json();
        
        // Fetch funding rate history
        const historyResponse = await fetch(
          `https://fapi.asterdex.com/fapi/v1/fundingRate?symbol=${asterSymbol}&limit=10`,
          { next: { revalidate: 30 } }
        );
        
        let history: Array<{ ts: number; rate: number }> = [];
        let fundingPeriodHours = 8; // Default to 8h like Binance
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          history = historyData.map((item: any) => ({
            ts: item.fundingTime,
            rate: parseFloat(item.fundingRate)
          }));
          
          // Calculate funding period from history if available
          if (history.length >= 2) {
            const timeDiff = history[1].ts - history[0].ts;
            fundingPeriodHours = timeDiff / (1000 * 60 * 60); // Convert ms to hours
          }
        }
        
        const currentRate = parseFloat(premiumData.lastFundingRate);
        const aprSigned = calculateAPR(currentRate, fundingPeriodHours);
        
        // Use nextFundingTime from API response
        const nextFundingTime = premiumData.nextFundingTime 
          ? new Date(premiumData.nextFundingTime).toISOString()
          : new Date(Date.now() + (fundingPeriodHours * 60 * 60 * 1000)).toISOString();
        
        results.push({
          id: `aster-${asterSymbol}`,
          exchange: 'aster',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw: asterSymbol,
          fundingPeriodHours,
          lastFundingRate: currentRate,
          currentEstRate: currentRate,
          aprSigned,
          nextFundingTime,
          ts: new Date().toISOString(),
          history,
          source: 'aster'
        });
      } catch (error) {
        console.warn(`Failed to fetch Aster data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Aster funding fetch failed:', error);
    return [];
  }
}
