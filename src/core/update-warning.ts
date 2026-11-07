/** Build the warning for the rows that update an existing alert. Return null when no row updates an alert. */
export function updateWarning({ updateCount }: { updateCount: number }): string | null {
  if (updateCount <= 0) return null;
  const rows: string = updateCount === 1 ? "1 checked row updates" : `${String(updateCount)} checked rows update`;
  return `${rows} an existing alert. The run replaces all options of that alert with the final options of the row. Blank cells use the defaults. Choose "Skip this row" to keep the alert as it is.`;
}
