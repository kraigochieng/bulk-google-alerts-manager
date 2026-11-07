# Manual test checklist

Use throwaway queries that start with `bam test`. Use your own account.

1. Build with `npm run build`. Load `dist` in `chrome://extensions` (developer mode, unpacked).
2. Open `https://www.google.com/alerts`. Expect no element at the page edge. Expect a bar at the bottom of the page. Click the extension icon, or click Add in the bar. The Add dialog opens. Click Close. Scroll and click on the Google page and expect them to work.
3. Click Delete or Export in the bar before you accept the notice. Expect the first-run dialog. Accept it.
4. Add: import `fixtures/sample-queries.csv`. Expect the three steps (file, review, start) with Back and Next. The `extra` column of the file shows a warning and is ignored. A file without a `Search query` column shows an error and stays on the file step. Check 5 rows and click Start. Expect the foggy loader, then a dialog with Created: 5. Press OK.
4a. Add: click "Download template". Expect no paste box and no CSV template button. Expect the columns in this order: Search query, How often, Sources, Language, Region, How many, Deliver to. Open the file in a spreadsheet app. Expect the sheet Alerts (Lists is hidden) and no Samples sheet. In Alerts, click a cell under `region` and expect a dropdown. Type a value that is not in the list and expect no error. Fill two rows, save, and import the file. Expect the two rows in step 2. A row with an unlisted region shows a warning and stays checked.
5. Add the same file again: expect 5 updated rows and no new alert. Change `How often` in one row first and expect that alert to change.
6. Pause, resume, and cancel in a second run. Expect finished rows to stay.
7. Reload the page during a run. Open the Add dialog and resume. Expect no repeated creates.
8. Export: check 3 rows on the page. Expect the bar at the bottom of the page to show 3 selected. Click Export in the bar and wait. Expect the foggy loader, then a dialog with the buttons "Copy to clipboard" and "Download CSV". Click Download CSV and expect a CSV with one row per checked alert, all six options, and the feed link. Import it in Add and expect no warnings.
9. Delete: use the check-all box in the bar. Click Delete and confirm in the dialog. Expect the foggy loader, then a dialog with Deleted: 5.
10. With 11 or more alerts: click Show all alerts, then use check-all. Expect the count of all alerts. Expect the checkboxes to stay after you edit one alert.
11. Layout change check: rename a selector in `src/content/selectors.ts`, rebuild, run. Expect the message "Google's page layout changed, update the extension."
12. Checkbox position: expect each row to show a checkbox at its left edge. Check two rows that have the same query, if you have them. Expect both rows to check together.
13. Hidden tab: switch tab during a run. Expect a pause notice.
14. Heading: expect the list heading to read `My alerts (N created, M remaining)`. Add one alert and expect both numbers to change.
15. Limit: import more rows than the remaining count. Expect a warning on the review step and a Next button that stays off.
16. Page numbers: import more than 25 rows. Expect page numbers under the table. Click page 2.
17. Narrow window: make the browser window 600 pixels wide. Open the Add dialog. Expect all steps to stay usable.
18. Copy: export 3 alerts and click "Copy to clipboard". Expect the button to read Copied.
19. Bar buttons: with no alert checked, expect only the check-all box and Add. Check one alert and expect Clear, Export, and Delete to slide in. Clear the selection and expect them to slide out. Press Tab with no alert checked and expect no focus on a hidden button.
20. Defaults: with a new profile, open Add, import a file, and open "Blank cells use" in step 2. Expect At most once a day, Automatic, English, Any Region, Only the best results, and Email. Compare them with the options of a new alert on the Google Alerts page.
21. File limit: import a file with 1001 data rows. Expect an error that names the count and the limit, and no move to step 2. Import a file with 1000 rows and expect step 2. Import a file with only the header and expect the error "The file has no data rows."
22. Option summary: import a file where one row has `Language` and one row has no options. Expect "Uses the defaults" for the second row. Expect the language of the first row and the text "The other options use the defaults". Click Edit and expect all final options in the dialog. Expect As-it-happens for a row with Deliver to `RSS feed`.
23. Row editor: in step 2, click Edit on a row. A dialog opens with the title "Edit row N". Press Escape and expect the dialog to close. Open it again. Clear the search query and expect the issue "Empty query." and the row unchecked. Type a query and expect the row checked. Choose a value for `How often` and expect the options line of the row to change. Choose `Deliver to` RSS feed and expect `How often` disabled. Choose "Other" under `Region`, type a value that is not listed, and expect a warning.
24. Row delete: in step 2, click Delete on a row. Expect a dialog that names the row and its query. Click "Keep row" and expect the row to stay. Click Delete again, then "Delete row". Expect the row to leave the table, and the other rows to keep their row numbers. Expect the file on your computer to stay unchanged.
25. Draft: import a file, edit one row, and delete one row. Reload the Alerts page and open Add. Expect the banner "Restored your draft", the same rows, and your edits. Close and reopen the browser and expect the same. Click "Discard draft" and confirm. Expect the file step. Import a file, click Back, choose another file, and expect the dialog "Replace the draft?". Import a file, click Start, and expect the file step after the run starts.
26. Update warning: import a row with the query of an existing alert. Expect the note "Already exists. The run replaces its options with the options shown" and a warning banner with the count. Expect the same banner in step 3. Choose "Skip this row" and expect the banner to go.
27. Row badges: in step 2, expect each row to show one badge. Expect Problem for an empty query, Updates alert for an existing query, and New for a new query. Choose "Skip this row" and expect Skipped.
