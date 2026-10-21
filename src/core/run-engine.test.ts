import { describe, expect, it } from "vitest";

import { DEFAULT_ALERT_OPTIONS } from "src/core/alert-options";
import { buildCreateRun, buildDeleteRun } from "src/core/run-builders";
import { runQueue } from "src/core/run-engine";
import type { RunEngineDependencies } from "src/core/run-engine";
import { applyRunEvent } from "src/core/run-machine";
import type { RunEvent } from "src/core/run-machine";
import type { ContentReply, PanelRequest } from "src/shared/messages";
import type { ImportRow, RunSnapshot } from "src/shared/models";

function rowFor({ query }: { query: string }): ImportRow {
  return { sourceRowNumber: 2, query, label: "", overrides: {}, issues: [] };
}

function harness({
  initial,
  respond,
}: {
  initial: RunSnapshot;
  respond: (request: PanelRequest) => ContentReply | Error;
}): { dependencies: RunEngineDependencies; state: { run: RunSnapshot; sleeps: number[]; requests: PanelRequest[] } } {
  const state = { run: initial, sleeps: [] as number[], requests: [] as PanelRequest[] };
  const dependencies: RunEngineDependencies = {
    getRun: () => state.run,
    dispatch: (event: RunEvent) => {
      state.run = applyRunEvent({ run: state.run, event });
    },
    sendToPage: (request: PanelRequest) => {
      state.requests.push(request);
      const reply = respond(request);
      return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply);
    },
    sleep: (milliseconds: number) => {
      state.sleeps.push(milliseconds);
      return Promise.resolve();
    },
    random: () => 0,
    minimumDelayMilliseconds: 6000,
    maximumDelayMilliseconds: 14000,
  };
  return { dependencies, state };
}

const PONG: ContentReply = { ok: true, kind: "pong", pageUrl: "u", hidden: false };

function started({ run }: { run: RunSnapshot }): RunSnapshot {
  return applyRunEvent({ run, event: { type: "start" } });
}

function createRun({ queries }: { queries: string[] }): RunSnapshot {
  return started({
    run: buildCreateRun({
      entries: queries.map((query) => ({ row: rowFor({ query }), action: "create" as const })),
      defaults: DEFAULT_ALERT_OPTIONS,
    }),
  });
}

describe("runQueue", () => {
  it("creates every row and waits between rows", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a", "b"] }),
      respond: (request) => {
        if (request.kind === "ping") return PONG;
        return { ok: true, kind: "created" };
      },
    });
    await runQueue({ dependencies });
    expect(state.run.status).toBe("completed");
    expect(state.run.items.map((item) => item.status)).toEqual(["created", "created"]);
    expect(state.sleeps).toEqual([6000]);
  });

  it("sends an update request for an update item", async () => {
    const { dependencies, state } = harness({
      initial: started({
        run: buildCreateRun({
          entries: [{ row: rowFor({ query: "a" }), action: "update" }],
          defaults: DEFAULT_ALERT_OPTIONS,
        }),
      }),
      respond: (request) => {
        return request.kind === "ping" ? PONG : { ok: true, kind: "updated" };
      },
    });
    await runQueue({ dependencies });
    expect(state.requests.some((request) => request.kind === "update_alert")).toBe(true);
    expect(state.run.items[0]).toMatchObject({ status: "updated" });
  });

  it("records a failed row and keeps going", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a", "b"] }),
      respond: (request) => {
        if (request.kind === "ping") return PONG;
        if (request.kind === "create_alert" && request.query === "a") {
          return { ok: false, errorName: "X", message: "bad", botCheck: false, layoutChanged: false };
        }
        return { ok: true, kind: "created" };
      },
    });
    await runQueue({ dependencies });
    expect(state.run.items.map((item) => item.status)).toEqual(["failed", "created"]);
    expect(state.run.items[0]?.errorMessage).toBe("bad");
  });

  it("stops at a bot check and leaves later rows pending", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a", "b"] }),
      respond: (request) =>
        request.kind === "ping"
          ? PONG
          : { ok: false, errorName: "CaptchaError", message: "m", botCheck: true, layoutChanged: false },
    });
    await runQueue({ dependencies });
    expect(state.run.status).toBe("awaiting_captcha");
    expect(state.run.items.map((item) => item.status)).toEqual(["pending", "pending"]);
  });

  it("pauses with the layout message when selectors fail", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a"] }),
      respond: (request) =>
        request.kind === "ping"
          ? PONG
          : { ok: false, errorName: "LayoutChangedError", message: "layout changed", botCheck: false, layoutChanged: true },
    });
    await runQueue({ dependencies });
    expect(state.run).toMatchObject({ status: "paused", notice: "layout changed" });
  });

  it("pauses when the tab is in the background", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a"] }),
      respond: () => ({ ok: true, kind: "pong", pageUrl: "u", hidden: true }),
    });
    await runQueue({ dependencies });
    expect(state.run.status).toBe("paused");
    expect(state.run.notice).toContain("background");
    expect(state.requests).toHaveLength(1);
  });

  it("pauses when the page cannot be reached", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a"] }),
      respond: () => new Error("no receiver"),
    });
    await runQueue({ dependencies });
    expect(state.run.status).toBe("paused");
    expect(state.run.notice).toContain("cannot reach");
  });

  it("does not run rows after a pause", async () => {
    const { dependencies, state } = harness({
      initial: createRun({ queries: ["a", "b"] }),
      respond: (request) => {
        if (request.kind === "ping") return PONG;
        state.run = applyRunEvent({ run: state.run, event: { type: "pause", reason: "user" } });
        return { ok: true, kind: "created" };
      },
    });
    await runQueue({ dependencies });
    expect(state.run.status).toBe("paused");
    expect(state.run.items.map((item) => item.status)).toEqual(["created", "pending"]);
  });

  it("deletes rows and does not read the list at the end", async () => {
    const { dependencies, state } = harness({
      initial: started({ run: buildDeleteRun({ queries: ["a"] }) }),
      respond: (request) => (request.kind === "ping" ? PONG : { ok: true, kind: "deleted" }),
    });
    await runQueue({ dependencies });
    expect(state.run.items[0]?.status).toBe("deleted");
    expect(state.requests.map((request) => request.kind)).toEqual(["ping", "delete_alert"]);
  });

  it("skips rows that the user skipped", async () => {
    const initial = started({
      run: buildCreateRun({
        entries: [
          { row: rowFor({ query: "a" }), action: "skip" },
          { row: rowFor({ query: "b" }), action: "create" },
        ],
        defaults: DEFAULT_ALERT_OPTIONS,
      }),
    });
    const { dependencies, state } = harness({
      initial,
      respond: (request) =>
        request.kind === "ping" ? PONG : { ok: true, kind: "created" },
    });
    await runQueue({ dependencies });
    expect(state.run.items.map((item) => item.status)).toEqual(["skipped", "created"]);
    expect(state.requests.filter((request) => request.kind === "create_alert")).toHaveLength(1);
  });
});
