import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-ink": "var(--accent-ink)",
        "accent-2": "var(--accent-2)",
        "accent-2-soft": "var(--accent-2-soft)",
        "accent-2-ink": "var(--accent-2-ink)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        ok: "var(--ok)",
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "16px",
        lg: "22px",
        "2xl": "22px",
        full: "9999px",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(13, 27, 50, 0.04), 0 1px 3px rgba(13, 27, 50, 0.04)",
        md: "0 1px 2px rgba(13, 27, 50, 0.04), 0 8px 24px -10px rgba(13, 27, 50, 0.10)",
        lg: "0 1px 2px rgba(13, 27, 50, 0.04), 0 24px 48px -20px rgba(13, 27, 50, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
