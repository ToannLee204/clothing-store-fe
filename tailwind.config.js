/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "lumiere-cream": "#F8F3EC",
        "lumiere-charcoal": "#1A1A1A",
        "lumiere-gray": "#8C8178",
        "lumiere-terracotta": "#C4714A",
        "lumiere-blush": "#E8D5C8",
        "lumiere-gold": "#B89A6E",
      },
      fontFamily: {
        "sans": ["Jost", "sans-serif"],
        "serif": ["Cormorant Garamond", "serif"],
        "display": ["Cormorant Garamond", "serif"],
      },
      letterSpacing: {
        "ultra-widest": "0.3em",
        "premium": "0.2em",
      }
    },
  },
  plugins: [],
}