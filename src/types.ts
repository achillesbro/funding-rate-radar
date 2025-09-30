export type FundingTicker = {
  id: string;
  exchange: 'binance' | 'bybit' | 'okx' | 'hyperliquid' | 'lighter' | 'extended' | 'aster';
  base: string;
  quote: string;
  symbolRaw: string;
  fundingPeriodHours: number;
  lastFundingRate?: number;
  nextFundingRate?: number;
  currentEstRate?: number;
  aprSigned?: number;
  nextFundingTime?: string;
  ts: string;
  history?: Array<{ ts: number; rate: number }>;
  source: string;
  stale?: boolean;
};

export type CostItem = {
  id: string;
  label: string;
  usd: number;
  category?: 'housing' | 'tech' | 'travel' | 'food' | 'utilities' | 'leisure';
  editable?: boolean;
};

export type ValueComparison = {
  item: CostItem;
  multiple: number;
  isNiceInteger: boolean;
};

export type ExchangeConfig = {
  name: string;
  baseUrl: string;
  fundingEndpoint: string;
  symbolsEndpoint?: string;
  fundingPeriodHours: number;
};

export type FundingData = {
  lastFundingRate?: number;
  nextFundingRate?: number;
  currentEstRate?: number;
  nextFundingTime?: string;
  history?: Array<{ ts: number; rate: number }>;
};
