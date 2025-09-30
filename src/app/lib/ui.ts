export const aprClass = (apr?: number) => {
  if (apr == null) return "text-muted";
  const a = Math.abs(apr);
  if (a < 2) return "text-muted";
  return apr >= 0 ? "text-[var(--amber)]" : "text-[var(--akane)]";
};

export const fmtAPR = (v?: number) => v == null ? "—" : `${v.toFixed(Math.abs(v) >= 10 ? 1 : 2)}%`;

export const fmtRate = (v?: number) => v == null ? "—" : (Math.abs(v) < 0.001 ? v.toExponential(2) : v.toFixed(6));

export const tabular = "font-variant-numeric:tabular-nums";
