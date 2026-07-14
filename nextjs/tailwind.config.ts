import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        grade: {
          a: '#22c55e',
          b: '#84cc16',
          c: '#eab308',
          d: '#f97316',
          f: '#ef4444',
          i: '#64748b',
        },
      },
    },
  },
  plugins: [],
};
export default config;
