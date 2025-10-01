import { CostItem } from '../../types';

export const DEFAULT_COSTS: CostItem[] = [
  // ————— Housing / “basket” anchors
  { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 1200, category: 'housing', editable: true },
  { id: 'rent_room', label: 'Month of rent (room in shared apt.)', usd: 700, category: 'housing', editable: true },
  { id: 'living_barebones_month', label: 'Barebones living basket (1 month)', usd: 1000, category: 'housing', editable: true }, // shared room + groceries + utilities + transit
  { id: 'living_comfortable_month', label: 'Comfortable living basket (1 month)', usd: 1800, category: 'housing', editable: true },

  // ————— Food
  { id: 'groceries_month', label: 'Groceries (1 month)', usd: 250, category: 'food', editable: true },
  { id: 'coffee', label: 'Coffee', usd: 3, category: 'food', editable: true },
  { id: 'ramen_bowl', label: 'Ramen bowl', usd: 9, category: 'food', editable: true },
  { id: 'conbini_bento', label: 'Convenience-store bento', usd: 5, category: 'food', editable: true },
  { id: 'sushi_omakase_mid', label: 'Sushi omakase (mid-range, per person)', usd: 60, category: 'food', editable: true },
  { id: 'casual_dinner_for_two', label: 'Casual dinner for two', usd: 80, category: 'food', editable: true },
  { id: 'cocktail_bar', label: 'Cocktail (nice bar)', usd: 12, category: 'food', editable: true },

  // ————— Travel & local transport
  { id: 'metro_daypass', label: 'Metro/Train day pass (24h)', usd: 7, category: 'travel', editable: true },
  { id: 'commuter_pass_month', label: 'Commuter pass (1 month)', usd: 75, category: 'travel', editable: true },
  { id: 'rideshare_10km', label: 'Rideshare (10 km)', usd: 15, category: 'travel', editable: true },
  { id: 'airport_train_oneway', label: 'Airport express train (one-way)', usd: 25, category: 'travel', editable: true },
  { id: 'domestic_flight_rt', label: 'Domestic flight (RT, economy)', usd: 150, category: 'travel', editable: true },
  { id: 'shinkansen_rt', label: 'Shinkansen Tokyo–Osaka (RT)', usd: 220, category: 'travel', editable: true },
  { id: 'jrpass_7d', label: 'JR Pass (7 days)', usd: 330, category: 'travel', editable: true },
  { id: 'flight_eu_jp_rt', label: 'Flight EU↔JP (RT, economy)', usd: 900, category: 'travel', editable: true },
  { id: 'gas_tank_50l', label: 'Gasoline (full tank ~50 L)', usd: 70, category: 'travel', editable: true },

  // ————— Tech / work setup
  { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech', editable: true },
  { id: 'smartphone_mid', label: 'Smartphone (mid-tier)', usd: 700, category: 'tech', editable: true },
  { id: 'monitor_27_4k', label: '27" 4K monitor', usd: 300, category: 'tech', editable: true },
  { id: 'ext_ssd_2tb', label: 'External SSD (2 TB)', usd: 120, category: 'tech', editable: true },
  { id: 'nc_headphones', label: 'Noise-cancelling headphones', usd: 250, category: 'tech', editable: true },
  { id: 'hardware_wallet', label: 'Hardware wallet', usd: 79, category: 'tech', editable: true },
  { id: 'domain_ssl_year', label: 'Domain + SSL (1 year)', usd: 15, category: 'tech', editable: true },
  { id: 'vps_dev_month', label: 'VPS (dev box, 1 month)', usd: 25, category: 'tech', editable: true },

  // ————— Utilities
  { id: 'electricity_month', label: 'Electricity (1 month)', usd: 75, category: 'utilities', editable: true },
  { id: 'water_month', label: 'Water (1 month)', usd: 25, category: 'utilities', editable: true },
  { id: 'heating_gas_month', label: 'Heating gas (1 month)', usd: 60, category: 'utilities', editable: true },
  { id: 'fiber_internet_month', label: 'Fiber internet (1 month)', usd: 40, category: 'utilities', editable: true },
  { id: 'mobile_plan_month', label: 'Mobile plan (1 month)', usd: 25, category: 'utilities', editable: true },
  { id: 'cloud_storage_month', label: 'Cloud storage 2 TB (1 month)', usd: 10, category: 'utilities', editable: true },

  // ————— Leisure & lifestyle
  { id: 'gym_month', label: 'Gym (1 month)', usd: 35, category: 'leisure', editable: true },
  { id: 'gym_year', label: 'Gym (1 year)', usd: 300, category: 'leisure', editable: true },
  { id: 'onsen_day', label: 'Onsen day pass', usd: 8, category: 'leisure', editable: true },
  { id: 'karaoke_2h_room', label: 'Karaoke room (2 hours)', usd: 20, category: 'leisure', editable: true },
  { id: 'cinema_ticket', label: 'Cinema ticket', usd: 12, category: 'leisure', editable: true },
  { id: 'netflix_month', label: 'Netflix (1 month)', usd: 16, category: 'leisure', editable: true },
  { id: 'museum_entry', label: 'Museum entry', usd: 10, category: 'leisure', editable: true },
  { id: 'ski_pass_week', label: 'Ski pass (1 week, Hokkaidō)', usd: 350, category: 'leisure', editable: true },

  // ——— Vehicles (Travel)
{ id: 'car_used_compact_5y', label: 'Used car (5-yr compact sedan)', usd: 15000, category: 'travel', editable: true },
{ id: 'car_new_mid_sedan', label: 'New car (mid-tier sedan)', usd: 30000, category: 'travel', editable: true },
{ id: 'car_tesla_model3_lr', label: 'Tesla Model 3 Long Range (new)', usd: 45000, category: 'travel', editable: true },
{ id: 'car_land_cruiser_new', label: 'Toyota Land Cruiser (new)', usd: 65000, category: 'travel', editable: true },
{ id: 'car_porsche_911_gt3rs', label: 'Porsche 911 GT3 RS (new, base)', usd: 250000, category: 'travel', editable: true },
{ id: 'supercar_maintenance_year', label: 'Supercar maintenance (1 year)', usd: 10000, category: 'travel', editable: true },

// ——— Housing (purchase scale)
{ id: 'house_down_payment_20', label: '20% down payment (median home)', usd: 80000, category: 'housing', editable: true }, // assuming ~$400k median
{ id: 'house_median_national', label: 'Median home price (national)', usd: 400000, category: 'housing', editable: true },
{ id: 'apartment_prime_city_2br', label: 'Prime-city apartment (2BR)', usd: 1200000, category: 'housing', editable: true }
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
