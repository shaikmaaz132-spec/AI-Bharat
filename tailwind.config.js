/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        devanagari: ['"Noto Sans Devanagari"', 'Hind', 'Mukta', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', '"Tenali Ramakrishna"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'Catamaran', 'sans-serif'],
        bengali: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'sans-serif'],
        marathi: ['"Noto Sans Devanagari"', 'Mukta', 'sans-serif'],
        gujarati: ['"Noto Sans Gujarati"', 'sans-serif'],
        kannada: ['"Noto Sans Kannada"', 'sans-serif'],
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
        odia: ['"Noto Sans Oriya"', 'sans-serif'],
        punjabi: ['"Noto Sans Gurmukhi"', 'sans-serif'],
        assamese: ['"Noto Sans Bengali"', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', '"Noto Sans Arabic"', 'sans-serif'],
        indic: [
          '"Noto Sans"',
          '"Noto Sans Devanagari"',
          '"Noto Sans Telugu"',
          '"Noto Sans Tamil"',
          '"Noto Sans Bengali"',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        // Vernacular responsive scaling (1.1x - 1.25x with relaxed line heights for upper/lower vowel matras)
        'indic-xs': ['0.85rem', { lineHeight: '1.45rem', letterSpacing: '0.01em' }],
        'indic-sm': ['0.95rem', { lineHeight: '1.6rem', letterSpacing: '0.01em' }],
        'indic-base': ['1.075rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        'indic-lg': ['1.225rem', { lineHeight: '1.9rem', letterSpacing: '0.01em' }],
        'indic-xl': ['1.4rem', { lineHeight: '2.1rem', letterSpacing: '0.01em' }],
        'indic-2xl': ['1.7rem', { lineHeight: '2.4rem', letterSpacing: '0.01em' }],
        'indic-3xl': ['2.15rem', { lineHeight: '2.85rem', letterSpacing: '0.01em' }],
        'indic-4xl': ['2.65rem', { lineHeight: '3.4rem', letterSpacing: '0.01em' }],
      },
      colors: {
        bharat: {
          saffron: '#FF671F',
          white: '#FFFFFF',
          green: '#046A38',
          navy: '#06038D',
          gold: '#FF9933',
          warmgray: '#F8F9FA',
          surface: '#FDFBF7',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { transform: 'scale(1.08)', boxShadow: '0 0 0 20px rgba(239, 68, 68, 0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '32px' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.8s infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'sound-wave': 'wave 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
