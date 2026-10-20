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

/** Alert options that a CSV row sets. A missing key uses the panel default. */
export type AlertOptionOverrides = Partial<AlertOptions>;

/** One alert that exists in the account, read from the live list. */
export interface LiveAlert {
  readonly query: string;
  readonly feedUrl: string | null;
}

export type RowIssue = "empty" | "too_long" | "duplicate_in_file" | "invalid_option";

/** One row of the imported CSV file, with its validation result. */
export interface ImportRow {
  readonly sourceRowNumber: number;
  readonly query: string;
  readonly label: string;
  readonly overrides: AlertOptionOverrides;
  readonly issues: readonly RowIssue[];
}

export type RowStatus = "pending" | "created" | "skipped" | "failed" | "deleted";

/** The result of one row after a run. */
export interface RowResult {
  readonly query: string;
  readonly status: RowStatus;
  readonly rssLink: string;
  readonly errorMessage: string;
}
