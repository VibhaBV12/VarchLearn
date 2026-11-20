/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7041C6',
          dark: '#39245F',
          lavender: '#F3EEFC',
          border: '#E2D6F8',
        },
      },
    },
  },
  plugins: [],
};
