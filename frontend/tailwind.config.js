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
        ring: "#F97316",
        background: "#FFFFFF",
        foreground: "#171717",
        surface: {
          primary: "#FFFFFF",
          secondary: "#F3F4F6",
          card: "#FFFFFF",
          dark: "#171717",
          border: "#E5E7EB",
        },
        primary: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          foreground: "#FFFFFF",
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F97316',
          600: '#EA580C',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        brand: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
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
