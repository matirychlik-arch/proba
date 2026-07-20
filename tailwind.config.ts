import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      colors: {
        "bg-app": "var(--bg-app)",
        "bg-surface": "var(--bg-surface)",
        "bg-card": "var(--bg-card)",
        "bg-sidebar": "var(--bg-sidebar)",
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-input": "var(--border-input)",
        blue: "var(--blue)",
        "blue-pale": "var(--blue-pale)",
        coral: "var(--coral)",
        "coral-pale": "var(--coral-pale)",
        amber: "var(--amber)",
        "amber-pale": "var(--amber-pale)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-placeholder": "var(--text-placeholder)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
    },
  },
  plugins: [],
};
export default config;
