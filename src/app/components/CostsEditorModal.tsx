'use client';

import { useState, useRef, useEffect } from 'react';
import { CostItem } from '../../types';
import { jp } from '../i18n/jpKatakana';

interface CostsEditorModalProps {
  isOpen: boolean;
  costs: CostItem[];
  onClose: () => void;
  onSave: (costs: CostItem[]) => void;
}

const REGION_PRESETS = {
  EU: [
    // Housing & baskets
    { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 1200, category: 'housing' as const },
    { id: 'living_barebones_month', label: 'Barebones living basket (1 month)', usd: 1400, category: 'housing' as const },
    { id: 'living_comfortable_month', label: 'Comfortable living basket (1 month)', usd: 2200, category: 'housing' as const },

    // Food
    { id: 'groceries_month', label: 'Groceries (1 month)', usd: 250, category: 'food' as const },
    { id: 'coffee', label: 'Coffee', usd: 3, category: 'food' as const },
    { id: 'casual_dinner_for_two', label: 'Casual dinner for two', usd: 80, category: 'food' as const },
    { id: 'cocktail_bar', label: 'Cocktail (nice bar)', usd: 12, category: 'food' as const },

    // Travel & local transport
    { id: 'metro_daypass', label: 'Metro/Train day pass (24h)', usd: 7, category: 'travel' as const },
    { id: 'commuter_pass_month', label: 'Commuter pass (1 month)', usd: 60, category: 'travel' as const },
    { id: 'domestic_flight_rt', label: 'Domestic flight (RT, economy)', usd: 120, category: 'travel' as const },
    { id: 'flight_eu_jp_rt', label: 'Flight EU↔JP (RT, economy)', usd: 900, category: 'travel' as const },
    { id: 'gas_tank_50l', label: 'Gasoline (full tank ~50 L)', usd: 85, category: 'travel' as const },

    // Tech / work
    { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech' as const },
    { id: 'hardware_wallet', label: 'Hardware wallet', usd: 79, category: 'tech' as const },

    // Utilities
    { id: 'electricity_month', label: 'Electricity (1 month)', usd: 75, category: 'utilities' as const },
    { id: 'fiber_internet_month', label: 'Fiber internet (1 month)', usd: 40, category: 'utilities' as const },
    { id: 'mobile_plan_month', label: 'Mobile plan (1 month)', usd: 25, category: 'utilities' as const },
    { id: 'water_month', label: 'Water (1 month)', usd: 25, category: 'utilities' as const },

    // ——— Big-ticket (EU)
    { id: 'car_used_compact_5y', label: 'Used car (5-yr compact sedan)', usd: 14000, category: 'travel' as const },
    { id: 'car_new_mid_sedan', label: 'New car (mid-tier sedan)', usd: 32000, category: 'travel' as const },
    { id: 'car_tesla_model3_lr', label: 'Tesla Model 3 Long Range (new)', usd: 50000, category: 'travel' as const },
    { id: 'car_land_cruiser_new', label: 'Toyota Land Cruiser (new)', usd: 75000, category: 'travel' as const },
    { id: 'car_porsche_911_gt3rs', label: 'Porsche 911 GT3 RS (new, base)', usd: 280000, category: 'travel' as const },
    { id: 'supercar_maintenance_year', label: 'Supercar maintenance (1 year)', usd: 12000, category: 'travel' as const },

    { id: 'house_down_payment_20', label: '20% down payment (median home)', usd: 80000, category: 'housing' as const }, // ~$400k median
    { id: 'house_median_national', label: 'Median home price (urban EU)', usd: 400000, category: 'housing' as const },
    { id: 'apartment_prime_city_2br', label: 'Prime-city apartment (2BR, Paris/Milan/Munich)', usd: 1200000, category: 'housing' as const }
  ],

  US: [
    // Housing & baskets
    { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 1500, category: 'housing' as const },
    { id: 'living_barebones_month', label: 'Barebones living basket (1 month)', usd: 1800, category: 'housing' as const },
    { id: 'living_comfortable_month', label: 'Comfortable living basket (1 month)', usd: 2800, category: 'housing' as const },

    // Food
    { id: 'groceries_month', label: 'Groceries (1 month)', usd: 300, category: 'food' as const },
    { id: 'coffee', label: 'Coffee', usd: 4, category: 'food' as const },
    { id: 'casual_dinner_for_two', label: 'Casual dinner for two', usd: 90, category: 'food' as const },
    { id: 'cocktail_bar', label: 'Cocktail (nice bar)', usd: 15, category: 'food' as const },

    // Travel & local transport
    { id: 'metro_daypass', label: 'Metro/Train day pass (24h)', usd: 10, category: 'travel' as const },
    { id: 'commuter_pass_month', label: 'Commuter pass (1 month)', usd: 90, category: 'travel' as const },
    { id: 'domestic_flight_rt', label: 'Domestic flight (RT, economy)', usd: 250, category: 'travel' as const },
    { id: 'flight_us_jp_rt', label: 'Flight US↔JP (RT, economy)', usd: 1100, category: 'travel' as const },
    { id: 'rideshare_10km', label: 'Rideshare (10 km)', usd: 18, category: 'travel' as const },
    { id: 'gas_tank_50l', label: 'Gasoline (full tank ~50 L)', usd: 65, category: 'travel' as const },

    // Tech / work
    { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech' as const },
    { id: 'hardware_wallet', label: 'Hardware wallet', usd: 79, category: 'tech' as const },

    // Utilities
    { id: 'electricity_month', label: 'Electricity (1 month)', usd: 100, category: 'utilities' as const },
    { id: 'fiber_internet_month', label: 'Fiber internet (1 month)', usd: 60, category: 'utilities' as const },
    { id: 'mobile_plan_month', label: 'Mobile plan (1 month)', usd: 50, category: 'utilities' as const },
    { id: 'water_month', label: 'Water (1 month)', usd: 30, category: 'utilities' as const },

    // ——— Big-ticket (US)
    { id: 'car_used_compact_5y', label: 'Used car (5-yr compact sedan)', usd: 13000, category: 'travel' as const },
    { id: 'car_new_mid_sedan', label: 'New car (mid-tier sedan)', usd: 30000, category: 'travel' as const },
    { id: 'car_tesla_model3_lr', label: 'Tesla Model 3 Long Range (new)', usd: 45000, category: 'travel' as const },
    { id: 'car_land_cruiser_new', label: 'Toyota Land Cruiser (new)', usd: 65000, category: 'travel' as const },
    { id: 'car_porsche_911_gt3rs', label: 'Porsche 911 GT3 RS (new, base)', usd: 250000, category: 'travel' as const },
    { id: 'supercar_maintenance_year', label: 'Supercar maintenance (1 year)', usd: 10000, category: 'travel' as const },

    { id: 'house_down_payment_20', label: '20% down payment (median home)', usd: 84000, category: 'housing' as const }, // ~$420k median
    { id: 'house_median_national', label: 'Median home price (US)', usd: 420000, category: 'housing' as const },
    { id: 'apartment_prime_city_2br', label: 'Prime-city apartment (2BR, NYC/SF)', usd: 1500000, category: 'housing' as const }
  ],

  JP: [
    // Housing & baskets
    { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 800, category: 'housing' as const },
    { id: 'living_barebones_month', label: 'Barebones living basket (1 month)', usd: 1000, category: 'housing' as const },
    { id: 'living_comfortable_month', label: 'Comfortable living basket (1 month)', usd: 1800, category: 'housing' as const },

    // Food (local flavour)
    { id: 'groceries_month', label: 'Groceries (1 month)', usd: 200, category: 'food' as const },
    { id: 'coffee', label: 'Coffee', usd: 3, category: 'food' as const },
    { id: 'ramen_bowl', label: 'Ramen bowl', usd: 9, category: 'food' as const },
    { id: 'conbini_bento', label: 'Convenience-store bento', usd: 5, category: 'food' as const },
    { id: 'sushi_omakase_mid', label: 'Sushi omakase (mid-range, per person)', usd: 60, category: 'food' as const },

    // Travel (Japan-specific)
    { id: 'commuter_pass_month', label: 'Commuter pass (1 month)', usd: 75, category: 'travel' as const },
    { id: 'metro_daypass', label: 'Metro/Train day pass (24h)', usd: 7, category: 'travel' as const },
    { id: 'shinkansen_rt', label: 'Shinkansen Tokyo–Osaka (RT)', usd: 220, category: 'travel' as const },
    { id: 'jrpass_7d', label: 'JR Pass (7 days)', usd: 330, category: 'travel' as const },
    { id: 'gas_tank_50l', label: 'Gasoline (full tank ~50 L)', usd: 70, category: 'travel' as const },

    // Tech / work
    { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech' as const },
    { id: 'hardware_wallet', label: 'Hardware wallet', usd: 79, category: 'tech' as const },

    // Utilities & lifestyle
    { id: 'electricity_month', label: 'Electricity (1 month)', usd: 60, category: 'utilities' as const },
    { id: 'fiber_internet_month', label: 'Fiber internet (1 month)', usd: 35, category: 'utilities' as const },
    { id: 'mobile_plan_month', label: 'Mobile plan (1 month)', usd: 20, category: 'utilities' as const },
    { id: 'onsen_day', label: 'Onsen day pass', usd: 8, category: 'leisure' as const },
    { id: 'gym_year', label: 'Gym (1 year)', usd: 300, category: 'leisure' as const },

    // ——— Big-ticket (Japan)
    { id: 'car_used_compact_5y', label: 'Used car (5-yr compact sedan)', usd: 8000, category: 'travel' as const },
    { id: 'car_new_mid_sedan', label: 'New car (mid-tier sedan)', usd: 25000, category: 'travel' as const },
    { id: 'car_tesla_model3_lr', label: 'Tesla Model 3 Long Range (new)', usd: 47000, category: 'travel' as const },
    { id: 'car_land_cruiser_new', label: 'Toyota Land Cruiser (new)', usd: 65000, category: 'travel' as const },
    { id: 'car_porsche_911_gt3rs', label: 'Porsche 911 GT3 RS (new, base)', usd: 300000, category: 'travel' as const }, // higher with JP taxes
    { id: 'supercar_maintenance_year', label: 'Supercar maintenance (1 year)', usd: 11000, category: 'travel' as const },

    { id: 'house_down_payment_20', label: '20% down payment (median home)', usd: 60000, category: 'housing' as const }, // ~$300k national median
    { id: 'house_median_national', label: 'Median home price (Japan, national)', usd: 300000, category: 'housing' as const },
    { id: 'apartment_prime_city_2br', label: 'Prime-city apartment (2BR, central Tokyo)', usd: 1200000, category: 'housing' as const }
  ]
};

export default function CostsEditorModal({ isOpen, costs, onClose, onSave }: CostsEditorModalProps) {
  const [editingCosts, setEditingCosts] = useState<CostItem[]>(costs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'label' | 'usd' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [lastEdited, setLastEdited] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof REGION_PRESETS | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize editing costs when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditingCosts(costs);
      setLastEdited(new Date());
    }
  }, [isOpen, costs]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (!isOpen) return null;

  const handleCostChange = (id: string, field: 'label' | 'usd', value: string | number) => {
    setEditingCosts(prev => 
      prev.map(cost => 
        cost.id === id 
          ? { ...cost, [field]: field === 'usd' ? Number(value) : value }
          : cost
      )
    );
    setLastEdited(new Date());
  };

  const startInlineEdit = (id: string, field: 'label' | 'usd', currentValue: string | number) => {
    setEditingId(id);
    setEditingField(field);
    setEditingValue(String(currentValue));
  };

  const commitInlineEdit = () => {
    if (editingId && editingField) {
      const value = editingField === 'usd' ? Number(editingValue) : editingValue;
      handleCostChange(editingId, editingField, value);
      setEditingId(null);
      setEditingField(null);
      setEditingValue('');
    }
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const handlePresetApply = (region: keyof typeof REGION_PRESETS) => {
    const presetCosts = REGION_PRESETS[region].map(cost => ({
      ...cost,
      editable: true
    }));
    setEditingCosts(presetCosts);
    setSelectedRegion(region);
    setLastEdited(new Date());
  };

  const handleResetToDefaults = () => {
    setEditingCosts(costs);
    setSelectedRegion(null);
    setLastEdited(new Date());
  };


  const handleSave = () => {
    onSave(editingCosts);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="glass p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-ink">{jp.editCosts}</h3>
            {lastEdited && (
              <p className="text-xs text-muted">
                Last edited: {lastEdited.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink focus-ring"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Region Presets */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-ink mb-3">Region Presets</h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(REGION_PRESETS).map(region => (
              <button
                key={region}
                onClick={() => handlePresetApply(region as keyof typeof REGION_PRESETS)}
                className={`chip ${
                  selectedRegion === region ? 'chip--on' : ''
                } focus-ring`}
                role="button"
                aria-pressed={selectedRegion === region}
              >
                {region}
              </button>
            ))}
            <button
              onClick={handleResetToDefaults}
              className="chip focus-ring"
            >
              Reset to defaults
            </button>
          </div>
        </div>


        {/* Editable Table */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-ink mb-3">Cost Items</h4>
          <div className="space-y-2">
            {editingCosts.map(cost => (
              <div key={cost.id} className="flex items-center space-x-4 p-2 rounded border border-border hover:bg-surface-2">
                {/* Label */}
                <div className="flex-1">
                  {editingId === cost.id && editingField === 'label' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={commitInlineEdit}
                      className="w-full px-2 py-1 border border-aizome rounded bg-surface text-ink focus:outline-none"
                    />
                  ) : (
                    <div
                      onClick={() => startInlineEdit(cost.id, 'label', cost.label)}
                      className="px-2 py-1 cursor-pointer hover:bg-surface rounded tabular-nums"
                    >
                      {cost.label}
                    </div>
                  )}
                </div>
                
                {/* USD Amount */}
                <div className="flex items-center space-x-1">
                  <span className="text-muted">$</span>
                  {editingId === cost.id && editingField === 'usd' ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={commitInlineEdit}
                      className="w-20 px-2 py-1 border border-aizome rounded bg-surface text-ink focus:outline-none tabular-nums"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div
                      onClick={() => startInlineEdit(cost.id, 'usd', cost.usd)}
                      className="w-20 px-2 py-1 cursor-pointer hover:bg-surface rounded text-right tabular-nums"
                    >
                      {cost.usd}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="btn--quiet focus-ring"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn focus-ring"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
