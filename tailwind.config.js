/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'saffron': '#f97316',
        'saffron-light': '#fb923c',
        'charcoal': '#1e293b',
        'charcoal-light': '#334155',
      },
      fontFamily: {
        sans: ['Mukta', 'sans-serif'],
        display: ['Kalam', 'cursive'],
      }
    },
  },
  plugins: [],
}
