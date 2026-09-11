import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/* Stien har «/» på Linux (CI) og «\» på Windows. */
const inNodeModules = (...pkgs: string[]) => new RegExp(`node_modules[\\\\/](${pkgs.join("|")})`);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
