/* Shared reports through Firebase (Firestore + anonymous sign-in).
   If the config is empty or Firebase failed to load, CLOUD.on stays false and the app works locally. */
(function () {
  var C = window.CLOUD = { on: false, uid: '', admin: false, email: '' };
  var cfg = window.FIREBASE_CONFIG, db, auth;
  if (!cfg || !cfg.apiKey || !window.firebase) { return; }
  try {
    firebase.initializeApp(cfg);
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
      }
      else { auth.signInAnonymously().catch(function (er) { onErr(er); }); }
    });
    db.collection('reports').orderBy('time', 'desc').limit(200).onSnapshot(function (snap) {
      var list = [];
      snap.forEach(function (d) { var x = d.data(); x._id = d.id; list.push(x); });
      onData(list);
    }, function (er) { onErr(er); });
  };

  C.login = function (email, pw, ok, fail) {
    auth.signInWithEmailAndPassword(email, pw).then(function () { ok(); }, function (er) { fail(er); });
  };
  C.logout = function () { auth.signOut(); };

  C.add = function (it, fail) {
    var ref = db.collection('reports').doc(), obs = [], i;
    for (i = 0; i < it.obs.length; i++) { obs.push({ k: String(it.obs[i][0]), v: String(it.obs[i][1]) }); }
    ref.set({
      uid: C.uid, type: it.type, sev: it.sev, title: it.title, desc: it.desc, place: it.place,
      lat: it.lat, lng: it.lng, img: it.img || '', obs: obs, time: it.time, resolved: false, resAt: 0
    }).catch(function (er) { fail(er); });
    return ref.id;
  };
  C.setResolved = function (docId, val, fail) {
    db.collection('reports').doc(docId).update({ resolved: val, resAt: val ? Date.now() : 0 }).catch(function (er) { fail(er); });
  };
  C.remove = function (docId, fail) {
    db.collection('reports').doc(docId).delete().catch(function (er) { fail(er); });
  };
})();
