/* DATAsaster: LGU module PHASE 1 security test (partnership applications).
   Run it in the browser console (F12) on the LIVE site's home page, in a NEW INCOGNITO WINDOW, signed out of any account.
   Wait ~10 seconds after the page loads, paste this whole file, press Enter. A table of PASS / FAIL appears.
   Expected: 14 PASS, 0 FAIL.  It leaves ONE test application behind ("ZZ TEST DELETE ME") and one applyLimits document.
   Delete both in Firebase console > Firestore (applications, applyLimits) afterwards.
   NOTE: it blocks you from applying again from this window for 10 minutes. That is the rate limit working. */
(async function () {
  var db = firebase.firestore(), u = firebase.auth().currentUser, TS = firebase.firestore.FieldValue.serverTimestamp, rows = [];
  if (!u) { console.log('Not signed in yet. Wait a few seconds and run again.'); return; }
  function id() { var A = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', s = '', i; for (i = 0; i < 20; i++) { s += A.charAt(Math.floor(Math.random() * A.length)); } return s; }
  function app(o) {
    var d = { uid: u.uid, refNo: 'LGU-2026-ZZTEST', status: 'pending', time: TS(), orgName: 'ZZ TEST DELETE ME', orgType: 'Other', province: 'Test', city: 'Test City', barangay: '', address: 'Test address',
      repName: 'Test Person', position: 'Tester', email: 'test@example.com', phone: '0917 123 4567', purpose: 'Other', message: '', hasDoc: false, docName: '', docType: '', docSize: 0, agreed: true };
    var k; for (k in (o || {})) { if (o[k] === undefined) { delete d[k]; } else { d[k] = o[k]; } } return d;
  }
  function lim(appId) { return { lastApply: TS(), appId: appId }; }
  async function t(name, expect, fn) {
    var got;
    try { await fn(); got = 'allowed'; } catch (e) { got = e && e.code === 'permission-denied' ? 'denied' : 'other:' + ((e && (e.code || e.message)) || e); }
    rows.push({ '#': rows.length + 1, attempt: name, expected: expect, got: got, result: got === expect ? 'PASS' : 'FAIL' });
  }
  async function one(a, id1, limDoc, extra) {
    var b = db.batch(); b.set(db.collection('applications').doc(id1), a);
    if (limDoc !== null) { b.set(db.collection('applyLimits').doc(u.uid), limDoc || lim(id1)); }
    if (extra) { extra(b); }
    await b.commit();
  }
  var a1 = id(), a2 = id(), a3 = id();
  /* things that must be refused (and must NOT use up the rate limit) */
  await t('Read the applications list', 'denied', function () { return db.collection('applications').limit(1).get(); });
  await t('Read the private documents', 'denied', function () { return db.collection('applicationDocs').limit(1).get(); });
  await t('Application without a rate-limit entry', 'denied', function () { return one(app(), a1, null); });
  await t('Application with status "approved"', 'denied', function () { return one(app({ status: 'approved' }), a1); });
  await t('Application with an extra field (isAdmin)', 'denied', function () { return one(app({ isAdmin: true }), a1); });
  await t('Application with a bad email', 'denied', function () { return one(app({ email: 'no-domain@gmail' }), a1); });
  await t('Application with an unknown organization type', 'denied', function () { return one(app({ orgType: 'Kingdom' }), a1); });
  await t('Application in someone else\'s name (uid)', 'denied', function () { return one(app({ uid: 'someone-else' }), a1); });
  await t('Rate-limit entry names a different application', 'denied', function () { return one(app(), a1, lim(a2)); });
  await t('Two applications in one batch', 'denied', function () { return one(app(), a1, lim(a1), function (b) { b.set(db.collection('applications').doc(a2), app()); }); });
  await t('Document without hasDoc = true', 'denied', function () { return one(app(), a1, lim(a1), function (b) { b.set(db.collection('applicationDocs').doc(a1), { uid: u.uid, data: 'AAAA' }); }); });
  /* one honest application must work */
  await t('One valid application (a leftover test row is created)', 'allowed', function () { return one(app(), a3, lim(a3)); });
  /* and then the cooldown, edits and deletes must fail */
  await t('A second valid application right after', 'denied', function () { return one(app(), a1, lim(a1)); });
  await t('Edit the application status afterwards', 'denied', function () { return db.collection('applications').doc(a3).update({ status: 'approved' }); });
  console.table(rows);
  var bad = rows.filter(function (r) { return r.result !== 'PASS'; }).length;
  console.log(bad ? bad + ' FAIL. Copy the table and send it to the developer.' : 'All ' + rows.length + ' PASS. Delete the test application ' + a3 + ' and your applyLimits document in Firebase console.');
}());
