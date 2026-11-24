# Changelog

All notable changes to DATAsaster (repo `iririrish/datasaster`) are documented here.

**Reconstructed from the chat history and checked against the current source.** Dates are unknown (the history carries none), so entries are in chronological order of the conversation. Labels: **CONFIRMED** (present in current code), **UNVERIFIED** (claimed in chat, not seen in code), **PROPOSED** (discussed only), **NOT TESTED** (nobody confirmed it on a real device).
Only the DATAsaster repo is covered. The single-file builds (`ph-alert-map.html`, `alertph.html`) are separate lineages and are not part of this changelog.

## Pre-repo prototypes - Date unknown
### Added
- Single-file map app `ph-alert-map.html` (map, news, categories, report form, emergency contacts), then an installable PWA zip with bottom bar, offline shell, Resolved status. (Prototype, not this repo's code.)
### Notes
- A moodboard re-skin (globe logo, blue palette) was applied and then reverted at the owner's request.

## Repo split and group editing - Date unknown
### Changed
- App split into `index.html`, `css/style.css`, `js/data.js`, `js/app.js`, `lib/`, plus README with GitHub Pages and group-editing steps.
### Technical Changes
- Cache name `datasaster-v4` to `v5` mentioned for updates.
### Notes
- Repo created by owner on GitHub Pages. Tested only with fake data by the assistant.

## Shared reports with Firebase - Date unknown
### Added
- `js/cloud.js`, `js/firebase-config.js`, `firestore.rules`, local Firebase compat libs. Anonymous sign-in, Firestore reports, live updates, offline queue. **CONFIRMED**
- Admin sign-in (Email/Password) with `admins/<uid>` check; admin can resolve and delete any report. **CONFIRMED**
### Technical Changes
- Cache `datasaster-v6`, then `v7`. Photos stored inside the report document (no Storage).
### Notes
- Owner configured the Firebase project and created the admin account/UID in the console. Not tested by the assistant against a live project at that time.

## Street view and news-scroll fix - Date unknown
### Added
- "Street view" button (Google Maps link); optional in-panel embed with `MAPS_EMBED_KEY`. **CONFIRMED** (code present; embed key left empty)
### Fixed
- News source dropdown no longer jumps to top (`renderNews(keepSel)`). **CONFIRMED in code; fix unverified by owner**
### Notes
- 3D view and similar-report grouping were offered; 3D declined. See next entries for grouping.

## Spam protection, verification, flags, alerts, quakes - Date unknown
### Added
- 2-minute posting limit (rules `canPost()` plus `users/{uid}.lastPost`). **CONFIRMED**
- App Check (reCAPTCHA Enterprise key in config). **CONFIRMED**
- Admin "verified" status, visitor flags with admin review list, CSV export (200 reports). **CONFIRMED**
- In-app proximity alerts for High/Critical reports. **CONFIRMED**
- Live earthquakes from USGS + EMSC, min-magnitude setting, 60 s refresh; sample quakes removed. **CONFIRMED**
- Live layers (radar, cloud, rain, river, fires, storms). **CONFIRMED**
### Changed
- README updated with these setup steps (README still says `datasaster-v5`, outdated).
### Technical Changes
- Cache version reached `datasaster-v13` then `v14` while debugging; hide-reports patch moved it `v17` to `v18` (current in sw.js: `v18`). 

## "Hide reports" switch and legend rebuild - Date unknown
### Added
- "Incident reports" on/off layer switch; legend with clickable type/severity filters and counts. **CONFIRMED** (`LAYERS` entry, `renderLegend`, `data-sevf`)
### Notes
- Assistant could not push to GitHub (403); owner uploaded `js/app.js`, `js/data.js`, `css/style.css`, `sw.js` manually. Headless test only.

## Posting failures (permission-denied) - Date unknown
### Fixed
- Posts were rejected by the rules. Cause **never identified**. Debugging steps: duplicate `cloud.js` suspected (repo copy has one `var C = window.CLOUD`), App Check unenforced, temporary open rules, then loosened rules. Reports worked with loosened rules.
### Added
- `CLOUD.diagnose()` and a detailed failure alert (signed in, device time, App Check token, read test). **CONFIRMED**
### Changed
- Strict rules restored in the later update (below). **Whether strict rules post successfully is UNVERIFIED.**
### Notes
- Temporary open rules were published for a while; owner confirmed "working" on loosened rules only.

## Typhoon, landslide, multi-photo and zoom - Date unknown
### Added
- Report types `typhoon` and `landslide` (form, filter, legend, severity text, rules). **CONFIRMED**
- 0 to 3 photos per report, preview with remove button, client-side shrinking, fullscreen lightbox with zoom/prev/next, new `imgs` field. **CONFIRMED**
### Changed
- Rules: type list extended, photo size 230,000 chars each, `time` tolerance widened to 1 hour, `canPost()` restored. **CONFIRMED** in `firestore.rules`
### Technical Changes
- Cache `v14` to `v15`. Owner must publish the new rules together with the files. Only a simulated browser test was run.

## Page jumps to top, admin sign-in error - Date unknown
### Fixed
- Scroll position kept when feed/settings re-render, feed row selection scrolls only inside the list, tab switch only scrolls on real tab change, click safety net. **CONFIRMED in code** (`renderFeed`, `onDocClick`); owner has not confirmed the jump is gone.
- Admin sign-in now shows the real Firebase error code. **CONFIRMED**
### Notes
- Owner hit `auth/invalid-credential`; recreated the admin user and the `admins/<new UID>` document. Result of the final sign-in is **not reported**.

## Header tweaks - Date unknown
### Changed
- Tagline no-wrap rules (second `.brand small` block under "NEW MAIN MENU + LONGER TAGLINE"); `#logo` fixed at a locked square box. **CONFIRMED in style.css**
### Notes
- `<title>` still has a trailing space.

## Rain forecast map, wind, timeline - Date unknown
### Added
- Forecast map layer `fcmap`: rain heat map, wind streaks, timeline bar, city weather icons. **CONFIRMED** (`FCS`, `fc*` functions, layer pushed into `LAYERS`)
### Changed
- Coverage enlarged and request grid reduced to **300 points** (15 x 20, 2 degree step); lower rain/timeline/wind opacity. **CONFIRMED** (`FCS` latTop 28, latBot 0, lngW 102, lngE 140, step 2)
### Notes
- Not tested on a real screen.

## Moved hosting plan: GitHub Pages to Vercel - Date unknown
### Added
- `index.html` includes Vercel Insights scripts. **CONFIRMED**
### Notes
- Owner confirmed they now use Vercel. Repo structure confirmed: `css/`, `js/`, `lib/` plus root files; no `api/` folder, no `vercel.json`. Whether the repo is private, and whether the Vercel domain was added to Firebase authorized domains and the reCAPTCHA key, is still UNKNOWN.

## Not implemented (history only)
- **PROPOSED:** PAGASA wind-signal layer (only a Claude Design mockup exists, no code).
- **PROPOSED:** Filipino/English translation (build offered, no code).
- **PROPOSED:** Automatic resolve-after-N-days rule; Vercel function to cache forecast data; denser grid over PH only.
- **Single-file builds only, not in repo:** Home page, incident matching/statuses/moderator, SQL schema.

## Agency roles and audit log (Agency Portal step 1) - Date unknown
### Added
- Two admin roles: **owner** (any `admins/<uid>` doc without `role: agency`, so existing admins are unchanged) and **agency** (`role`, `agency`, `types` fields). Agencies can verify/resolve only reports of their listed hazard types and cannot delete. **IMPLEMENTED, NOT TESTED against live Firebase**
- `audit` collection (append-only; owner reads). Entries for VERIFY, UNVERIFY, RESOLVE, REOPEN, DELETE, FLAGS_DISMISS, written in the same batch as the change. Agency updates are rejected by the rules unless they carry a matching `auditId`.
- Settings > Admin: shows role text, an owner-only "Audit log" panel (Load/Refresh, last 50).
### Changed
- `firestore.rules`: new helpers `isOwner`, `isAgency`, `adminDoc`, `auditOk`; report delete and flag delete are owner-only; owner/agency report updates may carry `auditId`.
- `js/cloud.js`: `CLOUD.owner/role/agency/types`, `CLOUD.can(type)`, `setRole`, `auditRef`, `listAudit`; `setResolved`, `setVerified`, `remove`, `dismissFlags` now write audit entries for admin actions.
- `js/app.js`: report buttons (resolve, verify, delete), flag dismiss/delete and `own` follow the role and hazard scope.
### Technical Changes
- Files modified: `firestore.rules`, `js/cloud.js`, `js/app.js`, `sw.js` (cache `datasaster-v18` to `v19`), `DEV_README.md`, `CHANGELOG.md`, `DEVELOPMENT_STATUS.md`. No new files. New Firestore collection: `audit`. Rules must be re-published by hand.
### Notes
- Tests run: `node --check` on app.js and cloud.js, and a mock test of the role/audit logic in cloud.js (12 checks passed). The rules and the UI were **not** run (no Firestore emulator or browser here).
- Not done yet (later steps): agency assessments, official advisories, agency registry screens.

## Agency assessments (Agency Portal step 2) - Date unknown
### Added
- `assessments` collection: one document per agency per report (`<reportId>_<AGENCY>`), public to read, written only by agency accounts for their own hazard types. Statuses: under review, corroborated, not corroborated, duplicate, unable to verify, plus an optional public note. **IMPLEMENTED, NOT TESTED against live Firebase**
- Report details: "Agency assessments" section (all agencies' assessments, a reminder that "not corroborated" does not mean false) and, for an eligible agency account, a form to save its assessment. The feed row shows a short tag such as "PAGASA: Corroborated".
- New audit action `ASSESS` (status stored in the audit note), required by the rules for every assessment write.
### Technical Changes
- Files modified: `firestore.rules` (new `assessments` match, `auditOkFor`, `ASSESS` action), `js/cloud.js` (`watchAssess`, `saveAssess`, audit note), `js/app.js` (`assessHtml`, `trustLine`, assess handler, audit log row shows note), `sw.js` (cache `v19` to `v20`), the three docs. Rules must be re-published by hand.
### Notes
- Only the latest assessment per agency is stored; history is in the audit log (owner reads it).
- The original community report is not changed, and the old `verified` flag still works separately.
- Deleting a report leaves its assessments behind (rules forbid deletes); they are not shown.
- Tests: `node --check` passed and the mock test of `saveAssess` passed (15 checks in total). The rules and the screens were not run.

## Official advisories (Agency Portal step 3) - Date unknown
### Added
- `advisories` and `advisoryVersions` collections. An agency account can publish an advisory for a hazard type it covers, revise it (each revision is kept), and withdraw it. Required: title, text, https source link. Optional: areas, reference number. Validity 6 hours to 14 days. **IMPLEMENTED, NOT TESTED against live Firebase**
- "Official advisories" section on the page (above the news; on phones inside the News tab) with an OFFICIAL badge, agency, validity, revision, original-source link; expired and withdrawn advisories are listed separately. Agency accounts get a "Publish advisory" button and Edit/Withdraw on their own advisories; the owner can withdraw any advisory.
- Audit actions `ADVISORY_NEW`, `ADVISORY_EDIT`, `ADVISORY_WITHDRAW` (target type `advisory`).
### Technical Changes
- Files modified: `firestore.rules`, `js/cloud.js` (`watchAdv`, `saveAdv`, `ownerWithdraw`), `js/app.js`, `index.html` (`#advSec`), `css/style.css` (advisory styles, mobile pane rules), `sw.js` (cache `v20` to `v21`), the three docs. Rules must be re-published by hand.
### Notes
- Not done: advisories are not drawn on the map, no notifications, no attachments, no scheduled advisories.
- Tests: `node --check` passed; mock test of `saveAdv`/`ownerWithdraw` passed (20 checks in total). The rules and screens were not run. Rule brace/paren/bracket counts balance, but the Firebase rules editor is the real syntax check.

## [Audit] - Documentation created
### Added
- `DEV_README.md`, `CHANGELOG.md`, `DEVELOPMENT_STATUS.md`. No source files changed.
### Notes
- Owner pasted the Firestore rules they have; they read the same as the strict `firestore.rules` file in the upload (canPost, photosOk, six types). Treated as the live rules, but the Firebase console was not seen directly.
