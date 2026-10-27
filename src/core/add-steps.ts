/** The screens of the Add dialog, in order. */
export const ADD_STEPS = ["file", "review", "start"] as const;

export type AddStep = (typeof ADD_STEPS)[number];

/** The label of each step, as the dialog shows it. */
export const STEP_LABELS: Record<AddStep, string> = {
  file: "File",
  review: "Review",
  start: "Start",
};

/** Return how far the user is, from 33 to 100 percent, with one third for each step. Pure. */
export function stepProgressPercent({ step }: { step: AddStep }): number {
  return (stepNumber({ step }) / ADD_STEPS.length) * 100;
}

/** What the Add dialog knows when it decides about a step change. */
export interface AddStepFacts {
  readonly step: AddStep;
  readonly hasFile: boolean;
  readonly checkedRowCount: number;
  readonly withinAlertLimit: boolean;
}

/** Return the number of a step, counting from 1. Pure. */
export function stepNumber({ step }: { step: AddStep }): number {
  return ADD_STEPS.indexOf(step) + 1;
}

/** Return the step before the given step. The first step has none. Pure. */
export function previousStep({ step }: { step: AddStep }): AddStep | null {
  return ADD_STEPS[ADD_STEPS.indexOf(step) - 1] ?? null;
}

/** Return the step after the given step. The last step has none. Pure. */
export function nextStep({ step }: { step: AddStep }): AddStep | null {
  return ADD_STEPS[ADD_STEPS.indexOf(step) + 1] ?? null;
}

/** Decide whether the user may leave the step forward. The last step never advances. Pure. */
export function canAdvance({ step, hasFile, checkedRowCount, withinAlertLimit }: AddStepFacts): boolean {
  if (step === "file") return hasFile;
  if (step === "review") return checkedRowCount > 0 && withinAlertLimit;
  return false;
}
