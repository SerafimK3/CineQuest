/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        text: {
          primary: '#FFFFFF',
          secondary: '#B3B3B3',
        },
        accent: {
          DEFAULT: '#00E5FF', // Electric Cyan
          hover: '#00B8D4',
        }
      }
    },
  },
  plugins: [],
}
