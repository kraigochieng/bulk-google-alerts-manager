# Changelog

All notable changes to this project are in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- A "Copy to clipboard" button for an export, and a text box to paste CSV text in the Add dialog.
- Dropdowns for the default source, language, and region. The user can still type a value that is not listed.
- An xlsx template with dropdowns, a `Samples` sheet that the import never reads, and a hidden `Lists` sheet.
- Import of `.xlsx` files. The import reads only the `Alerts` sheet.
- A warning for a source, language, or region that is not in the app lists. The row keeps the typed value.
- A warning for a column that is not in the template.

### Changed

- The Add dialog has three steps: file, review, start. The default alert options moved to the file step.

### Removed

- **Breaking:** the column mapping step. The import expects the column names of the template: `query`, `deliver_to`, `how_often`, `how_many`, `sources`, `language`, and `region`. Header synonyms such as `keyword`, `topic`, and `country` no longer work. A file without a `query` column is refused.

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
