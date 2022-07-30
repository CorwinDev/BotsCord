/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./website/**/*.{html,js,css}",
    "./website/views/*.ejs",
    "./website/views/**/*.ejs",
  ],
  theme: {
    extend: {
      colors: {
        "primary-color": "#1E2023;",
        "secondary-color": "#F5F5F5",
        "blue-color": "#18191C",
        "footer": "#27282D"
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