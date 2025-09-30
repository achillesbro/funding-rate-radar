/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        aizome: 'var(--aizome)',
        tetsu: 'var(--tetsu)',
        kori: 'var(--kori)',
        amber: 'var(--amber)',
        matsu: 'var(--matsu)',
        akane: 'var(--akane)',
      },
      borderRadius: {
        'radius': 'var(--radius)',
      },
      boxShadow: {
        'shadow': 'var(--shadow)',
      },
    },
  },
  plugins: [],
}
