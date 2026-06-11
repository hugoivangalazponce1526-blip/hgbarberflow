import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1A1A1A",
        surface: {
          dark: "#242424",
          light: "#2E2E2E",
        },
        gold: {
          DEFAULT: "#C9A84C",
          hover: "#B8973B",
          light: "#DFCA87",
        },
        success: "#22C55E",
        danger: "#EF4444",
        text: {
          primary: "#F5F5F5",
          secondary: "#A3A3A3",
        }
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
