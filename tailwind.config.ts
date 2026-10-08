import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kiwi: { 50: "#f5faee", 100: "#e8f4d6", 200: "#d0e8ad", 400: "#8cc152", 500: "#6aa84f", 600: "#578f3f", 700: "#467532" },
        ink: { DEFAULT: "#1d1d1f", soft: "#6e6e73", faint: "#86868b" },
      },
      fontFamily: { sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "Helvetica Neue", "Arial", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)", pop: "0 12px 40px rgba(0,0,0,0.12)" },
    },
  },
  plugins: [],
};
export default config;
