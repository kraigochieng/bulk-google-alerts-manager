import { useEffect, useRef } from "react";

import { subscribeToCommands } from "src/panel/page-link";
import type { PageCommand } from "src/shared/frame-messages";

/** Call the handler when the user starts an action from the bar on the page. Side effect: subscribes to the page link. */
export function usePageCommands({ onCommand }: { onCommand: (command: PageCommand) => void }): void {
  const handlerReference = useRef<(command: PageCommand) => void>(onCommand);
  handlerReference.current = onCommand;
  useEffect(
    () => subscribeToCommands({ listener: (command: PageCommand) => { handlerReference.current(command); } }),
    [],
  );
}
