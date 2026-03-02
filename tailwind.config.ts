import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "Apple Color Emoji", "Segoe UI Emoji"],
      },
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceff3",
          200: "#d7dde6",
          300: "#b6c1d1",
          400: "#8697b1",
          500: "#607696",
          600: "#4a5d7a",
          700: "#3c4b63",
          800: "#343f52",
          900: "#2f3746"
        },
        maple: {
          50: "#fff6f2",
          100: "#ffe8dd",
          200: "#ffd0ba",
          300: "#ffad86",
          400: "#ff7a45",
          500: "#ff5b1f",
          600: "#f0420a",
          700: "#c83207",
          800: "#a0280b",
          900: "#7f240c"
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
