/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Matches karkaii-frontend's dashboard chart palette (CHART_COLORS.primary).
        brand: {
          DEFAULT: '#3D5EE1',
          dark: '#2F49B3',
        },
      },
    },
  },
  plugins: [],
};
