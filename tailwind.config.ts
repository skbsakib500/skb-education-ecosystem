import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      /* ── Semantic colors → CSS variables ───────────────── */
      colors: {
        canvas: "var(--color-bg)",
        "canvas-soft": "var(--color-bg-soft)",

        surface: {
          DEFAULT: "var(--color-surface)",
          solid: "var(--color-surface-solid)",
          hover: "var(--color-surface-hover)",
        },

        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },

        fg: {
          DEFAULT: "var(--color-fg)",
          muted: "var(--color-fg-muted)",
          subtle: "var(--color-fg-subtle)",
        },

        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          fg: "var(--color-accent-fg)",
        },

        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
      },

      /* ── Typography ────────────────────────────────────── */
      fontFamily: {
        sans: ["Outfit", "Hind Siliguri", "system-ui", "sans-serif"],
        bangla: ["Hind Siliguri", "sans-serif"],
      },
      fontSize: {
        "fluid-display": [
          "clamp(2.5rem, 5vw, 4rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "fluid-h1": [
          "clamp(2rem, 4vw, 3rem)",
          { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "fluid-h2": [
          "clamp(1.5rem, 3vw, 2.25rem)",
          { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "fluid-h3": [
          "clamp(1.25rem, 2.5vw, 1.75rem)",
          { lineHeight: "1.3", fontWeight: "600" },
        ],
        "fluid-body-lg": ["1.125rem", { lineHeight: "1.65" }],
        "fluid-body": ["1rem", { lineHeight: "1.6" }],
        "fluid-body-sm": ["0.875rem", { lineHeight: "1.6" }],
        "fluid-caption": ["0.8125rem", { lineHeight: "1.5" }],
        "fluid-micro": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.02em" }],
      },

      /* ── Radius ────────────────────────────────────────── */
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },

      /* ── Elevation ─────────────────────────────────────── */
      boxShadow: {
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-4": "var(--elevation-4)",
      },

      /* ── Motion ────────────────────────────────────────── */
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },

      /* ── Layout ────────────────────────────────────────── */
      maxWidth: {
        container: "var(--container-xl)",
      },
    },
  },
  plugins: [],
};

export default config;
