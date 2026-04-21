/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Màu Cam chủ đạo của Lumina
        "primary": "#ec5b13", 
        // Màu nền xám nhạt hiện đại (Thay cho màu be cũ)
        "background-light": "#f8f6f6",
        "background-dark": "#221610",
        // Các tông màu bổ trợ cho bảng và card
        "slate-custom": {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
        }
      },
      fontFamily: {
        // Lumina dùng font Sans hiện đại (Public Sans hoặc Inter)
        "display": ["Public Sans", "Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px",
      },
    },
  },
  plugins: [],
}