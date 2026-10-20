import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

/** Save a value after the user stops typing. Side effect: calls `save`. Returns the save status. */
export function useAutosave<Value>({
  value,
  save,
  enabled,
  delayMilliseconds,
}: {
  value: Value;
  save: (value: Value) => Promise<void>;
  enabled: boolean;
  delayMilliseconds: number;
}): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const firstRun = useRef<boolean>(true);

  useEffect(() => {
    if (!enabled) return undefined;
    if (firstRun.current) {
      firstRun.current = false;
      return undefined;
    }
    setStatus("saving");
    const handle: number = window.setTimeout(() => {
      save(value).then(
        () => {
          setStatus("saved");
        },
        () => {
          setStatus("failed");
        },
      );
    }, delayMilliseconds);
    return (): void => {
      window.clearTimeout(handle);
    };
  }, [value, save, enabled, delayMilliseconds]);

  return status;
}
