# LGU Partnership & Disaster Management module

Branch: `feature/lgu-disaster-module`. Baseline (original site): commit `cdf152f` on `main`.
Going back to the original site = do not merge this branch (or redeploy `main`). Nothing here touches `main` until you merge.

Scope decisions: no evacuation centers and no automatic emails in this version (see "Future additions" in `README.md`). Partnership applications and administration are website only, not the mobile app.

## Phases
| Phase | What | Status |
|---|---|---|
| 1 | Public partner page, application form (saves to Firestore), legal pages, application rules, `isOwner()` allow-list | **Built** |
| 2 | Organization console (`console.html`): overview stats, incident review for the org's hazard types and area, announcements, reports and CSV, organization profile. Public display of active announcements on the home page. Rules for `orgMembers`, `organizations`, `announcements` | Not started |
| 3 | Super admin page: applications list, status, private notes, view the uploaded letter, approve (creates the organization), organizations and roles | Not started |

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
