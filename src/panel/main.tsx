import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "src/panel/fonts.css";
import { App } from "src/panel/App";
import { connectToPage } from "src/panel/page-link";
import "src/panel/styles.css";

const rootElement: HTMLElement | null = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element #root is missing from app.html.");
}
void connectToPage().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
