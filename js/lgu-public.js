/* Partner announcements on the public home page (LGU module phase 2). Read only.
   Shows PUBLISHED announcements that are inside their start and end time. Everything else stays private (see firestore.rules). */
(function () {
  'use strict';
  var list = [], db;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(ms) { return new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function isLocal(a) { return a.scope === 'areas' && a.areaCodes && a.areaCodes.length; }
  /* With the area filter on: announcements for the visitor's area first, then at most 3 nationwide ones, so they cannot crowd the list.
     Announcements without a scope (older ones) count as nationwide. */
  function active() {
    var n = Date.now(), on = window.PLACES && PLACES.isOn(), codes = on ? PLACES.codes() : [], loc = [], nat = [];
    list.filter(function (a) { return a.status === 'published' && a.startsAt <= n && a.endsAt > n; }).forEach(function (a) {
      if (isLocal(a)) { if (!on || a.areaCodes.some(function (c) { return codes.indexOf(c) > -1; })) { loc.push(a); } } else { nat.push(a); }
    });
    function srt(x, y) { return (x.type === 'evacuation' ? 0 : 1) - (y.type === 'evacuation' ? 0 : 1) || y.startsAt - x.startsAt; }
    loc.sort(srt); nat.sort(srt);
    return loc.concat(on ? nat.slice(0, 3) : nat);
  }
  function render() {
    var a = active(), box = $('annList'), bar = $('annBar');
    if (box) {
      box.innerHTML = a.map(function (x) {
        var ev = x.type === 'evacuation';
        return '<article class="ann' + (ev ? '' : ' gen') + '"><div class="atags"><span class="atag' + (ev ? ' evac' : '') + '">' + (ev ? 'EVACUATION' : 'GENERAL') + '</span><span class="atag">' + (isLocal(x) ? 'YOUR AREA' : 'NATIONWIDE') + '</span><span class="atag">PARTNER</span><b>' + esc(x.orgName) + '</b></div><h3>' + esc(x.title) + '</h3><p>' + esc(x.desc) + '</p><small>'
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
  /* ---- Partnership popup: shown when the visitor reaches the News section, at most once per day on this browser ---- */
  var PKEY = 'datasaster_partner_day', pm = null, lastFocus = null;
  function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); }
  function shownToday() { try { return window.localStorage.getItem(PKEY) === today(); } catch (e) { return pmSession; } }
  var pmSession = false;
  function markShown() { pmSession = true; try { window.localStorage.setItem(PKEY, today()); } catch (e) {} }
  function closePm() {
    if (!pm) { return; }
    markShown(); pm.hidden = true;
    document.removeEventListener('keydown', pmKey, true);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function pmKey(e) {
    if (e.key === 'Escape' || e.keyCode === 27) { e.stopPropagation(); closePm(); return; }
    if (e.key === 'Tab' || e.keyCode === 9) {
      var f = pm.querySelectorAll('a[href],button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function openPm() {
    if (shownToday() || $('noticeBar') || document.body.getAttribute('data-view') === 'settings' || document.body.getAttribute('data-view') === 'review') { return; }
    if (!pm) {
      pm = document.createElement('div'); pm.className = 'pmodal'; pm.id = 'partnerModal'; pm.hidden = true;
      pm.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="pmH" aria-describedby="pmD">'
        + '<button type="button" class="btn x" id="pmX" aria-label="Close">&times;</button>'
        + '<small class="k">For LGUs, barangays, HOAs and response teams</small>'
        + '<h2 id="pmH">Run your area’s disaster dashboard on DATAsaster</h2>'
        + '<p id="pmD">Review community reports and publish announcements to residents in your area. Applications are reviewed by the DATAsaster team.</p>'
        + '<div class="acts"><a class="btn" href="partner.html" id="pmL">Learn more</a><a class="btn primary" href="apply.html" id="pmA">Apply for partnership</a></div>'
        + '<div class="acts" style="margin-top:8px"><button type="button" class="btn" id="pmN">Not now</button></div></div>';
      document.body.appendChild(pm);
      $('pmX').addEventListener('click', closePm); $('pmN').addEventListener('click', closePm);
      $('pmL').addEventListener('click', markShown); $('pmA').addEventListener('click', markShown);
      pm.addEventListener('mousedown', function (e) { if (e.target === pm) { closePm(); } });
    }
    lastFocus = document.activeElement; pm.hidden = false;
    document.addEventListener('keydown', pmKey, true);
    $('pmX').focus();
  }
  function newsVisible() {
    var b = document.body, g = $('infoGrid');
    if (b.getAttribute('data-pane') === 'news') { return !!(g && g.offsetParent !== null); }
    return false;
  }
  function watchNews() {
    var g = $('infoGrid');
    if (!g) { return; }
    // phone: the News tab; computer: the News section scrolling into view
    new MutationObserver(function () { if (newsVisible()) { setTimeout(function () { if (newsVisible()) { openPm(); } }, 600); } }).observe(document.body, { attributes: true, attributeFilter: ['data-pane', 'data-view'] });
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (en) {
        if (window.matchMedia('(max-width:900px)').matches) { return; }
        if (en[0].isIntersecting && en[0].intersectionRatio >= 0.35) { setTimeout(function () { if (!shownToday() && g.getBoundingClientRect().top < window.innerHeight * 0.6) { openPm(); } }, 800); }
      }, { threshold: [0.35] });
      io.observe(g);
    }
  }
  watchNews();
  if (window.PLACES) { PLACES.onChange(render); }
  start();
}());
