import { CostItem } from '../../types';

export type SmartFilterOptions = {
  // apply your existing UI filters here, e.g. category/monthly/etc.
  predicate?: (c: CostItem) => boolean;
};

export function selectSmartContextItems(
  costs: CostItem[],
  x: number,
  opt: SmartFilterOptions = {}
): CostItem[] {
  // 1) base filtering & sanitation
  let items = costs.filter(c => Number.isFinite(c.usd) && c.usd > 0);
  if (opt.predicate) items = items.filter(opt.predicate);
  if (items.length === 0) return [];

  // sort asc once for deterministic operations
  items.sort((a, b) => (a.usd - b.usd) || a.label.localeCompare(b.label));

  // Handle negative values (losses) by using absolute value for calculations
  const absX = Math.abs(x);
  const isNegative = x < 0;

  // 2) override: X beyond everything => top 5 expensive
  if (absX >= items[items.length - 1].usd) {
    return items.slice(-5).reverse(); // 5 most expensive, desc
  }

  const picked: CostItem[] = [];
  const used = new Set<string>();
  const take = (c?: CostItem) => {
    if (c && !used.has(c.id)) {
      used.add(c.id);
      picked.push(c);
    }
  };

  const cheapest = items[0];
  take(cheapest);

  const pool = () => items.filter(c => !used.has(c.id));

  const pickClosestInRange = (min: number, max: number, target: number) => {
    const candidates = pool().filter(c => c.usd >= min && c.usd <= max);
    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => {
      const da = Math.abs(a.usd - target);
      const db = Math.abs(b.usd - target);
      return (da - db) || (a.usd - b.usd) || a.label.localeCompare(b.label);
    });
    return candidates[0];
  };

  const pickMinAbove = (min: number) => {
    const candidates = pool().filter(c => c.usd >= min);
    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => (a.usd - b.usd) || a.label.localeCompare(b.label));
    return candidates[0];
  };

  const pickMaxAbove = (min: number) => {
    const candidates = pool().filter(c => c.usd >= min);
    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => (b.usd - a.usd) || a.label.localeCompare(b.label));
    return candidates[0];
  };

  // 3) slots according to the spec (using absolute value for calculations)
  // #2 in [0.1x, 0.5x], target 0.3x
  take(pickClosestInRange(0.1 * absX, 0.5 * absX, 0.3 * absX));

  // #3 in [0.5x, 1.5x], target x
  take(pickClosestInRange(0.5 * absX, 1.5 * absX, absX));

  // #4 >= 0.5x, take smallest above threshold
  let s4 = pickMinAbove(0.5 * absX);
  if (!s4) {
    // fallback: largest remaining (keeps the list growing)
    const r = pool();
    s4 = r[r.length - 1];
  }
  take(s4);

  // #5 >= 0.1x, take largest above threshold, but cap at reasonable multiple of X
  const maxReasonable = Math.max(absX * 10, 10000); // Cap at 10x input or $10k, whichever is higher
  let s5 = pickMaxAbove(0.1 * absX);
  if (s5 && s5.usd > maxReasonable) {
    // If the largest is too expensive, pick the largest under the cap
    const candidates = pool().filter(c => c.usd >= 0.1 * absX && c.usd <= maxReasonable);
    if (candidates.length > 0) {
      candidates.sort((a, b) => (b.usd - a.usd) || a.label.localeCompare(b.label));
      s5 = candidates[0];
    }
  }
  if (!s5) {
    // fallback: closest to 2x the input amount
    const target = absX * 2;
    const candidates = pool();
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const da = Math.abs(a.usd - target);
        const db = Math.abs(b.usd - target);
        return (da - db) || (a.usd - b.usd) || a.label.localeCompare(b.label);
      });
      s5 = candidates[0];
    }
  }
  take(s5);

  // 4) fill if any slot missed (range gaps)
  if (picked.length < 5) {
    const remaining = pool();
    remaining.sort(
      (a, b) => (Math.abs(a.usd - absX) - Math.abs(b.usd - absX)) || (a.usd - b.usd) || a.label.localeCompare(b.label)
    );
    for (const c of remaining) {
      take(c);
      if (picked.length === 5) break;
    }
  }

  // 5) final order: cheapest first, then by amount asc (keeps UX consistent)
  return picked.sort((a, b) => (a.usd - b.usd) || a.label.localeCompare(b.label));
}
