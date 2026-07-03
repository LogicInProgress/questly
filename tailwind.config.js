/** @type {import('tailwindcss').Config} */
// Design tokens ported verbatim from the wireframe :root — the source of truth for the build.
module.exports = {
  content: ["./app/javascript/**/*.{ts,tsx}", "./app/views/**/*.html.erb"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#151228",
        bg2: "#1b1636",
        surface: "#241d45",
        surface2: "#2c2454",
        surface3: "#372c68",
        line: "#3d3170",
        violet: { DEFAULT: "#8b5cf6", 2: "#a78bfa" },
        gold: "#ffc94d",
        green: "#4ade80",
        coral: "#fb7185",
        sky: "#38bdf8",
        ink: "#f5f3ff",
        muted: "#a79fd0",
        faint: "#6f66a0"
      },
      fontFamily: {
        display: ["Fredoka", "Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        r: "20px",
        rs: "14px"
      },
      boxShadow: {
        card: "0 18px 40px -18px rgba(0,0,0,.7)"
      }
    }
  },
  plugins: []
}
