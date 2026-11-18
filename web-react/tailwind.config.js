/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true, // resolve globs from this file, whatever the cwd
    files: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  },
  theme: {
    extend: {
      colors: {
        // CampusSave × Griddle canonical palette
        cs: {
          cream: '#FAF3E6',   // page canvas
          biscuit: '#EDE6D7', // cards
          sand: '#E2D8C5',    // pressed / dividers on biscuit
          paper: '#FFFDF8',   // receipts, polaroids
          ink: '#111111',
          muted: '#5E5850',   // secondary text (AA on cream)
          red: '#DA0711',
          redDark: '#B0050D',
          mustard: '#FFD000',
          leaf: '#1F7A3A',    // success / eco
          tape: 'rgba(255,236,170,0.78)',
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
        // Griddle type system — see src/styles/README.md
        sans: ['Oswald', 'system-ui', 'sans-serif'],          // body + UI (Griddle uses Oswald everywhere)
        body: ['Oswald', 'system-ui', 'sans-serif'],
        display: ['"League Gothic"', 'Oswald', 'sans-serif'], // monumental headlines (hero, page titles)
        title: ['"Bowlby One SC"', 'Anton', 'sans-serif'],    // chunky section titles ("OUR BESTSELLERS")
        sticker: ['Knewave', 'cursive'],                      // die-cut sticker labels
        marker: ['"Permanent Marker"', 'cursive'],            // polaroid captions, handwritten notes
        mono: ['"Space Mono"', 'monospace'],                  // receipts, tickets, codes
        // legacy aliases kept so older markup keeps rendering sensibly
        anton: ['Oswald', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        bebas: ['"League Gothic"', 'sans-serif'],
        fraunces: ['"League Gothic"', 'sans-serif'],
        caveat: ['"Permanent Marker"', 'cursive'],
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
