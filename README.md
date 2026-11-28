# DATAsaster (demo only)

Philippine disaster monitoring: map, live layers, incidents, news and emergency contacts.

## What is in this folder

| File | What it is | Who edits it |
|---|---|---|
| `index.html` | Page layout and fixed text (header, menus, forms) | Layout and wording |
| `css/style.css` | All colours, spacing and fonts. Colours are at the top, under `:root` | Designer |
| `js/data.js` | Content: sample incidents, emergency contacts, news outlets, forecast cities | Content and research |
| `js/app.js` | How the app works (filters, map, layers, reports) | Coder |
| `partner.html`, `apply.html`, `css/lgu.css`, `js/lgu-apply.js` | LGU Partnership module: public partner page and application form | Layout and coder |
| `lib/` | The Leaflet map library. Do not edit | Nobody |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | Makes it installable and usable offline | Rarely |

## (GitHub Pages, free)

1. Everyone makes a free account at github.com.
2. One person: click **+** (top right), then **New repository**. Name it `datasaster`, choose **Public**, press **Create repository**.
3. On the new page click **uploading an existing file**. Open the unzipped `datasaster` folder, select everything inside, and drag it onto the page. Wait for the upload, then press **Commit changes**.
4. Go to **Settings**, then **Pages**. Under Branch choose **main** and **/ (root)**, then **Save**. After 1 to 2 minutes the link appears at the top, like `https://yourname.github.io/datasaster/`.
5. Go to **Settings**, then **Collaborators**, then **Add people**. Type each groupmate's GitHub username. They accept the email invite.

## Edit as a group

1. Open the repository and click the file you want.
2. Click the pencil icon, make your change, then press **Commit changes**. (Or press the `.` key on the repository page for a full editor in the browser.)
3. Wait about a minute, open the live link and press **Ctrl+Shift+R** to see the change.
4. Agree who edits which file, so two people do not change the same file at once. If you get a conflict message, copy your change, reload the file and paste it again.
5. Installed phone apps: after a big change, raise the number in `var CACHE = 'datasaster-v..'` at the top of `sw.js` by one, so phones fetch the new version.

## Where to change things

- Colours: `css/style.css`, top lines, `:root{` (dark theme) and `[data-theme=light]`.
- Sample incidents: `js/data.js`, the `SEED` list. Copy one block, change the text and coordinates.
- Emergency contacts: `js/data.js`, `CONTACTS`.
- News outlets: `js/data.js`, `SRC`.
- Forecast cities: `js/data.js`, `POINTS`.
- Header title and tagline: `index.html`, search for `class="brand"`.

Keep the quotes, commas and brackets exactly as they are. If the page goes blank, undo your last change (GitHub keeps every version under **History**).


## Shared reports (Firebase)

Without Firebase, reports stay on each phone. To share them with everyone:

1. Go to console.firebase.google.com, **Add project** (Analytics not needed).
2. **Build > Authentication > Get started > Sign-in method > Anonymous > Enable**.
3. **Build > Firestore Database > Create database** (production mode, pick `asia-southeast1`).
4. Firestore **Rules** tab: paste everything from `firestore.rules`, press **Publish**.
5. **Project settings > Your apps > Web (`</>`)**, register an app, copy the `firebaseConfig` values into `js/firebase-config.js`.
6. **Authentication > Settings > Authorized domains**: add `yourname.github.io`.
7. Commit the changes. Everyone who opens the link now sees the same reports. People can only resolve or delete their own.

### Admin account (resolve and delete any report)

1. **Authentication > Sign-in method > Email/Password > Enable**.
2. **Authentication > Users > Add user**: type the admin email and a password. Copy the **User UID**.
3. **Firestore Database > Start collection** named `admins`. Document ID: paste the UID. Add any field (for example `role` = `admin`). Save.
4. Re-publish `firestore.rules` (it changed).
5. In the app: **Settings > Admin**, sign in. Repeat step 2 and 3 for each extra admin.

## New features: setup steps

Re-publish `firestore.rules` first (Firestore Database > Rules > paste > Publish). It now covers the posting limit, verified reports and flags.

### Spam protection
- **Posting limit:** one report per 2 minutes per person. Enforced by the rules, nothing else to set up.
- **App Check (blocks bots and copies of your app):**
  1. Go to google.com/recaptcha/admin, create a **reCAPTCHA v3** site, add `yourname.github.io` as a domain. Copy the **Site key** and **Secret key**.
  2. Firebase console > **App Check** > **Apps** > your web app > **reCAPTCHA** > paste the **Secret key**, Save.
  3. Paste the **Site key** into `js/firebase-config.js` as `window.APPCHECK_SITE_KEY = "your site key";` and upload.
  4. Open the live site and post a test report. In App Check > **APIs** > **Cloud Firestore** you should see verified requests after a few minutes.
  5. Only then click **Enforce** on Cloud Firestore. Enforcing before step 3 will block your own app.

### Admin tools (Settings > Admin, after signing in)
- **Mark verified / Remove verified** appears on every shared report.
- **Flagged reports** lists reports flagged by visitors, with Open, Dismiss and Delete.
- **Export CSV** downloads the latest 200 shared reports.

### Alerts
Settings > Alerts. While the app is open, a notice appears when a High or Critical report is posted within the chosen distance. Alerts when the app is closed need Firebase Cloud Functions and the paid Blaze plan, so they are not included.

### Earthquakes (real and live)
Earthquakes come from USGS and EMSC (which collects Philippine data), refreshed every minute while the app is open and visible. Sample earthquakes were removed. Settings > Data has a **Smallest earthquake** choice (default M3.0). Official bulletins are still at PHIVOLCS (earthquake.phivolcs.dost.gov.ph), which can differ slightly.

## LGU Partnership module (in progress)

Built in phases on the branch `feature/lgu-disaster-module`. The phase plan, the rules to publish and the test list for each phase are in **`LGU_MODULE.md`**. Phase 1 is the public partner page and the application form. Phase 2 is the organization console (`console.html`) and public announcements. Phase 3 is the super admin page (`admin.html`).

Before the form goes public:
1. The contact email is set to `aitetha8@gmail.com` (in `partner.html`, `privacy.html`, `terms.html`, `js/data.js`, `js/lgu-apply.js` and `js/lgu-console.js`). Still to fill in: `[your contact number]` and the office hours in `partner.html`.
2. Publish `firestore.rules` and run the tests in `LGU_MODULE.md`.
3. **Turn on App Check enforcement for Cloud Firestore** (see Spam protection above). The form is open to anyone, so without it a script can send many applications from new anonymous identities. The 10-minute limit only stops one device.

### Future additions (left out on purpose to keep the first version simple and cheap)
These were designed but are not built. Each can be added later without changing what is already there.
- **Evacuation centers.** Public "Evacuation centers" page with a map and capacity bars, an "Evacuation centers" map layer, a "nearby centers" card on the home page, an organization console tab to add, edit and remove centers (name, address, map pin, maximum capacity, current occupancy, status, available capacity worked out automatically), a centers CSV export, and linking centers to announcements. Needs a `centers` collection with rules that let an organization write only its own centers.
- **Automatic emails.** An acknowledgment email to the applicant and a notice to the owner on every application, and a status-change email. The browser cannot send mail, so this needs a small server function (for example a free Vercel serverless function with Brevo or Resend) and one secret API key.
- **Larger uploads.** The letter of intent is limited to 600 KB and stored in Firestore. 10 MB files need Firebase Storage, which needs the paid Blaze plan, or another file host.
- **Province, city and barangay drop-down lists** on the application form (the form uses typed text now). The area picker from `js/places.js` can be reused for this.
- **Branded invitation emails.** Admins are invited by Firebase's standard password-reset email (plain wording, may land in spam). A branded invitation or status-change email needs the same server function as the automatic emails.
- **Platform settings page** (global switches, defaults), a team-roles screen for several owners, and an audit-log entry for organization-admin actions.
- **Automatic deletion** of old applications and documents, to match the retention in `privacy.html` (needs a scheduled server function). It is done by hand until then.
- **Reports for trends,** automatic PDF reports and historical analysis, SMS or push distribution of announcements, and detailed supplies or evacuee tracking.
