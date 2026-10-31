/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EE',
        surface: '#FFFFFF',
        line: '#E8E2D4',
        ink: {
          DEFAULT: '#14231C',
          muted: '#667266',
        },
        forest: {
          900: '#0F2D22',
          700: '#1B4D3B',
          100: '#E1F0E8',
        },
        brand: {
          500: '#F2683C',
          600: '#D9532A',
          100: '#FFE8DE',
        },
        mint: {
          500: '#2DBE7A',
          100: '#E5F9F0',
        },
        amber: {
          500: '#F2A93B',
          100: '#FEF4E6',
        },
        rose: {
          500: '#E5484D',
          100: '#FDE8E8',
        },
        stone: {
          500: '#9A9A8E',
          100: '#F2F0EB',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-xs': '0 1px 3px rgba(20, 35, 28, 0.04)',
        'warm-sm': '0 4px 12px rgba(20, 35, 28, 0.06)',
        'warm-md': '0 8px 24px rgba(20, 35, 28, 0.08)',
        'warm-lg': '0 16px 36px rgba(20, 35, 28, 0.10)',
        'warm-xl': '0 24px 50px rgba(20, 35, 28, 0.14)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
