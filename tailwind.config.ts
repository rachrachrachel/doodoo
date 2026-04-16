import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          yellow: '#F2E840',
          lila: '#D4B8F0',
          rose: '#F0B8D0',
        },
        cream: '#F5F3EE',
        surface: '#FFFFFF',
        ink: '#111111',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
      },
      transitionDuration: {
        hover: '100ms',
        card: '200ms',
      },
    },
  },
  plugins: [],
} satisfies Config
