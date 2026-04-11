import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#A84C34",
        },
        admin: {
          bg: "#f4f1ea",
          panel: "#fffdf8",
          muted: "#f7f1e6",
          border: "#ddd4c6",
          text: "#201b16",
          soft: "#655d53",
          accent: "#c95b2b",
          success: "#1f7a4f",
          warning: "#b7791f",
          danger: "#ba453b",
        },
      },
      boxShadow: {
        admin: "0 18px 40px rgb(53 42 28 / 0.08)",
      },
      borderRadius: {
        admin: "1.25rem",
        control: "0.95rem",
      },
    },
  },
  plugins: [],
};

export default config;
