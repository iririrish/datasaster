# DATAsaster: security test (Agency Portal step 4)

Goal: prove that an agency account and an ordinary visitor **cannot** do things they must not do, and **can** do what they should. The server (Firestore rules) does the refusing, so this test talks to the real database from the browser console.

You need: the step 1 to 3 files deployed, the new `firestore.rules` published, and the PAGASA test account (`role: agency`, `types`: flood, typhoon).

## 1. Make two test reports (as a visitor)
Open the live site in a normal window while **signed out of Admin**. Post two reports (wait 2 minutes between them):
- one **Flood** report titled "TEST flood"
- one **Earthquake** report titled "TEST quake" (the agency does not cover this type)

Open each report's details. The id is in the link when you share it, or in Firebase > Firestore > `reports` (the document id). Copy both ids.

## 2. Run the test as the agency account
1. On the live site go to Settings > Admin and sign in with the PAGASA test account.
2. Press **F12**, open the **Console** tab.
3. Open `security-test.js`, paste your two ids at the top (`FLOOD_ID`, `QUAKE_ID`), copy the whole file, paste into the console, press Enter.
4. Wait a few seconds. A table appears with PASS or FAIL for each line.

Expected: **17 PASS, 0 FAIL.** For the agency account the three "should work" lines are allowed: verify a covered report, assess a covered report, publish and then withdraw a test advisory. Everything else is denied.

## 3. Run the test as a visitor
1. Open a **new private/incognito window** (a different identity from the one that posted the test reports). Open the site, wait about 10 seconds. Do not sign in.
2. Press F12 > Console, paste the same script (same two ids), press Enter.

Expected: **17 PASS, 0 FAIL.** For a visitor every line is denied, including the ones the agency may do.

(If you run it as the owner account it stops and says so. Owner powers are tested by hand: verify, resolve, delete, audit log.)

## 4. Read the result
- **All PASS:** the permissions hold. Tell me and I'll mark it tested.
- **Any FAIL:** copy the table and send it to me. A FAIL on a "denied" line means a hole in the rules, which I fix before any real agency gets an account. A FAIL on an "allowed" line usually means a bug that blocks legitimate use.
- `other:...` in the "got" column is not a rules answer (network, wrong id, missing document). Check the ids and run again.

## What the test leaves behind
- The "TEST flood" report is marked verified, one assessment on it, one withdrawn test advisory with two revision records, and several audit entries. This is harmless. The owner can delete the two test reports in the app (Settings > Admin shows delete on report details).

## What the lines check
| # | Attempt | Agency | Visitor |
|---|---|---|---|
| 1 | Delete someone else's report | denied | denied |
| 2 | Verify a type the agency does not cover | denied | denied |
| 3 | Verify without an audit entry | denied | denied |
| 4 | Verify a covered report with audit | allowed | denied |
| 5 | Read the audit log | denied | denied |
| 6 | Audit entry with action DELETE | denied | denied |
| 7 | Edit an audit entry | denied | denied |
| 8 | Make yourself owner | denied | denied |
| 9 | Assess an uncovered type | denied | denied |
| 10 | Assess under another agency's name | denied | denied |
| 11 | Assess a covered report | allowed | denied |
| 12 | Advisory for an uncovered hazard | denied | denied |
| 13 | Advisory under another agency's name | denied | denied |
| 14 | Advisory with an http link | denied | denied |
| 15 | Publish a valid advisory | allowed | denied |
| 16 | Withdraw it (revision 2) | allowed | denied |
| 17 | Edit again without raising the revision | denied | denied |

## Not covered by this script (test by hand)
- A second agency (for example PHIVOLCS) cannot edit PAGASA's advisory. Make a second agency account, then sign in and try Edit on a PAGASA advisory: the button must not show.
- Signing out: an agency account that is removed from `admins` loses its powers on the next request.
- Owner: verify, resolve, delete, audit log, withdraw any advisory.
- This script checks the rules as they are now. Re-run it after every change to `firestore.rules`.
