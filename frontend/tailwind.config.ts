import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07030f',
        deep: '#0d0717',
        panel: '#100b18',
        panelSoft: '#1a1422',
        line: 'rgba(159, 112, 255, 0.18)',
        textMain: '#f4efff',
        textMuted: '#bcb0cc',
        vita: '#8b5cf6',
        aqua: '#c7a7ff',
        amber: '#ffb86b',
        coral: '#ff7b8f',
        violet: '#b794ff'
      },
      boxShadow: {
        soft: '0 18px 70px rgba(0, 0, 0, 0.55)'
      }
    }
  },
  plugins: []
} satisfies Config;
