/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e6fdb',
          dark: '#1557bb',
        },
      },
    },
  },
  plugins: [],
};
