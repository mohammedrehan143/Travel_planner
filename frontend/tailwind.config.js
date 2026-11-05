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
        ring: "#1E60FF",
        background: "#F8FAFC",
        foreground: "#171717",
        surface: {
          primary: "#FFFFFF",
          secondary: "#F3F4F6",
          card: "#FFFFFF",
          dark: "#0B2545",
          border: "#E5E7EB",
        },
        primary: {
          DEFAULT: "#1E60FF",
          hover: "#0052FF",
          foreground: "#FFFFFF",
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#c7dcfe',
          300: '#9ec5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E60FF',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          dark: '#0B2545',
          light: '#EBF2FF',
        },
        brand: {
          DEFAULT: "#1E60FF",
          hover: "#0052FF",
          light: "#EBF2FF",
          dark: "#0B2545",
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
          DEFAULT: "#1E60FF",
          hover: "#0052FF",
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
