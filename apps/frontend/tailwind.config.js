/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'byzantium': '#7C3AED',
        'violet-ltci': '#6D28D9',
        'dark-purple': '#374151',
        'platinum': '#F9FAFB',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'custom': '0 8px 25px 0 rgba(100, 100, 100, 0.15)',
        'glass': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'hover-lift': '0 12px 35px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'hover-lift': 'hover-lift 0.3s ease-in-out',
      },
      keyframes: {
        'hover-lift': {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}