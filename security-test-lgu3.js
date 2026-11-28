/* DATAsaster: LGU module PHASE 3 security test (owner-only powers).
   Run it THREE times in the browser console (F12) on the LIVE admin.html page:
     (1) new incognito window, not signed in          -> visitor table, expected 7 PASS
     (2) signed in as an ORGANIZATION ADMIN           -> expected 7 PASS   (sign in at console.html first, then open admin.html in the same window)
     (3) signed in as the OWNER                       -> expected 14 PASS (12 if there are no applications yet)
   It leaves ONE suspended test organization "zz-test-org" in Firestore (organizations cannot be deleted from the app): delete it in the Firebase console. */
(async function () {
  var db = firebase.firestore(), u = firebase.auth().currentUser, TS = firebase.firestore.FieldValue.serverTimestamp, rows = [];
  if (!u) { console.log('Not signed in yet. Wait a few seconds and run again.'); return; }
  var adm = (!u.isAnonymous) ? await db.collection('admins').doc(u.uid).get().catch(function () { return { exists: false }; }) : { exists: false };
  var mem = (!u.isAnonymous) ? await db.collection('orgMembers').doc(u.uid).get().catch(function () { return { exists: false }; }) : { exists: false };
  var mode = adm.exists && (!(adm.data() || {}).role || (adm.data() || {}).role === 'owner' || (adm.data() || {}).role === 'admin') ? 'owner' : (mem.exists ? 'orgadmin' : 'visitor');
  async function t(name, expect, fn) {
    var got;
    try { await fn(); got = 'allowed'; } catch (e) { got = e && e.code === 'permission-denied' ? 'denied' : 'other:' + ((e && (e.code || e.message)) || e); }
    rows.push({ '#': rows.length + 1, attempt: name, expected: expect, got: got, result: got === expect ? 'PASS' : 'FAIL' });
  }
  function org(o) {
    var d = { name: 'ZZ Test Organization', type: 'Barangay', province: 'Batangas', city: 'Batangas City', barangay: '', address: 'Test address', hotline: '', publicEmail: '', status: 'suspended', types: ['flood'], south: 13.7, north: 13.8, west: 121, east: 121.1, appId: '', updatedAt: TS() }, k;
    for (k in (o || {})) { d[k] = o[k]; } return d;
  }
  var apps = await db.collection('applications').limit(1).get().then(function (s) { var id = null; s.forEach(function (d) { id = d.id; }); return id; }).catch(function () { return null; });
  var appId = apps || 'aaaaaaaaaaaaaaaaaaaa';
  if (mode !== 'owner') {
    await t('Read applications', 'denied', function () { return db.collection('applications').limit(1).get(); });
    await t('Read an application\'s private notes', 'denied', function () { return db.collection('applications').doc(appId).collection('notes').limit(1).get(); });
    await t('Read uploaded letters', 'denied', function () { return db.collection('applicationDocs').limit(1).get(); });
    await t('Approve an application (change its status)', 'denied', function () { return db.collection('applications').doc(appId).update({ status: 'approved', updatedAt: TS(), decidedAt: Date.now() }); });
    await t('Create an organization', 'denied', function () { return db.collection('organizations').doc('zz-test-org').set(org()); });
    await t('Link myself as an organization admin', 'denied', function () { return db.collection('orgMembers').doc(u.uid).set({ role: 'orgadmin', orgId: 'zz-test-org', email: 'x@x.com' }); });
    await t('Delete an application', 'denied', function () { return db.collection('applications').doc(appId).delete(); });
  } else {
    await t('Read applications', 'allowed', function () { return db.collection('applications').limit(1).get(); });
    if (apps) {
      await t('Set a status that does not exist', 'denied', function () { return db.collection('applications').doc(apps).update({ status: 'hacked', updatedAt: TS() }); });
      await t('Change an applicant\'s email', 'denied', function () { return db.collection('applications').doc(apps).update({ email: 'x@x.com', updatedAt: TS() }); });
    }
    await t('Create an organization with a box outside the Philippines', 'denied', function () { return db.collection('organizations').doc('zz-test-bad').set(org({ south: 40, north: 50 })); });
    await t('Create an organization with an unknown hazard type', 'denied', function () { return db.collection('organizations').doc('zz-test-bad').set(org({ types: ['aliens'] })); });
    await t('Create an organization with an unknown type', 'denied', function () { return db.collection('organizations').doc('zz-test-bad').set(org({ type: 'Kingdom' })); });
    await t('Create a valid (suspended) test organization', 'allowed', function () { return db.collection('organizations').doc('zz-test-org').set(org()); });
    await t('Link an admin to a missing organization', 'denied', function () { return db.collection('orgMembers').doc('zzTestUid').set({ role: 'orgadmin', orgId: 'does-not-exist', email: 'x@x.com' }); });
    await t('Link an admin with role "owner"', 'denied', function () { return db.collection('orgMembers').doc('zzTestUid').set({ role: 'owner', orgId: 'zz-test-org', email: 'x@x.com' }); });
    await t('Link a test admin to the test organization', 'allowed', function () { return db.collection('orgMembers').doc('zzTestUid').set({ role: 'orgadmin', orgId: 'zz-test-org', email: 'x@x.com' }); });
    await t('Remove the test admin', 'allowed', function () { return db.collection('orgMembers').doc('zzTestUid').delete(); });
    await t('Delete an organization', 'denied', function () { return db.collection('organizations').doc('zz-test-org').delete(); });
    await t('Add a note with an extra field', 'denied', function () { return db.collection('applications').doc(appId).collection('notes').doc().set({ text: 'x', time: TS(), by: 'me', admin: true }); });
    await t('Add a valid private note, then delete it', 'allowed', async function () { var r = db.collection('applications').doc(appId).collection('notes').doc(); await r.set({ text: 'ZZ test note', time: TS(), by: 'test' }); await r.delete(); });
  }
  console.table(rows);
  var bad = rows.filter(function (r) { return r.result !== 'PASS'; }).length;
  console.log('Mode detected: ' + mode + '. ' + (bad ? bad + ' FAIL. Copy the table and send it to the developer.' : 'All ' + rows.length + ' PASS.') + (mode === 'owner' ? ' Delete organizations/zz-test-org in Firebase console.' : ''));
}());
