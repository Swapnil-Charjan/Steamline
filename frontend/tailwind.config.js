/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: "#080808", panel: "#141414", brand: "#e50914" },
      boxShadow: { glow: "0 12px 44px rgba(229,9,20,.28)" },
    },
  },
  plugins: [],
};
