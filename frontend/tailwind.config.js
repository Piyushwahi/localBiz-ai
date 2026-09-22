/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#faf8f5',
          100: '#f4efe6',
          200: '#eae2d3',
          300: '#dfd2bd',
          400: '#cbb79a',
        },
        navy: {
          950: '#060e1a',
          900: '#0a192f',
          800: '#0f2744',
          700: '#1a365d',
          600: '#23487a',
          500: '#335c96',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        champagne: {
          light: '#f7f1e7',
          DEFAULT: '#c5a880',
          dark: '#96703b',
        },
        dark: {
          950: '#060e1a',
          900: '#0a192f',
          800: '#0f2744',
          700: '#1a365d',
          600: '#23487a',
          500: '#335c96',
          400: '#64748b',
        },
        surface: {
          DEFAULT: '#ffffff',
          cream: '#f4efe6',
          card: '#ffffff',
          card2: '#fbf9f5',
          border: 'rgba(15, 39, 68, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        glow: { '0%,100%': { boxShadow: '0 0 10px rgba(37,99,235,0.2)' }, '50%': { boxShadow: '0 0 25px rgba(37,99,235,0.45)' } },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(15 39 68 / 0.03)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },
    },
  },
  plugins: [],
}
