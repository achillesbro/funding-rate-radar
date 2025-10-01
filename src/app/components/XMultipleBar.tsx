'use client';

import * as React from 'react';
import { makeLogPositioner } from '../../lib/utils/xMultiple';

type XMultipleBarProps = {
  xUSD: number;         // user input X
  itemUSD: number;      // this row's price
  domainMin: number;    // lo across the 5 items (see parent)
  domainMax: number;    // hi across the 5 items
  className?: string;   // keep existing sizing
  ariaLabel?: string;   // a11y
};

export function XMultipleBar({
  xUSD,
  itemUSD,
  domainMin,
  domainMax,
  className,
  ariaLabel
}: XMultipleBarProps) {
  const multiple = xUSD > 0 ? itemUSD / xUSD : Infinity;
  const pos01 = React.useMemo(
    () => makeLogPositioner(domainMin, domainMax)(multiple),
    [domainMin, domainMax, multiple]
  );

  return (
    <div
      className={className ?? 'w-full h-1 relative'}
      role="img"
      aria-label={ariaLabel ?? `Position ${multiple.toFixed(3)}× of X`}
      title={`≈ ${multiple.toFixed(3)}× of X`}
    >
      {/* track (neutral background) */}
      <div className="absolute inset-0 rounded-full bg-[var(--kori)]/20" />

      {/* dot (amber/yellow) */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: `${pos01 * 100}%` }}
      >
        <div className="w-2 h-2 rounded-full bg-[var(--amber)] shadow-sm" />
      </div>
    </div>
  );
}
