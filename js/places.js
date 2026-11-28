/* Philippine places (region > province > city/municipality > barangay) by their official PSGC codes (Phase 4).
   The lists come from the free public PSGC API in the visitor's browser and are cached in localStorage, so nothing is bundled or invented here.
   Change window.PSGC_API before this file loads to use another copy of the same API. The saved choice (ds_loc) stays on the device. */
(function () {
  'use strict';
  var API = window.PSGC_API || 'https://psgc.gitlab.io/api', TTL = 90 * 86400000, KEY = 'ds_loc', ONKEY = 'ds_loc_on', SCKEY = 'ds_loc_scope';
  var P = window.PLACES = {}, memo = {}, listeners = [];

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) {} }

  /* Load one list: memory, then localStorage (up to 90 days), then the network. cb(error, [{c, n, p}]) */
  function load(path, norm, cb) {
    var ck = 'ds_psgc:' + path, raw, o, ctl, t;
    if (memo[path]) { cb(null, memo[path]); return; }
    raw = lsGet(ck);
    if (raw) { try { o = JSON.parse(raw); if (o && o.t && Date.now() - o.t < TTL && o.d && o.d.length) { memo[path] = o.d; cb(null, o.d); return; } } catch (e) {} }
    if (!window.fetch) { cb({ code: 'no-fetch' }); return; }
    ctl = window.AbortController ? new AbortController() : null;
    t = setTimeout(function () { if (ctl) { ctl.abort(); } }, 15000);
    fetch(API + path, ctl ? { signal: ctl.signal } : {}).then(function (r) { if (!r.ok) { throw { code: 'http-' + r.status }; } return r.json(); }).then(function (j) {
      var out = [], i;
      clearTimeout(t);
      if (!j || !j.length) { throw { code: 'empty' }; }
      for (i = 0; i < j.length; i++) { if (j[i] && typeof j[i].code === 'string' && typeof j[i].name === 'string') { out.push(norm(j[i])); } }
      out.sort(function (a, b) { return a.n < b.n ? -1 : (a.n > b.n ? 1 : 0); });
      memo[path] = out; lsSet(ck, JSON.stringify({ t: Date.now(), d: out }));
      cb(null, out);
    }).catch(function (er) {
      clearTimeout(t);
      // an old cached copy is better than nothing
      if (raw) { try { o = JSON.parse(raw); if (o && o.d && o.d.length) { memo[path] = o.d; cb(null, o.d); return; } } catch (e2) {} }
      cb(er || { code: 'network' });
    });
  }
  function nm(x) { return { c: x.code, n: String(x.name).substring(0, 100), p: x.provinceCode && typeof x.provinceCode === 'string' ? x.provinceCode : '' }; }

  P.regions = function (cb) { load('/regions/', nm, cb); };
  P.provinces = function (reg, cb) { load('/regions/' + encodeURIComponent(reg) + '/provinces/', nm, cb); };
  P.cities = function (reg, cb) { load('/regions/' + encodeURIComponent(reg) + '/cities-municipalities/', nm, cb); };
  P.barangays = function (city, cb) { load('/cities-municipalities/' + encodeURIComponent(city) + '/barangays/', nm, cb); };

  /* The visitor's saved choice: { reg:{c,n}, prov:{c,n}|null, city:{c,n}|null, brgy:{c,n}|null, lat, lng } */
  function clean(o) {
    var out = {}, k, v, ks = ['reg', 'prov', 'city', 'brgy'];
    if (!o || typeof o !== 'object') { return null; }
    for (k = 0; k < ks.length; k++) {
      v = o[ks[k]];
      if (v && typeof v.c === 'string' && /^[0-9]{9,10}$/.test(v.c) && typeof v.n === 'string') { out[ks[k]] = { c: v.c, n: v.n.substring(0, 100) }; }
    }
    if (!out.reg && !out.prov && !out.city && !out.brgy) { return null; }
    if (typeof o.lat === 'number' && typeof o.lng === 'number' && isFinite(o.lat) && isFinite(o.lng) && o.lat > 3 && o.lat < 23 && o.lng > 115 && o.lng < 128) { out.lat = o.lat; out.lng = o.lng; }
    return out;
  }
  P.clean = clean;
  P.get = function () { var r = lsGet(KEY); if (!r) { return null; } try { return clean(JSON.parse(r)); } catch (e) { return null; } };
  /* Filter is on when a place is saved and the visitor has not switched to Nationwide. */
  P.isOn = function () { return !!P.get() && lsGet(ONKEY) !== '0'; };
  P.scope = function () { var s = lsGet(SCKEY); return s === 'city' || s === 'reg' ? s : 'prov'; };
  function fire() { var i; for (i = 0; i < listeners.length; i++) { try { listeners[i](); } catch (e) {} } }
  P.onChange = function (fn) { listeners.push(fn); };
  P.set = function (o) { var c = clean(o); if (!c) { return false; } lsSet(KEY, JSON.stringify(c)); lsSet(ONKEY, '1'); fire(); return true; };
  P.clear = function () { lsDel(KEY); lsDel(ONKEY); fire(); };
  P.setOn = function (on) { lsSet(ONKEY, on ? '1' : '0'); fire(); };
  P.setScope = function (s) { lsSet(SCKEY, s); fire(); };
  P.label = function (L) { L = L || P.get(); return L ? [L.brgy && L.brgy.n, L.city && L.city.n, L.prov && L.prov.n, !L.prov && !L.city && L.reg && L.reg.n].filter(Boolean).join(', ') : ''; };
  /* 0 = barangay, 1 = city, 2 = province, 3 = region: how wide the saved place is */
  P.level = function (L) { L = L || P.get(); return !L ? 4 : (L.brgy || L.city ? 1 : (L.prov ? 2 : 3)); };
  /* Codes a report or announcement may carry to be relevant here */
  P.codes = function (L) { L = L || P.get(); var o = []; if (L) { ['brgy', 'city', 'prov', 'reg'].forEach(function (k) { if (L[k]) { o.push(L[k].c); } }); } return o; };

  /* Map centre for a saved place (best effort, free Open-Meteo geocoder). Only used to zoom the map and to place old reports that have no codes. */
  P.locate = function (L, cb) {
    var name, q, ctl, t;
    if (!L) { cb(null); return; }
    name = (L.city || L.prov || L.reg).n.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(City|Municipality) of\s+/i, '').replace(/\s+City$/i, ' City').replace(/^\s+|\s+$/g, '');
    if (!window.fetch) { cb(null); return; }
    ctl = window.AbortController ? new AbortController() : null;
    t = setTimeout(function () { if (ctl) { ctl.abort(); } }, 10000);
    q = 'https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&countryCode=PH&name=' + encodeURIComponent(name);
    fetch(q, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
      var res = (j && j.results) || [], best = null, i, hay, want = ((L.prov && L.prov.n) || (L.reg && L.reg.n) || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/^province of\s+/, '');
      clearTimeout(t);
      for (i = 0; i < res.length && !best; i++) {
        hay = ((res[i].admin1 || '') + ' ' + (res[i].admin2 || '') + ' ' + (res[i].admin3 || '')).toLowerCase();
        if (want && hay.indexOf(want.split(' ')[0]) > -1) { best = res[i]; }
      }
      if (!best && res.length) { best = res[0]; }
      cb(best && typeof best.latitude === 'number' ? { lat: best.latitude, lng: best.longitude } : null);
    }).catch(function () { clearTimeout(t); cb(null); });
  };
  /* ---- Cascading picker: region > province > city/municipality > barangay (barangay optional). Used on the home page and in the super admin page. ---- */
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  P.esc = esc;
  P.picker = function (el, opts, onChange) {
    var pre = (opts && opts.prefix) || 'pk', withB = !opts || opts.barangay !== false, st = { reg: null, prov: null, city: null, brgy: null }, lists = { reg: [], prov: [], city: [], brgy: [] }, hasProv = true, busy = {}, err = '', api = {};
    function sel(k) { return document.getElementById(pre + '-' + k); }
    function find(list, c) { var i; for (i = 0; i < list.length; i++) { if (list[i].c === c) { return list[i]; } } return null; }
    function opt(list, cur, first) { var h = '<option value="">' + esc(first) + '</option>', i; for (i = 0; i < list.length; i++) { h += '<option value="' + esc(list[i].c) + '"' + (cur && cur.c === list[i].c ? ' selected' : '') + '>' + esc(list[i].n) + '</option>'; } return h; }
    function cityOpts() {
      var own = [], ind = [], i, h;
      if (!hasProv) { return opt(lists.city, st.city, 'Choose city or municipality'); }
      if (!st.prov) { return '<option value="">Choose a province first</option>'; }
      for (i = 0; i < lists.city.length; i++) { if (lists.city[i].p === st.prov.c) { own.push(lists.city[i]); } else if (!lists.city[i].p) { ind.push(lists.city[i]); } }
      h = opt(own, st.city, 'Choose city or municipality');
      if (ind.length) { h += '<optgroup label="Independent cities in this region">'; for (i = 0; i < ind.length; i++) { h += '<option value="' + esc(ind[i].c) + '"' + (st.city && st.city.c === ind[i].c ? ' selected' : '') + '>' + esc(ind[i].n) + '</option>'; } h += '</optgroup>'; }
      return h;
    }
    function draw() {
      var h = '', ld = function (k) { return busy[k] ? ' disabled' : ''; };
      h += '<div class="pkf"><label class="l" for="' + pre + '-reg">Region</label><select id="' + pre + '-reg"' + ld('reg') + '>' + opt(lists.reg, st.reg, busy.reg ? 'Loading regions...' : 'Choose region') + '</select></div>';
      h += '<div class="pkf"' + (hasProv ? '' : ' hidden') + '><label class="l" for="' + pre + '-prov">Province</label><select id="' + pre + '-prov"' + (!st.reg || busy.prov ? ' disabled' : '') + '>' + (st.reg ? opt(lists.prov, st.prov, busy.prov ? 'Loading...' : 'Choose province') : '<option value="">Choose a region first</option>') + '</select></div>';
      h += '<div class="pkf"><label class="l" for="' + pre + '-city">City / Municipality</label><select id="' + pre + '-city"' + (!st.reg || busy.city || (hasProv && !st.prov) ? ' disabled' : '') + '>' + (st.reg ? (busy.city ? '<option value="">Loading...</option>' : cityOpts()) : '<option value="">Choose a region first</option>') + '</select></div>';
      if (withB) { h += '<div class="pkf"><label class="l" for="' + pre + '-brgy">Barangay <span class="lopt">Optional</span></label><select id="' + pre + '-brgy"' + (!st.city || busy.brgy ? ' disabled' : '') + '>' + (st.city ? opt(lists.brgy, st.brgy, busy.brgy ? 'Loading barangays...' : 'Whole city or municipality') : '<option value="">Choose a city first</option>') + '</select></div>'; }
      if (err) { h += '<div class="pkerr" role="alert">' + esc(err) + ' <button type="button" class="btn sm" id="' + pre + '-retry">Try again</button></div>'; }
      el.innerHTML = h;
    }
    function changed() { if (onChange) { onChange(api.value()); } }
    function fail(what) { return function (e) { err = 'Could not load ' + what + (e && e.code ? ' (' + e.code + ')' : '') + '. Check your connection.'; }; }
    function loadRegions() {
      busy.reg = true; err = ''; draw();
      P.regions(function (e, l) { busy.reg = false; if (e) { fail('the region list')(e); } else { lists.reg = l; } draw(); });
    }
    function loadReg(r, then) {
      var n = 2, bad = false;
      busy.prov = true; busy.city = true; err = ''; draw();
      function done() { n--; if (n) { return; } busy.prov = false; busy.city = false; if (bad) { st.reg = null; } hasProv = lists.prov.length > 0; draw(); if (then) { then(); } }
      P.provinces(r.c, function (e, l) { if (e) { bad = true; fail('provinces')(e); lists.prov = []; } else { lists.prov = l; } done(); });
      P.cities(r.c, function (e, l) { if (e) { bad = true; fail('cities and municipalities')(e); lists.city = []; } else { lists.city = l; } done(); });
    }
    function loadBrgy(c, then) {
      if (!withB) { return; }
      busy.brgy = true; draw();
      P.barangays(c.c, function (e, l) { busy.brgy = false; if (e) { fail('barangays')(e); lists.brgy = []; } else { lists.brgy = l; } draw(); if (then) { then(); } });
    }
    el.addEventListener('change', function (e) {
      var id = e.target.id || '', k = id.slice(pre.length + 1), v = e.target.value, it;
      if (id.indexOf(pre + '-') !== 0) { return; }
      if (k === 'reg') { st = { reg: find(lists.reg, v), prov: null, city: null, brgy: null }; lists.prov = []; lists.city = []; lists.brgy = []; hasProv = true; if (st.reg) { loadReg(st.reg, changed); } else { draw(); changed(); } }
      else if (k === 'prov') { st.prov = find(lists.prov, v); st.city = null; st.brgy = null; lists.brgy = []; draw(); changed(); }
      else if (k === 'city') { it = null; st.city = find(lists.city, v); st.brgy = null; lists.brgy = []; draw(); changed(); if (st.city) { loadBrgy(st.city, changed); } }
      else if (k === 'brgy') { st.brgy = find(lists.brgy, v); changed(); }
    });
    el.addEventListener('click', function (e) { if (e.target && e.target.id === pre + '-retry') { if (!lists.reg.length) { loadRegions(); } else if (st.reg && !lists.city.length) { loadReg(st.reg, changed); } else if (st.city) { loadBrgy(st.city, changed); } else { err = ''; draw(); } } });
    api.value = function () { return { reg: st.reg ? { c: st.reg.c, n: st.reg.n } : null, prov: st.prov ? { c: st.prov.c, n: st.prov.n } : null, city: st.city ? { c: st.city.c, n: st.city.n } : null, brgy: st.brgy ? { c: st.brgy.c, n: st.brgy.n } : null }; };
    /* Fill from a saved value (names come from the saved copy, so the lists only need to contain the codes) */
    api.set = function (v, done) {
      if (!v || !v.reg) { st = { reg: null, prov: null, city: null, brgy: null }; draw(); if (done) { done(); } return; }
      st.reg = v.reg;
      loadReg(v.reg, function () {
        st.prov = v.prov ? (find(lists.prov, v.prov.c) || v.prov) : null;
        st.city = v.city ? (find(lists.city, v.city.c) || v.city) : null;
        draw();
        if (st.city && withB) { loadBrgy(st.city, function () { st.brgy = v.brgy ? (find(lists.brgy, v.brgy.c) || v.brgy) : null; draw(); if (done) { done(); } }); }
        else if (done) { done(); }
      });
    };
    draw(); loadRegions();
    return api;
  };
}());
