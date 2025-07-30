/** @type {import('tailwindcss').Config} */
module.exports = {
  // —→ force le thème sombre dès que la classe « dark » est présente sur <html> ou <body>
  darkMode: 'class',

  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      /* === tes animations existantes, intactes === */
      keyframes: {
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
    },
  },

  plugins: [],
};
