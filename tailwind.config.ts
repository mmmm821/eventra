import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        base: "#0A0B14",
        surface: {
          DEFAULT: "#12131F",
          raised: "#171826",
        },
        border: "rgba(255,255,255,0.08)",
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        electric: {
          blue: "#3B82F6",
          pink: "#EC4899",
        },
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "in": {
          "0%": { opacity: "0", transform: "translateY(4px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        in: "in 0.35s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
