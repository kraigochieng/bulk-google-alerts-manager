import { describe, expect, it } from "vitest";

import { canAdvance, nextStep, previousStep, stepNumber, stepProgressPercent } from "src/core/add-steps";
import type { AddStepFacts } from "src/core/add-steps";

const READY: AddStepFacts = { step: "file", hasFile: true, checkedRowCount: 2, withinAlertLimit: true };

describe("step order", () => {
  it("numbers the steps from 1", () => {
    expect(stepNumber({ step: "file" })).toBe(1);
    expect(stepNumber({ step: "start" })).toBe(3);
  });

  it("moves forward and back", () => {
    expect(nextStep({ step: "file" })).toBe("review");
    expect(previousStep({ step: "review" })).toBe("file");
  });

  it("has no step before the first or after the last", () => {
    expect(previousStep({ step: "file" })).toBeNull();
    expect(nextStep({ step: "start" })).toBeNull();
  });
});

describe("canAdvance", () => {
  it("needs a file on the file step", () => {
    expect(canAdvance(READY)).toBe(true);
    expect(canAdvance({ ...READY, hasFile: false })).toBe(false);
  });

  it("needs a checked row on the review step", () => {
    expect(canAdvance({ ...READY, step: "review" })).toBe(true);
    expect(canAdvance({ ...READY, step: "review", checkedRowCount: 0 })).toBe(false);
  });

  it("blocks the review step when the run passes the alert limit", () => {
    expect(canAdvance({ ...READY, step: "review", withinAlertLimit: false })).toBe(false);
  });

  it("never advances from the start step", () => {
    expect(canAdvance({ ...READY, step: "start" })).toBe(false);
  });
});

describe("stepProgressPercent", () => {
  it("gives one third for each step", () => {
    expect(stepProgressPercent({ step: "file" })).toBeCloseTo(33.33, 1);
    expect(stepProgressPercent({ step: "review" })).toBeCloseTo(66.67, 1);
    expect(stepProgressPercent({ step: "start" })).toBe(100);
  });
});
