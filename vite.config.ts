import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

import manifest from "./manifest.config";

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: { alias: { src: resolve(__dirname, "src") } },
  build: { rollupOptions: { input: { app: resolve(__dirname, "app.html") } } },
  test: {
    projects: [
      {
        extends: false,
        resolve: { alias: { src: resolve(__dirname, "src") } },
        test: { name: "unit", include: ["src/**/*.test.ts"] },
      },
      {
        extends: false,
        plugins: [react(), tailwindcss()],
        resolve: { alias: { src: resolve(__dirname, "src") } },
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.tsx"],
          browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: "chromium" }] },
        },
      },
    ],
  },
});
