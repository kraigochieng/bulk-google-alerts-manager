import type { JSX } from "react";

import { ADD_STEPS, STEP_LABELS, stepNumber, stepProgressPercent } from "src/core/add-steps";
import type { AddStep } from "src/core/add-steps";
import { Progress } from "src/panel/ui/progress";

/** Render a progress bar and the step labels. The current label is bold. Pure: the step comes as a prop. */
export function StepProgress({ step }: { step: AddStep }): JSX.Element {
  return (
    <div className="mt-3">
      <Progress value={stepProgressPercent({ step })} aria-label={`Step ${String(stepNumber({ step }))} of ${String(ADD_STEPS.length)}: ${STEP_LABELS[step]}`} className="block w-full" />
      <ol className="mt-1 grid grid-cols-3 text-xs text-muted-foreground">
        {ADD_STEPS.map((label: AddStep) => (
          <li key={label} aria-current={label === step ? "step" : undefined} className={label === step ? "font-semibold text-foreground" : ""}>
            {String(stepNumber({ step: label }))}. {STEP_LABELS[label]}
          </li>
        ))}
      </ol>
    </div>
  );
}
