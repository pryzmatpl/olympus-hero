/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mystic: {
          900: '#3A1078', // deep purple
          800: '#4E31AA', // celestial blue
          700: '#5C2E7E', // royal purple
          600: '#6C3483', // majestic purple
          500: '#7D3C98', // vibrant purple
          400: '#A569BD', // lavender purple
          300: '#D2B4DE', // soft lavender
          200: '#E8DAEF', // pale lavender
          100: '#F4ECF7', // lightest lavender
          50: '#F9F5FC',  // almost white lavender
        },
        cosmic: {
          500: '#F2F7A1', // starlight yellow
          400: '#F8FAC0', // pale cosmic yellow
          300: '#F9FCDA', // ethereal light
        },
        earth: {
          900: '#1E3A29', // deep earth green
          800: '#2E4A39', // forest green
          700: '#3E5A49', // moss green
          600: '#4B614F', // sage green 
          500: '#5A6B5B', // muted green
          400: '#6E7D6F', // gray green
          300: '#8C9A8D', // pale sage
          200: '#B6C2B7', // very pale sage
          100: '#D8E2D9', // almost white sage
        }
      },
      fontFamily: {
        'sans': ['Montserrat', 'ui-sans-serif', 'system-ui'],
        'display': ['Spectral', 'ui-serif', 'Georgia'],
      },
      backgroundImage: {
        'mystic-gradient': 'linear-gradient(to right, rgba(58, 16, 120, 0.95), rgba(78, 49, 170, 0.95))',
        'cosmic-radial': 'radial-gradient(circle, rgba(242, 247, 161, 0.15) 0%, rgba(58, 16, 120, 0.05) 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'cosmic': '0 0 15px rgba(242, 247, 161, 0.5)',
        'mystic': '0 4px 20px rgba(78, 49, 170, 0.25)',
      }
    },
  },
  plugins: [],
};