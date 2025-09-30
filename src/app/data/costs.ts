import { CostItem } from '../../types';

export const DEFAULT_COSTS: CostItem[] = [
  { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 1200, category: 'housing', editable: true },
  { id: 'groceries_month', label: 'Groceries (1 month)', usd: 250, category: 'food', editable: true },
  { id: 'flight_eu_jp_rt', label: 'Flight EU↔JP (RT, economy)', usd: 900, category: 'travel', editable: true },
  { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech', editable: true },
  { id: 'gym_year', label: 'Gym (1 year)', usd: 300, category: 'leisure', editable: true },
  { id: 'electricity_month', label: 'Electricity (1 month)', usd: 75, category: 'utilities', editable: true },
  { id: 'coffee', label: 'Coffee', usd: 3, category: 'food', editable: true },
  { id: 'shinkansen_rt', label: 'Shinkansen Tokyo–Osaka (RT)', usd: 220, category: 'travel', editable: true },
  { id: 'ski_pass_week', label: 'Ski pass (1 week, Hokkaidō)', usd: 350, category: 'leisure', editable: true }
];

export function loadCostsFromStorage(): CostItem[] {
  if (typeof window === 'undefined') return DEFAULT_COSTS;
  
  try {
    const stored = localStorage.getItem('value-context.costs');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : DEFAULT_COSTS;
    }
  } catch (error) {
    console.warn('Failed to load costs from localStorage:', error);
  }
  
  return DEFAULT_COSTS;
}

export function saveCostsToStorage(costs: CostItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('value-context.costs', JSON.stringify(costs));
  } catch (error) {
    console.warn('Failed to save costs to localStorage:', error);
  }
}
