import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#3BA935", dark: "#2E8A29", light: "#E8F5E7" },
        ink: { DEFAULT: "#1A1A1A", muted: "#4A4A4A" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      borderRadius: { card: "12px" },
      keyframes: {
        "card-tap": {
          "0%": { transform: "translate(-50%, 120px) rotate(12deg)", opacity: "0" },
          "20%": { opacity: "1" },
          "50%, 80%": { transform: "translate(-50%, 0) rotate(-6deg)", opacity: "1" },
          "100%": { transform: "translate(-50%, 0) rotate(-6deg)", opacity: "0" },
        },
      },
      animation: { "card-tap": "card-tap 2.4s ease-in-out infinite" },
    },
  },
  plugins: [],
} satisfies Config;
