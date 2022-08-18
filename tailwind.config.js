module.exports = {
  content: [
    "./website/**/*.{html,css}",
    "./website/views/*.ejs",
    "./website/views/**/*.ejs",
    "./website/views/**/**/*.ejs",
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

      typography: theme => ({
        DEFAULT: {
          css: {
            color: '#FFF',
            "code::before": {
              "content": "unset",
            },
            "code::after": {
              "content": "unset",
            },
            "code": {
              "background-color": "#747174",
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    {
      tailwindcss: {},
      autoprefixer: {},
    },
  ],
};