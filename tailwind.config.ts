import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1e241f",
        moss: "#5f7351",
        ochre: "#c8833a",
        paper: "#f7f1e5",
        clay: "#e2b887"
      },
      boxShadow: {
        card: "0 24px 80px rgba(30, 36, 31, 0.12)"
      }
    }
  },
  plugins: [forms]
};

export default config;
