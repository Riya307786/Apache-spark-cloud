/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#FFF8FA',
        },
        card: '#FFFFFF',
        text: {
          primary: '#29252B',
          secondary: '#77717A',
        },
        brand: {
          DEFAULT: '#C84B65',     // Primary red-pink accent
          light: '#E8A1B1',       // Soft pink
          surface: '#FBEAF0',     // Pale pink surface
          paleRed: '#FCE8E8',     // Pale red surface
        },
        border: {
          DEFAULT: '#F0E4E8',
        },
        status: {
          success: '#47866C',
          warning: '#C58B38',
          error: '#C74650',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
