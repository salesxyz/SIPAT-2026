/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sipat: { DEFAULT: "#168447", dark: "#105C35", light: "#E8F5EC", gray: "#F5F7F5", ink: "#333333" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Instrument Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,92,53,.06), 0 8px 24px -8px rgba(16,92,53,.14)",
        lift: "0 2px 4px rgba(16,92,53,.08), 0 18px 36px -12px rgba(16,92,53,.28)",
      },
      borderRadius: { "3xl": "1.75rem" },
      keyframes: {
        scan: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(100%)" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: { scan: "scan 2.8s ease-in-out infinite", pop: "pop .45s cubic-bezier(.2,.9,.3,1.2) both" },
    },
  },
  plugins: [],
};
