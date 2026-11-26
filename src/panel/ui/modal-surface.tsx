import { useEffect, useRef } from "react";
import type { JSX, KeyboardEvent, ReactNode, SyntheticEvent } from "react";
import clsx from "clsx";

import { focusEdge } from "src/panel/ui/focus-wrap";

/**
 * Render a full screen native modal dialog that keeps the keyboard focus inside. Side effect: opens the dialog.
 * Escape calls onDismiss. Without onDismiss, Escape does nothing. An Escape of an inner dialog is not handled here.
 */
export function ModalSurface({
  label,
  className,
  onDismiss,
  children,
}: {
  label: string;
  className: string;
  onDismiss?: () => void;
  children: ReactNode;
}): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const dialog: HTMLDialogElement | null = dialogRef.current;
    dialog?.showModal();
    if (dialog !== null) focusEdge({ container: dialog, edge: "first" });
    return (): void => { dialog?.close(); };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>): void => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const innermost: EventTarget | undefined = event.nativeEvent.composedPath().find((target: EventTarget) => target instanceof HTMLDialogElement);
    if (innermost !== dialogRef.current) return;
    event.preventDefault();
    onDismiss?.();
  };
  // A modal dialog in a frame lets Tab leave the frame. A guard at each end moves the focus to the other end.
  const wrapTo = (edge: "first" | "last"): void => {
    if (dialogRef.current !== null) focusEdge({ container: dialogRef.current, edge });
  };

  // The browser can close the dialog without a key press inside it, for example when the focus is on no control.
  const onCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onDismiss?.();
  };
  const reopen = (event: SyntheticEvent<HTMLDialogElement>): void => {
    const dialog: HTMLDialogElement = event.currentTarget;
    if (event.target === dialog && !dialog.open && dialog.isConnected) dialog.showModal();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onKeyDown={onKeyDown}
      onCancel={onCancel}
      onClose={reopen}
      className={clsx("fixed inset-0 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 p-4 text-foreground", className)}
    >
      <span data-focus-guard tabIndex={0} aria-hidden="true" className="fixed" onFocus={() => { wrapTo("last"); }} />
      {children}
      <span data-focus-guard tabIndex={0} aria-hidden="true" className="fixed" onFocus={() => { wrapTo("first"); }} />
    </dialog>
  );
}
