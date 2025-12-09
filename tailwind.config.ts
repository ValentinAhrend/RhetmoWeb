import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        emerald: {
          50: '#e6fffd',
          100: '#b8fff7',
          200: '#7ff7ed',
          300: '#45e3db',
          400: '#17cfc7',
          500: '#00c8be',
          600: '#00a89f',
          700: '#008680',
          800: '#006963',
          900: '#004b47',
        },
        ink: '#0f172a',
        charcoal: '#1f2937',
        mist: '#e5e7eb',
        jade: {
          50: '#e6fffd',
          100: '#b8fff7',
          200: '#7ff7ed',
          300: '#45e3db',
          400: '#17cfc7',
          500: '#00c8be',
          600: '#00a89f',
          700: '#008680',
          800: '#006963',
          900: '#004b47',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      boxShadow: {
        soft: '0 14px 45px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
