import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Listen to a DOM event on an element for as long as the component is mounted. Side effect: adds a listener.
 * The handler may change between renders without a new listener.
 */
export function useElementEvent({
  elementRef,
  eventName,
  handler,
}: {
  elementRef: RefObject<HTMLElement | null>;
  eventName: string;
  handler: (event: Event) => void;
}): void {
  const latestHandler = useRef<(event: Event) => void>(handler);
  latestHandler.current = handler;
  useEffect(() => {
    const element: HTMLElement | null = elementRef.current;
    if (element === null) return undefined;
    const listener = (event: Event): void => {
      latestHandler.current(event);
    };
    element.addEventListener(eventName, listener);
    return (): void => {
      element.removeEventListener(eventName, listener);
    };
  }, [elementRef, eventName]);
}
