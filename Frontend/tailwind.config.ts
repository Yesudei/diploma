import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#111118',
        surface2: '#18181F',
        gold: '#C9A84C',
        'gold-light': '#E8C96D',
        'gold-dim': 'rgba(201,168,76,0.13)',
        cream: '#F5F0E8',
        muted: '#7A7570',
        'muted-dark': '#4A4540',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderColor: {
        gold: {
          DEFAULT: 'rgba(201,168,76,0.20)',
          strong: 'rgba(201,168,76,0.40)',
          faint: 'rgba(201,168,76,0.10)',
        },
      },
    },
  },
};
export default config;
