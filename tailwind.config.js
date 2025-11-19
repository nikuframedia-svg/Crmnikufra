/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        dark: {
          DEFAULT: '#0f1410',
          50: '#f8faf9',
          100: '#e8ede9',
          200: '#d1dbd3',
          300: '#b0c0b3',
          400: '#8a9e8d',
          500: '#6b7f6e',
          600: '#546558',
          700: '#455247',
          800: '#3a453c',
          850: '#242b26',
          900: '#1a1f1c',
          950: '#0f1410',
        },
      },
    },
  },
  plugins: [],
};
