/** Base class for every error that this project expects. */
export class BulkAlertsError extends Error {
  constructor({ message, cause }: { message: string; cause?: unknown }) {
    super(message, { cause });
    this.name = new.target.name;
  }
}

/** The Alerts page no longer matches the selectors in the content script. */
export class LayoutChangedError extends BulkAlertsError {
  readonly selectorName: string;

  constructor({ selectorName }: { selectorName: string }) {
    super({
      message: `Google's page layout changed, update the extension. Missing: ${selectorName}.`,
    });
    this.selectorName = selectorName;
  }
}

/** The query box does not hold the text that the run meant to submit. */
export class QueryVerificationError extends BulkAlertsError {
  readonly expectedQuery: string;
  readonly actualQuery: string;

  constructor({ expectedQuery, actualQuery }: { expectedQuery: string; actualQuery: string }) {
    super({ message: "The query box did not hold the expected text. Nothing was submitted." });
    this.expectedQuery = expectedQuery;
    this.actualQuery = actualQuery;
  }
}

/** A dropdown has no menu item with the requested text. */
export class OptionNotFoundError extends BulkAlertsError {
  readonly requestedText: string;
  readonly availableTexts: readonly string[];

  constructor({
    requestedText,
    availableTexts,
  }: {
    requestedText: string;
    availableTexts: readonly string[];
  }) {
    super({
      message: `The option "${requestedText}" is not in the menu. Available: ${availableTexts.join(", ")}.`,
    });
    this.requestedText = requestedText;
    this.availableTexts = availableTexts;
  }
}

/** The page shows a bot check. The user must solve it. The extension never tries to bypass it. */
export class CaptchaError extends BulkAlertsError {
  constructor() {
    super({ message: "Google shows a bot check. Solve it in the tab, then resume." });
  }
}

/** An alert did not appear or did not disappear in the list in time. */
export class AlertListTimeoutError extends BulkAlertsError {
  readonly query: string;

  constructor({ query, expectation }: { query: string; expectation: "appear" | "disappear" }) {
    super({ message: `The alert "${query}" did not ${expectation} in the list in time.` });
    this.query = query;
  }
}

/** The alert to delete is not in the list. */
export class AlertNotFoundError extends BulkAlertsError {
  readonly query: string;

  constructor({ query }: { query: string }) {
    super({ message: `No alert with the query "${query}" is in the list.` });
    this.query = query;
  }
}
