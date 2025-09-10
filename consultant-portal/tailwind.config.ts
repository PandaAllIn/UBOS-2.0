import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        eufm: {
          primary: '#0ea5e9',
          dark: '#0b5c7a',
          accent: '#22c55e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

