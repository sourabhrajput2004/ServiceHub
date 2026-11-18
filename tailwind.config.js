/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['1.25rem', { lineHeight: '1.65' }],
        sm: ['1.25rem', { lineHeight: '1.7' }],
        base: ['1.25rem', { lineHeight: '1.75' }],
        lg: ['1.375rem', { lineHeight: '1.6' }],
        xl: ['1.5rem', { lineHeight: '1.4' }],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}

