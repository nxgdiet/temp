/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors based on the image and new design
        "mobile-frame-dark": "#1a2a2a", // Dark green/blue for the mobile frame
        "pitch-green": "#38a169", // Bright green for the pitch
        "pitch-line-white": "#ffffff", // White for pitch lines
        "player-slot-bg": "rgba(255, 255, 255, 0.2)", // Semi-transparent white for player slots
        "position-st": "#ef4444", // Red for Striker (ST)
        "position-mf": "#3b82f6", // Blue for Midfielder (MF)
        "position-cb": "#a16207", // Brown/Orange for Center Back (CB)
        "tab-active-green": "#4ade80", // Lighter green for active tab
        "tab-inactive-text": "#a0aec0", // Grey for inactive tab text
        "error-red": "#ef4444", // Red for error messages
        "button-green": "#10b981", // Green for primary buttons
        "button-disabled": "#4b5563", // Darker grey for disabled buttons
        "bottom-nav-bg": "#1a2a2a", // Same as mobile frame dark
        // New colors for competition screen (enhanced)
        "comp-bg-dark": "#0a0a0a", // Very dark background for competition page
        "comp-header-bg": "#1c1c1c", // Slightly lighter dark for header
        "live-dot": "#FFD700", // Gold for live match dot
        "score-text": "#00FF00", // Bright green for scores
        "player-card-bg-start": "#2a2a2a", // Dark gradient start for player cards
        "player-card-bg-end": "#1a1a1a", // Dark gradient end for player cards
        "graph-grid": "#333333", // Darker grey for graph grid lines
        "graph-line-user": "#FF69B4", // Hot pink for user's graph line
        "graph-line-opponent": "#7CFC00", // Lawn green for opponent's graph line
        "share-button-gradient-start": "#10B981", // Green gradient start for share button
        "share-button-gradient-end": "#059669", // Darker green gradient end
        "victorious-gradient-start": "#00C853", // Vibrant green for victorious screen
        "victorious-gradient-end": "#00796B", // Darker green for victorious screen
        "victorious-glow": "#00FF00", // Bright green glow
        "confetti-red": "#FF0000",
        "confetti-blue": "#0000FF",
        "confetti-yellow": "#FFFF00",
        "confetti-green": "#00FF00",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 255, 0, 0.4)" },
          "50%": { boxShadow: "0 0 15px rgba(0, 255, 0, 0.8)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100vh) rotate(0deg)", opacity: "0" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "1" },
        },
        "confetti-burst": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "trophy-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-scale": "fade-in-scale 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 2s infinite",
        "confetti-fall": "confetti-fall 5s ease-in-out forwards",
        "confetti-burst": "confetti-burst 0.5s ease-out forwards",
        "trophy-bounce": "trophy-bounce 1s infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
