import { useCallback, useMemo, useState } from "react";
import type { JSX } from "react";

import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { canAdvance, nextStep, previousStep } from "src/core/add-steps";
import type { AddStep } from "src/core/add-steps";
import { buildImportRows, guessMapping } from "src/core/column-mapping";
import type { ColumnMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import type { CsvTable } from "src/core/csv";
import { findMatches } from "src/core/matching";
import type { AlertMatch } from "src/core/matching";
import { MAXIMUM_QUERY_LENGTH } from "src/core/row-validation";
import { TEMPLATE_FILE_NAME, buildTemplateCsv } from "src/core/template-csv";
import { buildCreateRun } from "src/core/run-builders";
import type { CreateEntry } from "src/core/run-builders";
import { checkCreateGate } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import type { Settings } from "src/core/settings";
import { StepProgress } from "src/panel/components/step-progress";
import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import { FileDropzone } from "src/panel/ui/file-dropzone";
import { RadioGroup } from "src/panel/ui/radio-group";
import { TextField } from "src/panel/ui/text-field";
import { SettingsForm } from "src/panel/components/settings-form";
import type { SaveStatus } from "src/panel/use-autosave";
import { ColumnMapper } from "src/panel/components/column-mapper";
import { DataTable } from "src/panel/components/data-table";
import { downloadTextFile } from "src/panel/chrome-bridge";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import { useTableState } from "src/panel/use-table-state";
import type { ImportRow, LiveAlert, RowIssue } from "src/shared/models";

export const ROWS_TABLE_SCHEMA: TableSchema = {
  sortKeys: ["row", "query", "notes"],
  filters: ["all", "problems", "matches", "checked"],
  defaultState: { search: "", sortKey: "row", sortDirection: "asc", page: 0, filter: "all" },
};

const BLOCKING_ISSUES: readonly RowIssue[] = ["empty", "too_long", "invalid_option"];

const ISSUE_TEXT: Record<RowIssue, string> = {
  empty: "Empty query.",
  too_long: `Query is longer than ${String(MAXIMUM_QUERY_LENGTH)} characters.`,
  duplicate_in_file: "Same query appears earlier in this file.",
  invalid_option: "A value in an option column is not valid (use rss or email, all or best, and so on).",
};

type RowAction = "create" | "update" | "skip";

function isSelectable({ row }: { row: ImportRow }): boolean {
  return !row.issues.some((issue: RowIssue) => BLOCKING_ISSUES.includes(issue));
}

function defaultChecked({ row }: { row: ImportRow }): boolean {
  return row.issues.length === 0;
}

/** Render the Add flow as four steps: file, columns, review, start. Holds the state of the flow. */
export function CreateView({
  settings,
  onSettingsChange,
  saveStatus,
  controller,
  live,
  onNotify,
}: {
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  saveStatus: SaveStatus;
  controller: RunController;
  live: LiveAlertsState;
  onNotify: (message: string) => void;
}): JSX.Element {
  const [fileName, setFileName] = useState<string>("");
  const [csvTable, setCsvTable] = useState<CsvTable | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [importError, setImportError] = useState<string>("");
  const [pastedText, setPastedText] = useState<string>("");
  const [checkedRows, setCheckedRows] = useState<ReadonlySet<number>>(new Set());
  const [actionOverrides, setActionOverrides] = useState<Readonly<Record<number, RowAction>>>({});
  const liveAlerts: readonly LiveAlert[] | null = live.alerts;
  const [step, setStep] = useState<AddStep>("file");
  const [rowsState, setRowsState] = useTableState({ schema: ROWS_TABLE_SCHEMA });

  const rows: readonly ImportRow[] = useMemo(
    () =>
      csvTable === null || mapping === null || mapping.query === null
        ? []
        : buildImportRows({ table: csvTable, mapping, maximumQueryLength: MAXIMUM_QUERY_LENGTH }),
    [csvTable, mapping],
  );

  const matchesByRow: ReadonlyMap<number, AlertMatch[]> = useMemo(() => {
    const map = new Map<number, AlertMatch[]>();
    if (liveAlerts === null) return map;
    for (const row of rows) {
      const matches: AlertMatch[] = row.query.trim() === "" ? [] : findMatches({ query: row.query, liveAlerts });
      if (matches.length > 0) map.set(row.sourceRowNumber, matches);
    }
    return map;
  }, [rows, liveAlerts]);

  const actionFor = useCallback(
    ({ row }: { row: ImportRow }): RowAction => {
      const override: RowAction | undefined = actionOverrides[row.sourceRowNumber];
      if (override !== undefined) return override;
      return matchesByRow.get(row.sourceRowNumber)?.[0]?.similarity === "exact" ? "update" : "create";
    },
    [actionOverrides, matchesByRow],
  );

  const importText = useCallback(
    ({ text, sourceName }: { text: string; sourceName: string }): void => {
      setImportError("");
      try {
        const table: CsvTable = parseCsv({ text });
        const guessed: ColumnMapping = guessMapping({ headers: table.headers });
        setFileName(sourceName);
        onNotify(`Read ${String(table.records.length)} rows from ${sourceName}.`);
        setCsvTable(table);
        setMapping(guessed);
        setActionOverrides({});
        setStep("columns");
        setRowsState(ROWS_TABLE_SCHEMA.defaultState);
        live.refresh();
      } catch (error: unknown) {
        setImportError(error instanceof Error ? error.message : "The text could not be read.");
      }
    },
    [live, setRowsState, onNotify],
  );

  const importFile = useCallback(
    async (file: File): Promise<void> => {
      importText({ text: await file.text(), sourceName: file.name });
    },
    [importText],
  );

  // Reset the checked rows whenever the rows change (new file or new mapping).
  const rowsSignature: string = rows.map((row: ImportRow) => `${String(row.sourceRowNumber)}:${row.issues.join("+")}`).join("|");
  const [appliedSignature, setAppliedSignature] = useState<string>("");
  if (rowsSignature !== appliedSignature) {
    setAppliedSignature(rowsSignature);
    setCheckedRows(new Set(rows.filter((row: ImportRow) => defaultChecked({ row })).map((row: ImportRow) => row.sourceRowNumber)));
  }

  const entries: CreateEntry[] = rows
    .filter((row: ImportRow) => checkedRows.has(row.sourceRowNumber) && isSelectable({ row }))
    .map((row: ImportRow) => ({ row, action: actionFor({ row }) }));
  const createCount: number = entries.filter((entry: CreateEntry) => entry.action === "create").length;
  const updateCount: number = entries.filter((entry: CreateEntry) => entry.action === "update").length;
  const liveCount: number = liveAlerts?.length ?? 0;
  const gate = checkCreateGate({ liveCount, createCount, updateCount, cap: ALERT_CAP_PER_ACCOUNT });
  const canStart: boolean = gate.allowed && liveAlerts !== null;

  const columns: readonly TableColumn<ImportRow>[] = [
    { key: "row", label: "Row", sortValue: (row) => row.sourceRowNumber, searchText: () => "" },
    { key: "query", label: "Query", sortValue: (row) => row.query.toLowerCase(), searchText: (row) => row.query },
    {
      key: "notes",
      label: "Notes",
      sortValue: (row) => row.issues.length + (matchesByRow.get(row.sourceRowNumber)?.length ?? 0),
      searchText: (row) => `${row.issues.join(" ")} ${matchesByRow.get(row.sourceRowNumber)?.map((match) => match.alert.query).join(" ") ?? ""}`,
    },
  ];

  const run = controller.run;
  const runActive: boolean = run !== null && ["running", "paused", "awaiting_captcha"].includes(run.status);
  const queryColumnMapped: boolean = mapping !== null && mapping.query !== null;
  const previous: AddStep | null = previousStep({ step });
  const next: AddStep | null = nextStep({ step });
  const advanceAllowed: boolean = canAdvance({ step, hasFile: csvTable !== null, queryColumnMapped, checkedRowCount: entries.length, withinAlertLimit: gate.allowed });

  return (
    <div>
      <StepProgress step={step} />
      {step === "file" && (
        <section aria-label="Import">
          <h2 className="mt-4 text-sm font-semibold">Import a CSV file</h2>
          <p className="text-xs text-muted-foreground">The file needs a column with the queries. Other columns are optional.</p>
          <details className="mt-1 text-xs">
            <summary className="cursor-pointer font-medium">Columns and allowed values</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
              <li><code>query</code>: the search text. Quotes and OR work as in Google Alerts.</li>
              <li><code>deliver_to</code>: <code>rss</code> or <code>email</code>.</li>
              <li><code>how_often</code>: <code>as_it_happens</code>, <code>daily</code> or <code>weekly</code>. RSS always uses as-it-happens.</li>
              <li><code>how_many</code>: <code>all</code> or <code>best</code>.</li>
              <li><code>sources</code>, <code>language</code>, <code>region</code>: the text of the Google dropdown, for example <code>English</code>.</li>
              <li>An empty cell uses the default from the app. Column names can differ. You map them after the import.</li>
            </ul>
          </details>
          <div className="mt-3 flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                downloadTextFile({ fileName: TEMPLATE_FILE_NAME, text: buildTemplateCsv() });
                onNotify(`Saved ${TEMPLATE_FILE_NAME}.`);
              }}
            >
              Download template CSV
            </Button>
            <FileDropzone
              label="Choose a CSV file"
              chosenFileName={fileName}
              onFile={(file: File) => { void importFile(file); }}
            />
          </div>
          <h3 className="mt-4 text-sm font-semibold">Or paste CSV text</h3>
          <p className="text-xs text-muted-foreground">Paste the text that you copied from an export.</p>
          <TextField
            type="textarea"
            rows={5}
            aria-label="CSV text"
            placeholder="query,deliver_to,how_often,how_many"
            value={pastedText}
            onValueChange={setPastedText}
            className="mt-2 w-full"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth
            className="mt-2"
            disabled={pastedText.trim() === ""}
            onClick={() => { importText({ text: pastedText, sourceName: "Pasted text" }); }}
          >
            Read pasted text
          </Button>
          {importError !== "" && <Banner tone="error">{importError}</Banner>}
        </section>
      )}
      {step === "columns" && csvTable !== null && mapping !== null && (
        <section aria-label="Columns">
          <h2 className="mt-4 text-sm font-semibold">Match the columns</h2>
          <p className="text-xs text-muted-foreground">
            File: <span className="font-medium text-foreground">{fileName}</span> ({String(csvTable.records.length)} data rows)
          </p>
          <ColumnMapper headers={csvTable.headers} mapping={mapping} onChange={setMapping} />
          {mapping.query === null && <Banner tone="warning">Choose the column that holds the queries.</Banner>}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium">Default alert options</summary>
            <SettingsForm settings={settings} onChange={onSettingsChange} saveStatus={saveStatus} locked={runActive} />
          </details>
        </section>
      )}
      {step === "review" && (
        <section aria-label="Review">
          <h2 className="mt-4 text-sm font-semibold">Check the rows</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {liveAlerts !== null && <span>{String(liveAlerts.length)} alerts in your account.</span>}
          </div>
          {live.error !== "" && <Banner tone="error">{live.error}</Banner>}
          {!gate.allowed && createCount + updateCount > 0 && <Banner tone="warning">{gate.reason}</Banner>}
          {liveAlerts === null && live.error === "" && <Banner tone="info">Reading your existing alerts to look for duplicates…</Banner>}
          <DataTable<ImportRow, number>
            rows={rows}
            columns={columns}
            rowKey={(row) => row.sourceRowNumber}
            renderCell={(row, columnKey) => {
              if (columnKey === "row") return String(row.sourceRowNumber);
              if (columnKey === "query") return <span className="font-mono">{row.query}</span>;
              const matches: AlertMatch[] = matchesByRow.get(row.sourceRowNumber) ?? [];
              return (
                <div>
                  {row.issues.map((issue: RowIssue) => (
                    <p key={issue} className="text-destructive">{ISSUE_TEXT[issue]}</p>
                  ))}
                  {matches.slice(0, 2).map((match: AlertMatch) => (
                    <p key={match.alert.query} className="text-amber-800">
                      {match.similarity === "exact" ? "Already exists, the alert is updated" : match.similarity === "same_words" ? "Same words as" : "Similar to"}:{" "}
                      <span className="font-mono">{match.alert.query}</span>
                    </p>
                  ))}
                  {matches.length > 0 && checkedRows.has(row.sourceRowNumber) && (
                    <RadioGroup
                      legend="What to do with this row"
                      value={actionFor({ row })}
                      onValueChange={(value: string) => {
                        setActionOverrides({ ...actionOverrides, [row.sourceRowNumber]: value as RowAction });
                      }}
                      choices={
                        matches[0]?.similarity === "exact"
                          ? [
                              { value: "update", label: "Update the alert" },
                              { value: "skip", label: "Skip this row" },
                            ]
                          : [
                              { value: "skip", label: "Skip this row" },
                              { value: "create", label: "Create anyway" },
                            ]
                      }
                    />
                  )}
                </div>
              );
            }}
            schema={ROWS_TABLE_SCHEMA}
            state={rowsState}
            onStateChange={setRowsState}
            filters={{
              all: () => true,
              problems: (row) => row.issues.length > 0,
              matches: (row) => matchesByRow.has(row.sourceRowNumber),
              checked: (row) => checkedRows.has(row.sourceRowNumber),
            }}
            filterLabels={{ all: "All rows", problems: "With problems", matches: "Similar to an alert", checked: "Checked" }}
            selection={{
              selected: checkedRows,
              isSelectable: (key) => {
                const row: ImportRow | undefined = rows.find((candidate: ImportRow) => candidate.sourceRowNumber === key);
                return row !== undefined && isSelectable({ row });
              },
              onToggleMany: (keys, checked) => {
                const next = new Set(checkedRows);
                for (const key of keys) {
                  if (checked) next.add(key);
                  else next.delete(key);
                }
                setCheckedRows(next);
              },
            }}
            emptyMessage="No rows match."
          />
        </section>
      )}
      {step === "start" && (
        <section aria-label="Start">
          <h2 className="mt-4 text-sm font-semibold">Read the notice and start</h2>
          <Banner tone="warning">
            This run creates {String(createCount)} alerts and updates {String(updateCount)} alerts. Google can slow, throttle, or show a bot check on large batches.
            If that happens the run stops and asks you to solve it. Google allows {String(ALERT_CAP_PER_ACCOUNT)} alerts for each account, and you have{" "}
            {String(liveCount)}. Keep the Alerts tab open and in the foreground.
          </Banner>
          {!gate.allowed && <p className="mt-1 text-xs text-destructive">{gate.reason}</p>}
          {gate.allowed && liveAlerts === null && <p className="mt-1 text-xs text-destructive">Wait until your existing alerts are read.</p>}
          <p className="mt-3 text-xs text-muted-foreground">When you click Start, you accept this notice.</p>
          <Button
            type="button"
            fullWidth
            className="mt-2"
            disabled={!canStart}
            onClick={() => {
              controller.begin(buildCreateRun({ entries, defaults: settings.defaults }));
            }}
          >
            Start: create {String(createCount)}, update {String(updateCount)}
          </Button>
        </section>
      )}
      <footer className="sticky -bottom-4 -mx-4 mt-4 flex items-center justify-between gap-2 border-t bg-background px-4 py-3">
        <Button type="button" variant="outline" size="sm" disabled={previous === null} onClick={() => { if (previous !== null) setStep(previous); }}>
          Back
        </Button>
        {next !== null && (
          <Button type="button" size="sm" disabled={!advanceAllowed} onClick={() => { setStep(next); }}>
            Next
          </Button>
        )}
      </footer>
    </div>
  );
}
