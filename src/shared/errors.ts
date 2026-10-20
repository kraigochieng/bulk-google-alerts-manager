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
