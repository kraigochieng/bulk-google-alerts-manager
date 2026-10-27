export type HowOften = "as_it_happens" | "daily" | "weekly";
export type HowMany = "all" | "best";
export type DeliverTo = "email" | "rss";

/** The six options of one alert, as set in the Google Alerts form. */
export interface AlertOptions {
  readonly howOften: HowOften;
  readonly sources: string;
  readonly language: string;
  readonly region: string;
  readonly howMany: HowMany;
  readonly deliverTo: DeliverTo;
}

/** Alert options that a CSV row sets. A missing key uses the app default. */
export type AlertOptionOverrides = Partial<AlertOptions>;

/** One alert that exists in the account, read from the live list. */
export interface LiveAlert {
  readonly query: string;
  readonly feedUrl: string | null;
}

export type RowIssue = "empty" | "too_long" | "duplicate_in_file" | "invalid_option" | "unlisted_option";

/** One row of the imported CSV file, with its validation result. */
export interface ImportRow {
  readonly sourceRowNumber: number;
  readonly query: string;
  readonly overrides: AlertOptionOverrides;
  readonly issues: readonly RowIssue[];
}

export type RowStatus = "pending" | "created" | "updated" | "skipped" | "failed" | "deleted";

/** What a run does with one item: create an alert, update the alert that has the same query, or delete an alert. */
export type ItemAction = "create" | "update" | "delete";

export type RunKind = "create" | "delete";

export type RunStatus =
  | "idle"
  | "running"
  | "paused"
  | "awaiting_captcha"
  | "completed"
  | "cancelled";

/** One alert to create or to delete in a run, with its result so far. */
export interface RunItem {
  readonly id: number;
  readonly query: string;
  readonly action: ItemAction;
  readonly options: AlertOptions | null;
  readonly status: RowStatus;
  readonly errorMessage: string;
}

/** The whole state of a run. The app saves it after every change. */
export interface RunSnapshot {
  readonly kind: RunKind;
  readonly status: RunStatus;
  readonly items: readonly RunItem[];
  readonly notice: string;
}
