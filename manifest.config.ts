import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  minimum_chrome_version: "120",
  name: "Bulk Google Alerts Manager",
  version: "1.0.0",
  description:
    "Unofficial tool. Not affiliated with Google. Create and delete many alerts from CSV files.",
  permissions: ["storage"],
  host_permissions: ["https://www.google.com/alerts*"],
  background: { service_worker: "src/background/index.ts", type: "module" },
  content_scripts: [
    {
      matches: ["https://www.google.com/alerts*"],
      js: ["src/content/index.ts"],
    },
  ],
  web_accessible_resources: [{ resources: ["app.html", "icons/icon-32.png"], matches: ["https://www.google.com/*"] }],
  icons: {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
  action: {
    default_title: "Bulk Google Alerts Manager",
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
    },
  },
});
