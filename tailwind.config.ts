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
        gold: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#F5E9B0",
          300: "#EDD882",
          400: "#D4AF37",
          500: "#B8960C",
          600: "#92740A",
          700: "#6B5407",
        },
        cream: {
          50:  "#FDFAF0",
          100: "#FDF8EC",
          200: "#FAF6EE",
          300: "#F3EDD8",
          400: "#E8DFB8",
        },
        charcoal: {
          50:  "#F5F3F2",
          100: "#E0DBD8",
          200: "#B8AFA9",
          500: "#6B5F57",
          700: "#3A302A",
          900: "#1A1612",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans:  ["Lato", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                           to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
