import { useCallback, useEffect, useState } from "react";

export const SNACKBAR_DURATION_MILLISECONDS: number = 5000;

export interface SnackbarState {
  readonly message: string;
  readonly show: (message: string) => void;
  readonly dismiss: () => void;
}

/** Hold the message of the snackbar. Side effect: a timer clears the message after five seconds. */
export function useSnackbar(): SnackbarState {
  const [message, setMessage] = useState<string>("");
  const show = useCallback((next: string): void => {
    setMessage(next);
  }, []);
  const dismiss = useCallback((): void => {
    setMessage("");
  }, []);
  useEffect(() => {
    if (message === "") return undefined;
    const timer: ReturnType<typeof setTimeout> = setTimeout(dismiss, SNACKBAR_DURATION_MILLISECONDS);
    return (): void => {
      clearTimeout(timer);
    };
  }, [message, dismiss]);
  return { message, show, dismiss };
}
