# Development Status

Audit of the uploaded files (app.js 1,623 lines, cloud.js, data.js, firestore.rules, sw.js, index.html, style.css). Syntax check: `node --check` passed on app.js, cloud.js, data.js and sw.js. **No runtime or Firebase tests were possible**; everything below is from code inspection.

## Implemented (confirmed in code)
- Six report types (flood, fire, quake, volcano, typhoon, landslide): app.js `TYPES/TORDER`, rules type list matches. 
- Shared reports, live sync, anonymous auth: cloud.js, firestore.rules.
- Up to 3 photos with shrinking and lightbox zoom: app.js `shrinkPhoto`, `lb*`; rules `photosOk`.
- Admin tools: verify, resolve, delete, flags list, CSV export: cloud.js, app.js.
- Flagging, share link (`#id`), proximity alerts, grouping of similar community reports (1 km, 24 h).
- Live quakes (USGS/EMSC), live layers, rain forecast map with timeline and wind (300-point grid).
- Hide-reports switch and filter legend; resolved status; PWA with network-first service worker (`datasaster-v18`).

## Needs Testing
- Posting with the **current strict rules** (the owner's pasted rules match the strict file, so these appear to be live) (`canPost()`, `time` window, `photosOk`): earlier strict rules failed with permission-denied and the cause was never found. Test one report with 0 and 3 photos, per type. (firestore.rules, cloud.js `C.add`)
- Scroll-jump fixes on a real phone (app.js `renderFeed`, `onDocClick`).
- Admin sign-in after the account was recreated, including the `admins/<UID>` document match.
- Forecast map and timeline on mobile; Open-Meteo request volume (300 per visitor).
- Offline behaviour and update flow after a `sw.js` cache bump.
- Vercel deployment: confirmed in use by the owner. Still check that the Vercel domain is in Firebase Authorized domains and the reCAPTCHA key, then test admin sign-in and posting on that domain.

## Partially Implemented
- Street view: link works without a key; embedded view needs `MAPS_EMBED_KEY` (empty). firebase-config.js.
- App Check: client activates with an Enterprise key; **enforcement status unknown**. 
- Photo storage inside documents (about 3 x 230 KB per report): works but heavy for Firestore reads (200 reports per load).
- News: depends on third-party proxies, with sample headlines as fallback.

## Known Bugs and Inconsistencies
1. **Icons:** `icon-192.png` and `icon-512.png` are byte-identical and only 149x140 px (not square, not the declared sizes). Hurts installability, maskable icons and the `#logo` box. Replace with real square 192 and 512 PNGs. (manifest.webmanifest, sw.js)
2. **Rate limit can be bypassed:** `canPost()` is satisfied by several `reports` creates in one batch with a single `users` write. Also resets with a new anonymous identity (clearing site data); App Check enforcement is the real defense. (firestore.rules)
3. **Rules gaps:** lat/lng not range-checked; `resAt` and `obs` item types not checked. (firestore.rules)
4. **README outdated:** says `datasaster-v5` and GitHub Pages only; actual cache is `v18` and Vercel is planned. (README.md)
5. **Duplicate/overriding CSS:** `.brand small` defined at line 31 and again in the later block; later wins. (style.css)
6. **`<title>` has a trailing space.** (index.html)
7. **Vercel Insights scripts** only work on Vercel and 404 elsewhere (harmless). (index.html)
8. **Flat upload vs folder paths:** the uploaded bundle was flat; the repo must keep `css/`, `js/`, `lib/`.
9. **Exposed third parties:** news goes through public proxies (allorigins, rss2json); can be rate-limited or blocked.
10. **Admin visible to all in Settings** (UI only; enforcement is in the rules, which is correct).

## Pending Features (requested, not in code)
- PAGASA wind-signal / typhoon-signal layer (mockup only).
- Making the repo private: unknown whether done. Vercel hosting is confirmed. If the repo is private, the old GitHub Pages link is offline and installed phone copies from it must be reinstalled from the Vercel link.

## Proposed Improvements (not approved)
- Filipino translation (`js/lang.js`, `t()` lookups).
- Fix the posting-limit bypass with a `lastId` tie between `users` and `reports`; add coordinate range checks.
- Store photos in Firebase Storage or reduce count/size to cut Firestore read cost.
- Cache forecast data server-side (Vercel function) to cut Open-Meteo calls.
- Automatic "resolved after N days" rule; remember legend open/closed; push alerts when closed (needs Cloud Functions, Blaze plan).

## Configuration Required (manual)
- Confirm the live rules are the strict set (they appear to be) and that posting works.
- Firebase Authentication: Anonymous + Email/Password enabled; authorized domains include `iririrish.github.io` and the Vercel domain.
- Admin user and `admins/<UID>` document (UID without any prefix).
- reCAPTCHA Enterprise key domains include every hosting domain; verify requests before enforcing App Check.
- Restrict the Firebase API key by domain in Google Cloud.
- Optional: `MAPS_EMBED_KEY`.
- Bump `CACHE` in `sw.js` on every deploy.

## Files still needed
- Repo tree: confirmed (no `api/`, no `vercel.json`).
- App Check status for Firestore (Enforced or Unenforced) and your Vercel domain, so I can check the Firebase domain list.
- Whether a test post works with the current rules, and whether the repo is now private.
