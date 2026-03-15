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
        primary: {
          50: "#EBF0FF",
          100: "#D6E0FF",
          200: "#ADC1FF",
          300: "#85A3FF",
          400: "#5C84FF",
          500: "#0057FF",
          600: "#0046CC",
          700: "#003499",
          800: "#002366",
          900: "#001133",
        },
        sidebar: "#1E293B",
        amber: {
          500: "#D97706",
          100: "#FEF3C7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
