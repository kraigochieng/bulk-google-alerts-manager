import { useCallback, useMemo, useReducer, useState } from "react";
import type { JSX } from "react";

import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { canAdvance, nextStep, previousStep } from "src/core/add-steps";
import type { AddStep } from "src/core/add-steps";
import { draftRowsFromTable, importRowsFromDraft } from "src/core/draft-rows";
import { parseCsv } from "src/core/csv";
import type { CsvTable } from "src/core/csv";
import { checkFileRows } from "src/core/file-limit";
import { findMatches } from "src/core/matching";
import type { AlertMatch } from "src/core/matching";
import { describeRowOptions } from "src/core/row-options";
import type { RowOptionView } from "src/core/row-options";
import type { DraftRow } from "src/core/draft-rows";
import { EMPTY_REVIEW_STATE, reviewReducer } from "src/core/review-reducer";
import type { ReviewAction, ReviewState, RowAction } from "src/core/review-reducer";
import { WARNING_ISSUES, isRowSelectable } from "src/core/row-rules";
import { MAXIMUM_QUERY_LENGTH } from "src/core/row-validation";
import { isXlsxFile } from "src/core/file-type";
import { checkHeaders, FIELD_HEADERS } from "src/core/template-columns";
import type { HeaderReport } from "src/core/template-columns";
import { buildTemplateWorkbook } from "src/core/template-workbook";
import { readTemplateWorkbook } from "src/core/workbook-reader";
import { TEMPLATE_WORKBOOK_FILE_NAME, WORKBOOK_MIME_TYPE } from "src/core/workbook-sheets";
import { buildCreateRun } from "src/core/run-builders";
import type { CreateEntry } from "src/core/run-builders";
import { checkCreateGate } from "src/core/start-gates";
import type { GateResult } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import type { Settings } from "src/core/settings";
import { StepProgress } from "src/panel/components/step-progress";
import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import { FileDropzone } from "src/panel/ui/file-dropzone";
import { RadioGroup } from "src/panel/ui/radio-group";
import { ConfirmDialog } from "src/panel/components/confirm-dialog";
import { RowEditor } from "src/panel/components/row-editor";
import { SettingsForm } from "src/panel/components/settings-form";
import type { SaveStatus } from "src/panel/use-autosave";
import { DataTable } from "src/panel/components/data-table";
import { downloadBinaryFile } from "src/panel/chrome-bridge";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import { useTableState } from "src/panel/use-table-state";
import { BulkAlertsError } from "src/shared/errors";
import type { ImportRow, LiveAlert, RowIssue } from "src/shared/models";

export const ROWS_TABLE_SCHEMA: TableSchema = {
  sortKeys: ["row", "query", "notes"],
  filters: ["all", "problems", "matches", "checked"],
  defaultState: { search: "", sortKey: "row", sortDirection: "asc", page: 0, filter: "all" },
};

const ISSUE_TEXT: Record<RowIssue, string> = {
  empty: "Empty query.",
  too_long: `Query is longer than ${String(MAXIMUM_QUERY_LENGTH)} characters.`,
  duplicate_in_file: "Same query appears earlier in this file.",
  invalid_option: "A value in an option column is not valid. Use the values of the dropdowns in the template.",
  unlisted_option: "A source, language, or region is not in the app lists. The app uses it as typed.",
};

/** Render the Add flow as three steps: file, review, start. Holds the state of the flow. */
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
  const [extraColumns, setExtraColumns] = useState<readonly string[]>([]);
  const [importError, setImportError] = useState<string>("");
  const [review, dispatchReview] = useReducer(
    (state: ReviewState, action: ReviewAction): ReviewState => reviewReducer({ state, action, maximumQueryLength: MAXIMUM_QUERY_LENGTH }),
    EMPTY_REVIEW_STATE,
  );
  const { checkedRows, actionOverrides } = review;
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const liveAlerts: readonly LiveAlert[] | null = live.alerts;
  const [step, setStep] = useState<AddStep>("file");
  const [rowsState, setRowsState] = useTableState({ schema: ROWS_TABLE_SCHEMA });

  const rows: readonly ImportRow[] = useMemo(
    () => importRowsFromDraft({ rows: review.rows, maximumQueryLength: MAXIMUM_QUERY_LENGTH }),
    [review.rows],
  );

  const draftRowsByNumber: ReadonlyMap<number, DraftRow> = useMemo(
    () => new Map(review.rows.map((row: DraftRow): [number, DraftRow] => [row.sourceRowNumber, row])),
    [review.rows],
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

  const importTable = useCallback(
    ({ table, sourceName }: { table: CsvTable; sourceName: string }): void => {
      const fileGate: GateResult = checkFileRows({ rowCount: table.records.length, limit: ALERT_CAP_PER_ACCOUNT });
      if (!fileGate.allowed) {
        setImportError(fileGate.reason);
        return;
      }
      const report: HeaderReport = checkHeaders({ headers: table.headers });
      if (report.missingRequired.length > 0) {
        setImportError(
          `The file has no "${FIELD_HEADERS.query}" column. Use the column names of the template. The columns in the file are: ${table.headers.join(", ")}.`,
        );
        return;
      }
      setFileName(sourceName);
      onNotify(`Read ${String(table.records.length)} rows from ${sourceName}.`);
      dispatchReview({ type: "load", rows: draftRowsFromTable({ table, mapping: report.columnIndexes }) });
      setEditingRow(null);
      setExtraColumns(report.extraColumns);
      setStep("review");
      setRowsState(ROWS_TABLE_SCHEMA.defaultState);
      live.refresh();
    },
    [live, setRowsState, onNotify],
  );

  const importText = useCallback(
    ({ text, sourceName }: { text: string; sourceName: string }): void => {
      setImportError("");
      try {
        importTable({ table: parseCsv({ text }), sourceName });
      } catch (error: unknown) {
        setImportError(error instanceof Error ? error.message : "The text could not be read.");
      }
    },
    [importTable],
  );

  const importFile = useCallback(
    async (file: File): Promise<void> => {
      if (!isXlsxFile({ name: file.name, type: file.type })) {
        importText({ text: await file.text(), sourceName: file.name });
        return;
      }
      setImportError("");
      try {
        importTable({ table: await readTemplateWorkbook({ bytes: await file.arrayBuffer() }), sourceName: file.name });
      } catch (error: unknown) {
        setImportError(error instanceof BulkAlertsError ? error.message : "The file could not be read.");
      }
    },
    [importText, importTable],
  );

  const entries: CreateEntry[] = rows
    .filter((row: ImportRow) => checkedRows.has(row.sourceRowNumber) && isRowSelectable({ row }))
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
  const previous: AddStep | null = previousStep({ step });
  const next: AddStep | null = nextStep({ step });
  const advanceAllowed: boolean = canAdvance({ step, hasFile: fileName !== "", checkedRowCount: entries.length, withinAlertLimit: gate.allowed });

  return (
    <div>
      <StepProgress step={step} />
      {step === "file" && (
        <section aria-label="Import">
          <h2 className="mt-4 text-sm font-semibold">Import a file</h2>
          <p className="text-xs text-muted-foreground">Start from the template. You can also import a CSV file with the same column names. The file needs a Search query column.</p>
          <div className="mt-3 flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                void buildTemplateWorkbook().then((bytes: Uint8Array<ArrayBuffer>) => {
                  downloadBinaryFile({ fileName: TEMPLATE_WORKBOOK_FILE_NAME, bytes, mimeType: WORKBOOK_MIME_TYPE });
                  onNotify(`Saved ${TEMPLATE_WORKBOOK_FILE_NAME}.`);
                });
              }}
            >
              Download template
            </Button>
            <FileDropzone
              label="Choose a CSV or xlsx file"
              chosenFileName={fileName}
              onFile={(file: File) => { void importFile(file); }}
            />
          </div>
          {importError !== "" && <Banner tone="error">{importError}</Banner>}
        </section>
      )}
      {step === "review" && (
        <section aria-label="Review">
          <h2 className="mt-4 text-sm font-semibold">Check the rows</h2>
          <p className="text-xs text-muted-foreground">
            File: <span className="font-medium text-foreground">{fileName}</span> ({String(rows.length)} data rows)
          </p>
          {extraColumns.length > 0 && (
            <Banner tone="warning">These columns are not in the template and are ignored: {extraColumns.join(", ")}.</Banner>
          )}
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer font-medium">
              Blank cells use:{" "}
              <span className="font-normal text-muted-foreground">
                {describeRowOptions({ row: { overrides: {} }, defaults: settings.defaults })
                  .filter((view: RowOptionView) => view.source !== "forced")
                  .map((view: RowOptionView) => view.value)
                  .join(", ")}
              </span>
            </summary>
            <SettingsForm settings={settings} onChange={onSettingsChange} saveStatus={saveStatus} locked={runActive} />
          </details>
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
              if (columnKey === "query") {
                const draftRow: DraftRow | undefined = draftRowsByNumber.get(row.sourceRowNumber);
                return (
                  <div>
                    <span className="font-mono">{row.query}</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {describeRowOptions({ row, defaults: settings.defaults }).map((view: RowOptionView) => (
                        <span key={view.field} className="mr-2 inline-block" title={view.source === "default" ? "From the defaults" : view.source === "forced" ? "RSS always uses As-it-happens" : "From the file"}>
                          {view.label}: <span className={view.source === "row" ? "font-medium text-foreground" : "italic"}>{view.value}</span>
                        </span>
                      ))}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`${editingRow === row.sourceRowNumber ? "Close the editor of" : "Edit"} row ${String(row.sourceRowNumber)}`}
                      onClick={() => { setEditingRow(editingRow === row.sourceRowNumber ? null : row.sourceRowNumber); }}
                    >
                      {editingRow === row.sourceRowNumber ? "Close" : "Edit"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete row ${String(row.sourceRowNumber)}`}
                      onClick={() => { setRowToDelete(row.sourceRowNumber); }}
                    >
                      Delete
                    </Button>
                    {editingRow === row.sourceRowNumber && draftRow !== undefined && (
                      <RowEditor
                        row={draftRow}
                        defaults={settings.defaults}
                        onQueryChange={(query: string) => { dispatchReview({ type: "edit_query", rowNumber: row.sourceRowNumber, query }); }}
                        onOptionChange={({ field, text }) => { dispatchReview({ type: "edit_option", rowNumber: row.sourceRowNumber, field, text }); }}
                        onClose={() => { setEditingRow(null); }}
                      />
                    )}
                  </div>
                );
              }
              const matches: AlertMatch[] = matchesByRow.get(row.sourceRowNumber) ?? [];
              return (
                <div>
                  {row.issues.map((issue: RowIssue) => (
                    <p key={issue} className={WARNING_ISSUES.includes(issue) ? "text-amber-800" : "text-destructive"}>{ISSUE_TEXT[issue]}</p>
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
                        dispatchReview({ type: "set_action", rowNumber: row.sourceRowNumber, action: value as RowAction });
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
                return row !== undefined && isRowSelectable({ row });
              },
              onToggleMany: (keys, checked) => {
                dispatchReview({ type: "set_checked", rowNumbers: keys, checked });
              },
            }}
            emptyMessage="No rows match."
          />
          <ConfirmDialog
            open={rowToDelete !== null}
            title={`Delete row ${String(rowToDelete ?? "")}?`}
            description={`Remove row ${String(rowToDelete ?? "")} from this import:\n${draftRowsByNumber.get(rowToDelete ?? -1)?.query ?? ""}\nThe file on your computer does not change.`}
            confirmLabel="Delete row"
            keepLabel="Keep row"
            onConfirm={() => {
              if (rowToDelete === null) return;
              dispatchReview({ type: "delete_row", rowNumber: rowToDelete });
              if (editingRow === rowToDelete) setEditingRow(null);
              setRowToDelete(null);
            }}
            onOpenChange={(open: boolean) => { if (!open) setRowToDelete(null); }}
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
