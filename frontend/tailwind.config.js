/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#16A34A",
        background: "#F8FAFC",
        foreground: "#171717",
        surface: {
          primary: "#FFFFFF",
          secondary: "#F3F4F6",
          card: "#FFFFFF",
          dark: "#0B3B2C",
          border: "#E5E7EB",
        },
        primary: {
          DEFAULT: "#16A34A",
          hover: "#15803D",
          foreground: "#FFFFFF",
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          dark: '#0B3B2C',
          light: '#EAF5EE',
        },
        brand: {
          DEFAULT: "#16A34A",
          hover: "#15803D",
          light: "#EAF5EE",
          dark: "#0B3B2C",
          foreground: "#FFFFFF",
        },
        mono: {
          DEFAULT: "#171717",
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#E5E7EB',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          dark: '#171717',
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#171717",
        },
        accent: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        error: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
}
