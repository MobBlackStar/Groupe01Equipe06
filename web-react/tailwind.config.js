/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Original CampusSave theme
        campus: {
          dark: '#0D0F12',
          card: '#16191E',
          border: '#262A33',
          lime: '#CCFF00',
          orange: '#FF5500',
          red: '#FF1744',
          muted: '#8A92A6',
        },
        // Framer Street Food & Paper Market Palette
        paper: '#F6F1E7',       // Warm cream paper
        carbon: '#0E0D0C',      // Night market carbon
        flame: '#EE3124',       // Street flame red
        mustard: '#F5C400',     // Mustard gold
        matcha: '#2E6F40',      // Matcha emerald
        ink: '#161412',         // Deep espresso ink
        market: {
          paper: '#F6F1E7',
          carbon: '#0E0D0C',
          flame: '#EE3124',
          mustard: '#F5C400',
          matcha: '#2E6F40',
          ink: '#161412',
        },
        framer: {
          paper: '#F6F1E7',
          carbon: '#0E0D0C',
          flame: '#EE3124',
          mustard: '#F5C400',
          matcha: '#2E6F40',
          ink: '#161412',
        },
        // Griddle Total Overhaul Palette
        griddle: {
          canvas: '#F4EFE6',    // Warm Butcher-Paper Cream
          card: '#FAF6EE',      // Warm Ivory
          pure: '#FFFFFF',      // Pure Paper
          ink: '#141210',       // Ink & Borders
          red: '#E51C23',       // Griddle Crimson Red
          crimson: '#E51C23',   // Griddle Crimson Red
          yellow: '#FFD000',    // Mustard Yellow
          mustard: '#FFD000',   // Mustard Yellow
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'serif'],
        fraunces: ['Fraunces', 'serif'],
        oswald: ['Oswald', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // Griddle Fonts
        anton: ['Anton', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif'],
        marker: ['"Permanent Marker"', 'cursive'],
        caveat: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'paper-sm': '0 2px 4px rgba(22, 20, 18, 0.08), 0 1px 2px rgba(22, 20, 18, 0.04)',
        'paper': '0 6px 16px rgba(22, 20, 18, 0.12), 0 2px 4px rgba(22, 20, 18, 0.06)',
        'paper-lg': '0 12px 28px rgba(22, 20, 18, 0.18), 0 4px 8px rgba(22, 20, 18, 0.08)',
        'stamp': '0 0 0 2px currentColor, 0 4px 10px rgba(0, 0, 0, 0.15)',
        // Griddle Retro Hard Shadow
        'griddle': '4px 4px 0px #141210',
        'griddle-sm': '2px 2px 0px #141210',
        'griddle-lg': '6px 6px 0px #141210',
        'griddle-hover': '2px 2px 0px #141210',
        'retro': '4px 4px 0px #141210',
      },
    },
  },
  plugins: [],
};
