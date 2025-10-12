/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
        },
      },
      colors: {
        brand: {
          50: '#fff1f7',
          100: '#ffe4ef',
          200: '#ffc9df',
          300: '#ff9ec5',
          400: '#ff77af',
          500: '#ff589d',
          600: '#e43f87',
          700: '#c22f71',
          800: '#9a275d',
          900: '#7c224d'
        },
        mint: {
          50: '#eefcf7',
          100: '#d8f7ee',
          200: '#b2f0dc',
          300: '#80e5c7',
          400: '#4fd7b0',
          500: '#2cc39b',
          600: '#1ea684',
          700: '#19866b',
          800: '#176b57',
          900: '#145847'
        },
        banana: {
          50: '#fffce8',
          100: '#fff8c1',
          200: '#fff28d',
          300: '#ffe755',
          400: '#ffd82b',
          500: '#ffc400',
          600: '#e2a700',
          700: '#b98000',
          800: '#8f5f00',
          900: '#734c00'
        },
        sky: {
          50: '#eef7ff',
          100: '#d7ecff',
          200: '#b8ddff',
          300: '#89c8ff',
          400: '#56afff',
          500: '#2b93ff',
          600: '#1874e7',
          700: '#155dc0',
          800: '#144c9a',
          900: '#133f7d'
        }
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Baloo 2', 'cursive'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideInLeft: {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        slideInRight: {
          '0%': { 
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        fadeInUp: {
          '0%': { 
            transform: 'translateY(30px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scroll-smooth': {
          'scroll-behavior': 'smooth'
        },
        '.scroll-snap-x': {
          'scroll-snap-type': 'x mandatory'
        },
        '.scroll-snap-start': {
          'scroll-snap-align': 'start'
        }
      })
    }
  ],
}

