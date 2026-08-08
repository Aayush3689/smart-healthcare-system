/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          500: '#1976D2',
          700: '#0D47A1',
          900: '#0A3475',
        },
        surface: {
          bg: '#F7FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        text: {
          main: '#1E293B',
          muted: '#64748B',
        },
        status: {
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}