/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Outfit"', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
        mono:    ['"Fira Code"', 'monospace'],
      },
      colors: {
        ink:    { DEFAULT: '#0f1117', 50: '#f4f4f6', 100: '#e8e9ee', 200: '#c9cad5', 300: '#9a9cb2', 400: '#6b6e8f', 500: '#484b6e', 600: '#333657', 700: '#252844', 800: '#181a31', 900: '#0f1020' },
        jade:   { DEFAULT: '#16a579', 50: '#edfaf5', 100: '#d0f4e6', 200: '#a3e8cd', 300: '#67d4ad', 400: '#2ebf8c', 500: '#16a579', 600: '#0d8462', 700: '#0b6a4f', 800: '#0b543f', 900: '#0b4534' },
        amber:  { DEFAULT: '#e8850a', 50: '#fef8ec', 100: '#fdefc9', 200: '#fbda8e', 300: '#f8c14a', 400: '#f4a71b', 500: '#e8850a', 600: '#cc6205', 700: '#a94509', 800: '#8a370e', 900: '#722e0f' },
        rose:   { DEFAULT: '#e5385a', 50: '#fff1f3', 100: '#ffe0e5', 200: '#ffc7d0', 300: '#ff9eb0', 400: '#ff6585', 500: '#f83860', 600: '#e5385a', 700: '#c11944', 800: '#a21740', 900: '#8b183b' },
        sky:    { DEFAULT: '#0ea5e9', 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' },
      },
      boxShadow: {
        card:     '0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)',
        hover:    '0 4px 12px rgba(0,0,0,.08), 0 16px 40px rgba(0,0,0,.10)',
        glow:     '0 0 0 3px rgba(22,165,121,.3)',
        'glow-r': '0 0 0 3px rgba(229,56,90,.25)',
      },
      borderRadius: { '4xl': '2rem' },
      animation: {
        'fade-in':  'fadeIn .2s ease both',
        'slide-up': 'slideUp .25s cubic-bezier(.16,1,.3,1) both',
        'scale-in': 'scaleIn .2s cubic-bezier(.34,1.56,.64,1) both',
        'shimmer':  'shimmer 1.5s infinite',
        'pulse-dot':'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(.92)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseDot: { '0%,100%': { opacity: .4, transform: 'scale(.8)' }, '50%': { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}