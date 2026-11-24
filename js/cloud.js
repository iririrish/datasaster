/* Shared reports through Firebase (Firestore + sign-in + optional App Check).
   If the config is empty or Firebase failed to load, CLOUD.on stays false and the app works locally. */
(function () {
  var C = window.CLOUD = { on: false, uid: '', admin: false, owner: false, role: '', agency: '', types: [], email: '' };
  var cfg = window.FIREBASE_CONFIG, db, auth, flagStop = null;
  if (!cfg || !cfg.apiKey || !window.firebase) { return; }
  try {
    firebase.initializeApp(cfg);
    if (firebase.appCheck) {
      try {
        if (window.APPCHECK_ENTERPRISE_KEY) { firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(window.APPCHECK_ENTERPRISE_KEY), true); }
        else if (window.APPCHECK_SITE_KEY) { firebase.appCheck().activate(window.APPCHECK_SITE_KEY, true); }
      } catch (e0) {}
    }
    db = firebase.firestore();
    auth = firebase.auth();
    C.on = true;
  } catch (e) { return; }
  try { db.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e2) {}

  C.start = function (onData, onAuth, onErr) {
    auth.onAuthStateChanged(function (u) {
      if (u) {
        C.uid = u.uid; C.email = u.isAnonymous ? '' : (u.email || ''); C.setRole(null);
        onAuth();
        if (!u.isAnonymous) {
          db.collection('admins').doc(u.uid).get().then(function (d) { C.setRole(d.exists ? (d.data() || {}) : null); onAuth(); }, function () { C.setRole(null); onAuth(); });
        }
      } else { auth.signInAnonymously().catch(function (er) { onErr(er); }); }
    });
    db.collection('reports').orderBy('time', 'desc').limit(200).onSnapshot({ includeMetadataChanges: true }, function (snap) {
      var list = [], added = [];
      snap.forEach(function (d) { var x = d.data(); x._id = d.id; x._pending = d.metadata.hasPendingWrites; list.push(x); });
      snap.docChanges().forEach(function (c) { if (c.type === 'added') { added.push(c.doc.id); } });
      onData(list, added);
    }, function (er) { onErr(er); });
  };

  /* Role comes from the admins/<uid> document. role "agency" = limited agency account (agency name + allowed hazard types).
     Any other document (including the old role "admin", or no role) = owner, same powers as before. */
  C.setRole = function (data) {
    var i, t;
    C.admin = !!data; C.owner = false; C.role = ''; C.agency = ''; C.types = [];
    if (!data) { return; }
    if (data.role === 'agency') {
      C.role = 'agency'; C.agency = String(data.agency || '');
      t = data.types && data.types.length ? data.types : [];
      for (i = 0; i < t.length; i++) { if (typeof t[i] === 'string') { C.types.push(t[i]); } }
    } else { C.role = 'owner'; C.owner = true; }
  };
  /* Can this signed-in admin act on a report of this hazard type? Owners: all. Agencies: only their listed types. */
  C.can = function (type) { return !!(C.admin && (C.owner || C.types.indexOf(type) > -1)); };

  C.login = function (email, pw, ok, fail) {
    auth.signInWithEmailAndPassword(email, pw).then(function () { ok(); }, function (er) { fail(er); });
  };
  C.logout = function () { C.stopFlags(); C.setRole(null); auth.signOut(); };

  /* A report and the poster's "last post" time are written together; the server rules use it to limit posting to one report per 2 minutes. */
  C.add = function (it, fail) {
    var ref = db.collection('reports').doc(), batch = db.batch(), obs = [], i;
    for (i = 0; i < it.obs.length; i++) { obs.push({ k: String(it.obs[i][0]), v: String(it.obs[i][1]) }); }
    batch.set(ref, {
      uid: C.uid, type: it.type, sev: it.sev, title: it.title, desc: it.desc, place: it.place,
      lat: it.lat, lng: it.lng, img: '', imgs: (it.imgs || []).slice(0, 3), obs: obs, time: it.time, resolved: false, resAt: 0, verified: false
    });
    batch.set(db.collection('users').doc(C.uid), { lastPost: firebase.firestore.FieldValue.serverTimestamp() });
    batch.commit().catch(function (er) { fail(er); });
    return ref.id;
  };
  /* Connection check: reports what is working. Reading reports is always allowed by the rules, so a failed read points to App Check or the network. */
  C.diagnose = function (cb) {
    var out = [], tok;
    out.push('Signed in: ' + (C.uid ? 'yes' : 'NO'));
    out.push('Device time: ' + new Date().toString());
    if (firebase.appCheck && (window.APPCHECK_ENTERPRISE_KEY || window.APPCHECK_SITE_KEY)) {
      tok = firebase.appCheck().getToken().then(function () { out.push('App Check token: ok'); }, function (e) { out.push('App Check token: FAILED (' + ((e && (e.code || e.message)) || 'unknown') + ')'); });
    } else { out.push('App Check: not set up in the app'); tok = Promise.resolve(); }
    tok.then(function () {
      return db.collection('reports').limit(1).get().then(function () { out.push('Read reports: ok'); }, function (e) { out.push('Read reports: FAILED (' + ((e && (e.code || e.message)) || 'unknown') + ')'); });
    }).then(function () { cb(out.join('\n')); }, function () { cb(out.join('\n')); });
  };
  /* Audit log: every admin or agency action is written in the same batch as the change. Only the owner can read the log; nobody can edit or delete entries. */
  C.auditRef = function (batch, action, targetId, note, ttype) {
    var ref = db.collection('audit').doc();
    batch.set(ref, { uid: C.uid, agency: C.owner ? 'OWNER' : C.agency, action: action, targetType: ttype || 'report', targetId: targetId, note: String(note || '').substring(0, 300), time: firebase.firestore.FieldValue.serverTimestamp() });
    return ref;
  };
  /* asAdmin = true when acting on someone else's report. The author resolving their own report is not an admin action. */
  C.setResolved = function (docId, val, fail, asAdmin) {
    var ref = db.collection('reports').doc(docId), f = { resolved: val, resAt: val ? Date.now() : 0 }, b, a;
    if (asAdmin && C.admin) {
      b = db.batch(); a = C.auditRef(b, val ? 'RESOLVE' : 'REOPEN', docId); f.auditId = a.id; b.update(ref, f);
      b.commit().catch(function (er) { fail(er); });
    } else { ref.update(f).catch(function (er) { fail(er); }); }
  };
  C.setVerified = function (docId, val, fail) {
    var b = db.batch(), a = C.auditRef(b, val ? 'VERIFY' : 'UNVERIFY', docId);
    b.update(db.collection('reports').doc(docId), { verified: val, auditId: a.id });
    b.commit().catch(function (er) { fail(er); });
  };
  C.remove = function (docId, fail, asAdmin) {
    var ref = db.collection('reports').doc(docId), b;
    if (asAdmin && C.owner) { b = db.batch(); C.auditRef(b, 'DELETE', docId); b.delete(ref); b.commit().catch(function (er) { fail(er); }); }
    else { ref.delete().catch(function (er) { fail(er); }); }
  };
  /* Agency assessments: public to read, written only by agency accounts (see firestore.rules). One document per agency per report. */
  C.watchAssess = function (onList) {
    db.collection('assessments').orderBy('time', 'desc').limit(400).onSnapshot(function (snap) {
      var list = [];
      snap.forEach(function (d) { var x = d.data(); x._id = d.id; list.push(x); });
      onList(list);
    }, function () {});
  };
  C.saveAssess = function (reportId, status, note, fail) {
    var b = db.batch(), a = C.auditRef(b, 'ASSESS', reportId, status);
    b.set(db.collection('assessments').doc(reportId + '_' + C.agency), { reportId: reportId, agency: C.agency, uid: C.uid, status: status, note: String(note || '').substring(0, 500), time: firebase.firestore.FieldValue.serverTimestamp(), auditId: a.id });
    b.commit().catch(function (er) { fail(er); });
  };
  /* Official advisories (public to read). saveAdv writes the advisory, a permanent revision record and an audit entry in one batch. */
  C.watchAdv = function (onList) {
    db.collection('advisories').orderBy('time', 'desc').limit(100).onSnapshot(function (snap) {
      var list = [];
      snap.forEach(function (d) { var x = d.data(); x._id = d.id; list.push(x); });
      onList(list);
    }, function () {});
  };
  C.saveAdv = function (a, fail) {
    var b = db.batch(), aref = a.id ? db.collection('advisories').doc(a.id) : db.collection('advisories').doc(), vref = db.collection('advisoryVersions').doc(),
        rev = (a.rev || 0) + 1, ts = firebase.firestore.FieldValue.serverTimestamp(),
        act = a.status === 'withdrawn' ? 'ADVISORY_WITHDRAW' : (a.id ? 'ADVISORY_EDIT' : 'ADVISORY_NEW'),
        au = C.auditRef(b, act, aref.id, 'rev ' + rev, 'advisory');
    b.set(vref, { advisoryId: aref.id, rev: rev, agency: C.agency, uid: C.uid, title: a.title, hazard: a.hazard, areas: a.areas, desc: a.desc, sourceUrl: a.sourceUrl, refNo: a.refNo, expiresAt: a.expiresAt, status: a.status, time: ts });
    b.set(aref, { agency: C.agency, uid: C.uid, title: a.title, hazard: a.hazard, areas: a.areas, desc: a.desc, sourceUrl: a.sourceUrl, refNo: a.refNo, issuedAt: a.issuedAt || Date.now(), expiresAt: a.expiresAt, status: a.status, rev: rev, time: ts, auditId: au.id, verId: vref.id });
    b.commit().catch(function (er) { fail(er); });
  };
  C.ownerWithdraw = function (advId, fail) {
    var b = db.batch(), au = C.auditRef(b, 'ADVISORY_WITHDRAW', advId, 'owner', 'advisory');
    b.update(db.collection('advisories').doc(advId), { status: 'withdrawn', time: firebase.firestore.FieldValue.serverTimestamp(), auditId: au.id });
    b.commit().catch(function (er) { fail(er); });
  };
  C.listAudit = function (onList, fail) {
    db.collection('audit').orderBy('time', 'desc').limit(50).get().then(function (snap) {
      var list = [];
      snap.forEach(function (d) { var x = d.data(); x._id = d.id; list.push(x); });
      onList(list);
    }, function (er) { fail(er); });
  };

  /* Flags: any visitor can flag a report once; only admins can read or clear flags. */
  C.flag = function (reportId, reason, ok, fail) {
    db.collection('flags').doc(reportId + '_' + C.uid).set({ reportId: reportId, uid: C.uid, reason: reason, time: Date.now() }).then(function () { ok(); }, function (er) { fail(er); });
  };
  C.watchFlags = function (onList, onErr) {
    if (flagStop) { return; }
    flagStop = db.collection('flags').orderBy('time', 'desc').limit(300).onSnapshot(function (snap) {
      var list = [];
      snap.forEach(function (d) { var x = d.data(); x._id = d.id; list.push(x); });
      onList(list);
    }, function (er) { flagStop = null; if (onErr) { onErr(er); } });
  };
  C.stopFlags = function () { if (flagStop) { flagStop(); flagStop = null; } };
  C.dismissFlags = function (reportId, fail) {
    db.collection('flags').where('reportId', '==', reportId).get().then(function (snap) {
      var b = db.batch();
      if (C.owner) { C.auditRef(b, 'FLAGS_DISMISS', reportId); }
      snap.forEach(function (d) { b.delete(d.ref); });
      return b.commit();
    }).catch(function (er) { fail(er); });
  };
})();
