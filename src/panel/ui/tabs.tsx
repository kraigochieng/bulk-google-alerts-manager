import { useRef } from "react";
import type { JSX } from "react";
import { MdTabs } from "@material/web/tabs/tabs.js";

import "src/panel/material-elements";
import { useElementEvent } from "src/panel/ui/use-element-event";

/** One tab: the value it reports and the text the user sees. */
export interface TabChoice {
  readonly value: string;
  readonly label: string;
}

/** Render Material Web primary tabs. They report the value of the chosen tab. */
export function Tabs({
  value,
  onValueChange,
  tabs,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tabs: readonly TabChoice[];
  className?: string;
}): JSX.Element {
  const tabsRef = useRef<HTMLElement | null>(null);
  useElementEvent({
    elementRef: tabsRef,
    eventName: "change",
    handler: (event: Event) => {
      if (!(event.target instanceof MdTabs)) return;
      const chosen: TabChoice | undefined = tabs[event.target.activeTabIndex];
      if (chosen !== undefined) onValueChange(chosen.value);
    },
  });
  return (
    <md-tabs
      ref={tabsRef}
      activeTabIndex={Math.max(
        0,
        tabs.findIndex((tab: TabChoice) => tab.value === value),
      )}
      className={className}
    >
      {tabs.map((tab: TabChoice) => (
        <md-primary-tab key={tab.value} active={tab.value === value}>
          {tab.label}
        </md-primary-tab>
      ))}
    </md-tabs>
  );
}
