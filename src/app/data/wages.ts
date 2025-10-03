export type WagePreset = {
  region: 'US' | 'EU' | 'JP';
  daily_usd: number;    // typical full-time workday
  monthly_usd: number;  // 12 months
  annual_usd: number;   // 52 weeks (or 12 months)
  meta: { source: string; notes?: string };
};

// Defaults (Oct 2025 build; make editable in your modal or admin config)
export const WAGE_PRESETS: Record<'US' | 'EU' | 'JP', WagePreset> = {
  US: {
    region: 'US',
    // BLS median usual weekly earnings Q2 2025 = $1,196 → daily ≈ 1,196/5, annual ≈ *52
    daily_usd: 239.20,
    monthly_usd: 5182.67,
    annual_usd: 62192.00,
    meta: {
      source: 'BLS: Median usual weekly earnings, Q2 2025',
      notes: 'Median weekly $1,196; monthly = annual/12.'
    }
  },
  EU: {
    region: 'EU',
    // Eurostat net annual earnings for an average single worker, EU-27 (2024) = €29,573
    // Converted here with a conservative default fx_eur_usd = 1.08 (editable).
    daily_usd: 122.84,
    monthly_usd: 2661.57,
    annual_usd: 31938.84,
    meta: {
      source: 'Eurostat: net annual earnings (EU-27, 2024)',
      notes: 'Assumes fx EUR→USD = 1.08; adjust in presets if needed.'
    }
  },
  JP: {
    region: 'JP',
    // Japan Statistical Handbook 2024: avg monthly total cash earnings 329,778 JPY; 17.6 days worked/month.
    // Converted with default fx_jpy_usd = 150 (editable).
    daily_usd: 124.92,         // (329,778 / 17.6) / 150
    monthly_usd: 2198.52,      // 329,778 / 150
    annual_usd: 26382.24,      // monthly * 12
    meta: {
      source: 'Japan Statistical Handbook 2024 (monthly cash earnings & days worked)',
      notes: 'Assumes fx JPY→USD = 150; adjust in presets if needed.'
    }
  }
};

export function wageEquivalents(xUSD: number, wage: WagePreset) {
  // Use absolute value for calculation, preserve sign in result
  const absAmount = Math.abs(xUSD);
  const sign = xUSD >= 0 ? 1 : -1;
  
  return {
    days: sign * (absAmount / wage.daily_usd),
    months: sign * (absAmount / wage.monthly_usd),
    years: sign * (absAmount / wage.annual_usd)
  };
}

// Storage functions for editable wage presets
export function loadWagePresetsFromStorage(): Record<'US' | 'EU' | 'JP', WagePreset> {
  if (typeof window === 'undefined') return WAGE_PRESETS;
  
  try {
    const stored = localStorage.getItem('value-context.wage-presets');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load wage presets from localStorage:', error);
  }
  
  return WAGE_PRESETS;
}

export function saveWagePresetsToStorage(presets: Record<'US' | 'EU' | 'JP', WagePreset>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('value-context.wage-presets', JSON.stringify(presets));
  } catch (error) {
    console.warn('Failed to save wage presets to localStorage:', error);
  }
}

// Function to recalculate EU/JP wages based on FX rates
export function recalculateWagePresetsWithFX(
  presets: Record<'US' | 'EU' | 'JP', WagePreset>,
  fx_eur_usd: number = 1.08,
  fx_jpy_usd: number = 150
): Record<'US' | 'EU' | 'JP', WagePreset> {
  return {
    ...presets,
    EU: {
      ...presets.EU,
      daily_usd: 113.68 / fx_eur_usd, // Base EUR daily wage
      monthly_usd: 2462.75 / fx_eur_usd, // Base EUR monthly wage
      annual_usd: 29573 / fx_eur_usd, // Base EUR annual wage
      meta: {
        ...presets.EU.meta,
        notes: `Assumes fx EUR→USD = ${fx_eur_usd}; adjust in presets if needed.`
      }
    },
    JP: {
      ...presets.JP,
      daily_usd: (329778 / 17.6) / fx_jpy_usd, // Base JPY daily wage
      monthly_usd: 329778 / fx_jpy_usd, // Base JPY monthly wage
      annual_usd: (329778 * 12) / fx_jpy_usd, // Base JPY annual wage
      meta: {
        ...presets.JP.meta,
        notes: `Assumes fx JPY→USD = ${fx_jpy_usd}; adjust in presets if needed.`
      }
    }
  };
}
