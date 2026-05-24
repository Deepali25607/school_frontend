/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#0a0a1a",
          soft: "#0f1024",
          card: "rgba(255,255,255,0.04)",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#b6cdff",
          300: "#86a8ff",
          400: "#5b81ff",
          500: "#3d5fff",
          600: "#2a44ee",
          700: "#2233c4",
          800: "#1d2a9c",
          900: "#1b287a",
        },
        accent: {
          pink: "#ff5ec4",
          violet: "#9b5cff",
          cyan: "#3ad6ff",
          gold: "#ffd166",
          mint: "#5cf2c4",
        },
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(60% 60% at 50% 30%, rgba(91,129,255,0.35), transparent 70%), radial-gradient(40% 40% at 80% 70%, rgba(155,92,255,0.25), transparent 70%), radial-gradient(40% 40% at 20% 80%, rgba(255,94,196,0.18), transparent 70%)",
        "grid-fade":
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(91,129,255,0.45)",
        "glow-pink": "0 0 40px rgba(255,94,196,0.35)",
        card: "0 8px 30px rgba(0,0,0,0.35)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        twinkle: {
          "0%,100%": { opacity: 0.2, transform: "scale(0.8)" },
          "50%": { opacity: 1, transform: "scale(1.1)" },
        },
        "gradient-x": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        twinkle: "twinkle 2.5s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
      },
    },
  },
  plugins: [],
};
