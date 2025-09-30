// APR color utility for dark theme
export const aprClass = (apr: number | undefined): string => {
  if (apr == null) return "text-muted";
  const a = Math.abs(apr);
  if (a < 0.02) return "text-muted"; // Less than 2% APR
  return apr >= 0 ? "text-amber" : "text-akane";
};

// Format APR with appropriate color class
export const formatAPRWithClass = (apr: number | undefined): { text: string; className: string } => {
  const className = aprClass(apr);
  const text = apr != null ? `${apr >= 0 ? '+' : ''}${(apr * 100).toFixed(2)}%` : '—';
  return { text, className };
};
