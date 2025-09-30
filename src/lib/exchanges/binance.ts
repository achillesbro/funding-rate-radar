import { FundingTicker, FundingData } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchBinanceFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'binance');
        const normalized = normalizeSymbol(symbolRaw, 'binance');
        if (!normalized) continue;
        
        // Fetch premium index (current funding rate)
        const premiumResponse = await fetch(
          `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbolRaw}`,
          { next: { revalidate: 30 } }
        );
        
        if (!premiumResponse.ok) continue;
        
        const premiumData = await premiumResponse.json();
        
        // Fetch funding rate history for APR calculation
        const historyResponse = await fetch(
          `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbolRaw}&limit=3`,
          { next: { revalidate: 30 } }
        );
        
        let history: Array<{ ts: number; rate: number }> = [];
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          history = historyData.map((item: any) => ({
            ts: item.fundingTime,
            rate: parseFloat(item.fundingRate)
          }));
        }
        
        const currentRate = parseFloat(premiumData.lastFundingRate);
        const nextRate = parseFloat(premiumData.nextFundingRate);
        const aprSigned = calculateAPR(currentRate, 8); // Binance uses 8h funding
        
        results.push({
          id: `binance-${symbolRaw}`,
          exchange: 'binance',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw,
          fundingPeriodHours: 8,
          lastFundingRate: currentRate,
          nextFundingRate: nextRate,
          currentEstRate: currentRate,
          aprSigned,
          nextFundingTime: new Date(premiumData.nextFundingTime).toISOString(),
          ts: new Date().toISOString(),
          history,
          source: 'binance'
        });
      } catch (error) {
        console.warn(`Failed to fetch Binance data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Binance funding fetch failed:', error);
    return [];
  }
}
