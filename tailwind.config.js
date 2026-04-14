/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-tint": "#5f5e5e",
        "background": "#fdf9f4",
        "primary": "#000000",
        "secondary": "#735a39",
        "on-surface": "#1c1c19",
        "surface-container": "#f1ede8",
        "surface-container-low": "#f7f3ee",
        "surface-container-highest": "#e6e2dd",
      },
      fontFamily: {
        "headline": ["Newsreader", "serif"],
        "body": ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}