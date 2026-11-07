/** The counts of what a run does with the checked rows. */
export interface ReviewCounts {
  readonly createCount: number;
  readonly updateCount: number;
  readonly skipCount: number;
  readonly problemCount: number;
}

function plural({ count, singular, many }: { count: number; singular: string; many: string }): string {
  return `${String(count)} ${count === 1 ? singular : many}`;
}

/** Build the line that says what the run does. Pure. */
export function summariseReview({ createCount, updateCount, skipCount, problemCount }: ReviewCounts): string {
  const parts: string[] = [
    `The run creates ${plural({ count: createCount, singular: "alert", many: "alerts" })}`,
    `updates ${plural({ count: updateCount, singular: "alert", many: "alerts" })}`,
    `and skips ${plural({ count: skipCount, singular: "row", many: "rows" })}.`,
  ];
  const line: string = `${parts[0] ?? ""}, ${parts[1] ?? ""}, ${parts[2] ?? ""}`;
  return problemCount === 0 ? line : `${line} ${plural({ count: problemCount, singular: "row has", many: "rows have" })} a problem.`;
}
