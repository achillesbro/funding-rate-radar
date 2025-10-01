import { FundingTicker } from '../../types';
import { normalizeSymbol, getSymbolForExchange } from '../symbols';
import { calculateAPR } from '../math';

export async function fetchLighterFunding(symbols: string[]): Promise<FundingTicker[]> {
  console.log('Lighter: fetchLighterFunding called with symbols:', symbols);
  try {
    const results: FundingTicker[] = [];
    
    for (const symbol of symbols) {
      console.log(`Lighter: Processing symbol ${symbol}`);
      try {
        const symbolRaw = getSymbolForExchange(symbol, 'lighter');
        const normalized = normalizeSymbol(symbolRaw, 'lighter');
        if (!normalized) continue;
        
        // Fetch current funding rates from Lighter mainnet API
        const fundingResponse = await fetch(
          'https://mainnet.zklighter.elliot.ai/api/v1/funding-rates',
          { 
            next: { revalidate: 60 },
            headers: {
              'User-Agent': 'FujiScan/1.0'
            }
          }
        );
        
        if (!fundingResponse.ok) {
          console.warn(`Lighter API failed: ${fundingResponse.status} ${fundingResponse.statusText}`);
          continue;
        }
        
        const fundingData = await fundingResponse.json();
        
        
        // Lighter returns { code: 200, funding_rates: [...] }
        const ratesArray = fundingData.funding_rates || [];
        
        // Find the specific symbol in the response
        // Lighter might return different symbol formats, so try multiple variations
        const symbolData = ratesArray.find((item: any) => {
          const itemSymbol = item.symbol || item.market || item.pair || item.token || item.coin;
          return itemSymbol === symbolRaw || 
                 itemSymbol === symbol || 
                 itemSymbol === `${symbol}USDT` ||
                 itemSymbol === `${symbol}-USDT` ||
                 itemSymbol === `${symbol}_USDT` ||
                 itemSymbol === symbol.toUpperCase() ||
                 itemSymbol === symbol.toLowerCase();
        });
        
        if (!symbolData) {
          console.warn(`Lighter: No data found for symbol ${symbol} (raw: ${symbolRaw}). Available symbols:`, 
            ratesArray.map((item: any) => item.symbol || item.market || item.pair || item.token || item.coin));
          continue;
        }
        
        // Fetch historical funding data
        const historyResponse = await fetch(
          `https://mainnet.zklighter.elliot.ai/api/v1/fundings?symbol=${symbolRaw}&limit=10`,
          { 
            next: { revalidate: 60 },
            headers: {
              'User-Agent': 'FujiScan/1.0'
            }
          }
        );
        
        let history: Array<{ ts: number; rate: number }> = [];
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          history = historyData.map((item: any) => ({
            ts: item.timestamp || item.t,
            rate: parseFloat(item.fundingRate || item.rate)
          }));
        }
        
        const currentRate = parseFloat(
          symbolData.fundingRate || 
          symbolData.rate || 
          symbolData.funding_rate || 
          symbolData.lastFundingRate || 
          0
        );
        const aprSigned = calculateAPR(currentRate, 8); // Lighter returns 8h funding rates
        
        // Calculate next funding time (8 hours from now)
        const nextFundingTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
        
        results.push({
          id: `lighter-${symbolRaw}`,
          exchange: 'lighter',
          base: normalized.base,
          quote: normalized.quote,
          symbolRaw,
          fundingPeriodHours: 8,
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
    
    console.log('Lighter: Returning results:', results.length, 'tickers');
    return results;
  } catch (error) {
    console.error('Lighter funding fetch failed:', error);
    return [];
  }
}
