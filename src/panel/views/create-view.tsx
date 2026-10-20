import { useCallback, useMemo, useState } from "react";
import type { JSX } from "react";

import { ALERT_CAP_PER_ACCOUNT } from "src/core/alert-cap";
import { buildImportRows, guessMapping } from "src/core/column-mapping";
import type { ColumnMapping } from "src/core/column-mapping";
import { parseCsv } from "src/core/csv";
import type { CsvTable } from "src/core/csv";
import { findMatches } from "src/core/matching";
import type { AlertMatch } from "src/core/matching";
import { MAXIMUM_QUERY_LENGTH } from "src/core/row-validation";
import { createResultCsv } from "src/core/result-csv";
import { buildCreateRun } from "src/core/run-builders";
import type { CreateEntry } from "src/core/run-builders";
import { checkCreateGate } from "src/core/start-gates";
import type { TableColumn } from "src/core/table-query";
import type { TableSchema } from "src/core/table-state";
import type { Settings } from "src/core/settings";
import { Banner } from "src/panel/components/banner";
import { Button } from "src/panel/ui/button";
import { Checkbox } from "src/panel/ui/checkbox";
import { Input } from "src/panel/ui/input";
import { Label } from "src/panel/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/panel/ui/select";
import { ColumnMapper } from "src/panel/components/column-mapper";
import { DataTable } from "src/panel/components/data-table";
import { RUN_TABLE_SCHEMA, RunPanel } from "src/panel/components/run-panel";
import { downloadTextFile } from "src/panel/chrome-bridge";
import type { LiveAlertsState } from "src/panel/use-live-alerts";
import type { RunController } from "src/panel/use-run-controller";
import { useTableUrlState } from "src/panel/use-table-url-state";
import type { ImportRow, LiveAlert, RowIssue } from "src/shared/models";

export const ROWS_TABLE_SCHEMA: TableSchema = {
  prefix: "rows",
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

type RowAction = "create" | "skip";

function isSelectable({ row }: { row: ImportRow }): boolean {
  return !row.issues.some((issue: RowIssue) => BLOCKING_ISSUES.includes(issue));
}

function defaultChecked({ row }: { row: ImportRow }): boolean {
  return row.issues.length === 0;
}

/** Render the bulk create flow: import, map, review, notice, run. Holds the state of the flow. */
export function CreateView({
  settings,
  controller,
  live,
}: {
  settings: Settings;
  controller: RunController;
  live: LiveAlertsState;
}): JSX.Element {
  const [fileName, setFileName] = useState<string>("");
  const [csvTable, setCsvTable] = useState<CsvTable | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [importError, setImportError] = useState<string>("");
  const [checkedRows, setCheckedRows] = useState<ReadonlySet<number>>(new Set());
  const [actionOverrides, setActionOverrides] = useState<Readonly<Record<number, RowAction>>>({});
  const liveAlerts: readonly LiveAlert[] | null = live.alerts;
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [rowsState, setRowsState] = useTableUrlState({ schema: ROWS_TABLE_SCHEMA });
  const [runState, setRunState] = useTableUrlState({ schema: RUN_TABLE_SCHEMA });

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
      return matchesByRow.get(row.sourceRowNumber)?.[0]?.similarity === "exact" ? "skip" : "create";
    },
    [actionOverrides, matchesByRow],
  );

  const importFile = useCallback(
    async (file: File): Promise<void> => {
      setImportError("");
      try {
        const table: CsvTable = parseCsv({ text: await file.text() });
        const guessed: ColumnMapping = guessMapping({ headers: table.headers });
        setFileName(file.name);
        setCsvTable(table);
        setMapping(guessed);
        setActionOverrides({});
        setAcknowledged(false);
        setRowsState(ROWS_TABLE_SCHEMA.defaultState, { history: "replace" });
        live.refresh();
      } catch (error: unknown) {
        setImportError(error instanceof Error ? error.message : "The file could not be read.");
      }
    },
    [live, setRowsState],
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
  const liveCount: number = liveAlerts?.length ?? 0;
  const gate = checkCreateGate({ liveCount, createCount, cap: ALERT_CAP_PER_ACCOUNT, risksAccepted: acknowledged });
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
  const runIsCreate: boolean = run?.kind === "create";
  const runActive: boolean = run !== null && ["running", "paused", "awaiting_captcha"].includes(run.status);

  if (run !== null && !runIsCreate) {
    return <Banner tone="warning">A delete run is open. Finish or close it before you create alerts.</Banner>;
  }

  return (
    <div>
      {run !== null && (
        <RunPanel
          run={run}
          onPause={() => { controller.send({ type: "pause", reason: "You paused the run." }); }}
          onResume={controller.resume}
          onCancel={() => { controller.send({ type: "cancel" }); }}
          onRetryFailed={controller.resume}
          onExport={() => { downloadTextFile({ fileName: "create-results.csv", text: createResultCsv({ items: run.items }) }); }}
          onClose={controller.clear}
          tableState={runState}
          onTableStateChange={setRunState}
        />
      )}
      {!runActive && (
        <section aria-label="Import">
          <h2 className="mt-3 text-sm font-semibold">1. Import a CSV file</h2>
          <p className="text-xs text-muted-foreground">The file needs a column with the queries. Other columns are optional.</p>
          <Input
            type="file"
            accept=".csv,text/csv"
            aria-label="Choose a CSV file"
            onChange={(event) => {
              const file: File | undefined = event.target.files?.[0];
              if (file !== undefined) void importFile(file);
            }}
            className="mt-1 h-8 text-xs"
          />
          {importError !== "" && <Banner tone="error">{importError}</Banner>}
          {csvTable !== null && mapping !== null && (
            <>
              <p className="mt-1 text-xs">
                {fileName}: {String(csvTable.records.length)} data rows.
              </p>
              <ColumnMapper headers={csvTable.headers} mapping={mapping} onChange={setMapping} />
              {mapping.query === null && <Banner tone="warning">Choose the column that holds the queries.</Banner>}
            </>
          )}
        </section>
      )}
      {!runActive && rows.length > 0 && (
        <section aria-label="Review">
          <h2 className="mt-3 text-sm font-semibold">2. Check the rows</h2>
          <div className="flex items-center gap-2 text-xs">
            <Button type="button" variant="outline" size="sm" onClick={live.refresh}>
              Read my alerts again
            </Button>
            {liveAlerts !== null && <span>{String(liveAlerts.length)} alerts in your account.</span>}
          </div>
          
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
                    <p key={issue} className="text-red-700">{ISSUE_TEXT[issue]}</p>
                  ))}
                  {matches.slice(0, 2).map((match: AlertMatch) => (
                    <p key={match.alert.query} className="text-amber-800">
                      {match.similarity === "exact" ? "Already exists" : match.similarity === "same_words" ? "Same words as" : "Similar to"}:{" "}
                      <span className="font-mono">{match.alert.query}</span>
                    </p>
                  ))}
                  {matches.length > 0 && checkedRows.has(row.sourceRowNumber) && (
                    <Select
                      value={actionFor({ row })}
                      onValueChange={(value: string) => {
                        setActionOverrides({ ...actionOverrides, [row.sourceRowNumber]: value as RowAction });
                      }}
                    >
                      <SelectTrigger size="sm" className="mt-0.5 h-7 text-xs" aria-label={`Action for row ${String(row.sourceRowNumber)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip this row</SelectItem>
                        <SelectItem value="create">Create anyway</SelectItem>
                      </SelectContent>
                    </Select>
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
      {!runActive && rows.length > 0 && (
        <section aria-label="Start">
          <h2 className="mt-3 text-sm font-semibold">3. Read the notice and start</h2>
          <Banner tone="warning">
            This run will create {String(createCount)} alerts, with a random wait of {String(settings.minimumDelaySeconds)} to{" "}
            {String(settings.maximumDelaySeconds)} seconds between them. Google can slow, throttle, or show a bot check on large batches.
            If that happens the run stops and asks you to solve it. Google allows {String(ALERT_CAP_PER_ACCOUNT)} alerts for each account, and you have{" "}
            {String(liveCount)}. Keep the Alerts tab open and in the foreground.
          </Banner>
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id="notice-read"
              checked={acknowledged}
              onCheckedChange={(checked) => { setAcknowledged(checked === true); }}
            />
            <Label htmlFor="notice-read" className="text-xs">I have read this notice.</Label>
          </div>
          {!gate.allowed && <p className="mt-1 text-xs text-red-700">{gate.reason}</p>}
          {gate.allowed && liveAlerts === null && <p className="mt-1 text-xs text-red-700">Wait until your existing alerts are read.</p>}
          <Button
            type="button"
            className="mt-2"
            disabled={!canStart}
            onClick={() => {
              setAcknowledged(false);
              controller.begin(buildCreateRun({ entries, defaults: settings.defaults }));
            }}
          >
            Start creating {String(createCount)} alerts
          </Button>
        </section>
      )}
    </div>
  );
}
