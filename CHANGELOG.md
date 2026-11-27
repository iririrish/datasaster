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

## Security test script (Agency Portal step 4) - Date unknown
### Added
- `security-test.js` (paste into the browser console) and `SECURITY_TEST.md` (how to run it). 17 checks run as the agency test account and again as a visitor: deleting reports, verifying or assessing uncovered types, forging audit entries, reading or editing the audit log, becoming owner, advisories for uncovered hazards or other agencies, http source links, skipping the revision number. Three legitimate actions are checked as allowed for the agency.
### Technical Changes
- No app files changed, no cache bump. New files are documentation and a test tool only.
### Notes
- Agency-account run on the live project: **17 of 17 PASS** (after fixing a wrong test report id). The visitor run is still to do. Before that, the script had only been run against a mock. Firestore's rules emulator could not be used here (download blocked).

## Agency guide (Agency Portal step 5) - Date unknown
### Added
- "DATAsaster Agency Guide": a one-to-two page document for agency representatives (what DATAsaster is and is not, what an agency account can and cannot do, how it appears publicly, agency responsibilities, what to expect, how to get started). Made as a Claude Doc; contact details are placeholders to fill in. Not part of the repo.
### Notes
- No code changed. The guide describes only features that exist (assessments, advisories, audit log); notifications, map overlays and an agency dashboard are not mentioned because they are not built.

## Review reports screen - Date unknown
### Added
- Header button **Review** (shown only to signed-in admins and agencies) opening a separate "Review reports" screen. It lists every shared report of the hazard types the account covers (owner: all types), newest first, with filter buttons Needs review, Assessed (by us), Not resolved, Resolved, All and a hazard filter. A row opens the usual report details, where assessment, verify and resolve are done. Updates live when reports or assessments change. **IMPLEMENTED, NOT TESTED in a browser**
### Why
- Settings > Admin only showed "Flagged reports" (reports flagged by visitors). That list is not a list of all reports, which caused the confusion.
### Technical Changes
- Files modified: `index.html` (`#btnRev`, `#viewReview`), `js/app.js` (review functions, `showView`, hooks), `sw.js` (cache `v21` to `v22`), docs. No rules change, no new reads: it reuses the already loaded report list (latest 200).
### Notes
- Only community reports shared through Firebase appear (not sample or live-earthquake records). Reports older than the latest 200 do not appear.

## Phone layout fixes - Date unknown
### Fixed
- **Help tab** no longer needs sideways scrolling: the contacts table becomes stacked cards on phones (the page was 481 px wide on a 390 px screen).
- **Map and Feed tabs** fill the screen exactly, so the page itself does not scroll (before, the map was sized with a fixed guess and the page scrolled about 45 px).
- **Legend vs forecast timeline:** the legend starts collapsed on phones, is smaller, and moves up above the timeline bar whenever the forecast layer is on (all screen sizes). The map-tiles warning is hidden while the forecast bar is showing.
- **Date picker** was pushed off-screen by the category chips; it now stays visible on the right while the chips scroll inside their own row, with a fade at the edge.
### Changed
- Phone header: the tagline is hidden (desktop unchanged); header is one compact row with the logo, name and the Review, Settings and Report buttons.
- Help tab hides the category/date bar.
### Technical Changes
- Files modified: `css/style.css` (new block "Phone layout fixes" at the bottom), `js/app.js` (legend starts collapsed on phones, `data-view` attribute set in `showView`, `fcon` body class while the forecast bar exists), `sw.js` (cache `v22` to `v23`), docs.
### Notes
- Checked in a headless Chrome at 390x844, 360x740, 768x1024 and 1280x800 with sample data: no sideways scrolling on any tab, Map and Feed tabs do not scroll vertically on phones, no script errors. The forecast timeline itself could not load there (no internet), so the legend/timeline spacing was checked with a stand-in bar of similar size. Not checked on a real phone or in Safari.

## Emergency contacts as the website footer - Date unknown
### Changed
- The "Emergency contacts" table is now a proper site footer at the bottom of the page: a grid of contact cards (agency, tap-to-call numbers, what to call for), the 911 card highlighted, then the disclaimer line. On phones the footer is what the Help tab shows (one card per row). The separate "contacts" section and the old one-line footer were merged.
### Technical Changes
- Files modified: `index.html` (footer `#contactSec` / `.sitefoot`, `#contacts` is now a card grid), `js/app.js` (`renderContacts` builds cards instead of table rows), `css/style.css` (footer styles, removed the table-on-phone rules; empty `.work` strip hidden on News and Help), `sw.js` (cache `v23` to `v24`). Contact data still lives in `js/data.js` (`CONTACTS`).
### Notes
- Checked in headless Chrome on desktop (1280) and phone (390): 9 cards, no sideways scrolling, no script errors. Not checked on a real phone. The footer is not pinned to the screen; it sits at the end of the page (desktop) and fills the Help tab (phone).

## Website checklist: legal, SEO, icons, accessibility, validation - Date unknown
### Added
- `privacy.html` and `terms.html` (draft, with contact placeholders), linked from the footer and the report form; `404.html` (branded, noindex); `robots.txt`, `sitemap.xml`; `vercel.json` (HSTS to force HTTPS, nosniff, referrer policy, frame denial, geolocation only for the site, no-cache for `sw.js`).
- Page title and description, Open Graph and Twitter tags, social preview image `og-image.png` (1200x630), real favicon set (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`), noscript message.
- Privacy notice bar (dismissible, remembered in local storage). It informs; it is not a consent gate, because the app uses no ad or marketing cookies.
- Report form checks: headline up to 120 characters, place up to 200, details up to 2000, depth and hours must be realistic numbers, location must be inside the Philippines; matching `maxlength`/`max` attributes.
- Header call to action: a labelled "+ Report" button on phones.
### Changed
- `icon-192.png` and `icon-512.png` are now square (the old ones were an identical 149x140 image) and compressed (about 21 KB and 80 KB, down from 37 KB each at the wrong size). Manifest purpose changed from "any maskable" to "any" so the globe is not cropped.
- Colour contrast: white text on blue buttons failed in the dark theme (3.2 to 1). Filled blue elements now use `--accentbg` (5.0 to 1 dark, 5.2 to 1 light). Other text colours were measured and already pass 4.5 to 1.
- Feed thumbnails now have descriptive alt text. Phone header tightened so Review, Settings and Report fit on a 320 px screen.
### Technical Changes
- Files added: `privacy.html`, `terms.html`, `404.html`, `robots.txt`, `sitemap.xml`, `vercel.json`, `og-image.png`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`. Files modified: `index.html`, `js/app.js`, `css/style.css`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `sw.js` (cache `v24` to `v25`, new files cached), docs. No rules change.
### Notes
- **Replace `https://YOUR-SITE.vercel.app`** with your real address in `index.html` (og:image and twitter:image), `sitemap.xml` and `robots.txt`. Fill `[your email address]` in `privacy.html` and `terms.html`.
- Not done on purpose: cookie consent gating (no ad or marketing cookies), moving secrets (none are secret), a honeypot (App Check and the rules are the real spam defence), a Content-Security-Policy (the app uses inline scripts; a wrong policy would break it).
- Tests: headless Chrome with sample data checked links and assets (none missing), the notice bar, the header at 320, 360 and 390 px, the three new pages, and no script errors. Form validation was checked by code only. Real-phone, Lighthouse and social-preview tests were not run.

## Optional author name, advisories/headlines panels, 3-day default - Date unknown
### Added
- **Optional author name** on reports ("Your name (optional)", up to 40 characters, blank = anonymous). Stored in a new `author` field, shown in the feed row and the report details as "by <name>", with a note that it is typed by the poster and not verified. Control characters and `<` `>` are stripped. Mentioned in the Privacy Policy and the Terms (no impersonation).
- **Two distinct panels** for "Official advisories" and "Latest headlines": on desktop side by side, advisories on the left with an accent edge, an OFFICIAL tag and card-style entries; headlines on the right as a plain list with a NEWS tag. On phones the News tab has a two-button switch (Official advisories with a live count, News headlines) with a short fade-in between them. Earlier advisories open with a rotating arrow. Motion is turned off for people who prefer reduced motion.
### Changed
- Default date range is now **Past 3 days** (was 7).
### Fixed
- The privacy notice bar sat above pop-ups and could cover the report form's Post and Cancel buttons; it now sits below them.
### Technical Changes
- Files modified: `firestore.rules` (`author` allowed, string up to 40, optional so older clients and old reports keep working), `js/cloud.js`, `js/app.js`, `index.html`, `css/style.css`, `privacy.html`, `terms.html`, `sw.js` (cache `v25` to `v26`), docs. **Rules must be re-published, or posting from the new app will be refused.**
### Notes
- Tested in headless Chrome with sample data: default shows Past 3 days; the author flow (local mode) shows the cleaned name in the feed; tab switch works and only one panel shows on phones; no sideways scrolling; no script errors. Advisory cards were checked with stand-in sample markup because advisories need Firebase. Posting with an author to the real database was not tested.

## Media accounts, Settings rebuild, footer, phone fixes - Date unknown
### Added
- **Media accounts** (`admins/<uid>` with `role: media`, `outlet`). They can post reports shown with the outlet name ("Media report", outlet in bold). They cannot resolve, verify or delete anything, including their own reports; the public can still flag any report ("Report as fake or wrong"). The rules enforce this: the `media` field on a report must equal the account's `outlet`, media accounts are not treated as owners or moderators (`isOwner` now excludes `media`), cannot read flags or write audit entries.
- **Change password** (Settings > Account): re-checks the current password, then updates it; clear messages for wrong password, weak password, too many attempts, offline.
- **New Settings page:** left sidebar (Appearance & map, Feed & data, Alerts, Account, Admin tools for staff, Privacy & security, About), search across all settings, "Saved on this device" indicator, a Reset button per section that only resets that section (with confirmation), tooltips, empty states, responsive layout (sections become a scrolling tab row on phones). Only settings the app really supports are shown. About shows logo, version/build, release notes, links to Privacy, Terms and Partner pages, open-source licenses; rows for Changelog, Documentation, Help center, Contact support and Report a bug appear only when `APP_INFO` in `js/data.js` has the URL or email.
- **Expired and withdrawn advisories switch** on the homepage advisories panel, off by default; also in Settings > Feed & data.
- **Website footer** modelled on the layout requested: brand block, Emergency & Reporting, Live Monitoring, Official Sources columns and an Emergency hotlines bar built from `CONTACTS`. On phones the Help tab shows contact cards instead.
- `partner.html` (how agencies and media can take part).
- Phone feed: Search plus a Filters dropdown (badge shows how many filters are changed) so the four selects no longer take space; category chips have one fixed size.
### Changed
- Contacts: every phone number is on its own tap-to-call row.
- Settings dropdowns (Smallest earthquake, Auto refresh and the others) now share one control width, show a short description, and are greyed out when the feature they depend on is off. The selected value saves and survives a reload (checked).
- Privacy Policy and Terms mention media accounts. The "Flag report" button is now "Report as fake or wrong".
### Technical Changes
- Files added: `partner.html`. Files modified: `firestore.rules`, `js/cloud.js`, `js/app.js`, `js/data.js` (`APP_INFO`), `index.html`, `css/style.css`, `privacy.html`, `terms.html`, `sitemap.xml`, `sw.js` (cache `v26` to `v27`), docs. **Rules must be republished.** No new collections.
### Notes
- Tested in headless Chrome (desktop and 390 px phone) with sample data: settings search, saving, per-section reset (theme kept when the Feed section is reset), filter badge, footer, no sideways scrolling, no script errors. Mock test of the media role in `cloud.js` passed. **Not tested against live Firebase:** media posting, rules for media, password change. Not tested on a real phone.
- Not added on purpose: "Advertise" and pricing pages (no advertising exists), a Help center and documentation links (none exist yet), granular cookie consent.

## [Audit] - Documentation created
### Added
- `DEV_README.md`, `CHANGELOG.md`, `DEVELOPMENT_STATUS.md`. No source files changed.
### Notes
- Owner pasted the Firestore rules they have; they read the same as the strict `firestore.rules` file in the upload (canPost, photosOk, six types). Treated as the live rules, but the Firebase console was not seen directly.
