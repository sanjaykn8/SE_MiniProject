// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6D28D9",    // indigo-violet
        accent:  "#06B6D4",    // teal
        surface: "rgba(255,255,255,0.06)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2,6,23,0.6)"
      }
    }
  },
  plugins: []
}
