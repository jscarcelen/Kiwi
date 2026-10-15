import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef3ff", 100: "#dce6ff", 200: "#b9cdff", 400: "#6b8dff", 500: "#2251ff", 600: "#1b43d6", 700: "#1536b0" },
        navy: { DEFAULT: "#051c2c", 700: "#030f18", 100: "#e4eaf2" },
        ink: { DEFAULT: "#1d1d1f", soft: "#6e6e73", faint: "#86868b" },
      },
      fontFamily: { sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "Helvetica Neue", "Arial", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)", pop: "0 12px 40px rgba(0,0,0,0.12)" },
    },
  },
  plugins: [],
};
export default config;
