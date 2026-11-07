# Changelog

All notable changes to this project are in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- The run overlay shows an estimate of the time left after 3 items finish.
- A warning in the review step and the start step when checked rows update an existing alert. The run replaces all options of that alert. The note of the row says the same.
- A saved draft of the Add dialog. A reload of the page or a restart of the browser keeps the rows, the edits, the step, and the checks. A "Discard draft" button removes it, and a click on Start removes it too.
- A Delete button for each row in the review. The user confirms, and the file on the computer does not change.
- A dialog editor for each row in the review. The user fixes the search query and the options of a row, and the review checks the row again.
- The review step shows the final value of each option in each row. A value from the defaults shows in italic text.
- A limit of 1000 data rows for an imported file, because Google allows 1000 alerts for each account. A file with no data rows is refused too.
- A "Copy to clipboard" button for an export.
- Dropdowns for the default source, language, and region. The user can still type a value that is not listed.
- An xlsx template with dropdowns and a hidden `Lists` sheet.
- Import of `.xlsx` files. The import reads only the `Alerts` sheet.
- A warning for a source, language, or region that is not in the app lists. The row keeps the typed value.
- A warning for a column that is not in the template.

### Changed

- **Breaking:** the default alert options are the defaults of a new alert on the Google Alerts page: At most once a day, Automatic, English, Any Region, Only the best results, and Email. A user who saved other defaults keeps them.
- The Clear, Export, and Delete buttons of the bar slide in when an alert is checked and slide out when none is checked. The animation stops when the user prefers reduced motion.
- **Breaking:** the template and the export use the names, the order, and the values of the Google Alerts options panel. Example: `Deliver to` has the values `RSS feed` and `Email`. The old names such as `deliver_to` are refused. The import still reads a value written in the old style.
- The Add dialog has three steps: file, review, start. The default alert options moved to the review step, with the label "Blank cells use".

### Removed

- **Breaking:** the text box to paste CSV text, the "Download template CSV" button, and the "Columns and allowed values" help in the Add dialog. The "Download template" button gives the xlsx template. The import still accepts CSV and xlsx files.
- **Breaking:** the column mapping step. The import expects the column names of the template: `Search query`, `How often`, `Sources`, `Language`, `Region`, `How many`, and `Deliver to`. Header synonyms such as `keyword`, `topic`, and `country` no longer work. A file without a `query` column is refused.

## [1.0.0] - 2026-10-23

### Added

- The bar at the bottom of the Google Alerts page with the buttons Clear, Export, Delete, and Add.
- The Add dialog: import a CSV file or pasted CSV text, review the rows, and start a run that creates or updates alerts.
- Detection of similar alerts that already exist, and the alert limit of 1000 for each account.
- Pause, resume, and cancel for a run, and a stop when Google shows a bot check.
- Export of the checked alerts to a CSV file.
- Delete of the checked alerts after a confirmation.
- Step labels, a progress bar, and the counts of created and remaining alerts in the page heading.

[Unreleased]: https://github.com/kraigochieng/bulk-google-alerts-manager/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/kraigochieng/bulk-google-alerts-manager/releases/tag/v1.0.0
