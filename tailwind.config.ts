import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#2f5d3a",
        ember: "#c0392b",
        harvest: "#e08e2c",
        gold: "#f2b705",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.35" },
          "50%": { transform: "scale(1.15)", opacity: "0.15" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out forwards",
        fadeOut: "fadeOut 0.5s ease-in forwards",
        scaleIn: "scaleIn 0.25s ease-out forwards",
        pulseRing: "pulseRing 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
