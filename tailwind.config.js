/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          bg: '#FAF7F2',
          surface: '#F3EFEA',
          card: '#FFFFFF',
          border: '#E7E5E4',
          subtle: '#EAE5DF',
        },
        matcha: {
          50: '#F2F7F4',
          100: '#E1EDE6',
          200: '#C2DBCF',
          300: '#94BEAA',
          400: '#5F9980',
          500: '#3D6554',
          deep: '#2D4A3E', // Primary Accent
          dark: '#22382F',
          darkest: '#16241E',
        },
        amber: {
          warm: '#D97706', // Secondary Accent
          light: '#FDE68A',
          subtle: '#FEF3C7',
        },
        stone: {
          dark: '#292524', // Neutral text
          warm: '#78716C', // Muted text
          muted: '#A8A29E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(45, 74, 62, 0.05), 0 4px 16px -4px rgba(41, 37, 36, 0.04)',
        'lifted': '0 8px 24px -6px rgba(45, 74, 62, 0.12), 0 4px 8px -2px rgba(41, 37, 36, 0.05)',
        'tactile': '0 3px 0 0 rgba(45, 74, 62, 0.2)',
        'tactile-amber': '0 3px 0 0 rgba(217, 119, 6, 0.3)',
      }
    },
  },
  plugins: [],
}
