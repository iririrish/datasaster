/* Partner announcements on the public home page (LGU module phase 2). Read only.
   Shows PUBLISHED announcements that are inside their start and end time. Everything else stays private (see firestore.rules). */
(function () {
  'use strict';
  var list = [], db;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(ms) { return new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function active() {
    var n = Date.now();
    return list.filter(function (a) { return a.status === 'published' && a.startsAt <= n && a.endsAt > n; })
      .sort(function (a, b) { return (a.type === 'evacuation' ? 0 : 1) - (b.type === 'evacuation' ? 0 : 1) || b.startsAt - a.startsAt; });
  }
  function render() {
    var a = active(), box = $('annList'), bar = $('annBar');
    if (box) {
      box.innerHTML = a.map(function (x) {
        var ev = x.type === 'evacuation';
        return '<article class="ann' + (ev ? '' : ' gen') + '"><div class="atags"><span class="atag' + (ev ? ' evac' : '') + '">' + (ev ? 'EVACUATION' : 'GENERAL') + '</span><span class="atag">PARTNER LGU</span><b>' + esc(x.orgName) + '</b></div><h3>' + esc(x.title) + '</h3><p>' + esc(x.desc) + '</p><small>'
          + (x.areas ? 'Areas: ' + esc(x.areas) + ' &middot; ' : '') + 'Until ' + fmt(x.endsAt) + '. Posted by the organization, not by DATAsaster.</small></article>';
      }).join('');
    }
    if (bar) {
      if (!a.length) { bar.hidden = true; bar.innerHTML = ''; return; }
      bar.hidden = false;
      bar.innerHTML = '<span class="atag evac" style="font-size:11px;font-weight:700">' + (a[0].type === 'evacuation' ? 'EVACUATION' : 'ANNOUNCEMENT') + '</span><b>' + esc(a[0].title) + '</b><span class="m">' + esc(a[0].orgName) + '</span><span class="sp"></span><button type="button" id="annGo">Read announcement' + (a.length > 1 ? ' &middot; ' + a.length + ' active' : '') + '</button>';
      $('annGo').onclick = function () {
        var t = document.querySelector('#tabbar [data-pane=news]');
        if (t && t.offsetParent !== null) { t.click(); }
        setTimeout(function () { var s = $('advSec'); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 60);
      };
    }
  }
  function start() {
    if (!window.firebase || !firebase.apps || !firebase.apps.length) { return; }
    try {
      db = firebase.firestore();
      db.collection('announcements').where('status', '==', 'published').limit(100).onSnapshot(function (snap) {
        var l = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; l.push(x); }); list = l; render();
      }, function () { list = []; render(); });
      setInterval(render, 60000);
    } catch (e) {}
  }
  start();
}());
