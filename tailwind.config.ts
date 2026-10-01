import type { Config } from "tailwindcss";

/**
 * Tokens inspirados en las Human Interface Guidelines de Apple:
 * tipografía del sistema (SF Pro en Apple, Segoe/Roboto en otros), azul de
 * sistema como color de acción, fondo agrupado gris claro y colores
 * semánticos (verde = bien, naranja = atención, rojo = crítico).
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#ebf4ff",
          100: "#d6e9ff",
          200: "#add3ff",
          300: "#7cbaff",
          500: "#0a84ff",
          600: "#007aff",
          700: "#0062cc",
        },
        canvas: "#f2f2f7",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.03)",
        float: "0 8px 30px rgba(0, 0, 0, 0.12)",
      },
      keyframes: {
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
