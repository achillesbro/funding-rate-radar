// Symbol normalization for different exchanges
export const SYMBOL_MAP: Record<string, { base: string; quote: string }> = {
  // Binance
  'BTCUSDT': { base: 'BTC', quote: 'USDT' },
  'ETHUSDT': { base: 'ETH', quote: 'USDT' },
  'SOLUSDT': { base: 'SOL', quote: 'USDT' },
  'HYPEUSDT': { base: 'HYPE', quote: 'USDT' },
  
  // Bybit
  'BTCUSDT_BYBIT': { base: 'BTC', quote: 'USDT' },
  'ETHUSDT_BYBIT': { base: 'ETH', quote: 'USDT' },
  'SOLUSDT_BYBIT': { base: 'SOL', quote: 'USDT' },
  'HYPEUSDT_BYBIT': { base: 'HYPE', quote: 'USDT' },
  
  
  // Hyperliquid
  'BTC_HYPER': { base: 'BTC', quote: 'USDT' },
  'ETH_HYPER': { base: 'ETH', quote: 'USDT' },
  'SOL_HYPER': { base: 'SOL', quote: 'USDT' },
  'HYPE_HYPER': { base: 'HYPE', quote: 'USDT' },
  
  // Lighter
  'BTC_LIGHTER': { base: 'BTC', quote: 'USDT' },
  'ETH_LIGHTER': { base: 'ETH', quote: 'USDT' },
  'SOL_LIGHTER': { base: 'SOL', quote: 'USDT' },
  'HYPE_LIGHTER': { base: 'HYPE', quote: 'USDT' },
  
  // Extended
  'BTC-USD': { base: 'BTC', quote: 'USD' },
  'ETH-USD': { base: 'ETH', quote: 'USD' },
  'SOL-USD': { base: 'SOL', quote: 'USD' },
  'HYPE-USD': { base: 'HYPE', quote: 'USD' },
  
  // Aster
  'BTCUSDT_ASTER': { base: 'BTC', quote: 'USDT' },
  'ETHUSDT_ASTER': { base: 'ETH', quote: 'USDT' },
  'SOLUSDT_ASTER': { base: 'SOL', quote: 'USDT' },
  'HYPEUSDT_ASTER': { base: 'HYPE', quote: 'USDT' },
};

export const SUPPORTED_ASSETS = ['BTC', 'ETH', 'SOL', 'HYPE'];
export const SUPPORTED_EXCHANGES = ['binance', 'bybit', 'hyperliquid', 'lighter', 'extended', 'aster'];

export function normalizeSymbol(symbol: string, exchange: string): { base: string; quote: string } | null {
  const normalized = symbol.toUpperCase();
  const mapped = SYMBOL_MAP[normalized];
  
  if (mapped) {
    return mapped;
  }
  
  // Fallback parsing for common patterns
  if (exchange === 'extended' && normalized.includes('-')) {
    const [base, quote] = normalized.split('-');
    return { base, quote };
  }
  
  if (exchange === 'hyperliquid' || exchange === 'lighter') {
    // Hyperliquid and Lighter use just the base symbol
    return { base: normalized, quote: 'USDT' };
  }
  
  // Try to extract base/quote from common patterns
  const usdtMatch = normalized.match(/^([A-Z]+)USDT$/);
  if (usdtMatch) {
    return { base: usdtMatch[1], quote: 'USDT' };
  }
  
  return null;
}

export function getSymbolForExchange(base: string, exchange: string): string {
  switch (exchange) {
    case 'binance':
    case 'bybit':
    case 'aster':
      return `${base}USDT`;
    case 'hyperliquid':
    case 'lighter':
      return base;
    case 'extended':
      return `${base}-USD`;
    default:
      return `${base}USDT`;
  }
}
