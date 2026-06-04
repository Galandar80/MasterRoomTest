import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ember: {
          50: "#fff7ed",
          200: "#fed7aa",
          400: "#fb923c",
          500: "#f97316",
          700: "#c2410c"
        },
        ink: {
          900: "#07080d",
          800: "#0d1018",
          700: "#151927",
          600: "#1f2635"
        },
        brass: "#c8a35d",
        blood: "#7f1d1d"
      },
      boxShadow: {
        glow: "0 0 50px rgba(200, 163, 93, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
