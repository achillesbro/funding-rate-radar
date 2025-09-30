import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchOKXFunding(symbols: string[]): Promise<FundingTicker[]> {
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'okx');
        const normalized = normalizeSymbol(symbolRaw, 'okx');
        if (!normalized) continue;
        
        // Fetch funding rate data
        const response = await fetch(
          `https://www.okx.com/api/v5/public/funding-rate?instId=${symbolRaw}`,
          { next: { revalidate: 30 } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const fundingData = data.data?.[0];
        
        if (!fundingData) continue;
        
        const currentRate = parseFloat(fundingData.fundingRate);
        const nextRate = parseFloat(fundingData.nextFundingRate);
        const fundingTime = parseInt(fundingData.fundingTime);
        const nextFundingTime = parseInt(fundingData.nextFundingTime);
        
        // OKX typically uses 8h funding
        const fundingPeriodHours = 8;
        const aprSigned = calculateAPR(currentRate, fundingPeriodHours);
        
        results.push({
          id: `okx-${symbolRaw}`,
          exchange: 'okx',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw,
          fundingPeriodHours,
          lastFundingRate: currentRate,
          nextFundingRate: nextRate,
          currentEstRate: currentRate,
          aprSigned,
          nextFundingTime: new Date(nextFundingTime).toISOString(),
          ts: new Date().toISOString(),
          source: 'okx'
        });
      } catch (error) {
        console.warn(`Failed to fetch OKX data for ${symbol}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('OKX funding fetch failed:', error);
    return [];
  }
}
