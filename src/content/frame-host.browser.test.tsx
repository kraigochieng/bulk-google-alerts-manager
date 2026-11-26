import { beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { addFrame, sendCommand } from "src/content/frame-host";

const channels: MessageChannel[] = [];

/** A message channel that the test can reach, so that it can speak as the app. */
class RecordedMessageChannel extends MessageChannel {
  constructor() {
    super();
    channels.push(this);
  }
}

const pageButton: HTMLButtonElement = document.createElement("button");

/** Deliver the message that the app sends when it opens or closes. */
function appReports({ interactive }: { interactive: boolean }): void {
  const port: MessagePort | undefined = channels.at(-1)?.port1;
  port?.onmessage?.(new MessageEvent("message", { data: { kind: "interactive", interactive } }));
}

function frame(): HTMLIFrameElement {
  const element: HTMLIFrameElement | null = document.querySelector("iframe");
  if (element === null) throw new Error("The app frame is missing.");
  return element;
}

beforeAll(async () => {
  vi.stubGlobal("MessageChannel", RecordedMessageChannel);
  vi.stubGlobal("chrome", { runtime: { getURL: (): string => `${window.location.origin}/app-frame-stub` } });
  pageButton.textContent = "Add";
  document.body.append(pageButton);
  addFrame();
  await vi.waitFor(() => { expect(channels).toHaveLength(1); });
});

describe("the focus between the page and the app frame", () => {
  it("moves to the frame when the app opens", () => {
    pageButton.focus();
    sendCommand({ command: "add" });
    appReports({ interactive: true });
    expect(document.activeElement).toBe(frame());
  });

  it("returns to the frame when the user presses a key on the page", async () => {
    pageButton.focus();
    await userEvent.keyboard("a");
    expect(document.activeElement).toBe(frame());
  });

  it("returns to the page control when the app closes", () => {
    appReports({ interactive: false });
    expect(document.activeElement).toBe(pageButton);
  });

  it("stays on the page for a key press when the app is closed", async () => {
    pageButton.focus();
    await userEvent.keyboard("a");
    expect(document.activeElement).toBe(pageButton);
  });
});
