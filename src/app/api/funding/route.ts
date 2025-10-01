import { NextRequest, NextResponse } from 'next/server';
import { fetchBinanceFunding } from '../../../lib/exchanges/binance';
import { fetchBybitFunding } from '../../../lib/exchanges/bybit';
import { fetchHyperliquidFunding } from '../../../lib/exchanges/hyperliquid';
import { fetchLighterFunding } from '../../../lib/exchanges/lighter';
import { fetchExtendedFunding } from '../../../lib/exchanges/extended';
import { fetchAsterFunding } from '../../../lib/exchanges/aster';
import { SUPPORTED_ASSETS, SUPPORTED_EXCHANGES } from '../../../lib/symbols';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assets = searchParams.get('assets')?.split(',') || SUPPORTED_ASSETS;
    const exchanges = searchParams.get('exchanges')?.split(',') || SUPPORTED_EXCHANGES;
    
    // Validate inputs
    const validAssets = assets.filter(asset => SUPPORTED_ASSETS.includes(asset));
    const validExchanges = exchanges.filter(exchange => SUPPORTED_EXCHANGES.includes(exchange));
    
    if (validAssets.length === 0 || validExchanges.length === 0) {
      return NextResponse.json(
        { error: 'Invalid assets or exchanges' },
        { status: 400 }
      );
    }
    
    // Fetch data from all exchanges in parallel
    const fetchPromises = validExchanges.map(async (exchange) => {
      try {
        switch (exchange) {
          case 'binance':
            return await fetchBinanceFunding(validAssets);
          case 'bybit':
            return await fetchBybitFunding(validAssets);
          case 'hyperliquid':
            return await fetchHyperliquidFunding(validAssets);
          case 'lighter':
            return await fetchLighterFunding(validAssets);
          case 'extended':
            return await fetchExtendedFunding(validAssets);
          case 'aster':
            return await fetchAsterFunding(validAssets);
          default:
            return [];
        }
      } catch (error) {
        console.error(`Failed to fetch from ${exchange}:`, error);
        return [];
      }
    });
    
    const results = await Promise.allSettled(fetchPromises);
    
    // Merge all successful results
    const allTickers = results
      .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .filter(Boolean);
    
    // Check if any requests failed
    const failedCount = results.filter(result => result.status === 'rejected').length;
    const hasStaleData = failedCount > 0;
    
    // Mark stale data if some exchanges failed
    if (hasStaleData) {
      allTickers.forEach(ticker => {
        ticker.stale = true;
      });
    }
    
    const response = NextResponse.json({
      data: allTickers,
      meta: {
        timestamp: new Date().toISOString(),
        assets: validAssets,
        exchanges: validExchanges,
        stale: hasStaleData,
        failedExchanges: failedCount
      }
    });
    
    // Set cache headers - cache for 60 seconds
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error('Funding API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
        }
      }
    );
  }
}
