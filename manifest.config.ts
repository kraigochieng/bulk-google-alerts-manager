import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Bulk Alerts Manager",
  version: "0.1.0",
  description:
    "Unofficial tool. Not affiliated with Google. Create and delete many alerts from CSV files.",
  permissions: ["sidePanel", "storage"],
  host_permissions: ["https://www.google.com/alerts*"],
  background: { service_worker: "src/background/index.ts", type: "module" },
  content_scripts: [
    {
      matches: ["https://www.google.com/alerts*"],
      js: ["src/content/index.ts"],
    },
  ],
  side_panel: { default_path: "sidepanel.html" },
  action: { default_title: "Bulk Alerts Manager" },
});
