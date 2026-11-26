import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { ModalSurface } from "src/panel/ui/modal-surface";

describe("ModalSurface", () => {
  it("opens as a modal dialog and focuses the first control", async () => {
    const screen = await render(
      <ModalSurface label="Outer" className="">
        <button type="button">First</button>
      </ModalSurface>,
    );
    await expect.element(screen.getByRole("dialog", { name: "Outer" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("keeps Tab inside the dialog in both directions", async () => {
    const screen = await render(
      <ModalSurface label="Outer" className="">
        <button type="button">First</button>
        <button type="button">Last</button>
      </ModalSurface>,
    );
    await userEvent.tab({ shift: true });
    await expect.element(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    await userEvent.tab();
    await expect.element(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("calls onDismiss for Escape", async () => {
    const onDismiss = vi.fn<() => void>();
    await render(
      <ModalSurface label="Outer" className="" onDismiss={onDismiss}>
        <button type="button">First</button>
      </ModalSurface>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("stays open for Escape without onDismiss", async () => {
    const screen = await render(
      <ModalSurface label="Outer" className="">
        <button type="button">First</button>
      </ModalSurface>,
    );
    await userEvent.keyboard("{Escape}{Escape}");
    await expect.element(screen.getByRole("dialog", { name: "Outer" })).toBeVisible();
  });

  it("dismisses only the inner dialog for Escape", async () => {
    const dismissOuter = vi.fn<() => void>();
    const dismissInner = vi.fn<() => void>();
    await render(
      <ModalSurface label="Outer" className="" onDismiss={dismissOuter}>
        <ModalSurface label="Inner" className="" onDismiss={dismissInner}>
          <button type="button">Inside</button>
        </ModalSurface>
      </ModalSurface>,
    );
    await userEvent.keyboard("{Escape}");
    expect(dismissInner).toHaveBeenCalledOnce();
    expect(dismissOuter).not.toHaveBeenCalled();
  });
});
