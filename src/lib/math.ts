import { CostItem, ValueComparison } from '../types';

// APR calculation utilities
export function calculateAPR(fundingRate: number, fundingPeriodHours: number): number {
  const periodsPerYear = (24 * 365) / fundingPeriodHours;
  return fundingRate * periodsPerYear;
}

export function formatAPR(apr: number): string {
  const sign = apr >= 0 ? '+' : '';
  return `${sign}${(apr * 100).toFixed(2)}%`;
}

export function formatMultiple(multiple: number): string {
  const abs = Math.abs(multiple);
  const rounded = Math.round(abs);
  const diff = Math.abs(abs - rounded);
  
  // Precision policy based on magnitude
  let formatted: string;
  if (abs >= 10) {
    formatted = Math.round(abs).toString();
  } else if (abs >= 2) {
    formatted = abs.toFixed(1);
  } else {
    formatted = abs.toFixed(2);
  }
  
  // Use tilde badge only when close to integer
  if (diff < 0.15) {
    return `~${multiple >= 0 ? '' : '-'}${formatted}×`;
  }
  
  return `${multiple >= 0 ? '' : '-'}${formatted}×`;
}

export function isNiceInteger(multiple: number): boolean {
  const abs = Math.abs(multiple);
  const rounded = Math.round(abs);
  return Math.abs(abs - rounded) < 0.15;
}

// Value context calculations
export function computeComparisons(
  amount: number, 
  items: CostItem[], 
  sortMode: 'amount' | 'priority' | 'edited' = 'amount',
  filters: string[] = [],
  pinnedItems: string[] = []
): ValueComparison[] {
  if (amount === 0) {
    return [];
  }
  
  let filtered = items.filter(item => item.usd > 0);
  
  // Apply filters
  if (filters.length > 0) {
    filtered = filtered.filter(item => {
      if (filters.includes('oneOff') && item.category === 'tech') return true;
      if (filters.includes('monthly') && ['housing', 'food', 'utilities'].includes(item.category || '')) return true;
      if (filters.includes('annual') && item.category === 'leisure') return true;
      return false;
    });
  }
  
  const comparisons = filtered.map(item => ({
    item,
    multiple: amount / item.usd,
    isNiceInteger: isNiceInteger(amount / item.usd)
  }));
  
  // Sort based on mode
  switch (sortMode) {
    case 'priority':
      // Essentials first (housing, food, utilities)
      return comparisons.sort((a, b) => {
        const aPriority = ['housing', 'food', 'utilities'].includes(a.item.category || '') ? 0 : 1;
        const bPriority = ['housing', 'food', 'utilities'].includes(b.item.category || '') ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return Math.abs(b.multiple) - Math.abs(a.multiple);
      });
    case 'edited':
      // Edited items first (placeholder - would need to track edit state)
      return comparisons.sort((a, b) => Math.abs(b.multiple) - Math.abs(a.multiple));
    default:
      return comparisons.sort((a, b) => Math.abs(b.multiple) - Math.abs(a.multiple));
  }
}

export function generateOneLineSummary(amount: number, comparisons: ValueComparison[]): string {
  if (amount === 0 || comparisons.length === 0) return '';
  
  const topItems = comparisons.slice(0, 3).map(comp => {
    const formatted = formatMultiple(comp.multiple);
    return `${formatted} ${comp.item.label.toLowerCase()}`;
  });
  
  return `$${amount.toLocaleString()} = ${topItems.join(' · ')}`;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getTimeUntilNextFunding(nextFundingTime?: string): number | null {
  if (!nextFundingTime) return null;
  
  const nextTime = new Date(nextFundingTime).getTime();
  const now = Date.now();
  const diff = nextTime - now;
  
  return diff > 0 ? diff : null;
}
