# Release checklist for the Chrome Web Store

Steps marked **Owner** need your Google account or your decision. I could not check the live developer dashboard.
Field names in the dashboard can differ from the names here.

## Before the upload

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run audit`. All must pass.
2. **Owner.** Run all steps of [manual-test-checklist.md](manual-test-checklist.md) on your own account. Record any failure as an issue.
3. **Owner.** Choose the version number. Set the same number in `manifest.config.ts` and in `package.json`. The store rejects an upload with a version that is not higher than the last upload.
4. Run `npm run package`. It writes `bulk-google-alerts-manager.zip`.
5. Unzip the file into an empty folder. Load that folder with "Load unpacked". Check that the bar shows on the Alerts page.
6. Check that `manifest.json` in the zip has only the `storage` permission and the host access `https://www.google.com/alerts*`.

## Store account

1. **Owner.** Register as a developer at the Chrome Web Store developer dashboard. The one-time registration fee is 5 US dollars.
2. **Owner.** Turn on 2-step verification for the Google account. The dashboard needs it.
3. **Owner.** Set and verify the contact email in the account settings.

## Listing

Copy the text from [store-listing.md](store-listing.md).

1. **Owner.** Upload the zip as a new item.
2. Fill in the name, the short description, the long description, and the category.
3. Upload the icon `public/icons/icon-128.png`.
4. Use the screenshots in `docs/store-assets/`. **Owner.** Replace the files 1, 2, and 4 with captures from a signed-in account (see the limit in [store-listing.md](store-listing.md)). Use test queries that start with `bam test`. Do not show personal queries.
5. Use the promo tiles in `docs/store-assets/`: the small tile (440x280) and the optional marquee tile (1400x560).
6. Set the support link to `https://github.com/kraigochieng/bulk-google-alerts-manager/issues`.

## Privacy tab

1. Paste the single purpose from [store-listing.md](store-listing.md).
2. Paste the permission reasons from the table in [store-listing.md](store-listing.md). Add the reason for the host access.
3. Answer "Do you use remote code?" with no.
4. Answer the data usage questions: the extension collects no user data.
5. Check the three certifications about data use.
6. Set the privacy policy link to `https://github.com/kraigochieng/bulk-google-alerts-manager/blob/main/docs/privacy-policy.md`.

## Submit

1. **Owner.** Choose the visibility: public, unlisted, or private to testers. Unlisted is a safe first choice.
2. **Owner.** Choose the regions.
3. **Owner.** Submit the item for review. The review time varies.
4. After approval, install the item from the store link. Run steps 2 to 4 of the manual checklist again.

## Risks to check

| Risk | Effect | Action |
|---|---|---|
| The name contains "Google". | The review can reject the name as a claim of affiliation. | The name uses the form "for Google Alerts". The name and the first lines of the description say "Unofficial" and "Not affiliated with Google". |
| The extension edits a Google page. | The reviewer can ask why. | The single purpose and the permission reasons name the Alerts page only. |
| The web-accessible resources match `https://www.google.com/*`. | The reviewer can ask why the pattern is wider than the Alerts page. | Answer that Chrome checks only the origin for this field. I tested that a narrower pattern stops the dialog from loading. |
| Google changes the Alerts page. | The extension stops with a clear message. | Fix the selectors in `src/content/selectors.ts`. Raise the version. Upload again. |
