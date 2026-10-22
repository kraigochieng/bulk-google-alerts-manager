import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

import manifest from "./manifest.config";

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: { alias: { src: resolve(__dirname, "src") } },
  build: { rollupOptions: { input: { app: resolve(__dirname, "app.html") } } },
  test: { include: ["src/**/*.test.ts"] },
});
