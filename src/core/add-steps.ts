/** The screens of the Add dialog, in order. */
export const ADD_STEPS = ["file", "columns", "review", "start"] as const;

export type AddStep = (typeof ADD_STEPS)[number];

/** What the Add dialog knows when it decides about a step change. */
export interface AddStepFacts {
  readonly step: AddStep;
  readonly hasFile: boolean;
  readonly queryColumnMapped: boolean;
  readonly checkedRowCount: number;
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
export function canAdvance({ step, hasFile, queryColumnMapped, checkedRowCount }: AddStepFacts): boolean {
  if (step === "file") return hasFile;
  if (step === "columns") return queryColumnMapped;
  if (step === "review") return checkedRowCount > 0;
  return false;
}
