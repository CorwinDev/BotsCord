/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./website/**/*.{html,css}",
    "./website/views/*.ejs",
    "./website/views/**/*.ejs",
  ],
  theme: {
    extend: {
      colors: {
        "primary-color": "#1E2023;",
        "secondary-color": "#F5F5F5",
        "blue-color": "#18191C",
        "footer": "#27282D",
        "button-primary": "#5865F2"
      },
      fontFamily: {
        sans: ["QuickSand", "sans-serif"],
        serif: ["Georgia", "serif"],
        mono: ["Menlo", "monospace"]
      },
    }
  },
  plugins: [
    {
      tailwindcss: {},
      autoprefixer: {},
    },
  ],
};