/* Shared reports through Firebase (Firestore + sign-in + optional App Check).
   If the config is empty or Firebase failed to load, CLOUD.on stays false and the app works locally. */
(function () {
  var C = window.CLOUD = { on: false, uid: '', admin: false, email: '' };
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
        C.uid = u.uid; C.email = u.isAnonymous ? '' : (u.email || ''); C.admin = false;
        onAuth();
        if (!u.isAnonymous) {
          db.collection('admins').doc(u.uid).get().then(function (d) { C.admin = d.exists; onAuth(); }, function () { C.admin = false; onAuth(); });
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

  C.login = function (email, pw, ok, fail) {
    auth.signInWithEmailAndPassword(email, pw).then(function () { ok(); }, function (er) { fail(er); });
  };
  C.logout = function () { C.stopFlags(); auth.signOut(); };

  /* A report and the poster's "last post" time are written together; the server rules use it to limit posting to one report per 2 minutes. */
  C.add = function (it, fail) {
    var ref = db.collection('reports').doc(), batch = db.batch(), obs = [], i;
    for (i = 0; i < it.obs.length; i++) { obs.push({ k: String(it.obs[i][0]), v: String(it.obs[i][1]) }); }
    batch.set(ref, {
      uid: C.uid, type: it.type, sev: it.sev, title: it.title, desc: it.desc, place: it.place,
      lat: it.lat, lng: it.lng, img: it.img || '', obs: obs, time: it.time, resolved: false, resAt: 0, verified: false
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
  C.setResolved = function (docId, val, fail) {
    db.collection('reports').doc(docId).update({ resolved: val, resAt: val ? Date.now() : 0 }).catch(function (er) { fail(er); });
  };
  C.setVerified = function (docId, val, fail) {
    db.collection('reports').doc(docId).update({ verified: val }).catch(function (er) { fail(er); });
  };
  C.remove = function (docId, fail) {
    db.collection('reports').doc(docId).delete().catch(function (er) { fail(er); });
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
      snap.forEach(function (d) { b.delete(d.ref); });
      return b.commit();
    }).catch(function (er) { fail(er); });
  };
})();
