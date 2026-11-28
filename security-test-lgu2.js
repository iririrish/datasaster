/* DATAsaster: LGU module PHASE 2 security test (organization isolation).
   Run it TWICE in the browser console (F12) on the LIVE console page (console.html):
     (1) in a NEW INCOGNITO window, NOT signed in           -> prints the visitor table (expected: 8 PASS)
     (2) in a window SIGNED IN as an organization admin     -> prints the org-admin table (expected: 14 PASS, 0 FAIL, "skipped" rows are fine)
   Set OTHER_ORG below to the id of ANOTHER organization (any id that is not yours; it does not need to exist).
   It briefly edits one in-area report (verify, then undoes it) and one announcement it creates itself, and deletes that again. */
(async function () {
  var OTHER_ORG = 'some-other-org';
  var db = firebase.firestore(), u = firebase.auth().currentUser, TS = firebase.firestore.FieldValue.serverTimestamp, rows = [], n0 = Date.now();
  var isOrg = !!(u && !u.isAnonymous);
  function id() { var A = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', s = '', i; for (i = 0; i < 20; i++) { s += A.charAt(Math.floor(Math.random() * A.length)); } return s; }
  async function t(name, expect, fn) {
    var got;
    try { await fn(); got = 'allowed'; } catch (e) { got = e && e.code === 'permission-denied' ? 'denied' : 'other:' + ((e && (e.code || e.message)) || e); }
    rows.push({ '#': rows.length + 1, attempt: name, expected: expect, got: got, result: got === expect ? 'PASS' : 'FAIL' });
  }
  function skip(name) { rows.push({ '#': rows.length + 1, attempt: name, expected: '-', got: 'skipped', result: 'SKIP' }); }
  function ann(org, o) {
    var d = { orgId: org, orgName: 'x', type: 'general', title: 'ZZ test', desc: 'test only', areas: '', startsAt: n0, endsAt: n0 + 3600000, status: 'draft', uid: u ? u.uid : 'x', updatedAt: TS() }, k;
    for (k in (o || {})) { d[k] = o[k]; } return d;
  }
  if (!isOrg) {
    await t('Read all announcements (drafts included)', 'denied', function () { return db.collection('announcements').limit(1).get(); });
    await t('Read the member list', 'denied', function () { return db.collection('orgMembers').limit(1).get(); });
    await t('Create an announcement', 'denied', function () { return db.collection('announcements').doc(id()).set(ann('o', {})); });
    await t('Change an organization', 'denied', function () { return db.collection('organizations').doc(OTHER_ORG).set({ name: 'hacked' }); });
    await t('Make myself an organization admin', 'denied', function () { return db.collection('orgMembers').doc(u ? u.uid : 'x').set({ role: 'orgadmin', orgId: OTHER_ORG }); });
    var rs = await db.collection('reports').orderBy('time', 'desc').limit(1).get(), rid = null; rs.forEach(function (d) { rid = d.id; });
    if (rid) { await t('Mark someone\'s report verified (visitor)', 'denied', function () { return db.collection('reports').doc(rid).update({ verified: true, vOrg: OTHER_ORG }); }); } else { skip('Mark a report verified (no reports)'); }
    await t('Read published announcements (should work)', 'allowed', function () { return db.collection('announcements').where('status', '==', 'published').limit(1).get(); });
    await t('Read organization profiles (should work)', 'allowed', function () { return db.collection('organizations').limit(1).get(); });
  } else {
    var mem = (await db.collection('orgMembers').doc(u.uid).get()).data(), mine = mem && mem.orgId, org = (await db.collection('organizations').doc(mine).get()).data();
    var rs2 = await db.collection('reports').orderBy('time', 'desc').limit(200).get(), inA = null, outA = null;
    rs2.forEach(function (d) { var r = d.data(), inside = org.types.indexOf(r.type) > -1 && r.lat >= org.south && r.lat <= org.north && r.lng >= org.west && r.lng <= org.east; if (inside && !inA) { inA = d.id; } if (!inside && !outA) { outA = d.id; } });
    if (inA) {
      await t('Verify a report inside my area', 'allowed', function () { return db.collection('reports').doc(inA).update({ verified: true, vOrg: mine }); });
      await t('Same, but also change its title', 'denied', function () { return db.collection('reports').doc(inA).update({ verified: true, vOrg: mine, title: 'changed' }); });
      await t('Same, but stamp another organization', 'denied', function () { return db.collection('reports').doc(inA).update({ verified: true, vOrg: OTHER_ORG }); });
      await db.collection('reports').doc(inA).update({ verified: false, vOrg: mine }).catch(function () {});
    } else { skip('Verify a report inside my area (none found)'); skip('...change title'); skip('...stamp other org'); }
    if (outA) { await t('Verify a report OUTSIDE my area or hazard types', 'denied', function () { return db.collection('reports').doc(outA).update({ verified: true, vOrg: mine }); }); } else { skip('Verify a report outside my area (none found)'); }
    var a1 = id();
    await t('Create an announcement for another organization', 'denied', function () { return db.collection('announcements').doc(id()).set(ann(OTHER_ORG, { orgName: org.name })); });
    await t('Create one for me with a wrong organization name', 'denied', function () { return db.collection('announcements').doc(id()).set(ann(mine, { orgName: 'Someone Else' })); });
    await t('Create one that runs longer than 30 days', 'denied', function () { return db.collection('announcements').doc(id()).set(ann(mine, { orgName: org.name, endsAt: n0 + 40 * 86400000 })); });
    await t('Create a valid draft for my own organization', 'allowed', function () { return db.collection('announcements').doc(a1).set(ann(mine, { orgName: org.name })); });
    await t('Move my announcement to another organization', 'denied', function () { return db.collection('announcements').doc(a1).set(ann(OTHER_ORG, { orgName: org.name })); });
    await t('Change my organization\'s name', 'denied', function () { return db.collection('organizations').doc(mine).update({ name: 'Renamed', updatedAt: TS() }); });
    await t('Change the coverage area', 'denied', function () { return db.collection('organizations').doc(mine).update({ south: -90, north: 90, updatedAt: TS() }); });
    await t('Edit another organization\'s profile', 'denied', function () { return db.collection('organizations').doc(OTHER_ORG).update({ address: 'hacked address', updatedAt: TS() }); });
    await t('Make myself admin of another organization', 'denied', function () { return db.collection('orgMembers').doc(u.uid).set({ role: 'orgadmin', orgId: OTHER_ORG }); });
    await t('Delete my test announcement', 'allowed', function () { return db.collection('announcements').doc(a1).delete(); });
  }
  console.table(rows);
  var bad = rows.filter(function (r) { return r.result === 'FAIL'; }).length;
  console.log(bad ? bad + ' FAIL. Copy the table and send it to the developer.' : 'No failures. Mode: ' + (isOrg ? 'organization admin' : 'visitor') + '.');
}());
