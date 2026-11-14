var CACHE = 'datasaster-v18';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './css/style.css', './js/data.js', './js/app.js', './lib/leaflet.js', './lib/leaflet.css',
  './lib/firebase-app-compat.js', './lib/firebase-auth-compat.js', './lib/firebase-firestore-compat.js', './lib/firebase-app-check-compat.js', './js/firebase-config.js', './js/cloud.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) { return; }
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (cs) {
    if (cs.length) { return cs[0].focus(); }
    return self.clients.openWindow('./');
  }));
});
