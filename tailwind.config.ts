import type { Config } from 'tailwindcss';

const config: Config = {
  // The app toggles a `.dark` class on <html> (see src/lib/theme.ts /
  // ThemeToggle.tsx) rather than relying on the OS preference directly, so
  // `dark:` utilities must key off that class. Without this, Tailwind's
  // default "media" strategy makes every dark: utility follow
  // prefers-color-scheme instead of the app's own light/dark/system toggle.
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
