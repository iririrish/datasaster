# Development Status

Audit of the uploaded files (app.js 1,623 lines, cloud.js, data.js, firestore.rules, sw.js, index.html, style.css). Syntax check: `node --check` passed on app.js, cloud.js, data.js and sw.js. **No runtime or Firebase tests were possible**; everything below is from code inspection.

## Implemented (confirmed in code)
- Six report types (flood, fire, quake, volcano, typhoon, landslide): app.js `TYPES/TORDER`, rules type list matches. 
- Shared reports, live sync, anonymous auth: cloud.js, firestore.rules.
- Up to 3 photos with shrinking and lightbox zoom: app.js `shrinkPhoto`, `lb*`; rules `photosOk`.
- Admin tools: verify, resolve, delete, flags list, CSV export: cloud.js, app.js.
- Agency role (scoped verify/resolve, no delete) and audit log, added in Agency Portal step 1 (code present, see Needs Testing): cloud.js, app.js, firestore.rules.
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

- **Agency role and audit log (step 1), nothing run live yet.** Publish the new rules, then with a test agency account (`role: agency`, `agency: PAGASA`, `types: [flood, typhoon]`) check: verify/resolve a flood report works; verify a quake report is rejected; delete is rejected; the audit log shows the entries (owner only); the agency cannot read or edit `audit`; the owner still works as before. Also check that the access-call limit in the update rule is not hit (an agency update reads the admin doc and the audit doc).
- Existing admin documents must still work as owner: sign in with your current admin and verify, resolve, delete, and open the audit log.

- **Agency assessments (step 2), nothing run live yet.** Publish the new rules, then as the PAGASA test account: assess a flood report (saves, shows in details and feed); try a quake report (form must not show, and a forced write is rejected); change the status and confirm the same document updates; as a second agency account assess the same report and confirm both show; as owner confirm the audit log shows `ASSESS`. Check the `asStatus`/`asNote` fields keep your typing when a snapshot arrives.

- **Official advisories (step 3), nothing run live yet.** Publish the rules (the Rules editor will flag any syntax error), then as the PAGASA test account: publish an advisory for an allowed hazard (appears with OFFICIAL badge); try a hazard outside `types` (must not be offered or must be rejected); edit it and confirm Revision 2 and that `advisoryVersions` now has two documents; withdraw it and confirm it moves under "Expired and withdrawn"; as owner withdraw another advisory; confirm the audit log shows the `ADVISORY_*` entries; confirm a signed-out visitor sees the advisories. Check the form keeps your typing when a snapshot arrives, and the mobile News tab shows the section.

- **Security test (step 4):** the agency-account run passed 17 of 17 on the owner's live project (first run showed 2 FAILs caused by a wrong test report id, not by the rules). **Still to run: the visitor run in an incognito window.** Until both pass, do not give real agencies accounts. Re-run after every rules change.

- **Steps 2 and 3 in practice:** the test confirmed the live rules accept agency verify, assessment, advisory publish and withdraw, so those paths work at rules level. The on-screen forms (assessment form, advisory form, mobile layout) still need a quick visual check.

- **Review reports screen:** sign in as the PAGASA test account; the Review button should appear next to Settings; the list should show TEST flood and other flood/typhoon reports and no quake reports; filters and counts should change; opening a row should allow Save assessment; as owner the screen lists all types; signed out the button must not show; check it on a phone (icon only).

- **Phone layout:** on a real phone check all four tabs, the forecast layer with the legend open, Settings, the Review screen (admins), and landscape orientation. The category chips scroll sideways inside their row by design.

## Partially Implemented
- Street view: link works without a key; embedded view needs `MAPS_EMBED_KEY` (empty). firebase-config.js.
- App Check: client activates with an Enterprise key; **enforcement status unknown**. 
- Photo storage inside documents (about 3 x 230 KB per report): works but heavy for Firestore reads (200 reports per load).
- News: depends on third-party proxies, with sample headlines as fallback.

## Known Bugs and Inconsistencies
00. Icons fixed (now square and compressed). The logo source is only 140 px, so the 512 px icon is soft; supply a larger logo file to sharpen it. (icon-512.png)
0. **App Check token error on the Vercel site:** console shows `appCheck/recaptcha-error`. Most likely the Vercel domain is missing from the reCAPTCHA key's allowed domains. Writes still work, so enforcement is off. Do not enforce App Check until Firebase shows verified requests for Firestore. (js/firebase-config.js, Google Cloud reCAPTCHA key)
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
- Agency Portal steps 1 to 5 are all built. Remaining: the incognito visitor run of the security test, a visual check of the assessment and advisory screens, filling the contact placeholders in the agency guide, and getting a real agency's agreement before activating any account. (Steps 1 to 3 are built; step 1 confirmed working by the owner, steps 2 and 3 untested.) Advisories on the map and notifications are not built.
- PAGASA wind-signal / typhoon-signal layer (mockup only).
- Making the repo private: unknown whether done. Vercel hosting is confirmed. If the repo is private, the old GitHub Pages link is offline and installed phone copies from it must be reinstalled from the Vercel link.

## Proposed Improvements (not approved)
- Filipino translation (`js/lang.js`, `t()` lookups).
- Fix the posting-limit bypass with a `lastId` tie between `users` and `reports`; add coordinate range checks.
- Store photos in Firebase Storage or reduce count/size to cut Firestore read cost.
- Cache forecast data server-side (Vercel function) to cut Open-Meteo calls.
- Automatic "resolved after N days" rule; remember legend open/closed; push alerts when closed (needs Cloud Functions, Blaze plan).

## Configuration Required (manual)
- Replace `https://YOUR-SITE.vercel.app` in `index.html`, `sitemap.xml`, `robots.txt`. Fill the contact email in `privacy.html` and `terms.html`, and have your adviser read both pages.
- In Google Cloud > APIs & Services > Credentials, restrict the Firebase browser API key to your site's domain (and the Maps Embed key if you use one). The Firebase config and reCAPTCHA site key in the page are public by design; there are no private keys in the repo.
- After deploying, test the social preview (paste your link into a Facebook or LinkedIn debugger) and run Lighthouse on the live site.
- Publish the new `firestore.rules` from Agency Portal step 1 (copy the old rules to a text file first) and confirm posting and admin actions still work.
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
