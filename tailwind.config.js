/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./panel.html"
  ],
  theme: {
    extend: {
      colors: {
        'devtools': {
          bg: '#1e1e1e',
          panel: '#2d2d2d',
          border: '#3e3e3e',
          text: '#cccccc',
          accent: '#007acc',
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336'
        }
      }
    },
  },
  plugins: [],
}
