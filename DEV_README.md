# DATAsaster: Developer README

> `README.md` in the repo is the setup guide for groupmates and is kept as is.
> This file describes the **actual current code** (audited from the uploaded files). Where the two disagree, trust this file and the source.

## A. Overview
- **Name:** DATAsaster, "Bridging communities with simplified satellite intelligence and crowdsourced mapping". Marked *demo only*.
- **Repo:** `iririrish/datasaster` (GitHub). Firebase project id: `datasaster`.
- **Purpose:** Philippine disaster monitoring: map, live hazard layers, incident feed, crowdsourced reports, news, emergency contacts.
- **Users:** the public (read, post, flag, resolve/delete own reports) and admins (verify, resolve, delete any report, review flags, export CSV).
- **Stack:** plain HTML/CSS/ES5-style JavaScript (no build step), Leaflet 1.9.4, Firebase JS SDK 10.14.1 (compat builds: Auth, Firestore, App Check), PWA (manifest + service worker).
- **Offline-capable:** the app shell loads offline once visited. Map tiles, weather layers, news and quakes need internet.

## B. Structure (as the repo must be laid out)
Confirmed by the owner: the repo has `css/`, `js/`, `lib/` and the root files below. There is no `api/` folder and no `vercel.json` (pure static site).

```
datasaster/
├── index.html              layout, fixed text, report form, modals
├── css/style.css           all styling; colours in :root (dark) and [data-theme=light]
├── js/
│   ├── data.js             content: SRC, LAYERS, POINTS, SEED, CONTACTS, SAMPLE_HEADLINES
│   ├── app.js              all app logic (~1,600 lines)
│   ├── cloud.js            Firebase wrapper (window.CLOUD)
│   └── firebase-config.js  Firebase web config, App Check key, optional Maps Embed key
├── lib/                    leaflet.js/.css, firebase-app|auth|firestore|app-check-compat.js (do not edit)
├── firestore.rules         paste into Firebase console (not deployed by git)
├── manifest.webmanifest, sw.js, icon-192.png, icon-512.png, favicon.ico, favicon-32.png, apple-touch-icon.png, og-image.png
├── privacy.html, terms.html, 404.html, robots.txt, sitemap.xml, vercel.json
├── README.md               public setup guide (existing)
├── DEV_README.md  CHANGELOG.md  DEVELOPMENT_STATUS.md
```

| File | Depends on | Notes |
|---|---|---|
| `index.html` | style.css, lib/*, js/* (load order: leaflet, firebase x4, firebase-config, cloud, data, app) | Also loads Vercel Insights `/_vercel/insights/script.js` (404s harmlessly off Vercel). |
| `js/app.js` | data.js globals, `window.CLOUD`, Leaflet `L` | Everything is in one IIFE. Event handling is delegated via the `ACTIONS` list of `data-*` attributes. |
| `js/cloud.js` | firebase-config.js, Firebase libs | If config empty or SDK missing, `CLOUD.on=false` and the app runs local-only. |
| `sw.js` | all files in its `FILES` list | `cache.addAll` fails the whole install if any listed file is missing. |
| `lib/images/` | not present | Leaflet's default marker/layer PNGs are not used (custom `divIcon`s). |

## C. Features
| Feature | Files | Needs | Offline |
|---|---|---|---|
| Map (Leaflet), Dark/Street/Light basemaps (Esri tiles etc.), region selector | app.js | tiles online | markers/lists yes, tiles no |
| Six categories: flood, fire, quake, volcano, typhoon, landslide | app.js, data.js, index.html | none | yes |
| Feed: search, status (Active/Resolved/All), severity, sort (latest/severity/nearest), distance filter, date range (today/3d/7d/30d/all/pick day) | app.js | none | yes |
| Similar-report grouping (same type, within 1 km and 24 h; community reports only): one feed row, thread in details | app.js (`groupItems`, `threadOf`, `GROUP_KM`) | none | yes |
| Report form: type-specific fields, 0 to 3 photos (shrunk to ~200 KB each), map-pick or GPS location | app.js, index.html | Firebase to share | local copy yes |
| Photo lightbox with zoom, prev/next | app.js, index.html | none | yes |
| Shared reports, live updates, offline write queue (Firestore persistence) | cloud.js, app.js, firestore.rules | Firebase | queued |
| Admin roles. **Owner**: verify, resolve, delete any report, flags (open/dismiss/delete), audit log viewer, CSV export (latest 200). **Agency**: verify and resolve only reports of its allowed hazard types, read flags, no delete. Sign in at Settings > Admin | cloud.js, app.js, rules | Firebase Email/Password | no |
| Agency assessments: an agency account marks a report of one of its hazard types as Under review, Corroborated, Not corroborated, Duplicate or Unable to verify, with an optional public note (500 chars). Shown in the report details and as a short tag in the feed. Kept separate from the community report | cloud.js, app.js, rules (`assessments`) | Firebase | no |
| Official advisories: agency accounts publish, revise and withdraw advisories (title, hazard, areas, text, required https source link, optional reference number, validity 6 h to 14 days). Shown to everyone in the "Official advisories" section with an OFFICIAL badge, the agency name, validity and revision number; expired and withdrawn ones go under a collapsed list. Every revision is kept | cloud.js, app.js, index.html (`#advSec`), style.css (`.adv`), rules (`advisories`, `advisoryVersions`) | Firebase | no |
| Review reports (header button "Review", admins only): a separate screen listing the shared reports the account may act on (agency: its hazard types; owner: all), with filters Needs review / Assessed / Not resolved / Resolved / All and a hazard filter. Opening a row shows the normal details with the assess, verify and resolve controls | app.js (`renderReview`, `reviewScope`), index.html (`#btnRev`, `#viewReview`) | Firebase | no |
| Audit log: every owner/agency verify, resolve, delete and flag dismissal is recorded (Settings > Admin > Audit log, owner only, last 50) | cloud.js, app.js, rules (`audit`) | Firebase | no |
| Flag a report (one per user per report) | cloud.js, app.js | Firebase | no |
| Share link (`#<id>` opens a report) | app.js (`tryHash`) | none | yes |
| In-app proximity alerts for High/Critical shared reports (10/25/50/100 km) | app.js | Firebase, geolocation | only while app open |
| Live earthquakes (USGS + EMSC, min magnitude setting), refresh every 60 s while visible | app.js | internet | cached copy in localStorage |
| Live layers: RainViewer radar and cloud, Open-Meteo rain and river (GloFAS), NASA EONET fires and storms | app.js, data.js (`LAYERS`, `POINTS`) | internet | no |
| Rain forecast map: 15x20 = 300-point grid (0 to 28N, 102 to 140E, 2 degree step), 96 h timeline, wind streaks, city weather icons | app.js (`FCS`, `loadFcGrid`, `fc*`) | Open-Meteo | no |
| Legend with filters (type and severity buttons) and layer panel | app.js | none | yes |
| News: Google News RSS per outlet via api.rss2json.com or api.allorigins.win; sample headlines if blocked | app.js, data.js | internet | falls back to samples |
| Emergency contacts: website footer with a card per agency, tap to call (Help tab on phones) | data.js (`CONTACTS`), app.js (`renderContacts`), index.html (`#contactSec`), style.css (`.sitefoot`, `.cc`) | none | yes |
| Street view button (Google Maps link); in-panel embed only if `MAPS_EMBED_KEY` set | app.js, firebase-config.js | internet, key (optional) | no |
| Settings: theme, basemap, categories, sources, data refresh, alerts, install, reset | app.js | none | yes |
| PWA install, mobile bottom tab bar (Map/Feed/News/Help) | manifest, sw.js, app.js | https | yes |

Seed/demo records: `SEED` in data.js (shown tagged as sample; toggle `demo` in settings). Local-only user reports live in `localStorage` (`datasaster_reports`).

## D. Services and libraries
Leaflet 1.9.4; Firebase 10.14.1 compat (Auth, Firestore, App Check with reCAPTCHA Enterprise key); USGS, EMSC (seismicportal), RainViewer, Open-Meteo (forecast + flood API), NASA EONET, Google News RSS, rss2json, allorigins, Esri/CARTO/OSM tiles, Google Maps links, Vercel Insights.

## E. Backend and database (Firestore, no secrets listed)
Auth: Anonymous (every visitor; used for ownership) and Email/Password (admins only).

| Collection | Doc id | Fields | Access (firestore.rules) |
|---|---|---|---|
| `reports` | auto id | uid, type, sev (int 0 to 3), title, desc, place, lat, lng, img (always `''`), imgs (max 3 strings, each < 230,000 chars), obs (list of `{k,v}`, max 12), time (ms), resolved, resAt, verified | read: anyone. create: signed in, validated, `resolved=false`, `verified=false`, passes `canPost()`. update: author may change `resolved`,`resAt`; admin may also change `verified`. delete: author or admin. |
| `users` | uid | lastPost (server timestamp) | create/update own doc only, must equal `request.time`. No read. Used for the 2-minute posting limit. |
| `flags` | `<reportId>_<uid>` | reportId, uid, reason (<=200), time | create: signed in, report must exist. read/delete: admin only. |
| `admins` | admin's UID | `role`, and for agencies `agency` (text) and `types` (list of hazard types) | read own doc only. No client writes. Create in console. See "Roles" below. |
| `assessments` | `<reportId>_<AGENCY>` (one per agency per report) | reportId, agency, uid (last editor), status (`under_review`, `corroborated`, `not_corroborated`, `duplicate`, `unable`), note (<=500), time (server), auditId | read: anyone. create/update: agency accounts only, only for a report whose type is in their `types`, agency must equal their `agency` field, must carry an `auditId` for an `ASSESS` audit entry in the same batch. delete: nobody. Only the latest assessment per agency is kept; earlier states are in the audit log. |
| `advisories` | auto id | agency, uid, title, hazard, areas, desc, sourceUrl (https), refNo, issuedAt, expiresAt, status (`published`, `withdrawn`), rev, time, auditId, verId | read: anyone. create/update: agency accounts only, own agency name, hazard in their `types`, each write needs a matching `advisoryVersions` doc and an audit entry in the same batch, `rev` goes up by 1. The owner can only set `withdrawn`. delete: nobody. |
| `advisoryVersions` | auto id | advisoryId, rev, agency, uid, title, hazard, areas, desc, sourceUrl, refNo, expiresAt, status, time | read: anyone. create only (agency accounts). One per revision, never changed. |
| `audit` | auto id | uid, agency (`OWNER` or agency name), action (`VERIFY`, `UNVERIFY`, `RESOLVE`, `REOPEN`, `ASSESS`, `ADVISORY_NEW`, `ADVISORY_EDIT`, `ADVISORY_WITHDRAW`, `DELETE`, `FLAGS_DISMISS`), targetType (`report` or `advisory`), targetId, note, time (server) | create: admins only (agencies everything except DELETE and FLAGS_DISMISS, and only under their own agency name). read: owner only. update/delete: nobody. |

Admin = a document `admins/<UID>` exists. Never hide-button-only: all admin actions are enforced by the rules.

**Roles** (decided by the fields of the `admins/<UID>` document):
- **Owner:** `role` missing, `admin` or anything other than `agency`. Same powers as the old admin. Existing admin documents (e.g. `role = admin`) stay owners with no change.
- **Agency:** `role` = `agency`, `agency` = `PAGASA` (text), `types` = array of strings such as `flood`, `typhoon`. An agency can set `verified`/`resolved` only on reports whose `type` is in its `types`, and each such update must carry an `auditId` pointing to an audit entry written in the same batch (the rules check it). It cannot delete reports, dismiss flags or read the audit log.
- To create an agency account: Authentication > Add user; copy the UID; Firestore > `admins` > document id = UID with fields `role` (string) `agency`, `agency` (string) e.g. `PAGASA`, `types` (array of strings). Valid types: `flood`, `fire`, `quake`, `volcano`, `typhoon`, `landslide`. Removing the document removes the access immediately.
- Limits: the audit entries for **owner** actions are written by the app but not forced by the rules; only agency report updates are forced to have one. The owner can still edit the log in the Firebase console, so it protects against agencies, not against the owner.
Sync: `reports` ordered by `time desc`, limit 200, live `onSnapshot`; flags are watched only for admins.
Type list in rules (`flood, fire, quake, volcano, typhoon, landslide`) must match `TORDER` in app.js.

## F. Setup from scratch
1. Create the repo layout in section B and upload everything.
2. Firebase console: add project; Authentication: enable **Anonymous** and **Email/Password**; Firestore (production mode, `asia-southeast1`).
3. Paste `firestore.rules` into Firestore > Rules, Publish.
4. Register a web app, copy its config into `js/firebase-config.js`. Add every hosting domain under Authentication > Settings > Authorized domains.
5. Admin: Authentication > Add user; copy the **User UID** (28 characters, no prefix); Firestore: create collection `admins`, document id = that UID, one field (e.g. `role` = `admin`).
6. Optional App Check: create a reCAPTCHA Enterprise key, add your domains, put the key in `APPCHECK_ENTERPRISE_KEY` (or v3 key in `APPCHECK_SITE_KEY`). Verify requests show as verified for Firestore **before** clicking Enforce.
7. Optional: `MAPS_EMBED_KEY` for in-panel street view (restrict the key by domain).
Variables are all in `js/firebase-config.js`. The Firebase web config and App Check site key are public by design; restrict the API key by domain in Google Cloud and rely on the rules.

## G. Deployment
Static hosting only. The owner confirms the site is now served from **Vercel** (framework "Other", no build command, no serverless functions), which redeploys on each commit. GitHub Pages was used earlier. Vercel Insights in `index.html` only works on Vercel. Whichever host: add its domain to Firebase Authorized domains and the reCAPTCHA key. **Every deploy:** bump `CACHE` in `sw.js` (currently `datasaster-v18`) so installed copies update. Installed copies are tied to the origin they were installed from.

## H. Editing guide
- Phone layout: the block "Phone layout fixes" at the bottom of `css/style.css` (breakpoint 900 px) and the older `@media(max-width:900px)` rules near the middle. Later rules win, so change the bottom block first.
- Colours/themes: `css/style.css` lines 1 to 2. Layout/spacing/responsive: rest of style.css, breakpoint `max-width:900px`. Logo: `#logo` rule (uses `icon-192.png`). Header/tagline: `index.html` `class="brand"` plus `.brand small` rules (two blocks, later one wins).
- Text/labels: index.html (fixed text), app.js (`TYPES`, `SEV`, `SEVDESC`, `EFFECTS` and other option lists).
- Content: data.js (`SEED`, `CONTACTS`, `SRC`, `POINTS`, `LAYERS`).
- New report type: add to `TYPES`, `TORDER`, `TSHORT`, `SEVDESC`, form section in index.html, `rTypeChanged`/`saveReport`, **and** the `type in [...]` list in firestore.rules.
- Database operations: cloud.js only. Rules: firestore.rules (publish manually).
- Forecast grid size/area: `FCS` in app.js (rows x columns = Open-Meteo requests per visitor).
- Style code as ES5 (`var`, `function`, no arrow functions or template strings): this is the owner's stated compatibility preference.

## I. Known issues
See `DEVELOPMENT_STATUS.md`.

## J. Notes for future developers and AI assistants
- Source files beat chat history. Always read the file before editing; return full files, not snippets.
- Update `CHANGELOG.md`, `DEVELOPMENT_STATUS.md` and this file after every change. Bump the `sw.js` cache name.
- Do not mix this project with `alertph.html` / `ph-alert-map.html` (single-file demos, no Firebase) or other repos (cjuthinks, Bantay PH).
- Never commit passwords, admin credentials or service-account JSON.
