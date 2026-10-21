import { useCallback, useEffect, useRef, useState } from "react";

import { RUN_DELAY_RANGE_MILLISECONDS } from "src/core/delay";
import { applyRunEvent } from "src/core/run-machine";
import type { RunEvent } from "src/core/run-machine";
import { runQueue } from "src/core/run-engine";
import type { RunEngineDependencies } from "src/core/run-engine";
import { sendToAlertsTab } from "src/panel/chrome-bridge";
import type { RunSnapshot } from "src/shared/models";
import { clearRun, loadRun, saveRun } from "src/storage/run-repository";

/** The actions that a view can take on the run. */
export interface RunController {
  readonly run: RunSnapshot | null;
  readonly loaded: boolean;
  readonly begin: (snapshot: RunSnapshot) => void;
  readonly send: (event: RunEvent) => void;
  readonly resume: () => void;
  readonly clear: () => void;
}

/**
 * Own the one active run: state, saving, and the run loop. Side effect: drives the Alerts tab.
 * A run that was running when the panel closed comes back as paused.
 */
export function useRunController(): RunController {
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const runReference = useRef<RunSnapshot | null>(null);
  const loopActive = useRef<boolean>(false);

  const commit = useCallback((next: RunSnapshot | null): void => {
    runReference.current = next;
    setRun(next);
    void (next === null ? clearRun() : saveRun({ run: next }));
  }, []);

  const send = useCallback(
    (event: RunEvent): void => {
      if (runReference.current === null) return;
      commit(applyRunEvent({ run: runReference.current, event }));
    },
    [commit],
  );

  const startLoop = useCallback((): void => {
    if (loopActive.current) return;
    loopActive.current = true;
    const dependencies: RunEngineDependencies = {
      getRun: (): RunSnapshot => {
        if (runReference.current === null) throw new Error("No active run.");
        return runReference.current;
      },
      dispatch: send,
      sendToPage: (request) => sendToAlertsTab({ request }),
      sleep: (milliseconds: number) =>
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, milliseconds);
        }),
      random: () => Math.random(),
      minimumDelayMilliseconds: RUN_DELAY_RANGE_MILLISECONDS.minimum,
      maximumDelayMilliseconds: RUN_DELAY_RANGE_MILLISECONDS.maximum,
    };
    runQueue({ dependencies }).finally(() => {
      loopActive.current = false;
    }).catch(() => {
      send({ type: "pause", reason: "The run stopped because of an unexpected error. Check the Alerts tab, then resume." });
    });
  }, [send]);

  useEffect(() => {
    void loadRun().then((saved: RunSnapshot | null) => {
      if (saved !== null) {
        const restored: RunSnapshot =
          saved.status === "running" ? applyRunEvent({ run: saved, event: { type: "interrupted" } }) : saved;
        runReference.current = restored;
        setRun(restored);
        if (restored !== saved) void saveRun({ run: restored });
      }
      setLoaded(true);
    });
  }, []);

  const begin = useCallback(
    (snapshot: RunSnapshot): void => {
      commit(applyRunEvent({ run: snapshot, event: { type: "start" } }));
      startLoop();
    },
    [commit, startLoop],
  );

  const resume = useCallback((): void => {
    const status = runReference.current?.status;
    if (status === "awaiting_captcha") send({ type: "captcha_cleared" });
    else if (status === "paused") send({ type: "resume" });
    startLoop();
  }, [send, startLoop]);

  const clear = useCallback((): void => {
    commit(null);
  }, [commit]);

  return { run, loaded, begin, send, resume, clear };
}
