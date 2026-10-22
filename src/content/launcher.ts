const BELL_ICON: string =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

const LAUNCHER_STYLE: string = `
  :host { all: initial; }
  button {
    position: fixed; right: 16px; bottom: 16px; z-index: 2147482000;
    width: 48px; height: 48px; border: 0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: #1a73e8; color: #ffffff; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  button:hover { background: #1765cc; }
`;

/** Add a round button at the page edge. A click calls onClick. Side effect: adds an element to the page. */
export function addLauncher({ onClick }: { onClick: () => void }): void {
  const host: HTMLElement = document.createElement("div");
  const shadowRoot: ShadowRoot = host.attachShadow({ mode: "open" });
  const style: HTMLStyleElement = document.createElement("style");
  style.textContent = LAUNCHER_STYLE;
  const button: HTMLButtonElement = document.createElement("button");
  button.type = "button";
  button.title = "Bulk Google Alerts Manager";
  button.setAttribute("aria-label", "Open Bulk Google Alerts Manager");
  button.innerHTML = BELL_ICON;
  button.addEventListener("click", onClick);
  shadowRoot.append(style, button);
  document.body.append(host);
}
