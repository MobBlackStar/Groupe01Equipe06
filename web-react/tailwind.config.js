/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          dark: '#0D0F12',
          card: '#16191E',
          border: '#262A33',
          lime: '#CCFF00',
          orange: '#FF5500',
          red: '#FF1744',
          muted: '#8A92A6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
