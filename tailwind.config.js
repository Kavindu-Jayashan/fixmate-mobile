/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}" , "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors:{
        primary: '#112b3c',
        secondary: '#205375',
        light:{
          100 : '#efefef' ,
          200 : '#d6d6d6' ,
          300 : '#9CA4AB' ,
        },
        accent:'#f66b0e'
      }
    },
  },
  plugins: [],
}

