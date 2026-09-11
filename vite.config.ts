import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/* Stien har «/» på Linux (CI) og «\» på Windows. */
const inNodeModules = (...pkgs: string[]) => new RegExp(`node_modules[\\\\/](${pkgs.join("|")})`);

/**
 * Content-Security-Policy i produksjonsbygget. GitHub Pages kan ikke sette headere, så den
 * ligger som meta-tag. Ikke i dev: React-pluginen injiserer et inline-script der.
 */
const csp = {
  name: "csp-meta",
  transformIndexHtml: {
    order: "post" as const,
    handler(html: string, ctx: { server?: unknown }) {
      if (ctx.server) return html;
      const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
      return html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
    },
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), csp],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 8080,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "reactflow", test: inNodeModules("@xyflow", "d3-", "zustand", "classcat") },
            { name: "react", test: inNodeModules("react[\\\\/]", "react-dom[\\\\/]", "scheduler[\\\\/]") },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    css: false,
  },
});
