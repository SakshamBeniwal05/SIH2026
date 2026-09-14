/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark Tactical Baseline
        "surface-dark": "#0f131b",
        "surface-canvas-dark": "#0a0e15",
        "surface-panel-dark": "#10131b",
        "surface-card-dark": "#181c23",
        "surface-high-dark": "#1e1e30",
        "surface-border-dark": "#27303e",
        "text-dark": "#dfe2ed",
        "text-muted-dark": "#859585",

        // Light Field Baseline
        "surface-light": "#ffffff",
        "surface-canvas-light": "#f8fafc",
        "surface-panel-light": "#f1f5f9",
        "surface-card-light": "#ffffff",
        "surface-border-light": "#cbd5e1",
        "text-light": "#0f172a",
        "text-muted-light": "#475569",

        // Stitch Calibrated 4-Tier Hazard Ontology
        "z1-primary": "#D32F2F",
        "z1-fill": "#FFEBEE",
        "z1-stroke": "#B71C1C",

        "z2-primary": "#ED6C02",
        "z2-fill": "#FFF3E0",
        "z2-stroke": "#E65100",

        "z3-primary": "#F57C00",
        "z3-fill": "#FFF8E1",
        "z3-stroke": "#FF8F00",

        "z4-primary": "#0288D1",
        "z4-fill": "#E1F5FE",
        "z4-stroke": "#01579B",

        // Emergency Directives & Action Banners
        "banner-evac": "#B71C1C",
        "banner-evac-tint": "#EF5350",
        "banner-evac-stroke": "#7F0000",

        "banner-detour": "#E65100",
        "banner-detour-tint": "#FFA726",
        "banner-detour-stroke": "#A73A00",

        // Live Vitality Pulse Spectrum
        "telemetry-pulse": "#00E676",
        "telemetry-glow": "#69F0AE",
        "telemetry-stroke": "#00B0FF"
      },
      fontFamily: {
        headline: ["'Space Grotesk'", "Sora", "sans-serif"],
        display: ["'Space Grotesk'", "Sora", "sans-serif"],
        body: ["Chivo", "Inter", "sans-serif"],
        label: ["'Space Grotesk'", "sans-serif"],
        telemetry: ["'Space Grotesk'", "monospace"]
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0.125rem',
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.375rem',
        xl: '0.5rem',
        full: '9999px'
      },
      animation: {
        'radar-sweep': 'radarSweep 8s linear infinite',
        'pulse-ring': 'pulseRing 3s ease-in-out infinite',
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pulseRing: {
          '0%': { transform: 'scale(0.94)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '0.35' },
          '100%': { transform: 'scale(0.94)', opacity: '0.9' }
        }
      }
    },
  },
  plugins: [],
}
