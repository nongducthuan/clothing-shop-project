/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html', 
    './src/**/*.{js,jsx,ts,tsx}', 
  ],
  theme: {
    extend: {
      keyframes: {
        fadeColor: {
          '0%': { filter: 'brightness(0.8)' },
          '100%': { filter: 'brightness(1.2)' },
        },
        slideLine: {
          '0%': { transform: 'scaleX(0.5)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'right' },
        },
      },
      animation: {
        fadeColor: 'fadeColor 3s ease infinite alternate',
        slideLine: 'slideLine 2s ease infinite alternate',
      },
      colors: {
        primary: '#111',
        secondary: '#e60012',
        price: '#e60012',
        bg: '#f5f5f5',
        text: '#111',
        muted: '#666',
        border: '#ddd',
      },
      fontFamily: {
        main: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px',
      },
      boxShadow: {
        custom: '0 2px 10px rgba(0, 0, 0, 0.1)',
      },
      transitionProperty: {
        custom: 'all',
      },
    },
  },
  plugins: [],
};
