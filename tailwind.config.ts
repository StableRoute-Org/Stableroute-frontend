import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Extend with any custom font families if needed
      },
      colors: {
        // Semantic color system based on documented design tokens
        // Maps to CSS variables in src/app/globals.css where applicable
        // Allows components to use semantic names instead of hard-coded palette shades
        
        // Neutral/muted: for secondary text, borders, and backgrounds
        neutral: {
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          500: "#6b7280",
          700: "#374151",
          800: "#1f2937",
        },
        
        // Surface: for card backgrounds and surfaces
        surface: {
          light: "#ffffff",        // Corresponds to --card in light mode
          dark: "#171717",          // Corresponds to --card in dark mode
        },
        
        // Success/positive indicator (emerald-based, corresponds to accent in design tokens)
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          300: "#86efac",
          400: "#4ade80",
          600: "#16a34a",
          800: "#166534",
          950: "#052e16",
        },
        
        // Danger/destructive indicator (rose-based)
        danger: {
          50: "#fff7ed",
          100: "#fee2e2",
          300: "#fca5a5",
          400: "#f87171",
          600: "#dc2626",
          800: "#991b1b",
          950: "#7f1d1d",
        },
        
        // Warning/caution indicator (amber-based)
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          300: "#fcd34d",
          400: "#fbbf24",
          600: "#d97706",
          800: "#92400e",
          950: "#54210e",
        },
        
        // Muted: for secondary/tertiary text
        muted: {
          300: "#d4d4d8",
          500: "#6b7280",
          700: "#374151",
        },
        
        // Accent: alias to success for positive/primary actions
        accent: {
          50: "#f0fdf4",
          100: "#dcfce7",
          300: "#86efac",
          400: "#4ade80",
          600: "#16a34a",
          800: "#166534",
          950: "#052e16",
        },
      },
    },
  },
  plugins: [],
};

export default config;
