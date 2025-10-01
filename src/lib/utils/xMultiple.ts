export function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

export function makeLogPositioner(lo: number, hi: number) {
  const loC = Math.max(lo, 1e-6);
  const hiC = Math.max(hi, loC * 1.000001);
  const logLo = Math.log10(loC);
  const logHi = Math.log10(hiC);
  const span = Math.max(logHi - logLo, 1e-9);

  return (multiple: number) => {
    const m = clamp(multiple, loC, hiC);
    return (Math.log10(m) - logLo) / span; // 0..1
  };
}
