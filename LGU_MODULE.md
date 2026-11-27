# LGU Partnership & Disaster Management module

Branch: `feature/lgu-disaster-module`. Baseline (original site): commit `cdf152f` on `main`.
Going back to the original site = do not merge this branch (or redeploy `main`). Nothing here touches `main` until you merge.

Scope decisions: no evacuation centers and no automatic emails in this version (see "Future additions" in `README.md`). Partnership applications and administration are website only, not the mobile app.

## Phases
| Phase | What | Status |
|---|---|---|
| 1 | Public partner page, application form (saves to Firestore), legal pages, application rules, `isOwner()` allow-list | **Built** |
| 2 | Organization console (`console.html`): overview stats, incident review for the org's hazard types and area, announcements, reports and CSV, organization profile. Public display of active announcements on the home page. Rules for `orgMembers`, `organizations`, `announcements` | **Built** |
| 3 | Super admin page (`admin.html`): applications list, status, private notes, view the uploaded letter, approve (creates the organization), organizations and roles, announcement moderation | **Built** |

Roles: Super administrator = the existing owner (`admins/<uid>` with no role, `owner` or `admin`). Organization administrator = `orgMembers/<uid>` (Phase 2, created by hand in the Firebase console). Resident = everyone else. Agency and media accounts are unchanged.

---
## Phase 1

### Files
**New:** `apply.html`, `css/lgu.css`, `js/lgu-apply.js`, `security-test-lgu.js`, `LGU_MODULE.md`
**Modified:** `partner.html` (rewritten; all the old agency and media text is kept), `index.html` (stylesheet link, "Partner with us" header link, partner banner, two footer links), `js/app.js` (3 lines in Settings > About: a link row text and one new link row), `sw.js` (cache v28, new files), `firestore.rules`, `privacy.html`, `terms.html`, `sitemap.xml`, `README.md`

### Rules to publish
Publish the whole `firestore.rules` (Firestore Database > Rules > paste > Publish). What changed:
1. `isOwner()` is now an allow-list: owner only when `role` is missing, `owner` or `admin`. Agency and media branches are unchanged.
2. New: `applications`, `applicationDocs` and `applyLimits`. Anyone can create one application per 10 minutes; only the owner can read. Nobody can edit or delete from the app (you delete in the Firebase console).
   `applyLimits/<uid>` is used instead of `users/lastApply` so the existing `users` rule and the posting limit stay untouched. The application, its optional document and the limit entry must be in the same batch, and the limit entry names the exact application id, so one batch cannot carry two applications.

### Test list
**A. Existing security test, re-run both (agency and visitor). Expected: still 17 PASS, 0 FAIL each.**
Re-run everything because the rules file changed. The `isOwner()` change cannot change a result for an agency, media or visitor account (none of them was or is an owner). Lines that go through `isOwner()` and matter most: 1 (delete someone else's report), 5 (read the audit log), 6 (audit DELETE), 7 (edit an audit entry), 8 (make yourself owner).

**B. By hand, as accounts you have**
- Owner with **no** role, with `role: owner`, and with `role: admin`: verify, resolve, delete a report; open the audit log; withdraw any advisory; dismiss a flag. All must still work.
- An `admins` document with an unknown role (for example `role: viewer`): the rules must refuse the owner actions. The app screen may still show owner buttons for it (the screen reads roles in `js/cloud.js`, unchanged), but every write must fail.
- Media account: still cannot resolve, verify or delete.
- Agency account: verify, assess and advisory still work for its own hazard types.

**C. New script `security-test-lgu.js`** as a visitor in a new incognito window. Expected: 14 PASS, 0 FAIL. Then delete the leftover test application and your `applyLimits` document in Firebase console.

**D. The form, by hand** (live or Vercel preview)
1. `partner.html` and `apply.html` open from the home page header (desktop), footer, banner and Settings > About.
2. Submit empty: each missing field shows its message. Bad email (`a@gmail`) shows the domain message.
3. Fill in, reload the page: the text is still there (not the file).
4. A 700 KB file is refused; a `.txt` renamed to `.pdf` is refused; a real small PDF is accepted and can be removed.
5. Send: a reference number shows. In Firebase console, `applications/<id>` has all fields and `applicationDocs/<id>` has the file text.
6. Send again at once: refused with the 10-minute message.
7. Sign in as the owner on the home page: the Review button works. Sign out: it is hidden. A resident sees no Review, no Export CSV, no flagged reports, no publish buttons.
8. Existing site still works: map, layers, feed, report form, advisories, news, settings.

**E. Before you share the form**
- Replace the placeholder contact details (see README).
- Turn on App Check enforcement for Firestore (README, Spam protection).
- Keep the retention promise in `privacy.html` section 9: set a calendar reminder to delete old applications and documents by hand (applications and documents of rejected applicants after 12 months and 90 days; approved applications 12 months after the partnership ends; documents of approved applications 90 days after approval).

---
## Phase 2: organization console

### Files
**New:** `console.html`, `css/lgu-console.css`, `js/lgu-console.js`, `js/lgu-public.js`, `security-test-lgu2.js`
**Modified (on top of Phase 1):** `firestore.rules` (Phase 2 block + one new branch in the `reports` update rule), `index.html` (announcement bar, `annList` box, one script tag), `js/app.js` (one link row in Settings > Account), `js/data.js` (`contactEmail` set), `sw.js` (cache v29, new files), `css/lgu.css`, `js/lgu-apply.js` and `partner.html`, `privacy.html`, `terms.html` (contact email), `README.md`

### Set up one organization by hand (Firebase console, you only do this until Phase 3)
1. **Authentication > Users > Add user:** email and password of the organization's representative. Copy the user's **UID**.
2. **Firestore > `organizations` > Add document** (Document ID: a short name such as `brgy-san-isidro`). Fields:
   - `name` (string), `type` (string: City, Municipality, Barangay, HOA or Other), `province`, `city`, `barangay` (strings), `address` (string), `hotline` (string), `publicEmail` (string, may be empty)
   - `status` (string) = `active`
   - `types` (array of strings) from: `flood`, `fire`, `quake`, `volcano`, `typhoon`, `landslide`
   - `south`, `north`, `west`, `east` (numbers): the coverage box in decimal degrees, for example south 13.70, north 13.80, west 121.00, east 121.10. You can read a box off the map at bboxfinder.com.
3. **Firestore > `orgMembers` > Add document** (Document ID = the user's UID). Fields: `role` (string) = `orgadmin`, `orgId` (string) = the organization's document ID.
4. Give the representative `console.html` and their password. To suspend an organization, set its `status` to `suspended` (the console stops working for them and they cannot write).

### Rules to publish
Publish the whole `firestore.rules` again. Changes in Phase 2:
- New `orgMembers` (read your own only, nobody writes), `organizations` (public read; an org admin may change only address, hotline and public email of their own organization), `announcements` (published ones are public; drafts only for that organization's admins; create, edit and delete only for your own organization, only while it is `active`, name must equal the organization's real name, at most 30 days long).
- `reports` update gets one new branch: an organization admin may set only `verified`, `resolved`, `resAt` and `vOrg` (their own organization id), and only on reports whose hazard type is in their `types` and whose location is inside their coverage box. The three older branches (author, owner, agency) are unchanged. They cannot delete reports.

### Test list
**A. Phase 1 tests again** (`security-test.js` for agency and visitor: 17 PASS each; `security-test-lgu.js`: 14 PASS). The rules file changed, so run them all.
**B. New script `security-test-lgu2.js`:** run it as a visitor (incognito, `console.html`): expected 8 PASS. Run it signed in as the test organization admin: expected 14 PASS, 0 FAIL (rows marked SKIP are fine when no report is in or out of your area). Set `OTHER_ORG` at the top first. Create a second test organization if you want to test two organizations side by side.
**C. By hand**
1. Sign in at `console.html` with the organization admin. Wrong password gives an error. A normal account (not in `orgMembers`) is told it is not an organization admin.
2. Overview numbers match the Incidents tab. A report from outside the coverage box, or of another hazard type, does not appear.
3. Verify and resolve a report in your area. The public map shows the new status.
4. Publish an announcement (type, title, description, times). It shows in the bar and in the Advisories box on the home page until it ends. Draft, Scheduled and Ended ones do not show publicly. End now and Delete work.
5. Sign in as a second organization: it must not see the first one's drafts (Announcements tab) and must not be able to verify the first one's reports.
6. Reports tab: filter by date, category, status. Export CSV opens in Excel.
7. Settings > Public profile: save address, hotline and email. The name and type fields are read only.
8. Sign out. A resident on the home page sees no console buttons, no Review queue, no publish buttons, no Export CSV and no flagged reports.
9. Existing site: map, layers, feed, report form, advisories, news, Settings, Phase 1 application form.

### Limits to know
- Overview and Reports numbers are based on the latest 200 shared reports (the same limit as the map). Older incidents drop out.
- Organizations and organization admins are created by hand until Phase 3.
- The public announcement box and bar are for Phase 2. Evacuation centers are not built (see README).

---
## Phase 3: super admin page (`admin.html`)

Owner only. The owner is your existing `admins/<uid>` account with no role (or role `owner` / `admin`). The page is not linked from the public site: open `admin.html` directly. It has `noindex`.

### Files
**New:** `admin.html`, `js/lgu-admin.js`, `security-test-lgu3.js`
**Modified (on top of Phase 2):** `firestore.rules`, `js/lgu-console.js` (Forgot password link on sign-in), `sw.js` (cache v30), `README.md`, `LGU_MODULE.md`

### What it does
- **Applications:** list with status counts, filter and search. Detail: every field, the uploaded letter (opens in a new tab), private notes, status buttons (Pending, Under Review, Approved, Rejected), Email applicant (opens your mail app), retention dates, and delete (letter only, or the application with its notes and letter).
- **Approve and create organization:** opens a form filled from the application. You choose hazard types and the coverage box (south, north, west, east, Philippines only). Saving creates the organization and marks the application approved in one step.
- **Organizations & roles:** list, edit, suspend or activate. **Add admin by email** creates the account and sends Firebase's password-reset email so the person can set a password, then links them. If the email already has an account, paste its UID instead. Remove an admin at any time.
- **Announcements:** every organization's announcements, with Delete.
- Org console sign-in now has **Forgot password?**

### Rules to publish
Publish the whole `firestore.rules` again. Phase 3 changes:
- `applications`: the owner can change only `status`, `updatedAt`, `decidedAt` and `orgId` (status must be one of the four), and can delete. Visitors still cannot read or edit anything.
- `applications/<id>/notes`: owner only. `applicationDocs`: owner can also delete.
- `organizations`: the owner can create and edit (validated; the box must be inside the Philippines; types from the six hazard types). Nobody can delete an organization from the app: suspend it.
- `orgMembers`: the owner can create, edit and remove (role must be `orgadmin`, the organization must exist).

### Test list
**A. Earlier tests again:** `security-test.js` (agency and visitor, 17 each), `security-test-lgu.js` (14), `security-test-lgu2.js` (visitor 8, org admin 14).
**B. New `security-test-lgu3.js`:** visitor 7 PASS, organization admin 7 PASS, owner 14 PASS (12 if you have no applications yet). It leaves one suspended `zz-test-org` to delete in the Firebase console.
**C. By hand**
1. `admin.html`: an agency or media account, or an organization admin, is told an owner account is required. The owner sees three tabs.
2. Send a test application from `apply.html`. It shows in the list within seconds with the Pending badge.
3. Open it: fields, letter opens, add a note, Under Review, then Approve and create organization with a coverage box. The organization appears and the application shows Approved and links to it.
4. Add admin by email (use an address you own). You get the Firebase email, set a password, then sign in at `console.html` and see only that organization.
5. Suspend the organization: the console shows "Organization not active" and the admin cannot save anything. Activate it again.
6. Publish an announcement as that admin, then delete it from the Announcements tab as owner.
7. Delete the test application (also removes its notes and letter).
8. Existing site, the application form and the org console still work.

### Notes and limits
- Invitation and password emails come from Firebase's default template. Edit the wording in Firebase console > Authentication > Templates. They can land in spam.
- Retention (Privacy Policy section 9) is done by you with the Delete buttons. The page shows the due dates but does not delete anything by itself.
- Approving does not email the applicant. Use Email applicant.
