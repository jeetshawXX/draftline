import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        paper: "#f7f7f2",
        forest: "#275d4b",
        mint: "#d7f36b",
        line: "#e5e8df"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 31, 0.07)"
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
