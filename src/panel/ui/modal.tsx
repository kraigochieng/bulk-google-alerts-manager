import type { JSX, ReactNode } from "react";

import { Button } from "src/panel/ui/button";

/** Render a dialog over the page, with a dimmed layer behind it. Pure: state comes as props. */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element | null {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="@container max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl border bg-background p-4 text-sm shadow-xl"
      >
        <header className="flex items-center gap-3 px-1">
          <img src="/icons/icon-48.png" alt="" width={40} height={40} className="size-10 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-medium leading-tight text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">Unofficial tool. Not affiliated with Google.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
