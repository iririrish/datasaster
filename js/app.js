/* DATAsaster app logic. Content (incidents, contacts, outlets) lives in data.js.
   Colours and layout live in ../css/style.css. */
(function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lsGet(k, d) { try { var v = window.localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function each(a, f) { var i; for (i = 0; i < a.length; i++) { f(a[i], i); } }
  function ago(ms) {
    var s = Math.floor((Date.now() - ms) / 1000);
    if (isNaN(s)) { return ''; }
    if (s < 90) { return 'just now'; }
    if (s < 3600) { return Math.floor(s / 60) + ' min ago'; }
    if (s < 86400) { return Math.floor(s / 3600) + ' h ago'; }
    return Math.floor(s / 86400) + ' d ago';
  }
  function fmtFull(ms) { return new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PHT'; }
  function manilaDay(ms) { return new Date(ms + 8 * 3600000).toISOString().substring(0, 10); }
  function xhr(url, ok, fail, asText) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.timeout = 20000;
    x.onreadystatechange = function () {
      if (x.readyState !== 4) { return; }
      if (x.status >= 200 && x.status < 300) {
        if (asText) { ok(x.responseText); return; }
        try { ok(JSON.parse(x.responseText)); } catch (e) { fail('bad data'); }
      } else { fail(x.status ? 'error ' + x.status : 'no connection'); }
    };
    x.ontimeout = function () { fail('timeout'); };
    x.send();
  }

  /* ---------- icons (one set, 16px, 1.75 stroke) ---------- */
  var IC = {
    drop: '<path d="M12 3s6 6.3 6 10.3a6 6 0 0 1-12 0C6 9.300 12 3 12 3z"/>',
    flame: '<path d="M12 22c4 0 7-2.800 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 12 0 4 3 7 7 7z"/>',
    pulse: '<polyline points="3 12 7 12 10 4 14 20 17 12 21 12"/>',
    mountain: '<path d="M2 20l7-13 4 7 3-4 6 10z"/>',
    slide: '<path d="M3 5l18 10v5H3z"/><circle cx="14" cy="8" r="1.5"/><circle cx="18" cy="11.5" r="1.2"/>',
    zoomin: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>',
    zoomout: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/><line x1="8" y1="11" x2="14" y2="11"/>',
    right: '<polyline points="9 6 15 12 9 18"/>',
    left: '<polyline points="15 6 9 12 15 18"/>',
    alert: '<path d="M12 3l9.500 17h-19z"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.200"/>',
    storm: '<path d="M4 8h10a3 3 0 1 0-3-3"/><path d="M2 13h15a3 3 0 1 1-3 3"/><path d="M5 18h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.500" y2="16.500"/>',
    sliders: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.500"/><circle cx="15" cy="17" r="2.500"/>',
    layers: '<polygon points="12 3 2 8 12 13 22 8"/><polyline points="2 13 12 18 22 13"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="12" x2="18" y2="6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.300 5.700"/><polyline points="20 4 20 11 13 11"/>',
    up: '<polyline points="6 15 12 9 18 15"/>',
    down: '<polyline points="6 9 12 15 18 9"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>',
    pin: '<path d="M12 21s7-6.200 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/>',
    check: '<polyline points="5 12 10 17 19 7"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    news: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>',
    phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.870"/><path d="M16 3.130a4 4 0 0 1 0 7.750"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };
  function icon(n, s) { s = s || 16; return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + (IC[n] || '') + '</svg>'; }

  /* ---------- constants ---------- */
  var TYPES = {
    flood: { label: 'Flooding', ic: 'drop' },
    fire: { label: 'Fire', ic: 'flame' },
    quake: { label: 'Earthquake', ic: 'pulse' },
    volcano: { label: 'Volcanic eruption', ic: 'mountain' },
    typhoon: { label: 'Typhoon or storm', ic: 'storm' },
    landslide: { label: 'Landslide', ic: 'slide' }
  };
  var TORDER = ['flood', 'fire', 'quake', 'volcano', 'typhoon', 'landslide'];
  var TSHORT = { flood: 'Flooding', fire: 'Fire', quake: 'Earthquake', volcano: 'Volcanic', typhoon: 'Typhoon', landslide: 'Landslide' };
  var SEV = ['Low', 'Moderate', 'High', 'Critical'];
  var SEVCOL = ['#34d399', '#fbbf24', '#fb923c', '#ef4444'];
  var SEVINK = ['#0b1f17', '#2b2105', '#2b1405', '#ffffff'];
  var RESCOL = '#7f8ea3';
  var SEVDESC = {
    flood: ['Ankle-level flooding', 'Knee-level flooding', 'Waist-level flooding', 'Chest-level or higher flooding'],
    fire: ['Small contained fire', 'Expanding fire', 'Large fire', 'Widespread fire or threat to life'],
    quake: ['Felt only, no damage', 'Minor damage', 'Significant damage', 'Collapse, injuries or trapped people'],
    volcano: ['Minor activity', 'Noticeable activity or light ashfall', 'Heavy ashfall or major activity', 'Immediate threat to life'],
    typhoon: ['Strong wind or heavy rain', 'Damaged roofs or fallen trees', 'Widespread damage or power cuts', 'Destruction or threat to life'],
    landslide: ['Small slip, road still open', 'Cracks seen or road partly blocked', 'Road blocked or houses threatened', 'Houses buried or people trapped']
  };
  var REGIONS = { ph: [[4.5, 116], [21.5, 127]], luzon: [[12.3, 119.5], [19.0, 124.5]], visayas: [[9.0, 121.0], [12.5, 126.5]], mindanao: [[5.3, 121.5], [10.0, 127.0]], ncr: [[14.35, 120.9], [14.85, 121.2]] };
  var REGION_NAMES = { ph: 'Philippines', luzon: 'Luzon', visayas: 'Visayas', mindanao: 'Mindanao', ncr: 'Metro Manila' };
  var RANGE_NAMES = { today: 'Today', '3d': 'Past 3 days', '7d': 'Past 7 days', '30d': 'Past 30 days', all: 'All time', day: 'Selected day' };

  var RAIN_CLASSES = [[5, '#64748b', '#ffffff', 'Under 5 mm'], [25, '#38bdf8', '#08202e', '5 to 25 mm'], [50, '#facc15', '#2b2105', '25 to 50 mm'], [100, '#fb923c', '#2b1405', '50 to 100 mm'], [200, '#ef4444', '#ffffff', '100 to 200 mm'], [99999, '#a21caf', '#ffffff', 'Over 200 mm']];
  var RIVER_CLASSES = [[1.5, '#34d399', '#0b1f17', 'Normal, under 1.5x recent flow'], [2.5, '#fbbf24', '#2b2105', 'Elevated, 1.5 to 2.5x'], [4, '#fb923c', '#2b1405', 'High, 2.5 to 4x'], [99999, '#ef4444', '#ffffff', 'Very high, over 4x']];
  var STORM_CLASSES = [[34, '#38bdf8', 'Tropical depression'], [48, '#34d399', 'Tropical storm'], [64, '#fbbf24', 'Severe tropical storm'], [100, '#fb923c', 'Typhoon'], [9999, '#ef4444', 'Super typhoon']];

  var EFFECTS = ['Felt shaking', 'Objects fell or swayed', 'Cracks in walls or roads', 'Damaged buildings', 'Landslide', 'Injuries or trapped people'];
  var VOLC_OBS = ['Steam or plume visible', 'Rumbling or explosions heard', 'Sulfur smell', 'Lava or glow seen', 'Roads or crops covered in ash'];
  var TYPH_OBS = ['Fallen trees or poles', 'Power outage', 'Roofs blown off', 'High waves or storm surge', 'Flooded roads'];
  var LAND_OBS = ['Road blocked', 'Houses damaged or buried', 'People trapped or missing', 'Cracks or ground movement', 'More slides likely'];
  var MAXPHOTOS = 3, IMG_MAX = 200000;

  /* ---------- state ---------- */
  var DEFAULTS = { theme: 'dark', basemap: 'dark', region: 'ph', cats: { flood: true, fire: true, quake: true, volcano: true, typhoon: true, landslide: true }, sources: {}, demo: true, liveQuakes: true, liveNews: true, showUnverified: true, showPhotos: true, showOldAdv: false, refresh: 0, minMag: 3, alerts: false, alertKm: 25, layers: { reports: true, radar: true, cloud: false, rain: false, river: false, fire: false, storm: false, fcmap: false } };
  SRC_KEYS.forEach(function (k) { DEFAULTS.sources[k] = true; });
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var settings = clone(DEFAULTS);
  (function () {
    var s = lsGet('datasaster_settings', null), k, j;
    if (!s) { return; }
    for (k in s) {
      if (!s.hasOwnProperty(k)) { continue; }
      if ((k === 'cats' || k === 'sources' || k === 'layers') && typeof s[k] === 'object') { for (j in s[k]) { if (s[k].hasOwnProperty(j)) { settings[k][j] = s[k][j]; } } }
      else { settings[k] = s[k]; }
    }
  })();
  if (typeof LAYERS !== 'undefined' && !LAYERS.some(function (l) { return l[0] === 'fcmap'; })) { LAYERS.push(['fcmap', 'Forecast map', 'Hourly rain and wind forecast with a timeline, next 4 days']); }
  function saveSettings() { flashSaved(lsSet('datasaster_settings', settings)); }

  var demo = [], liveQuakes = [], userItems = lsGet('datasaster_reports', []), cloudRaw = [], cloudItems = [], detailId = null, userPos = null, nearKm = 0, flagged = lsGet('datasaster_flagged', {}), flagList = [], flagsOn = false, pendingHash = '', firstCloud = true, seenAlert = {}, lastPostAt = lsGet('datasaster_lastpost', 0), GROUP_KM = 1;
  var newsItems = [], newsState = 'loading', newsLive = 0, quakeState = '';
  var tf = 'all', trF = 'all', statusF = 'active', sevF = -1, sortBy = 'latest', query = '', range = '3d', dayVal = '', selId = null, newsF = 'all';
  var map = null, tiles = null, mlayer = null, markers = {}, pickMark = null, picking = false, pendLat = null, pendLng = null, pendImgs = [], photoBusy = 0, lbList = [], lbIdx = 0;
  var legendOpen = !(window.innerWidth && window.innerWidth <= 900), panelOpen = false;
  var lstat = {}, lgroups = {}, lupd = {};
  var rv = { loaded: false, loading: false, failed: false, host: '', radar: [], sat: [] }, rvLayers = [], rvCloud = null, rvTimer = null, rvIdx = 0, rvLabel = '';
  var fcData = { rain: null, river: null }, eonet = null, parLine = null, rainPop = null;

  function buildDemo() {
    var now = Date.now();
    demo = [];
    each(SEED, function (r, i) {
      var o = {}, k;
      if (r.type === 'quake') { return; }
      for (k in r) { if (r.hasOwnProperty(k)) { o[k] = r[k]; } }
      o.id = 'd' + i; o.demo = true; o.time = now - r.h * 3600000; o.prov = '';
      if (r.resolved) { o.resAt = now - r.resH * 3600000; }
      demo.push(o);
    });
  }

  /* ---------- filtering ---------- */
  function distKm(a, b, c, d) { var p = Math.PI / 180, x = Math.sin((c - a) * p / 2), y = Math.sin((d - b) * p / 2), q = x * x + Math.cos(a * p) * Math.cos(c * p) * y * y; return 12742 * Math.asin(Math.min(1, Math.sqrt(q))); }
  function fmtKm(k) { return k < 10 ? k.toFixed(1) + ' km' : Math.round(k) + ' km'; }
  /* ---------- Phase 4: location filter (PSGC codes; see js/places.js) ---------- */
  var LOC_KM = { 1: 15, 2: 60, 3: 150 }, LOC_ZOOM = { 0: 14, 1: 12, 2: 10, 3: 8 }, areaRaw = {}, areaStop = null, areaKey = '', globalRaw = [], orgCov = null;
  function locOn() { return !!(window.PLACES && PLACES.isOn()); }
  function locMax() { var s = PLACES.scope(); return Math.max(s === 'city' ? 1 : (s === 'reg' ? 3 : 2), PLACES.level()); }
  /* 0 = same barangay, 1 = same city, 2 = same province, 3 = same region, 9 = elsewhere. Reports are matched by their PSGC codes;
     old reports with no codes are placed by distance from the saved place's map centre. */
  function locRank(r) {
    var L = PLACES.get(), d;
    if (!L) { return 0; }
    if (r.brgyCode && L.brgy && r.brgyCode === L.brgy.c) { return 0; }
    if (r.cityCode && L.city && r.cityCode === L.city.c) { return 1; }
    if (r.provCode && L.prov && r.provCode === L.prov.c) { return 2; }
    if (r.regCode && L.reg && r.regCode === L.reg.c) { return 3; }
    if (r.regCode || r.provCode || r.cityCode || r.brgyCode) { return 9; }
    if (typeof L.lat !== 'number') { return 9; }
    d = distKm(L.lat, L.lng, r.lat, r.lng);
    return d <= LOC_KM[1] ? 1 : (d <= LOC_KM[2] ? 2 : (d <= LOC_KM[3] ? 3 : 9));
  }
  function locOK(r) { return !locOn() || locRank(r) <= locMax(); }
  function mergeRaw() {
    var by = {}, out = [], k, i;
    for (i = 0; i < globalRaw.length; i++) { by[globalRaw[i]._id] = globalRaw[i]; }
    for (k in areaRaw) { if (areaRaw.hasOwnProperty(k) && !by[k]) { by[k] = areaRaw[k]; } }
    for (k in by) { if (by.hasOwnProperty(k)) { out.push(by[k]); } }
    out.sort(function (a, b) { return (b.time || 0) - (a.time || 0); });
    cloudRaw = out;
  }
  /* Also listen to the newest reports of the saved area, so a busy country cannot push them out of the newest 200. */
  function syncArea() {
    var L = window.PLACES && PLACES.get(), f = '', c = '', m;
    if (L && locOn() && cloudOn() && CLOUD.watchArea) {
      m = locMax();
      if (m >= 3 && L.reg) { f = 'regCode'; c = L.reg.c; } else if (m >= 2 && L.prov) { f = 'provCode'; c = L.prov.c; } else if (L.city) { f = 'cityCode'; c = L.city.c; }
    }
    if (f + c === areaKey) { return; }
    areaKey = f + c;
    if (areaStop) { areaStop(); areaStop = null; }
    areaRaw = {};
    if (!f) { mergeRaw(); cloudRefresh(); return; }
    areaStop = CLOUD.watchArea(f, c, function (list) {
      var by = {}; each(list, function (x) { by[x._id] = x; }); areaRaw = by; mergeRaw(); cloudRefresh();
    }, function () { /* index not built yet: the newest-200 list still works */ });
  }
  function nationwideMap() { if (map) { map.fitBounds(REGIONS.ph, { padding: [10, 10] }); } }
  function locZoom() {
    var L, lv, items, pts = [];
    if (!map) { return; }
    if (!locOn()) { nationwideMap(); return; }
    L = PLACES.get(); lv = L.brgy ? 0 : (L.city ? 1 : (L.prov ? 2 : 3));
    if (typeof L.lat === 'number') { map.setView([L.lat, L.lng], LOC_ZOOM[lv]); return; }
    items = filtered(); each(items, function (r) { pts.push([r.lat, r.lng]); });
    if (pts.length) { map.fitBounds(pts, { padding: [30, 30], maxZoom: LOC_ZOOM[lv] }); } else { nationwideMap(); }
  }
  function orgCovers() {
    var L = PLACES.get(), codes, i, j, o, keys = ['regCodes', 'provCodes', 'cityCodes', 'brgyCodes'];
    if (!L || !orgCov) { return 'unknown'; }
    codes = PLACES.codes(L);
    for (i = 0; i < orgCov.length; i++) { o = orgCov[i]; for (j = 0; j < keys.length; j++) { if (o[keys[j]] && o[keys[j]].length && o[keys[j]].some(function (c) { return codes.indexOf(c) > -1; })) { return 'yes'; } } }
    return 'no';
  }
  var SCOPE_TXT = { city: 'This city only', prov: '+ province', reg: '+ region' };
  /* "Showing ..." banner: one short line. Tap it (or the pin button in the header) to change the area; the full choice is also in Settings > Your area. */
  function renderLocBar() {
    var b = $('locBar'), L, h, on, lab;
    if (!b) { return; }
    L = PLACES.get(); on = locOn(); lab = PLACES.label(L);
    if (!L) { h = '<button type="button" class="lt" data-locopen="1">' + icon('pin', 14) + '<span>Showing <b>all of the Philippines</b></span><span class="lgo">Set your area' + icon('right', 13) + '</span></button>'; }
    else if (on) {
      h = '<button type="button" class="lt" data-locopen="1" aria-label="Showing ' + esc(lab) + ', ' + SCOPE_TXT[PLACES.scope()] + '. Change area">' + icon('pin', 14) + '<span>Showing <b>' + esc(lab) + '</b></span><span class="lsz">' + SCOPE_TXT[PLACES.scope()] + '</span><span class="lgo">' + icon('right', 13) + '</span></button>';
      if (orgCovers() === 'no') { h += '<span class="lnote">No partner office covers this area yet. Reports here are public and unverified.</span>'; }
    } else { h = '<button type="button" class="lt" data-locopen="1">' + icon('pin', 14) + '<span>Showing <b>Nationwide</b></span><span class="lgo">' + icon('right', 13) + '</span></button><button type="button" class="lback" data-locon="1">Back to ' + esc((L.city || L.prov || L.reg).n) + '</button>'; }
    b.innerHTML = h;
    $('btnLoc').setAttribute('aria-label', L ? 'Area: ' + lab + (on ? '' : ' (nationwide view)') : 'Choose your area');
    $('btnLoc').innerHTML = icon('pin', 15) + '<span class="lbl"> ' + (L && on ? esc((L.city || L.prov || L.reg).n.length > 16 ? (L.city || L.prov || L.reg).n.substring(0, 15) + '…' : (L.city || L.prov || L.reg).n) : 'Area') + '</span>';
    updAreaHint();
  }
  function updAreaHint() {
    var el = $('rArea'), L = window.PLACES && PLACES.get(), far = false;
    if (!el) { return; }
    if (!L) { el.innerHTML = 'No area chosen. <button type="button" class="link" data-locopen="1">Choose your area</button> so people near you see this report.'; return; }
    if (typeof L.lat === 'number' && pendLat != null && distKm(L.lat, L.lng, pendLat, pendLng) > 150) { far = true; }
    el.innerHTML = far ? 'The pin is far from <b>' + esc(PLACES.label(L)) + '</b>, so no area tag is added. <button type="button" class="link" data-locopen="1">Change area</button>' : 'Area tag: <b>' + esc(PLACES.label(L)) + '</b>. <button type="button" class="link" data-locopen="1">Change</button>';
  }
  function stampArea(it) {
    var L = window.PLACES && PLACES.get();
    if (!L) { return; }
    if (typeof L.lat === 'number' && distKm(L.lat, L.lng, it.lat, it.lng) > 150) { return; }
    if (L.reg) { it.regCode = L.reg.c; } if (L.prov) { it.provCode = L.prov.c; } if (L.city) { it.cityCode = L.city.c; } if (L.brgy) { it.brgyCode = L.brgy.c; }
  }
  /* The "Choose your area" dialog */
  var locDlg = null, locPick = null, locLast = null, locAfter = null, locSc = 'prov';
  function closeLoc() {
    var fn = locAfter;
    if (locDlg) { locDlg.hidden = true; document.removeEventListener('keydown', locKey, true); if (!fn && locLast && locLast.focus) { try { locLast.focus(); } catch (e) {} } }
    locAfter = null;
    if (fn) { fn(); }
  }
  function scopeBtns(cur, attr) {
    var h = '';
    each(['city', 'prov', 'reg'], function (k) { h += '<button type="button" class="scb' + (cur === k ? ' on' : '') + '" ' + attr + '="' + k + '" aria-pressed="' + (cur === k ? 'true' : 'false') + '">' + SCOPE_TXT[k] + '</button>'; });
    return h;
  }
  function drawLocScope() { var el = $('lcScope'); if (el) { el.innerHTML = scopeBtns(locSc, 'data-lcsc'); } }
  function locKey(e) {
    if (e.key === 'Escape' || e.keyCode === 27) { e.stopPropagation(); closeLoc(); return; }
    if (e.key === 'Tab' || e.keyCode === 9) {
      var f = locDlg.querySelectorAll('select:not([disabled]),button:not([disabled])'), a = f[0], z = f[f.length - 1];
      if (!f.length) { return; }
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }
  function openLoc(preScope) {
    if (!window.PLACES) { return; }
    locLast = document.activeElement;
    if (!locDlg) {
      locDlg = document.createElement('div'); locDlg.className = 'pmodal'; locDlg.id = 'locModal'; locDlg.hidden = true;
      locDlg.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="lcH"><button type="button" class="btn x" id="lcX" aria-label="Close">&times;</button>'
        + '<h2 id="lcH">Choose your area</h2><p>Reports and announcements for your area come first. No account is needed. The choice stays on this device.</p>'
        + '<div class="pkgrid" id="lcPick"></div>'
        + '<div class="pkf"><span class="l" id="lcScH">Show reports from</span><div class="scopes" id="lcScope" role="group" aria-labelledby="lcScH"></div></div>'
        + '<div class="hint" id="lcMsg" role="status" aria-live="polite"></div>'
        + '<div class="acts"><button type="button" class="btn primary" id="lcSave">Save area</button><button type="button" class="btn" id="lcNat">Show nationwide</button></div></div>';
      document.body.appendChild(locDlg);
      $('lcScope').addEventListener('click', function (e) { var t = e.target.closest ? e.target.closest('[data-lcsc]') : null; if (t) { locSc = t.getAttribute('data-lcsc'); drawLocScope(); } });
      locPick = PLACES.picker($('lcPick'), { prefix: 'lc', barangay: true }, function () { $('lcMsg').textContent = ''; });
      $('lcX').addEventListener('click', closeLoc);
      locDlg.addEventListener('mousedown', function (e) { if (e.target === locDlg) { closeLoc(); } });
      $('lcNat').addEventListener('click', function () { PLACES.setOn(false); closeLoc(); });
      $('lcSave').addEventListener('click', function () {
        var v = locPick.value(), keep = PLACES.get();
        if (!v.reg || (!v.city && !v.prov)) { $('lcMsg').textContent = 'Choose at least a region and a province or city.'; return; }
        if (keep && keep.lat != null && keep.city && v.city && keep.city.c === v.city.c) { v.lat = keep.lat; v.lng = keep.lng; }
        if (locSc !== PLACES.scope()) { PLACES.setScope(locSc); }
        if (!PLACES.set(v)) { $('lcMsg').textContent = 'Could not save this area.'; return; }
        closeLoc(); toast('Area saved: ' + PLACES.label(PLACES.get()) + ' (' + SCOPE_TXT[locSc] + ')');
        if (typeof PLACES.get().lat !== 'number') { PLACES.locate(PLACES.get(), function (pt) { var cur = PLACES.get(); if (pt && cur && PLACES.label(cur) === PLACES.label(v)) { cur.lat = pt.lat; cur.lng = pt.lng; PLACES.set(cur); } }); }
      });
    }
    locSc = SCOPE_TXT[preScope] ? preScope : PLACES.scope(); drawLocScope(); $('lcMsg').textContent = '';
    locDlg.hidden = false; locPick.set(PLACES.get());
    document.addEventListener('keydown', locKey, true);
    $('lcX').focus();
  }
  function onLocChange() {
    renderLocBar(); syncArea(); refresh(); locZoom();
    if (viewing === 'settings') { svUpdate(false); }
    if (tourOpen()) { drawTour(); }
  }
  function initLoc() {
    if (!window.PLACES) { return; }
    $('btnLoc').addEventListener('click', function () { openLoc(); });
    PLACES.onChange(onLocChange);
    renderLocBar(); syncArea();
    if (locOn() && !window.location.hash) { locZoom(); }
    if (cloudOn() && CLOUD.loadOrgs) { CLOUD.loadOrgs(function (l) { orgCov = l; renderLocBar(); }); }
    // a saved area with no map centre yet (geocoder was down): try again quietly
    if (PLACES.get() && typeof PLACES.get().lat !== 'number') { PLACES.locate(PLACES.get(), function (pt) { var cur = PLACES.get(); if (pt && cur) { cur.lat = pt.lat; cur.lng = pt.lng; PLACES.set(cur); } }); }
  }
  function pool() {
    var a = [];
    if (settings.demo) { a = a.concat(demo); }
    if (settings.liveQuakes) { a = a.concat(liveQuakes); }
    a = a.concat(cloudItems).concat(userItems);
    return a.filter(function (r) {
      if (!settings.cats[r.type]) { return false; }
      if (r.src && settings.sources[r.src] === false) { return false; }
      if (r.live && r.mag < settings.minMag) { return false; }
      if (r.trust === 'unverified' && !settings.showUnverified) { return false; }
      return true;
    });
  }
  function inRange(r) {
    var now = Date.now();
    if (range === 'all') { return true; }
    if (range === 'today') { return manilaDay(r.time) === manilaDay(now); }
    if (range === 'day') { return manilaDay(r.time) === (dayVal || manilaDay(now)); }
    if (range === '3d') { return r.time >= now - 3 * 86400000; }
    if (range === '30d') { return r.time >= now - 30 * 86400000; }
    return r.time >= now - 7 * 86400000;
  }
  function trustOK(r) {
    if (trF === 'ov') { return r.trust !== 'unverified'; }
    if (trF === 'un') { return r.trust === 'unverified'; }
    return true;
  }
  function match(r, o) {
    var q;
    o = o || {};
    if (!o.noType && tf !== 'all' && r.type !== tf) { return false; }
    if (!o.noTrust && !trustOK(r)) { return false; }
    if (!o.noStatus && statusF !== 'all' && (statusF === 'resolved') !== !!r.resolved) { return false; }
    if (!o.noDate && !inRange(r)) { return false; }
    if (!o.noLoc && !locOK(r)) { return false; }
    if (!o.noSev && sevF >= 0 && r.sev !== sevF) { return false; }
    if (query) {
      q = (r.title + ' ' + r.place + ' ' + r.srcLabel + ' ' + r.desc).toLowerCase();
      if (q.indexOf(query) < 0) { return false; }
    }
    if (nearKm > 0 && userPos && distKm(userPos.lat, userPos.lng, r.lat, r.lng) > nearKm) { return false; }
    return true;
  }
  function filtered() {
    var out = pool().filter(function (r) { return match(r); });
    out.sort(function (a, b) { if (sortBy === 'latest' && locOn()) { var ra = locRank(a), rb = locRank(b); if (ra !== rb) { return ra - rb; } } if (sortBy === 'near' && userPos) { return distKm(userPos.lat, userPos.lng, a.lat, a.lng) - distKm(userPos.lat, userPos.lng, b.lat, b.lng); } if (sortBy === 'severity' && b.sev !== a.sev) { return b.sev - a.sev; } return b.time - a.time; });
    return out;
  }
  /* ---------- grouping of similar community reports ---------- */
  function isComm(r) { return !!(r.cloud || (r.own && !r.demo && !r.live)); }
  function nearBy(a, b) { return a.type === b.type && Math.abs(a.time - b.time) <= 86400000 && distKm(a.lat, a.lng, b.lat, b.lng) <= GROUP_KM; }
  function groupItems(items) {
    var order = items.slice().sort(function (a, b) { return b.sev !== a.sev ? b.sev - a.sev : b.time - a.time; }), groups = [];
    each(order, function (r) {
      var j, placed = false;
      if (isComm(r)) { for (j = 0; j < groups.length; j++) { if (isComm(groups[j].rep) && nearBy(groups[j].rep, r)) { groups[j].members.push(r); placed = true; break; } } }
      if (!placed) { groups.push({ rep: r, members: [r] }); }
    });
    each(groups, function (g) { g.members.sort(function (a, b) { return b.time - a.time; }); g.latest = g.members[0].time; });
    groups.sort(function (a, b) {
      if (sortBy === 'near' && userPos) { return distKm(userPos.lat, userPos.lng, a.rep.lat, a.rep.lng) - distKm(userPos.lat, userPos.lng, b.rep.lat, b.rep.lng); }
      if (sortBy === 'severity' && b.rep.sev !== a.rep.sev) { return b.rep.sev - a.rep.sev; }
      return b.latest - a.latest;
    });
    return groups;
  }
  function threadOf(r) {
    var out = [];
    if (!isComm(r)) { return out; }
    each(pool(), function (x) { if (isComm(x) && (x.id === r.id || nearBy(r, x))) { out.push(x); } });
    out.sort(function (a, b) { return b.time - a.time; });
    return out;
  }
  function byId(id) { var a = pool(), i; for (i = 0; i < a.length; i++) { if (a[i].id === id) { return a[i]; } } return null; }

  /* ---------- feed ---------- */
  function renderBar() {
    var h = '', barEl = $('segs').parentNode, barX = barEl ? barEl.scrollLeft : 0;
    function seg(val, label, on) { return '<button class="seg' + (on ? ' on' : '') + '" data-tf="' + val + '">' + label + '</button>'; }
    h += seg('all', 'General', tf === 'all');
    each(TORDER, function (t) { if (settings.cats[t]) { h += seg(t, TSHORT[t], tf === t); } });
    $('segs').innerHTML = h;
    if (barEl) { barEl.scrollLeft = barX; }
  }
  var ASTAT = { under_review: 'Under review', corroborated: 'Corroborated', not_corroborated: 'Not corroborated', duplicate: 'Duplicate', unable: 'Unable to verify' };
  var ASORDER = ['under_review', 'corroborated', 'not_corroborated', 'duplicate', 'unable'];
  var assessAll = [];
  function assessFor(cid) { var out = []; each(assessAll, function (a) { if (a.reportId === cid && ASTAT[a.status]) { out.push(a); } }); return out; }
  function trustLine(r) {
    var s = esc(r.srcLabel) + (r.demo ? ' (sample)' : '') + (r.media ? ' \u00b7 <b>' + esc(r.media) + '</b>' : '') + (r.author ? ' \u00b7 by ' + esc(r.author) : ''), al, k;
    if (r.cloud) { al = assessFor(r.cid); if (al.length) { s += ' \u00b7 <b>'; for (k = 0; k < al.length && k < 2; k++) { s += (k ? ', ' : '') + esc(String(al[k].agency).substring(0, 30)) + ': ' + ASTAT[al[k].status]; } s += '</b>'; } }
    if (r.trust === 'unverified') { s += ' \u00b7 <span class="warn">Unverified</span>'; }
    if (r.pending) { s += ' \u00b7 <span class="warn">Pending upload</span>'; }
    return s;
  }
  function samplePhoto() {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#2a3340"/><text x="60" y="64" text-anchor="middle" fill="#8f99a8" font-size="12" font-family="Arial">Sample photo</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function photosOf(r) {
    if (r.imgs && r.imgs.length) { return r.imgs; }
    return r.img ? [r.img] : [];
  }
  function statusLine(r, t) {
    return '<div class="m"><span class="dot" style="--c:' + (r.resolved ? RESCOL : SEVCOL[r.sev]) + '"></span>' + (r.resolved ? 'Resolved' : SEV[r.sev]) + ' \u00b7 ' + t.label + ' \u00b7 ' + ago(r.time) + '</div>';
  }
  function updFilterCount() {
    var c = 0, b = $('fCnt');
    if ($('nearSel').value !== '0') { c++; }
    if ($('statusSel').value !== 'active') { c++; }
    if ($('sevSel').value !== '-1') { c++; }
    if ($('sortSel').value !== 'latest') { c++; }
    if (b) { b.textContent = c; b.hidden = !c; }
  }
  function renderFeed() {
    updFilterCount();
    var rows = $('rows'), par = rows.parentNode, sa = rows.scrollTop, sb = par ? par.scrollTop : 0, sy = window.pageYOffset || 0;
    renderFeedInner();
    rows.scrollTop = sa; if (par) { par.scrollTop = sb; }
    window.scrollTo(0, sy);
  }
  function renderFeedInner() {
    var items = filtered(), h = '', hidden, note;
    each(groupItems(items), function (g) {
      var r = g.rep, t = TYPES[r.type], n = g.members.length, sel = false, k, dist = '';
      for (k = 0; k < n; k++) { if (g.members[k].id === selId) { sel = true; } }
      if (userPos) { dist = ' \u00b7 ' + fmtKm(distKm(userPos.lat, userPos.lng, r.lat, r.lng)) + ' away'; }
      h += '<div class="row' + (sel ? ' sel' : '') + (r.resolved ? ' res' : '') + '" data-id="' + r.id + '"><div>';
      h += statusLine(r, t);
      h += '<h3>' + esc(r.title) + '</h3>';
      if (n > 1) { h += '<div class="m"><span class="grp">+' + (n - 1) + ' similar report' + (n > 2 ? 's' : '') + ' nearby</span></div>'; }
      h += '<div class="m">' + esc(r.place) + dist + '</div><div class="m">' + trustLine(r) + ' \u00b7 <button class="link" data-open="' + r.id + '">' + (n > 1 ? 'Open thread' : 'Details') + '</button></div></div>';
      if (settings.showPhotos) { h += '<img class="thumb" alt="Photo for ' + esc(r.title) + '" src="' + (photosOf(r)[0] || samplePhoto()) + '">'; }
      h += '</div>';
    });
    if (!items.length) { h = locOn() ? '<div class="empty">No reports for ' + esc(PLACES.label()) + ' match these filters.<br>Reports from other areas are hidden while the area filter is on.<br><button type="button" class="btn sm" data-locnat="1" style="margin-top:10px">Show nationwide</button></div>' : '<div class="empty">No records match these filters.<br>Widen the date range or clear the filters.</div>'; }
    $('rows').innerHTML = h;
    var ov = 0, un = 0;
    each(pool(), function (r) { if (match(r, { noTrust: true })) { if (r.trust === 'unverified') { un++; } else { ov++; } } });
    $('fsum').innerHTML = '<span><b>' + items.length + '</b> records</span><span class="m">\u00b7</span><button data-tr="ov" class="' + (trF === 'ov' ? 'on' : '') + '"><b>' + ov + '</b> official / verified</button><span class="m">\u00b7</span><button data-tr="un" class="' + (trF === 'un' ? 'on' : '') + '"><b>' + un + '</b> unverified</button>';
    hidden = pool().filter(function (r) { return match(r, { noDate: true }); }).length - items.length;
    note = RANGE_NAMES[range] + (range === 'day' ? ' (' + (dayVal || manilaDay(Date.now())) + ')' : '') + ' \u00b7 ' + items.length + ' shown';
    if (hidden > 0 && range !== 'all') { note += ' \u00b7 ' + hidden + ' older hidden <button data-showall="1">Show all time</button>'; }
    var resHidden = statusF === 'active' ? pool().filter(function (r) { return r.resolved && match(r, { noStatus: true }); }).length : 0;
    if (resHidden > 0) { note += ' \u00b7 ' + resHidden + ' resolved hidden <button data-showres="1">Show</button>'; }
    if (locOn()) { var oh = pool().filter(function (r) { return match(r, { noLoc: true }) && !locOK(r); }).length; if (oh > 0) { note += ' \u00b7 ' + oh + ' in other areas hidden <button data-locnat="1">Show nationwide</button>'; } }
    if (quakeState === 'unavailable') { note += ' \u00b7 Live earthquakes unavailable'; }
    else if (quakeState === 'stale') { note += ' \u00b7 Showing saved earthquakes'; }
    else if (quakeState === 'ok' && settings.liveQuakes) { note += ' \u00b7 Earthquakes live \u00b7 ' + quakeStamp.toLowerCase(); }
    $('fnote').innerHTML = note;
  }

  /* ---------- map ---------- */
  function setTiles() {
    if (!map) { return; }
    if (tiles) { map.removeLayer(tiles); }
    var base = 'https://server.arcgisonline.com/ArcGIS/rest/services/', p = 'World_Street_Map', te = 0;
    if (settings.basemap === 'dark') { p = 'Canvas/World_Dark_Gray_Base'; }
    if (settings.basemap === 'light') { p = 'Canvas/World_Light_Gray_Base'; }
    tiles = L.tileLayer(base + p + '/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, zIndex: 1, attribution: 'Tiles &copy; Esri' });
    tiles.on('tileerror', function () { te++; if (te > 4) { $('tilewarn').style.display = 'block'; } });
    tiles.on('tileload', function () { te = 0; $('tilewarn').style.display = 'none'; });
    tiles.addTo(map);
  }
  function markIcon(r, n, sel) {
    var t = TYPES[r.type];
    return L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14], html: '<div class="mk' + (sel ? ' sel' : '') + (r.resolved ? ' res' : '') + '" style="--c:' + (r.resolved ? RESCOL : SEVCOL[r.sev]) + ';--ink:' + (r.resolved ? '#ffffff' : SEVINK[r.sev]) + '">' + icon(r.resolved ? 'check' : t.ic, 14) + (n > 1 ? '<span class="mkn">' + n + '</span>' : '') + '</div>' });
  }
  function drawMarkers() {
    if (!map) { return; }
    mlayer.clearLayers();
    markers = {};
    if (!settings.layers.reports) { return; }
    each(groupItems(filtered()), function (g) {
      var r = g.rep, sel = false, k, m;
      for (k = 0; k < g.members.length; k++) { if (g.members[k].id === selId) { sel = true; } }
      m = L.marker([r.lat, r.lng], { icon: markIcon(r, g.members.length, sel), title: r.title });
      m.on('click', function () { select(r.id, false); openDetail(r.id); });
      m.addTo(mlayer);
      each(g.members, function (x) { markers[x.id] = m; });
    });
  }
  function rainAt(ll) {
    var la = ll.lat.toFixed(3), lo = ll.lng.toFixed(3);
    if (rainPop) { map.closePopup(rainPop); }
    rainPop = L.popup({ maxWidth: 240 }).setLatLng(ll).setContent('Checking rainfall...').openOn(map);
    xhr('https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + lo + '&current=precipitation&hourly=precipitation&forecast_hours=6&timezone=Asia%2FManila', function (d) {
      var now = d.current ? d.current.precipitation : null, mx = 0, ok = d.hourly && d.hourly.precipitation;
      if (ok) { each(d.hourly.precipitation, function (v) { if (v != null && v > mx) { mx = v; } }); }
      if (now == null) { rainPop.setContent('No rainfall data for this spot.'); return; }
      rainPop.setContent('<b>Rain ' + now.toFixed(1) + ' mm (last hour)</b><br>Up to ' + mx.toFixed(1) + ' mm per hour in the next 6 hours<br><small>Model estimate (Open-Meteo), not an official PAGASA forecast. ' + la + ', ' + lo + '</small>');
    }, function () { rainPop.setContent('Could not load rainfall for this spot.'); });
  }
  function fitRegion() { if (map) { map.fitBounds(REGIONS[settings.region] || REGIONS.ph, { padding: [10, 10] }); } }
  function initMap() {
    if (typeof L === 'undefined') { $('map').innerHTML = '<div class="empty">The map library could not start in this browser.</div>'; return; }
    map = L.map('map', { zoomControl: false, minZoom: 5 });
    L.control.zoom({ position: 'topleft' }).addTo(map);
    map.createPane('fc'); map.getPane('fc').style.zIndex = 450;
    mlayer = L.layerGroup().addTo(map);
    setTiles();
    fitRegion();
    map.on('click', function (e) {
      if (picking) { setPending(e.latlng.lat, e.latlng.lng); endPick(); openReport(true); return; }
      if (settings.layers.radar) { rainAt(e.latlng); }
    });
    setTimeout(function () { map.invalidateSize(); fitRegion(); }, 300);
  }
  function select(id, fly) {
    var r = byId(id), el;
    selId = id;
    drawMarkers(); renderFeed();
    el = document.querySelector('.row.sel');
    if (el && $('rows')) {
      var er = el.getBoundingClientRect(), br = $('rows').getBoundingClientRect();
      if (er.top < br.top) { $('rows').scrollTop -= (br.top - er.top); }
      else if (er.bottom > br.bottom) { $('rows').scrollTop += (er.bottom - br.bottom); }
    }
    if (fly && window.innerWidth <= 900) { setPane('map'); }
    if (fly && map && r) { map.setView([r.lat, r.lng], Math.max(map.getZoom(), 9)); }
  }
  function renderBase() {
    var h = '';
    each([['dark', 'Dark'], ['street', 'Street'], ['light', 'Light']], function (b) { h += '<button data-base="' + b[0] + '" class="' + (settings.basemap === b[0] ? 'on' : '') + '">' + b[1] + '</button>'; });
    $('baseSw').innerHTML = h;
  }

  /* ---------- live layers ---------- */
  function classOf(list, v) { var i; for (i = 0; i < list.length; i++) { if (v < list[i][0]) { return list[i]; } } return list[list.length - 1]; }
  function group(id) { if (!lgroups[id]) { lgroups[id] = L.layerGroup(); } return lgroups[id]; }
  function setStat(id, s) { lstat[id] = s; if (panelOpen) { renderPanel(); } }
  function stamp() { var d = new Date(); return 'Updated ' + d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }); }

  function loadRV(cb) {
    if (rv.loaded) { cb(); return; }
    if (rv.loading) { return; }
    rv.loading = true;
    xhr('https://api.rainviewer.com/public/weather-maps.json', function (d) {
      rv.loaded = true; rv.loading = false; rv.failed = false;
      rv.host = d.host; rv.radar = (d.radar && d.radar.past) ? d.radar.past.slice(-6) : []; rv.sat = (d.satellite && d.satellite.infrared) ? d.satellite.infrared : [];
      cb();
    }, function (e) { rv.loading = false; rv.failed = true; setStat('radar', 'Unavailable'); setStat('cloud', 'Unavailable'); });
  }
  function stopRadar() {
    if (rvTimer) { clearInterval(rvTimer); rvTimer = null; }
    each(rvLayers, function (l) { if (map) { map.removeLayer(l); } });
    rvLayers = []; rvLabel = ''; renderLegend();
    if (parLine && map) { map.removeLayer(parLine); }
    if (rainPop && map) { map.closePopup(rainPop); }
  }
  function radarFrame(i) {
    var f = rv.radar[i];
    each(rvLayers, function (l, k) { l.setOpacity(k === i ? 0.7 : 0); });
    rvLabel = 'Frame ' + new Date(f.time * 1000).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) + ' PHT';
    renderLegend();
  }
  function startRadar() {
    if (!map) { return; }
    stopRadar();
    if (!settings.layers.radar) { return; }
    if (!parLine) { parLine = L.polyline([[25, 120], [25, 135], [5, 135], [5, 115], [15, 115], [21, 120], [25, 120]], { color: '#e5e7eb', weight: 1.5, dashArray: '8 8', opacity: 0.7, interactive: false, pane: 'fc' }); }
    parLine.addTo(map);
    setStat('radar', 'Loading');
    loadRV(function () {
      if (!settings.layers.radar) { return; }
      if (!rv.radar.length) { setStat('radar', 'No data'); return; }
      each(rv.radar, function (f) {
        var l = L.tileLayer(rv.host + f.path + '/256/{z}/{x}/{y}/7/1_1.png', { opacity: 0, zIndex: 5, maxNativeZoom: 7, maxZoom: 18 });
        l.addTo(map); rvLayers.push(l);
      });
      rvIdx = rvLayers.length - 1; radarFrame(rvIdx);
      rvTimer = setInterval(function () { rvIdx = (rvIdx + 1) % rvLayers.length; radarFrame(rvIdx); }, 800);
      setStat('radar', stamp());
    });
  }
  function startCloud() {
    if (!map) { return; }
    if (rvCloud) { map.removeLayer(rvCloud); rvCloud = null; }
    if (!settings.layers.cloud) { return; }
    setStat('cloud', 'Loading');
    loadRV(function () {
      if (!settings.layers.cloud) { return; }
      if (!rv.sat.length) { setStat('cloud', 'No data'); return; }
      rvCloud = L.tileLayer(rv.host + rv.sat[rv.sat.length - 1].path + '/256/{z}/{x}/{y}/0/0_0.png', { opacity: 0.55, zIndex: 4, maxNativeZoom: 7, maxZoom: 18 }).addTo(map);
      setStat('cloud', stamp());
    });
  }
  function pointsQS() {
    var la = [], lo = [];
    each(POINTS, function (p) { la.push(p[1]); lo.push(p[2]); });
    return 'latitude=' + la.join(',') + '&longitude=' + lo.join(',');
  }
  function fcIcon(txt, c, ink) { return L.divIcon({ className: '', iconSize: [34, 22], iconAnchor: [17, 11], html: '<div class="fc" style="--c:' + c + ';--ink:' + ink + '">' + txt + '</div>' }); }
  function drawRain() {
    var g = group('rain'); g.clearLayers();
    if (!fcData.rain || !map) { return; }
    each(fcData.rain, function (p) {
      var c = classOf(RAIN_CLASSES, p.v), m = L.marker([p.lat, p.lng], { icon: fcIcon(Math.round(p.v), c[1], c[2]), pane: 'fc' });
      m.bindPopup('<b>' + esc(p.name) + '</b><br>' + Math.round(p.v) + ' mm expected in the next 24 hours<br><small>Model forecast (Open-Meteo). Not an official PAGASA forecast.</small>');
      g.addLayer(m);
    });
    if (settings.layers.rain && !map.hasLayer(g)) { g.addTo(map); }
  }
  function drawRiver() {
    var g = group('river'); g.clearLayers();
    if (!fcData.river || !map) { return; }
    each(fcData.river, function (p) {
      var c = classOf(RIVER_CLASSES, p.v), m = L.marker([p.lat, p.lng], { icon: fcIcon(p.v.toFixed(1) + 'x', c[1], c[2]), pane: 'fc' });
      m.bindPopup('<b>' + esc(p.name) + '</b><br>Peak river flow in 7 days: ' + p.v.toFixed(1) + 'x the last 30 days<br><small>Model estimate (Open-Meteo GloFAS). Not an official flood warning.</small>');
      g.addLayer(m);
    });
    if (settings.layers.river && !map.hasLayer(g)) { g.addTo(map); }
  }
  function loadRain() {
    if (!settings.layers.rain) { return; }
    setStat('rain', 'Loading');
    xhr('https://api.open-meteo.com/v1/forecast?' + pointsQS() + '&hourly=precipitation&forecast_hours=24&timezone=Asia%2FManila', function (d) {
      var arr = Object.prototype.toString.call(d) === '[object Array]' ? d : [d], out = [];
      each(arr, function (o, i) {
        var s = 0, p = o.hourly ? o.hourly.precipitation : null;
        if (!p || !POINTS[i]) { return; }
        each(p, function (v) { s += v || 0; });
        out.push({ name: POINTS[i][0], lat: POINTS[i][1], lng: POINTS[i][2], v: s });
      });
      fcData.rain = out; drawRain(); setStat('rain', stamp());
    }, function () { setStat('rain', 'Unavailable'); });
  }
  function loadRiver() {
    if (!settings.layers.river) { return; }
    setStat('river', 'Loading');
    xhr('https://flood-api.open-meteo.com/v1/flood?' + pointsQS() + '&daily=river_discharge&past_days=30&forecast_days=7', function (d) {
      var arr = Object.prototype.toString.call(d) === '[object Array]' ? d : [d], out = [];
      each(arr, function (o, i) {
        var a = o.daily ? o.daily.river_discharge : null, base = 0, n = 0, peak = 0, k;
        if (!a || !POINTS[i] || a.length < 14) { return; }
        for (k = 0; k < a.length - 7; k++) { if (a[k] != null) { base += a[k]; n++; } }
        for (k = a.length - 7; k < a.length; k++) { if (a[k] != null && a[k] > peak) { peak = a[k]; } }
        if (!n || base <= 0) { return; }
        out.push({ name: POINTS[i][0], lat: POINTS[i][1], lng: POINTS[i][2], v: peak / (base / n) });
      });
      fcData.river = out; drawRiver(); setStat('river', out.length ? stamp() : 'No data');
    }, function () { setStat('river', 'Unavailable'); });
  }
  function drawEonet() {
    var gf = group('fire'), gs = group('storm');
    gf.clearLayers(); gs.clearLayers();
    if (!eonet || !map) { return; }
    var nf = 0, ns = 0;
    each(eonet, function (e) {
      var cat = e.categories && e.categories[0] ? e.categories[0].id : '', g = e.geometry || [], last = g[g.length - 1], c, i, pts = [], cls, m, kt;
      if (!last || !last.coordinates || typeof last.coordinates[0] !== 'number') { return; }
      c = last.coordinates;
      if (cat === 'wildfires' && c[1] >= 4 && c[1] <= 22 && c[0] >= 116 && c[0] <= 128) {
        m = L.marker([c[1], c[0]], { pane: 'fc', icon: L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: '<div class="ev" style="--c:#f97316">' + icon('flame', 13) + '</div>' }) });
        m.bindPopup('<b>' + esc(e.title) + '</b><br>Satellite-detected fire event<br><small>NASA EONET, ' + ago(new Date(last.date).getTime()) + '</small>');
        gf.addLayer(m); nf++;
      }
      if (cat === 'severeStorms') {
        for (i = 0; i < g.length; i++) { if (g[i].coordinates && typeof g[i].coordinates[0] === 'number') { pts.push([g[i].coordinates[1], g[i].coordinates[0]]); } }
        kt = (last.magnitudeUnit === 'kts' && last.magnitudeValue != null) ? last.magnitudeValue : null;
        cls = kt == null ? [0, '#94a3b8', 'Unclassified'] : classOf(STORM_CLASSES, kt);
        if (pts.length > 1) { gs.addLayer(L.polyline(pts, { color: cls[1], weight: 2, dashArray: '4 6', opacity: 0.9, pane: 'fc' })); }
        m = L.marker([c[1], c[0]], { pane: 'fc', icon: L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14], html: '<div class="ev" style="--c:' + cls[1] + ';width:28px;height:28px">' + icon('storm', 15) + '</div>' }) });
        m.bindPopup('<b>' + esc(e.title) + '</b><br>' + cls[2] + (kt != null ? ', ' + kt + ' kt winds' : '') + '<br><small>NASA EONET. Track dashed. Not an official PAGASA bulletin.</small>');
        gs.addLayer(m); ns++;
      }
    });
    if (settings.layers.fire && !map.hasLayer(gf)) { gf.addTo(map); }
    if (settings.layers.storm && !map.hasLayer(gs)) { gs.addTo(map); }
    if (settings.layers.fire) { setStat('fire', nf + (nf === 1 ? ' event' : ' events') + ', ' + stamp().replace('Updated ', '')); }
    if (settings.layers.storm) { setStat('storm', ns + (ns === 1 ? ' system' : ' systems') + ', ' + stamp().replace('Updated ', '')); }
  }
  function loadEonet() {
    if (!settings.layers.fire && !settings.layers.storm) { return; }
    if (settings.layers.fire) { setStat('fire', 'Loading'); }
    if (settings.layers.storm) { setStat('storm', 'Loading'); }
    xhr('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20&bbox=105,32,150,-5', function (d) { eonet = d.events || []; drawEonet(); }, function () { setStat('fire', 'Unavailable'); setStat('storm', 'Unavailable'); });
  }
  function applyLayers() {
    var id;
    if (!map) { return; }
    startRadar(); startCloud(); syncFc();
    each(['rain', 'river', 'fire', 'storm'], function (k) {
      var g = group(k);
      if (settings.layers[k]) {
        if (!map.hasLayer(g)) { g.addTo(map); }
        if (k === 'rain' && !fcData.rain) { loadRain(); }
        if (k === 'river' && !fcData.river) { loadRiver(); }
        if ((k === 'fire' || k === 'storm') && !eonet) { loadEonet(); }
        if ((k === 'fire' || k === 'storm') && eonet) { drawEonet(); }
      } else if (map.hasLayer(g)) { map.removeLayer(g); lstat[k] = ''; }
    });
    renderLegend();
    if (panelOpen) { renderPanel(); }
  }
  function refreshLayers() { fcData.rain = null; fcData.river = null; eonet = null; rv.loaded = false; fcg = null; fcc = null; stopFc(); applyLayers(); }
  function renderPanel() {
    var h = '';
    each(LAYERS, function (l) {
      h += '<div class="lrow"><div><b>' + l[1] + '</b><small>' + (settings.layers[l[0]] ? (lstat[l[0]] || '') + (lstat[l[0]] ? ' \u00b7 ' : '') : '') + l[2] + '</small></div><button class="sw' + (settings.layers[l[0]] ? ' on' : '') + '" data-layer="' + l[0] + '" aria-label="' + l[1] + '"></button></div>';
    });
    h += '<div class="lfoot"><span class="m">Live and model data</span><button class="btn sm" data-layers-refresh="1">' + icon('refresh', 13) + ' Refresh</button></div>';
    $('lpanel').innerHTML = h;
  }
  function lgSec(title, rows) {
    var h = '<h4>' + title + '</h4>';
    each(rows, function (r) { h += '<div class="lg-r"><span class="sq" style="--c:' + r[0] + '"></span>' + r[1] + '</div>'; });
    return h;
  }
  function renderLegend() {
    var h = '<button class="lg-h" data-legend="1">Legend ' + icon(legendOpen ? 'down' : 'up', 14) + '</button>', rows;
    if (!legendOpen) { $('legend').innerHTML = h; return; }
    h += '<div class="lg-b">';
    if (!settings.layers.reports) {
      h += '<div class="m" style="margin-top:6px">Incident reports are hidden on the map. <button class="link" data-layer="reports">Show reports</button></div>';
    } else {
      var tc = {}, sc = [0, 0, 0, 0], base = pool();
      each(base, function (r) { if (match(r, { noType: true })) { tc[r.type] = (tc[r.type] || 0) + 1; } if (match(r, { noSev: true })) { sc[r.sev]++; } });
      h += '<h4>Hazard type <span class="m">tap to filter</span></h4><div class="lg-grid">';
      each(TORDER, function (t) { if (settings.cats[t]) { h += '<button class="lg-b2' + (tf === t ? ' on' : '') + '" data-tf="' + (tf === t ? 'all' : t) + '" style="--c:var(--accent)">' + icon(TYPES[t].ic, 13) + '<span class="n">' + (TSHORT[t] || TYPES[t].label) + '</span><b>' + (tc[t] || 0) + '</b></button>'; } });
      h += '</div><h4>Severity <span class="m">tap to filter</span></h4><div class="lg-grid">';
      each(SEV, function (s, i) { h += '<button class="lg-b2' + (sevF === i ? ' on' : '') + '" data-sevf="' + i + '" style="--c:' + SEVCOL[i] + '"><span class="dot"></span><span class="n">' + s + '</span><b>' + sc[i] + '</b></button>'; });
      if (statusF !== 'active') { h += '<div class="lg-b2 static" style="--c:' + RESCOL + '"><span class="dot"></span><span class="n">Resolved</span></div>'; }
      h += '</div><div class="m" style="margin-top:6px">Icon shows type: drop flood, flame fire, pulse earthquake, mountain volcano, swirl typhoon, slope landslide. A number on a pin means several reports of one incident.</div>';
    }
    if (settings.layers.radar) { h += lgSec('Rain radar', [['#38bdf8', 'Light rain'], ['#22c55e', 'Moderate'], ['#facc15', 'Heavy'], ['#f97316', 'Very heavy'], ['#ef4444', 'Intense'], ['#d946ef', 'Extreme']]) + '<div class="m">Dashed line: Philippine Area of Responsibility. Tap the map for rainfall at that spot.</div><div class="m">' + (rvLabel || 'Loading frames') + '</div>'; }
    if (settings.layers.fcmap) { h += '<h4>Rain forecast map (mm per hour)</h4><div style="height:8px;border-radius:4px;background:linear-gradient(90deg,#7dd3fc,#3b82f6,#22c55e,#facc15,#f97316,#ef4444,#d946ef)"></div><div class="m" style="display:flex;justify-content:space-between"><span>0.2</span><span>1</span><span>2.5</span><span>5</span><span>10</span><span>20</span><span>40+</span></div><div class="m">White streaks show wind direction. Use the timeline to move through the next 4 days.</div>'; }
    if (settings.layers.cloud) { h += lgSec('Cloud cover', [['#f3f4f6', 'Cold, high cloud tops'], ['#6b7280', 'Warmer, thinner cloud']]); }
    if (settings.layers.rain) { rows = []; each(RAIN_CLASSES, function (c) { rows.push([c[1], c[3]]); }); h += lgSec('Rain forecast, next 24 h', rows); }
    if (settings.layers.river) { rows = []; each(RIVER_CLASSES, function (c) { rows.push([c[1], c[3]]); }); h += lgSec('River flood outlook', rows); }
    if (settings.layers.fire) { h += lgSec('Fire hotspots', [['#f97316', 'Satellite-detected fire']]); }
    if (settings.layers.storm) { rows = []; each(STORM_CLASSES, function (c) { rows.push([c[1], c[2]]); }); rows.push(['#94a3b8', 'Unclassified']); h += lgSec('Storms and typhoons', rows) + '<div class="m">Dashed line shows past track.</div>'; }
    $('legend').innerHTML = h + '</div>';
  }

  /* FC-BEGIN */
  /* ---------- forecast map: rain heat map, wind, timeline and weather icons ---------- */
  var FCS = { latTop: 28, latBot: 0, lngW: 102, lngE: 140, step: 2, cell: 10, hours: 96 };
  var FC_STOPS = [[0.05, 125, 211, 252, 0], [0.2, 125, 211, 252, 115], [1, 59, 130, 246, 180], [2.5, 34, 197, 94, 205], [5, 250, 204, 21, 215], [10, 249, 115, 22, 225], [20, 239, 68, 68, 235], [40, 217, 70, 239, 245]];
  var fcg = null, fcgAt = 0, fcc = null, fcActive = false, fcT = 0, fcOverlay = null, fcBar = null, fcTimer = null, fcMarks = [], fcMarkGroup = null, fcWind = null;
  function isArr(d) { return Object.prototype.toString.call(d) === '[object Array]'; }
  function fcColor(v) {
    var i, a, b, t, last = FC_STOPS[FC_STOPS.length - 1];
    if (!(v > FC_STOPS[0][0])) { return null; }
    for (i = 1; i < FC_STOPS.length; i++) {
      if (v <= FC_STOPS[i][0]) {
        a = FC_STOPS[i - 1]; b = FC_STOPS[i]; t = (v - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t];
      }
    }
    return [last[1], last[2], last[3], last[4]];
  }
  function fcSample(arr, lat, lng, clampIt) {
    var g = fcg, gr = (g.lat0 - lat) / g.step, gc = (lng - g.lng0) / g.step, r0, c0, r1, c1, fr, fq, a, b, c, d;
    if (!clampIt && (gr < 0 || gc < 0 || gr > g.rows - 1 || gc > g.cols - 1)) { return null; }
    gr = Math.max(0, Math.min(g.rows - 1, gr)); gc = Math.max(0, Math.min(g.cols - 1, gc));
    r0 = Math.floor(gr); c0 = Math.floor(gc); r1 = Math.min(g.rows - 1, r0 + 1); c1 = Math.min(g.cols - 1, c0 + 1);
    fr = gr - r0; fq = gc - c0;
    a = arr[r0 * g.cols + c0]; b = arr[r0 * g.cols + c1]; c = arr[r1 * g.cols + c0]; d = arr[r1 * g.cols + c1];
    return (a * (1 - fq) + b * fq) * (1 - fr) + (c * (1 - fq) + d * fq) * fr;
  }
  function fcMerc(l) { return Math.log(Math.tan(Math.PI / 4 + l * Math.PI / 360)); }
  function fcUnmerc(m) { return (2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180 / Math.PI; }
  function fcLabel(ms) { return new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' PHT'; }
  function wmo(code, day) {
    if (code === 0) { return day ? ['\u2600\uFE0F', 'Clear skies'] : ['\uD83C\uDF19', 'Clear skies']; }
    if (code === 1) { return day ? ['\uD83C\uDF24\uFE0F', 'Mostly clear'] : ['\uD83C\uDF19', 'Mostly clear']; }
    if (code === 2) { return day ? ['\u26C5', 'Partly cloudy'] : ['\u2601\uFE0F', 'Partly cloudy']; }
    if (code === 3) { return ['\u2601\uFE0F', 'Cloudy skies']; }
    if (code === 45 || code === 48) { return ['\uD83C\uDF2B\uFE0F', 'Fog']; }
    if (code >= 51 && code <= 57) { return ['\uD83C\uDF26\uFE0F', 'Drizzle']; }
    if (code >= 61 && code <= 67) { return ['\uD83C\uDF27\uFE0F', 'Rain']; }
    if (code >= 80 && code <= 82) { return ['\uD83C\uDF26\uFE0F', 'Rain showers']; }
    if (code >= 95) { return ['\u26C8\uFE0F', 'Thunderstorm']; }
    return ['\u2601\uFE0F', 'Cloudy'];
  }
  function loadFcGrid(cb, fail) {
    var la = [], lo = [], rows = Math.round((FCS.latTop - FCS.latBot) / FCS.step) + 1, cols = Math.round((FCS.lngE - FCS.lngW) / FCS.step) + 1, r, c;
    if (fcg && Date.now() - fcgAt < 1800000) { cb(); return; }
    for (r = 0; r < rows; r++) { for (c = 0; c < cols; c++) { la.push(FCS.latTop - r * FCS.step); lo.push(FCS.lngW + c * FCS.step); } }
    xhr('https://api.open-meteo.com/v1/forecast?latitude=' + la.join(',') + '&longitude=' + lo.join(',') + '&hourly=precipitation,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_hours=' + FCS.hours + '&timezone=Asia%2FManila', function (d) {
      var arr = isArr(d) ? d : [d], n = rows * cols, T, t, g;
      if (!arr.length || !arr[0].hourly || !arr[0].hourly.time || !arr[0].hourly.time.length) { fail(); return; }
      T = arr[0].hourly.time.length;
      g = { rows: rows, cols: cols, lat0: FCS.latTop, lng0: FCS.lngW, step: FCS.step, time: [], rain: [], u: [], v: [] };
      for (t = 0; t < T; t++) { g.time.push(Date.parse(arr[0].hourly.time[t] + '+08:00')); g.rain.push(new Float32Array(n)); g.u.push(new Float32Array(n)); g.v.push(new Float32Array(n)); }
      each(arr, function (o, i) {
        var h = o.hourly, k, sp, di;
        if (!h || i >= n || !h.precipitation) { return; }
        for (k = 0; k < T; k++) {
          g.rain[k][i] = h.precipitation[k] || 0;
          sp = h.wind_speed_10m ? (h.wind_speed_10m[k] || 0) : 0; di = (h.wind_direction_10m ? (h.wind_direction_10m[k] || 0) : 0) * Math.PI / 180;
          g.u[k][i] = -sp * Math.sin(di); g.v[k][i] = -sp * Math.cos(di);
        }
      });
      fcg = g; fcgAt = Date.now(); cb();
    }, function () { fail(); });
  }
  function loadFcCities(cb) {
    if (fcc) { cb(); return; }
    xhr('https://api.open-meteo.com/v1/forecast?' + pointsQS() + '&hourly=weather_code,temperature_2m,precipitation,is_day&forecast_hours=' + FCS.hours + '&timezone=Asia%2FManila', function (d) {
      var arr = isArr(d) ? d : [d], out = [];
      each(arr, function (o, i) {
        if (!o.hourly || !o.hourly.time || !o.hourly.time.length || !POINTS[i]) { return; }
        out.push({ name: POINTS[i][0], lat: POINTS[i][1], lng: POINTS[i][2], h: o.hourly, t0: Date.parse(o.hourly.time[0] + '+08:00') });
      });
      fcc = out; cb();
    }, function () { fcc = []; cb(); });
  }
  function fcPixels() {
    var g = fcg, W = g.cols * FCS.cell, H = g.rows * FCS.cell, data = new Uint8ClampedArray(W * H * 4), arr = g.rain[fcT], x, y, lat, lng, c, o, fade;
    var latN = g.lat0 + g.step / 2, latS = g.lat0 - (g.rows - 1) * g.step - g.step / 2, lngW = g.lng0 - g.step / 2, lngE = g.lng0 + (g.cols - 1) * g.step + g.step / 2;
    var mN = fcMerc(latN), mS = fcMerc(latS);
    for (y = 0; y < H; y++) {
      lat = fcUnmerc(mN - (y + 0.5) / H * (mN - mS));
      for (x = 0; x < W; x++) {
        lng = lngW + (x + 0.5) / W * (lngE - lngW);
        c = fcColor(fcSample(arr, lat, lng, true));
        if (c) {
          fade = Math.min(1, Math.min(Math.min(x + 0.5, W - x - 0.5), Math.min(y + 0.5, H - y - 0.5)) / FCS.cell);
          o = (y * W + x) * 4; data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = c[3] * fade;
        }
      }
    }
    return { w: W, h: H, data: data, bounds: [[latS, lngW], [latN, lngE]] };
  }
  function fcRender() {
    var p = fcPixels(), cv = document.createElement('canvas'), ctx = cv.getContext('2d'), im, url;
    cv.width = p.w; cv.height = p.h;
    im = ctx.createImageData(p.w, p.h); im.data.set(p.data); ctx.putImageData(im, 0, 0);
    url = cv.toDataURL('image/png');
    if (!fcOverlay) { fcOverlay = L.imageOverlay(url, p.bounds, { opacity: 0.6, zIndex: 6, interactive: false }).addTo(map); }
    else { fcOverlay.setUrl(url); }
  }
  function fcCityIcon(ic) { return L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14], html: '<div style="font-size:22px;line-height:28px;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.65)">' + ic + '</div>' }); }
  function fcCityAt(c) {
    var k = Math.round((fcg.time[fcT] - c.t0) / 3600000), h = c.h, w;
    if (k < 0 || k >= h.time.length) { return null; }
    w = wmo(h.weather_code ? h.weather_code[k] : null, h.is_day ? h.is_day[k] === 1 : true);
    return { ic: w[0], txt: w[1], temp: h.temperature_2m ? h.temperature_2m[k] : null, rain: h.precipitation ? (h.precipitation[k] || 0) : 0 };
  }
  function fcMarkUpdate() {
    each(fcMarks, function (m) { var d = fcCityAt(m.city); m.setIcon(fcCityIcon(d ? d.ic : '')); m.setOpacity(d ? 1 : 0); });
  }
  function fcBuildMarks() {
    fcMarkGroup = L.layerGroup(); fcMarks = [];
    each(fcc || [], function (c) {
      var m = L.marker([c.lat, c.lng], { icon: fcCityIcon(''), pane: 'fc' });
      m.city = c;
      m.bindPopup(function () {
        var d = fcCityAt(c);
        if (!d) { return 'No data for this time.'; }
        return '<b>' + esc(c.name) + '</b><br>' + d.txt + '<br>' + fcLabel(fcg.time[fcT]) + (d.temp != null ? ' \u00b7 ' + Math.round(d.temp) + '\u00b0C' : '') + '<br>Rain ' + d.rain.toFixed(1) + ' mm in that hour<br><small>Model forecast (Open-Meteo). Not an official PAGASA forecast.</small>';
      });
      m.addTo(fcMarkGroup); fcMarks.push(m);
    });
    fcMarkGroup.addTo(map);
  }
  var FC_PLAY = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="#fff"/></svg>';
  var FC_PAUSE = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="#fff"/></svg>';
  var FC_CSS = '.fcrange{-webkit-appearance:none;appearance:none;width:100%;height:22px;background:transparent;margin:0;cursor:pointer;outline:none}' +
    '.fcrange::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(90deg,#fff var(--p,0%),rgba(255,255,255,.28) var(--p,0%))}' +
    '.fcrange::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;margin-top:-7px;box-shadow:0 1px 5px rgba(0,0,0,.55)}' +
    '.fcrange::-moz-range-track{height:4px;border-radius:2px;background:rgba(255,255,255,.28)}' +
    '.fcrange::-moz-range-progress{height:4px;border-radius:2px;background:#fff}' +
    '.fcrange::-moz-range-thumb{width:18px;height:18px;border:0;border-radius:50%;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.55)}' +
    '.fcrange:focus-visible::-webkit-slider-thumb{outline:2px solid #3b82f6;outline-offset:2px}';
  function fcBubbleText(ms) { return fcLabel(ms).replace(' PHT', '').replace(/(\d{1,2}), (\d{1,2}:\d{2})/, '$1 $2'); }
  function fcPlaceBubble() {
    var wrap, bub, ww, bw, x, pct, n;
    if (!fcBar || !fcg) { return; }
    wrap = fcBar.querySelector('.fctrack'); bub = fcBar.querySelector('.fclbl');
    n = fcg.time.length; pct = n > 1 ? fcT / (n - 1) : 0;
    ww = wrap.clientWidth; bw = bub.offsetWidth; x = 9 + pct * (ww - 18);
    x = Math.max(bw / 2, Math.min(ww - bw / 2, x));
    bub.style.left = x + 'px';
  }
  function fcShow(i) {
    var n = fcg.time.length, r, bub, pct;
    fcT = ((i % n) + n) % n;
    fcRender();
    if (fcBar) {
      r = fcBar.querySelector('.fcrange'); bub = fcBar.querySelector('.fclbl');
      pct = n > 1 ? fcT / (n - 1) : 0;
      r.value = String(fcT); r.style.setProperty('--p', (pct * 100) + '%');
      bub.textContent = fcBubbleText(fcg.time[fcT]);
      fcPlaceBubble();
    }
    fcMarkUpdate();
  }
  function fcPlayToggle() {
    var b = fcBar ? fcBar.querySelector('.fcplay') : null;
    if (fcTimer) { clearInterval(fcTimer); fcTimer = null; if (b) { b.innerHTML = FC_PLAY; b.setAttribute('aria-label', 'Play forecast'); } return; }
    fcTimer = setInterval(function () { fcShow(fcT + 1); }, 700);
    if (b) { b.innerHTML = FC_PAUSE; b.setAttribute('aria-label', 'Pause forecast'); }
  }
  function fcBuildBar() {
    var d = document.createElement('div'), days = [], seg = '', st;
    if (!document.getElementById('fcstyle')) { st = document.createElement('style'); st.id = 'fcstyle'; st.textContent = FC_CSS; document.head.appendChild(st); }
    each(fcg.time, function (ms) {
      var key = manilaDay(ms);
      if (!days.length || days[days.length - 1].key !== key) { days.push({ key: key, ms: ms, n: 0 }); }
      days[days.length - 1].n++;
    });
    each(days, function (dy, i) {
      seg += '<div style="flex:' + dy.n + ' 1 0;position:relative;text-align:center;font-size:11px;color:rgba(255,255,255,.75);min-width:0;white-space:nowrap;overflow:hidden">' + (i ? '<span style="position:absolute;left:0;top:1px;height:14px;border-left:1px solid rgba(255,255,255,.3)"></span>' : '') + (dy.n >= 6 ? new Date(dy.ms).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short' }) : '') + '</div>';
    });
    d.className = 'fcbar';
    d.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:30px;z-index:900;width:min(560px,92%);box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:10px 16px 8px 10px;border-radius:16px;background:rgba(15,19,24,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;font:12px/1.3 system-ui,sans-serif';
    d.innerHTML = '<button type="button" class="fcplay" aria-label="Play forecast" style="flex:none;width:42px;height:42px;border-radius:50%;border:0;background:rgba(58,58,58,.7);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">' + FC_PLAY + '</button>' +
      '<div style="flex:1;min-width:0"><div class="fctrack" style="position:relative"><div class="fclbl" style="position:absolute;bottom:calc(100% + 20px);left:0;transform:translateX(-50%);padding:5px 11px;border-radius:9px;background:rgba(15,19,24,.75);font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none"></div>' +
      '<input class="fcrange" type="range" min="0" max="' + (fcg.time.length - 1) + '" value="0" step="1" aria-label="Forecast time"></div>' +
      '<div style="display:flex;padding:1px 9px 0;margin-top:1px">' + seg + '</div></div>';
    map.getContainer().appendChild(d);
    L.DomEvent.disableClickPropagation(d); L.DomEvent.disableScrollPropagation(d);
    d.querySelector('.fcplay').addEventListener('click', fcPlayToggle);
    d.querySelector('.fcrange').addEventListener('input', function () { if (fcTimer) { fcPlayToggle(); } fcShow(parseInt(this.value, 10) || 0); });
    map.on('resize', fcPlaceBubble);
    fcBar = d;
    document.body.classList.add('fcon');
  }
  function fcWindStart() {
    var cv = document.createElement('canvas'), box = map.getContainer(), ctx = cv.getContext('2d'), parts = [], W = 0, H = 0, last = 0, w;
    function spawn(p) {
      var k, ll;
      for (k = 0; k < 6; k++) {
        p.x = Math.random() * W; p.y = Math.random() * H;
        ll = map.containerPointToLatLng([p.x, p.y]);
        if (fcg && fcSample(fcg.u[fcT], ll.lat, ll.lng) !== null) { break; }
      }
      p.age = 0; p.life = 40 + Math.random() * 60;
    }
    function fill() { var n = Math.max(120, Math.min(600, Math.round(W * H / 1800))), i; parts = []; for (i = 0; i < n; i++) { parts.push({ x: 0, y: 0, age: 0, life: 1 }); spawn(parts[i]); } }
    function size() { W = box.clientWidth; H = box.clientHeight; cv.width = W; cv.height = H; fill(); }
    function reset() { ctx.clearRect(0, 0, W, H); each(parts, spawn); }
    function frame(ts) {
      if (!fcWind || fcWind.cv !== cv) { return; }
      fcWind.raf = window.requestAnimationFrame(frame);
      if (document.hidden || ts - last < 33 || !fcg) { return; }
      last = ts;
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
      each(parts, function (p) {
        var ll = map.containerPointToLatLng([p.x, p.y]), u = fcSample(fcg.u[fcT], ll.lat, ll.lng), v = fcSample(fcg.v[fcT], ll.lat, ll.lng), nx, ny;
        if (u === null || v === null || ++p.age > p.life) { spawn(p); return; }
        nx = p.x + u * 0.3; ny = p.y - v * 0.3;
        ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); p.x = nx; p.y = ny;
      });
      ctx.stroke();
    }
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:450';
    box.appendChild(cv);
    size();
    w = { cv: cv, raf: 0, onMove: reset, onSize: size };
    fcWind = w;
    map.on('movestart zoomstart', reset); map.on('resize', size);
    w.raf = window.requestAnimationFrame(frame);
  }
  function fcWindStop() {
    var w = fcWind;
    if (!w) { return; }
    fcWind = null;
    if (w.raf) { window.cancelAnimationFrame(w.raf); }
    if (map) { map.off('movestart zoomstart', w.onMove); map.off('resize', w.onSize); }
    if (w.cv.parentNode) { w.cv.parentNode.removeChild(w.cv); }
  }
  function stopFc() {
    fcActive = false;
    if (fcTimer) { clearInterval(fcTimer); fcTimer = null; }
    fcWindStop();
    if (map) { map.off('resize', fcPlaceBubble); }
    if (fcBar && fcBar.parentNode) { fcBar.parentNode.removeChild(fcBar); }
    fcBar = null;
    document.body.classList.remove('fcon');
    if (map && fcOverlay) { map.removeLayer(fcOverlay); }
    fcOverlay = null;
    if (map && fcMarkGroup) { map.removeLayer(fcMarkGroup); }
    fcMarkGroup = null; fcMarks = [];
  }
  function startFc() {
    fcActive = true;
    setStat('fcmap', 'Loading');
    loadFcGrid(function () {
      if (!fcActive) { return; }
      loadFcCities(function () {
        if (!fcActive) { return; }
        fcT = 0;
        fcBuildBar(); fcBuildMarks(); fcShow(0); fcWindStart();
        setStat('fcmap', stamp()); renderLegend();
      });
    }, function () { fcActive = false; setStat('fcmap', 'Unavailable'); });
  }
  function syncFc() {
    if (!map) { return; }
    if (settings.layers.fcmap && !fcActive) { startFc(); }
    else if (!settings.layers.fcmap && fcActive) { stopFc(); setStat('fcmap', ''); }
  }
  /* FC-END */

  /* ---------- detail ---------- */
  function noteFor(r) {
    if (r.cloud && r.media) { return 'Posted by the media account of ' + r.media + '. Media accounts are set up by the DATAsaster team, but the report itself is not verified by an agency. Treat the details as unconfirmed.'; }
    if (r.cloud && r.trust === 'verified') { return 'Community report reviewed by a DATAsaster admin. Still not an official agency record.'; }
    if (r.live) { return 'Instrument data from ' + r.srcLabel + '. PHIVOLCS publishes the official Philippine bulletin, which may differ slightly.'; }
    if (r.trust === 'official') { return 'Sample record modelled on an agency bulletin. For real warnings, use the agency website.'; }
    if (r.trust === 'news') { return 'Sample record modelled on a news report. Real headlines are listed under Latest headlines.'; }
    if (r.trust === 'verified') { return 'Sample of a report checked against a responder or barangay update.'; }
    return 'Not reviewed by any agency or moderator. Treat the details and severity as unconfirmed.' + (r.author ? ' The name shown was typed by the person who posted it and is not verified.' : '');
  }
  function kv(rows) { var h = '<table class="kv">'; each(rows, function (o) { h += '<tr><td>' + esc(o[0]) + '</td><td>' + esc(o[1]) + '</td></tr>'; }); return h + '</table>'; }
  function openDetail(id) {
    var r = byId(id), t, h, rel, th, ph;
    if (!r) { return; }
    detailId = id;
    t = TYPES[r.type];
    h = '<button class="mx" data-close="detail" aria-label="Close">' + icon('x') + '</button>';
    h += statusLine(r, t);
    h += '<h2>' + esc(r.title) + '</h2><div class="m">' + trustLine(r) + '</div>';
    ph = photosOf(r);
    if (settings.showPhotos && ph.length) {
      h += '<div class="gal"><button type="button" class="heroBtn" data-photo="' + r.id + '#0" aria-label="Open photo 1 of ' + ph.length + ', tap to zoom"><img class="hero" alt="Photo 1 of ' + ph.length + '" src="' + ph[0] + '"><span class="zoomtag">' + icon('zoomin', 14) + ' Tap to zoom' + (ph.length > 1 ? ' \u00b7 ' + ph.length + ' photos' : '') + '</span></button>';
      if (ph.length > 1) { h += '<div class="gthumbs">'; each(ph, function (p, gi) { h += '<button type="button" class="gt" data-photo="' + r.id + '#' + gi + '" aria-label="Open photo ' + (gi + 1) + '"><img alt="" src="' + p + '"></button>'; }); h += '</div>'; }
      h += '</div>';
    }
    h += '<p>' + esc(r.desc) + '</p>';
    h += '<h3>Record</h3>' + kv([['Location', r.place], ['Date and time', fmtFull(r.time)], ['Coordinates', r.lat.toFixed(4) + ', ' + r.lng.toFixed(4)], ['Severity', SEV[r.sev] + ': ' + SEVDESC[r.type][r.sev]], ['Status', r.resolved ? 'Resolved' + (r.resAt ? ' on ' + fmtFull(r.resAt) : '') : 'Active']].concat(r.resolved && r.resNote ? [['Resolution', r.resNote]] : []));
    if (r.lines) { h += '<h3>' + esc(r.obsTitle) + '</h3>' + kv(r.lines); }
    else if (r.obs && r.obs.length) { h += '<h3>' + esc(r.obsTitle || 'Observations') + '</h3>' + kv(r.obs); }
    if (r.cloud && CLOUD.admin) { var fl = flagsFor(r.cid), fr2 = []; each(fl.slice(0, 5), function (f) { fr2.push(['Flag', f.reason]); }); if (fl.length) { h += '<h3>Flags (' + fl.length + ')</h3>' + kv(fr2); } }
    if (r.cloud) { h += assessHtml(r); }
    h += '<p class="m" style="margin-top:16px">' + noteFor(r) + '</p>';
    h += '<div class="acts"><button class="btn primary" data-fly="' + r.id + '">Show on map</button>';
    h += '<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + r.lat + ',' + r.lng + '" style="text-decoration:none;color:inherit">' + icon('nav', 14) + ' Directions</a>';
    h += '<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + r.lat + ',' + r.lng + '" style="text-decoration:none;color:inherit">Street view</a>';
    if (window.MAPS_EMBED_KEY) { h += '<button class="btn" data-sv="' + r.id + '">View street here</button>'; }
    if (r.link) { h += '<a class="btn" target="_blank" rel="noopener" href="' + esc(r.link) + '" style="text-decoration:none;color:inherit">Source page</a>'; }
    if (r.own) { h += '<button class="btn" data-resolve="' + r.id + '">' + (r.resolved ? 'Reopen' : 'Mark as resolved') + '</button>'; if (!r.cloud || r.mine || CLOUD.owner) { h += '<button class="btn danger" data-del="' + r.id + '">' + (r.cloud && !r.mine ? 'Delete report (admin)' : 'Delete my report') + '</button>'; } }
    if (r.cloud && CLOUD.admin && CLOUD.can(r.type)) { h += '<button class="btn" data-verify="' + r.id + '">' + (r.trust === 'verified' ? 'Remove verified' : 'Mark verified') + '</button>'; }
    if (r.cloud) { h += '<button class="btn" data-share="' + r.id + '">Share link</button>'; }
    if (r.cloud && !r.mine) { h += flagged[r.cid] ? '<button class="btn" disabled>Flagged</button>' : '<button class="btn" data-flag="' + r.id + '">Report as fake or wrong</button>'; }
    h += '</div><div id="svBox"></div>';
    th = threadOf(r);
    if (th.length > 1) {
      h += '<h3>Similar reports nearby (' + th.length + ')</h3><div class="m">Same type, within ' + GROUP_KM + ' km and 24 hours of each other.</div>';
      each(th, function (x) { h += '<button class="rel" data-open="' + x.id + '"' + (x.id === r.id ? ' disabled' : '') + '><span><span class="dot" style="--c:' + (x.resolved ? RESCOL : SEVCOL[x.sev]) + '"></span>' + esc(x.title) + (x.id === r.id ? ' (this report)' : '') + '</span><span class="m">' + ago(x.time) + '</span></button>'; });
    }
    rel = pool().filter(function (x) { return x.id !== r.id && x.type === r.type; }).sort(function (a, b) { return Math.abs(a.lat - r.lat) + Math.abs(a.lng - r.lng) - Math.abs(b.lat - r.lat) - Math.abs(b.lng - r.lng); }).slice(0, 3);
    if (rel.length && th.length < 2) { h += '<h3>Nearby of the same type</h3>'; each(rel, function (x) { h += '<button class="rel" data-open="' + x.id + '"><span><span class="dot" style="--c:' + SEVCOL[x.sev] + '"></span>' + esc(x.title) + '</span><span class="m">' + ago(x.time) + '</span></button>'; }); }
    $('detailBox').innerHTML = h;
    $('detailBg').className = 'bg show';
    $('detailBg').scrollTop = 0;
  }

  /* ---------- news ---------- */
  function cleanTitle(t) { return String(t || '').replace(/\s+-\s+[^-]{2,40}$/, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'); }
  function fetchSite(key, cb) {
    var rss = 'https://news.google.com/rss/search?q=' + encodeURIComponent('site:' + SRC[key].site + ' (flood OR typhoon OR earthquake OR fire OR volcano OR bagyo OR lindol OR sunog) when:7d') + '&hl=en-PH&gl=PH&ceid=PH:en';
    function viaProxy() {
      xhr('https://api.allorigins.win/raw?url=' + encodeURIComponent(rss), function (txt) {
        var out = [], doc, items;
        try {
          doc = new DOMParser().parseFromString(txt, 'text/xml'); items = doc.getElementsByTagName('item');
          each(items, function (it) {
            var tt = it.getElementsByTagName('title')[0], ll = it.getElementsByTagName('link')[0], pp = it.getElementsByTagName('pubDate')[0], t;
            if (!tt || !ll) { return; }
            t = pp ? new Date(pp.textContent).getTime() : Date.now();
            out.push({ src: key, title: cleanTitle(tt.textContent), link: ll.textContent, time: isNaN(t) ? Date.now() : t });
          });
        } catch (e) { out = []; }
        cb(out);
      }, function () { cb([]); }, true);
    }
    xhr('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss), function (d) {
      var out = [];
      if (d.status !== 'ok' || !d.items || !d.items.length) { viaProxy(); return; }
      each(d.items, function (i) {
        var t = new Date(String(i.pubDate).replace(' ', 'T') + 'Z').getTime();
        out.push({ src: key, title: cleanTitle(i.title), link: i.link, time: isNaN(t) ? Date.now() : t });
      });
      cb(out);
    }, viaProxy);
  }
  function loadNews() {
    var keys = NEWS_KEYS.filter(function (k) { return settings.sources[k] !== false; }), pending = keys.length, all = [];
    newsState = 'loading'; newsLive = 0; renderNews();
    if (!settings.liveNews || !keys.length) { newsItems = []; newsState = settings.liveNews ? 'none' : 'off'; renderNews(); return; }
    each(keys, function (k) {
      fetchSite(k, function (out) {
        if (out.length) { newsLive++; all = all.concat(out.slice(0, 8)); }
        pending--;
        if (pending === 0) { all.sort(function (a, b) { return b.time - a.time; }); newsItems = all; newsState = 'done'; renderNews(); }
      });
    });
  }
  function renderNews(keepSel) {
    var h = '', list = [], sample = false, opts = '<option value="all">All sources</option>', total = NEWS_KEYS.filter(function (k) { return settings.sources[k] !== false; }).length, i;
    each(NEWS_KEYS, function (k) { if (settings.sources[k] !== false) { opts += '<option value="' + k + '"' + (newsF === k ? ' selected' : '') + '>' + SRC[k].name + '</option>'; } });
    if (!keepSel) { $('newsSrc').innerHTML = opts; }
    if (newsState === 'loading') {
      for (i = 0; i < 5; i++) { h += '<div class="nrow"><span class="sk"></span><span class="sk"></span><span class="sk"></span></div>'; }
      $('newsList').innerHTML = h; $('newsMeta').textContent = 'Loading headlines...'; return;
    }
    if (newsState !== 'done' || !newsItems.length) {
      sample = true;
      each(SAMPLE_HEADLINES, function (x) { if (settings.sources[x[0]] !== false) { list.push({ src: x[0], title: x[1], link: SRC[x[0]].url, time: Date.now() - x[2] * 3600000 }); } });
    } else { list = newsItems.slice(); }
    list = list.filter(function (n) { return newsF === 'all' || n.src === newsF; });
    each(list.slice(0, 20), function (n) {
      h += '<a class="nrow" href="' + esc(n.link) + '" target="_blank" rel="noopener"><span class="m">' + esc(SRC[n.src].name) + '</span><span>' + esc(n.title) + '</span><span class="m">' + ago(n.time) + '</span></a>';
    });
    if (!list.length) { h = '<div class="empty">No headlines for this source.</div>'; }
    $('newsList').innerHTML = h;
    $('newsMeta').innerHTML = sample ? 'Live headlines could not be loaded, so these are labelled sample headlines. <button class="link" data-newsretry="1">Try again</button>' : 'Headlines via Google News from ' + newsLive + ' of ' + total + ' sources. Open an article for the full story.';
  }

  /* ---------- live earthquakes ---------- */
  /* Earthquakes: USGS and EMSC, polled every minute while the app is visible. */
  var quakeBusy = false, quakeAt = 0, quakeStamp = '', knownQuakes = null;
  function quakeSev(m) { return m < 5 ? 0 : (m < 5.8 ? 1 : (m < 6.5 ? 2 : 3)); }
  function titleCase(t) { return String(t || '').toLowerCase().replace(/(^|[\s,\-(])([a-z])/g, function (x, p, c) { return p + c.toUpperCase(); }); }
  function quakeItem(o) {
    var m = o.mag, lines = [['Magnitude', m.toFixed(1) + (o.magType ? ' (' + o.magType + ')' : '')], ['Depth', o.depth != null ? Math.round(o.depth) + ' km' : 'n/a'], ['Epicenter', o.lat.toFixed(2) + ', ' + o.lng.toFixed(2)]];
    if (o.status) { lines.push(['Review status', o.status]); }
    if (o.felt) { lines.push(['Felt reports', String(o.felt)]); }
    if (o.also) { lines.push(['Also reported by', o.also]); }
    return { id: o.id, live: true, type: 'quake', mag: m, sev: quakeSev(m), trust: 'official', src: o.src, srcLabel: o.label, time: o.time, title: 'M' + m.toFixed(1) + ' ' + o.place, desc: 'Instrument-recorded event from the ' + o.label + ' catalogue.', place: o.place, lat: o.lat, lng: o.lng, link: o.link, obsTitle: 'Official parameters (' + o.label + ')', lines: lines };
  }
  function quakeBuild(raw) { var out = []; each(raw, function (o) { out.push(quakeItem(o)); }); return out; }
  function quakeMerge(usgs, emsc) {
    var out = usgs.slice();
    each(emsc, function (e) {
      var dup = null;
      each(usgs, function (u) { if (!dup && Math.abs(u.time - e.time) < 120000 && distKm(u.lat, u.lng, e.lat, e.lng) < 150) { dup = u; } });
      if (dup) { dup.also = 'EMSC'; } else { out.push(e); }
    });
    out.sort(function (a, b) { return b.time - a.time; });
    return out;
  }
  function quakeNew(items) {
    var n = 0, big = null;
    if (knownQuakes === null) { knownQuakes = {}; each(items, function (q) { knownQuakes[q.id] = true; }); return; }
    each(items, function (q) {
      if (knownQuakes[q.id]) { return; }
      knownQuakes[q.id] = true;
      if (q.mag >= 4.5 && q.time > Date.now() - 6 * 3600000) { n++; if (!big || q.mag > big.mag) { big = q; } }
    });
    if (big) { notify(n > 1 ? n + ' new earthquakes, strongest M' + big.mag.toFixed(1) + ' ' + big.place : 'New earthquake: M' + big.mag.toFixed(1) + ' ' + big.place); }
  }
  function loadQuakes() {
    var res = { usgs: null, emsc: null }, pending = 2, d0, start, startT;
    if (!settings.liveQuakes) { liveQuakes = []; quakeState = ''; refresh(); return; }
    if (quakeBusy) { return; }
    quakeBusy = true;
    d0 = new Date(Date.now() - 30 * 86400000);
    start = d0.toISOString().substring(0, 10);
    startT = d0.toISOString().substring(0, 19);
    function done() {
      var items;
      pending--;
      if (pending > 0) { return; }
      quakeBusy = false;
      if (res.usgs === null && res.emsc === null) { quakeState = liveQuakes.length ? 'stale' : 'unavailable'; refresh(); return; }
      var raw = quakeMerge(res.usgs || [], res.emsc || []);
      items = quakeBuild(raw);
      quakeNew(items);
      liveQuakes = items; quakeState = 'ok'; quakeAt = Date.now(); quakeStamp = stamp();
      lsSet('datasaster_quakes', { t: quakeAt, list: raw.slice(0, 250) });
      refresh();
    }
    xhr('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=4&maxlatitude=22&minlongitude=116&maxlongitude=128&minmagnitude=2.5&orderby=time&limit=300&starttime=' + start, function (d) {
      var out = [];
      each(d.features || [], function (f) {
        var p = f.properties, c = f.geometry.coordinates;
        if (p.mag == null) { return; }
        out.push({ id: 'q' + f.id, src: 'usgs', label: 'USGS', time: p.time, mag: p.mag, magType: p.magType || '', depth: c[2], lat: c[1], lng: c[0], place: p.place || 'Philippines', link: p.url, status: p.status || '', felt: p.felt || 0 });
      });
      res.usgs = out; done();
    }, function () { res.usgs = null; done(); });
    xhr('https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minlatitude=4&maxlatitude=22&minlongitude=116&maxlongitude=128&minmagnitude=2.5&orderby=time&limit=400&starttime=' + startT, function (d) {
      var out = [];
      each(d.features || [], function (f) {
        var p = f.properties || {}, t = Date.parse(p.time), lat = typeof p.lat === 'number' ? p.lat : f.geometry.coordinates[1], lng = typeof p.lon === 'number' ? p.lon : f.geometry.coordinates[0];
        if (typeof p.mag !== 'number' || isNaN(t) || typeof lat !== 'number' || typeof lng !== 'number') { return; }
        out.push({ id: 'e' + String(p.source_id || p.unid || f.id), src: 'emsc', label: 'EMSC', time: t, mag: p.mag, magType: p.magtype || '', depth: typeof p.depth === 'number' ? Math.abs(p.depth) : null, lat: lat, lng: lng, place: titleCase(p.flynn_region) || 'Philippines', link: 'https://www.emsc-csem.org/Earthquake_information/earthquake.php?id=' + encodeURIComponent(String(p.source_id || p.unid || '')), status: p.auth ? 'Contributed by ' + p.auth : '', felt: 0 });
      });
      res.emsc = out; done();
    }, function () { res.emsc = null; done(); });
  }
  function loadQuakeCache() {
    var c = lsGet('datasaster_quakes', null);
    if (!settings.liveQuakes || !c || !c.list || !c.list.length) { return; }
    try { liveQuakes = quakeBuild(c.list); quakeState = 'stale'; knownQuakes = {}; each(liveQuakes, function (q) { knownQuakes[q.id] = true; }); } catch (e) { liveQuakes = []; }
  }

  /* ---------- contacts ---------- */
  function renderContacts() {
    var h = '';
    each(CONTACTS, function (c) {
      h += '<div class="cc' + (c[3] ? ' big' : '') + '"><b>' + esc(c[0]) + '</b><span class="cn">';
      each(c[1], function (n) { h += '<a class="tel" href="tel:' + n[1] + '">' + icon('phone', 14) + '<span>' + n[0] + '</span></a>'; });
      h += '</span><small>' + esc(c[2]) + '</small></div>';
    });
    $('contacts').innerHTML = h;
    var SHORT = { 'National Emergency Hotline': 'National Emergency', 'Philippine Red Cross': 'Red Cross', 'Philippine National Police': 'PNP', 'Bureau of Fire Protection': 'BFP', 'NDRRMC Operations Center': 'NDRRMC', 'Philippine Coast Guard': 'Coast Guard' }, hb = '';
    each(CONTACTS, function (c) {
      hb += '<span class="hi"><b>' + esc(SHORT[c[0]] || c[0]) + ':</b> ';
      each(c[1], function (n) { hb += '<a href="tel:' + n[1] + '">' + n[0] + '</a>'; });
      hb += '</span>';
    });
    if ($('hotList')) { $('hotList').innerHTML = hb; }
  }

  /* ---------- report form ---------- */
  function fillReport() {
    var h = '';
    each(TORDER, function (t) { h += '<option value="' + t + '">' + TYPES[t].label + '</option>'; });
    $('rType').innerHTML = h;
    h = ''; each(SEV, function (s, i) { h += '<option value="' + i + '">' + s + '</option>'; });
    $('rSev').innerHTML = h;
    h = ''; each(EFFECTS, function (e) { h += '<label class="chk"><input type="checkbox" class="efx" value="' + esc(e) + '"> ' + esc(e) + '</label>'; });
    $('efxBox').innerHTML = h;
    h = ''; each(VOLC_OBS, function (e) { h += '<label class="chk"><input type="checkbox" class="obs" value="' + esc(e) + '"> ' + esc(e) + '</label>'; });
    $('obsBox').innerHTML = h;
    h = ''; each(TYPH_OBS, function (e) { h += '<label class="chk"><input type="checkbox" class="tobs" value="' + esc(e) + '"> ' + esc(e) + '</label>'; });
    $('tobsBox').innerHTML = h;
    h = ''; each(LAND_OBS, function (e) { h += '<label class="chk"><input type="checkbox" class="lobs" value="' + esc(e) + '"> ' + esc(e) + '</label>'; });
    $('lobsBox').innerHTML = h;
  }
  function rSevHelp() { var t = $('rType').value, s = parseInt($('rSev').value, 10); $('rSevHelp').textContent = SEV[s] + ': ' + SEVDESC[t][s]; }
  function rTypeChanged() {
    var t = $('rType').value;
    $('secFlood').style.display = t === 'flood' ? 'block' : 'none';
    $('secFire').style.display = t === 'fire' ? 'block' : 'none';
    $('secQuake').style.display = t === 'quake' ? 'block' : 'none';
    $('secVolc').style.display = t === 'volcano' ? 'block' : 'none';
    $('secTyph').style.display = t === 'typhoon' ? 'block' : 'none';
    $('secLand').style.display = t === 'landslide' ? 'block' : 'none';
    rSevHelp();
  }
  function setPending(lat, lng) {
    pendLat = lat; pendLng = lng;
    $('rLoc').textContent = 'Location set: ' + lat.toFixed(5) + ', ' + lng.toFixed(5); updAreaHint();
    if (map) { if (pickMark) { map.removeLayer(pickMark); } pickMark = L.circleMarker([lat, lng], { radius: 9, color: '#4c8dff', fillOpacity: 0.4 }).addTo(map); }
  }
  function clearChecks(c) { each(document.getElementsByClassName(c), function (x) { x.checked = false; }); }
  function getChecks(c) { var o = []; each(document.getElementsByClassName(c), function (x) { if (x.checked) { o.push(x.value); } }); return o; }
  function openReport(keep) {
    if (!keep) {
      $('rType').value = tf === 'all' ? 'flood' : tf; $('rSev').value = '0';
      each(['rTitle', 'rDesc', 'rPlace', 'rAuthor', 'rDepth', 'rFDur', 'rBurn', 'rStruct', 'rPhoto'], function (id) { $(id).value = ''; });
      $('rEvac').selectedIndex = 0;
      clearChecks('efx'); clearChecks('obs'); clearChecks('tobs'); clearChecks('lobs');
      $('rWind').selectedIndex = 0; $('rRain').selectedIndex = 0; $('rCause').selectedIndex = 0;
      pendLat = null; pendLng = null; pendImgs = []; renderPrevs(); $('rLoc').textContent = 'No location set';
      if (pickMark && map) { map.removeLayer(pickMark); pickMark = null; }
      rTypeChanged();
    }
    $('reportBg').className = 'bg show';
  }
  function closeReport() { $('reportBg').className = 'bg'; if (pickMark && map) { map.removeLayer(pickMark); pickMark = null; } }
  function endPick() { picking = false; $('pickbar').style.display = 'none'; }
  /* ---------- photos: 0 to 3 per report, each shrunk before upload ---------- */
  function shrinkPhoto(im) {
    var side = 900, q = 0.72, tries = 0, w, h, c, out = '';
    while (tries < 12) {
      w = im.width; h = im.height;
      if (w > side || h > side) { if (w > h) { h = Math.round(h * side / w); w = side; } else { w = Math.round(w * side / h); h = side; } }
      c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(im, 0, 0, w, h);
      out = c.toDataURL('image/jpeg', q);
      if (out.length <= IMG_MAX) { return out; }
      if (q > 0.46) { q -= 0.1; } else { side = Math.round(side * 0.8); }
      tries++;
    }
    return out.length <= IMG_MAX ? out : '';
  }
  function readPhoto(f, cb) {
    var fr = new FileReader();
    fr.onerror = function () { cb(''); };
    fr.onload = function () {
      var im = new Image();
      im.onerror = function () { cb(''); };
      im.onload = function () { var d = ''; try { d = shrinkPhoto(im); } catch (e) { d = ''; } cb(d); };
      im.src = fr.result;
    };
    fr.readAsDataURL(f);
  }
  function renderPrevs() {
    var h = '', n = pendImgs.length;
    each(pendImgs, function (p, i) {
      h += '<div class="pv"><img alt="Photo ' + (i + 1) + ' preview" src="' + p + '"><button type="button" class="pdel" data-pdel="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + icon('x', 14) + '</button></div>';
    });
    $('rPrevs').innerHTML = h;
    $('rPhoto').disabled = n >= MAXPHOTOS;
    $('rPhotoHint').textContent = n ? (n + ' of ' + MAXPHOTOS + ' photos added' + (n < MAXPHOTOS ? '. You can add ' + (MAXPHOTOS - n) + ' more.' : '.')) : 'No photos added. You can add up to ' + MAXPHOTOS + ', or none.';
  }
  function onPhoto() {
    var files = $('rPhoto').files, list = [], room = MAXPHOTOS - pendImgs.length, i;
    for (i = 0; i < files.length && list.length < room; i++) { list.push(files[i]); }
    if (files.length > room) { toast('Only ' + MAXPHOTOS + ' photos are allowed per report'); }
    $('rPhoto').value = '';
    function next(k) {
      if (k >= list.length) { return; }
      photoBusy++;
      $('rPhotoHint').textContent = 'Preparing photo...';
      readPhoto(list[k], function (d) {
        photoBusy--;
        if (d && pendImgs.length < MAXPHOTOS) { pendImgs.push(d); } else if (!d) { toast('A photo could not be used. Try a JPG or PNG.'); }
        renderPrevs();
        next(k + 1);
      });
    }
    next(0);
  }
  /* ---------- photo viewer with zoom ---------- */
  function lbShow() {
    var n = lbList.length, im = $('lbImg');
    im.src = lbList[lbIdx];
    im.alt = 'Photo ' + (lbIdx + 1) + ' of ' + n;
    $('lbCount').textContent = (lbIdx + 1) + ' / ' + n;
    $('lbPrev').style.display = n > 1 ? 'flex' : 'none';
    $('lbNext').style.display = n > 1 ? 'flex' : 'none';
    lbZoom(false);
  }
  function lbZoom(on) {
    var box = $('lbBox');
    box.className = 'lbbox' + (on ? ' zoomed' : '');
    box.scrollTop = 0; box.scrollLeft = 0;
    $('lbZoomBtn').innerHTML = on ? icon('zoomout', 18) + '<span class="lbl"> Zoom out</span>' : icon('zoomin', 18) + '<span class="lbl"> Zoom in</span>';
    $('lbZoomBtn').setAttribute('aria-label', on ? 'Zoom out' : 'Zoom in');
  }
  function lbOpen(list, idx) {
    if (!list || !list.length) { return; }
    lbList = list; lbIdx = idx >= 0 && idx < list.length ? idx : 0;
    $('lbBg').className = 'lb show';
    lbShow();
  }
  function lbClose() { $('lbBg').className = 'lb'; $('lbImg').removeAttribute('src'); }
  function lbStep(d) { if (lbList.length < 2) { return; } lbIdx = (lbIdx + d + lbList.length) % lbList.length; lbShow(); }
  function lbOpen_() { return $('lbBg').className.indexOf('show') > -1; }
  function gps() {
    if (!navigator.geolocation) { alert('Location is not available on this device.'); return; }
    $('rLoc').textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition(function (p) { setPending(p.coords.latitude, p.coords.longitude); if (map) { map.setView([p.coords.latitude, p.coords.longitude], 12); } },
      function () { $('rLoc').textContent = 'Could not get your location. Use Pick on map.'; }, { enableHighAccuracy: true, timeout: 15000 });
  }
  /* ---------- shared reports (Firebase) ---------- */
  function cloudOn() { return !!(window.CLOUD && window.CLOUD.on); }
  function codeOf(v) { return typeof v === 'string' && /^[0-9]{9,10}$/.test(v) ? v : ''; }
  function cloudBuild() {
    var out = [];
    each(cloudRaw, function (d) {
      var obs = [], imgs = [], jpegRe = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(d._id)) { return; }
      if (!TYPES.hasOwnProperty(d.type) || typeof d.lat !== 'number' || typeof d.lng !== 'number' || typeof d.time !== 'number' || !isFinite(d.lat) || !isFinite(d.lng) || !isFinite(d.time)) { return; }
      if (typeof d.sev !== 'number' || d.sev < 0 || d.sev > 3 || d.sev !== Math.floor(d.sev)) { return; }
      if (d.obs && d.obs.length) { each(d.obs.slice(0, 12), function (o) { if (o && o.k != null) { obs.push([String(o.k).substring(0, 80), String(o.v).substring(0, 200)]); } }); }
      if (d.imgs && d.imgs.length) { each(d.imgs.slice(0, MAXPHOTOS), function (s) { if (typeof s === 'string' && s.length < 230000 && jpegRe.test(s)) { imgs.push(s); } }); }
      if (!imgs.length && typeof d.img === 'string' && d.img.length < 400000 && jpegRe.test(d.img)) { imgs.push(d.img); }
      out.push({ id: 'c' + d._id, cid: d._id, cloud: true, mine: !!(CLOUD.uid && d.uid === CLOUD.uid), own: !!((CLOUD.admin && CLOUD.can(d.type)) || (CLOUD.uid && d.uid === CLOUD.uid && !CLOUD.media)), type: d.type, sev: d.sev, trust: d.verified === true ? 'verified' : 'unverified', srcLabel: d.verified === true ? 'Community report, verified by admin' : (typeof d.media === 'string' && d.media ? 'Media report' : 'Community report'), pending: d._pending === true, time: d.time, title: String(d.title || '').substring(0, 200), author: typeof d.author === 'string' ? d.author.substring(0, 40) : '', media: typeof d.media === 'string' ? d.media.substring(0, 60) : '', desc: String(d.desc || '').substring(0, 2000), place: String(d.place || '').substring(0, 200), lat: d.lat, lng: d.lng, img: imgs[0] || '', imgs: imgs, obsTitle: 'Observations', obs: obs, resolved: d.resolved === true, resAt: typeof d.resAt === 'number' ? d.resAt : 0, regCode: codeOf(d.regCode), provCode: codeOf(d.provCode), cityCode: codeOf(d.cityCode), brgyCode: codeOf(d.brgyCode) });
    });
    cloudItems = out;
  }
  function cloudRefresh() {
    cloudBuild(); refresh();
    if (viewing === 'review') { renderReview(); }
    if (viewing === 'settings' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { renderSettings(); }
    if ($('detailBg').className.indexOf('show') > -1 && detailId) { if (byId(detailId)) { openDetail(detailId); } else { $('detailBg').className = 'bg'; } }
  }
  function cloudFail(er) { toast(er && er.code === 'permission-denied' ? 'Not allowed. Posting is limited to one report per 2 minutes.' : 'Could not reach the server'); }
  function postFail(er) {
    var c = er && er.code ? er.code : '', msg;
    lastPostAt = 0; lsSet('datasaster_lastpost', 0);
    msg = c === 'permission-denied' ? 'The server rejected your report, so it was not posted.' : 'Could not post the report.';
    msg += '\n\nError: ' + (c || 'none') + (er && er.message ? ' - ' + er.message : '');
    if (CLOUD.diagnose) { CLOUD.diagnose(function (txt) { alert(msg + '\n\nChecks:\n' + txt + '\n\nSend this message to the developer.'); }); }
    else { alert(msg); }
  }
  function myCloud() { return cloudItems.filter(function (x) { return x.mine; }); }
  function flagsFor(cid) { return flagList.filter(function (f) { return f.reportId === cid; }); }
  function flagGroups() {
    var by = {}, out = [];
    each(flagList, function (f) { if (!by[f.reportId]) { by[f.reportId] = []; } by[f.reportId].push(f); });
    each(cloudItems, function (r) { if (by[r.cid]) { out.push({ r: r, list: by[r.cid] }); } });
    out.sort(function (a, b) { return b.list.length - a.list.length; });
    return out;
  }
  function getPos(cb) {
    if (!navigator.geolocation) { cb(false); return; }
    navigator.geolocation.getCurrentPosition(function (p) { userPos = { lat: p.coords.latitude, lng: p.coords.longitude }; cb(true); }, function () { cb(false); }, { timeout: 15000, maximumAge: 300000 });
  }
  function enableAlerts() {
    try { if (window.Notification && Notification.permission === 'default') { Notification.requestPermission(); } } catch (e) {}
    getPos(function (ok) { if (ok) { refresh(); } else { toast('Location is needed for alerts'); } });
  }
  function notify(msg) {
    toast(msg);
    try {
      if (window.Notification && Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) { navigator.serviceWorker.ready.then(function (reg) { reg.showNotification('DATAsaster', { body: msg, icon: 'icon-192.png', tag: 'datasaster-alert' }); }); }
        else { new Notification('DATAsaster', { body: msg, icon: 'icon-192.png' }); }
      }
    } catch (e) {}
  }
  function cloudAlerts(ids) {
    var n = 0, hit = null;
    if (!settings.alerts || !userPos) { return; }
    each(cloudItems, function (r) {
      if (ids.indexOf(r.cid) < 0 || r.mine || seenAlert[r.cid] || r.sev < 2 || r.time < Date.now() - 1800000) { return; }
      seenAlert[r.cid] = true;
      if (distKm(userPos.lat, userPos.lng, r.lat, r.lng) > settings.alertKm) { return; }
      n++; if (!hit) { hit = r; }
    });
    if (hit) { notify(n > 1 ? n + ' new serious reports near you' : SEV[hit.sev] + ' ' + TYPES[hit.type].label.toLowerCase() + ' near you: ' + hit.title); }
  }
  function tryHash() {
    var r;
    if (!pendingHash) { return; }
    r = byId(pendingHash);
    if (!r) { return; }
    pendingHash = '';
    range = 'all'; $('range').value = 'all'; $('day').hidden = true; statusF = 'all'; $('statusSel').value = 'all'; tf = 'all'; trF = 'all'; sevF = -1; $('sevSel').value = '-1'; query = ''; $('q').value = ''; nearKm = 0; $('nearSel').value = '0';
    select(r.id, true); openDetail(r.id);
  }
  function onCloudData(list, added) {
    var first = firstCloud;
    firstCloud = false;
    globalRaw = list; mergeRaw();
    cloudRefresh();
    if (!first && added && added.length) { cloudAlerts(added); }
    tryHash();
  }
  function onCloudAuth() {
    if (CLOUD.admin && !flagsOn) { flagsOn = true; CLOUD.watchFlags(function (l) { flagList = l; if (viewing === 'settings' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { renderSettings(); } if ($('detailBg').className.indexOf('show') > -1 && detailId && byId(detailId)) { openDetail(detailId); } }, function () { flagsOn = false; }); }
    if (!CLOUD.admin && flagsOn) { CLOUD.stopFlags(); flagsOn = false; flagList = []; }
    syncAdminUi(); cloudRefresh(); tryHash(); renderAdv();
  }
  function csvCell(v) { var q = String(v == null ? '' : v).replace(/\r?\n/g, ' '); if (/^[=+\-@\t]/.test(q)) { q = "'" + q; } return '"' + q.replace(/"/g, '""') + '"'; }
  function exportCsv() {
    var rows = [['id', 'posted_pht', 'type', 'severity', 'status', 'verified', 'title', 'place', 'latitude', 'longitude', 'description', 'observations', 'photo_count', 'flags']], lines = [], blob, a;
    each(cloudItems, function (r) {
      var o = [];
      each(r.obs, function (p) { o.push(p[0] + ': ' + p[1]); });
      rows.push([r.cid, fmtFull(r.time), TYPES[r.type].label, SEV[r.sev], r.resolved ? 'Resolved' : 'Active', r.trust === 'verified' ? 'Yes' : 'No', r.title, r.place, r.lat, r.lng, r.desc, o.join('; '), photosOf(r).length, flagsFor(r.cid).length]);
    });
    each(rows, function (row) { var c = []; each(row, function (x) { c.push(csvCell(x)); }); lines.push(c.join(',')); });
    blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'datasaster-reports-' + manilaDay(Date.now()) + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 500);
    toast('Exported ' + cloudItems.length + ' reports');
  }
  function initCloud() {
    if (!cloudOn()) { return; }
    $('rHint').textContent = 'Reports are shared with everyone who opens this app and shown as unverified.';
    CLOUD.start(onCloudData, onCloudAuth, function () { toast('Shared reports are unavailable right now'); });
    if (CLOUD.watchAdv) { CLOUD.watchAdv(function (l) { advAll = l; renderAdvList(); }); }
    if (CLOUD.watchAssess) {
      CLOUD.watchAssess(function (l) {
        var ae = document.activeElement;
        assessAll = l; refresh();
        if (viewing === 'review') { renderReview(); }
        if ($('detailBg').className.indexOf('show') > -1 && detailId && byId(detailId) && !(ae && /^(TEXTAREA|SELECT|INPUT)$/.test(ae.tagName) && $('detailBox').contains(ae))) { openDetail(detailId); }
      });
    }
  }

  function saveReport() {
    var t = $('rType').value, obs = [], title = $('rTitle').value.replace(/^\s+|\s+$/g, ''), it, e, o;
    if (pendLat === null) { alert('Please set a location first.'); return; }
    if (!title) { title = TYPES[t].label + (t === 'volcano' ? ' observation' : ' report'); }
    if (title.length > 120) { alert('The headline is too long. Please keep it under 120 characters.'); return; }
    if (pendLat < 3 || pendLat > 23 || pendLng < 114 || pendLng > 129) { alert('This location is outside the Philippines. Please pick a spot inside the Philippines.'); return; }
    if ($('rPlace').value.length > 200 || $('rDesc').value.length > 2000) { alert('The place name or details are too long.'); return; }
    var numOk = function (id, max) { var v = $(id).value, n; if (v === '') { return true; } n = parseFloat(v); return isFinite(n) && n >= 0 && n <= max; };
    if (t === 'flood' && !(numOk('rDepth', $('rUnit').value === 'm' ? 100 : 10000) && numOk('rFDur', 720))) { alert('Please check the water depth and the hours flooded. They must be numbers from 0 up, and realistic.'); return; }
    if (t === 'fire' && !numOk('rBurn', 720)) { alert('Please check how long the fire has been burning. It must be a number between 0 and 720 hours.'); return; }
    if (t === 'flood') {
      if ($('rDepth').value) { obs.push(['Water depth', $('rDepth').value + ' ' + $('rUnit').value]); }
      if ($('rFDur').value) { obs.push(['Flooded for', $('rFDur').value + ' hours']); }
      obs.push(['Road', $('rRoad').value]); obs.push(['Water', $('rWater').value]);
    }
    if (t === 'fire') { if ($('rBurn').value) { obs.push(['Burning for', $('rBurn').value + ' hours']); } if ($('rStruct').value) { obs.push(['Structures affected', $('rStruct').value]); } }
    if (t === 'quake') { e = getChecks('efx'); if (e.length) { obs.push(['Effects', e.join(', ')]); } }
    if (t === 'volcano') { obs.push(['Ashfall', $('rAsh').value]); o = getChecks('obs'); if (o.length) { obs.push(['Observed', o.join(', ')]); } }
    if (t === 'typhoon') { obs.push(['Wind', $('rWind').value]); obs.push(['Rain', $('rRain').value]); o = getChecks('tobs'); if (o.length) { obs.push(['Observed', o.join(', ')]); } }
    if (t === 'landslide') { obs.push(['Cause', $('rCause').value]); o = getChecks('lobs'); if (o.length) { obs.push(['Observed', o.join(', ')]); } }
    if ($('rEvac').value) { obs.push(['Evacuation', $('rEvac').value]); }
    if (photoBusy > 0) { alert('Your photos are still being prepared. Please try again in a moment.'); return; }
    it = { id: 'u' + Date.now(), own: true, type: t, sev: parseInt($('rSev').value, 10), trust: 'unverified', srcLabel: 'Community report', time: Date.now(), title: title, desc: $('rDesc').value || 'No further details given.', place: $('rPlace').value || (pendLat.toFixed(4) + ', ' + pendLng.toFixed(4)), lat: pendLat, lng: pendLng, img: pendImgs[0] || '', imgs: pendImgs.slice(0, MAXPHOTOS), obsTitle: 'Observations', obs: obs };
    stampArea(it);
    it.author = $('rAuthor').value.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/^\s+|\s+$/g, '').substring(0, 40);
    if (cloudOn() && CLOUD.uid) {
      if (Date.now() - lastPostAt < 120000) { alert('Please wait ' + Math.ceil((120000 - (Date.now() - lastPostAt)) / 1000) + ' seconds before posting another report.'); return; }
      it.id = 'c' + CLOUD.add(it, postFail);
      lastPostAt = Date.now(); lsSet('datasaster_lastpost', lastPostAt);
      closeReport();
      tf = 'all'; trF = 'all'; sevF = -1; statusF = 'active'; query = ''; $('q').value = ''; $('sevSel').value = '-1'; $('statusSel').value = 'active';
      selId = it.id; if (map) { map.setView([it.lat, it.lng], 10); }
      toast('Report shared');
      return;
    }
    if (cloudOn()) { toast('Not connected yet, saved on this device only'); }
    userItems.unshift(it);
    if (!lsSet('datasaster_reports', userItems)) {
      it.img = ''; it.imgs = [];
      if (!lsSet('datasaster_reports', userItems)) { userItems.shift(); alert('Could not save. Storage is full.'); return; }
      alert('Saved without the photos (storage is almost full).');
    }
    closeReport();
    tf = 'all'; trF = 'all'; sevF = -1; statusF = 'active'; query = ''; $('q').value = ''; $('sevSel').value = '-1'; $('statusSel').value = 'active';
    selId = it.id; refresh();
    if (map) { map.setView([it.lat, it.lng], 10); }
    toast('Report added');
  }
  function toggleResolved(id) {
    var c = cloudById(id);
    if (c) { CLOUD.setResolved(c.cid, !c.resolved, cloudFail, !!(CLOUD.admin && !c.mine)); toast(c.resolved ? 'Reopened' : 'Marked as resolved'); return; }
    each(userItems, function (u) { if (u.id === id) { u.resolved = !u.resolved; u.resAt = u.resolved ? Date.now() : 0; toast(u.resolved ? 'Marked as resolved' : 'Reopened'); } });
    lsSet('datasaster_reports', userItems);
    refresh(); openDetail(id);
  }
  function cloudById(id) { var i; for (i = 0; i < cloudItems.length; i++) { if (cloudItems[i].id === id && cloudItems[i].own) { return cloudItems[i]; } } return null; }
  function deleteReport(id) {
    var keep = [], c = cloudById(id);
    var any = byId(id);
    if (any && any.cloud && !c) { return; }
    if (c && !c.mine && !CLOUD.owner) { return; }
    if (!window.confirm('Delete this report?')) { return; }
    if (c) { CLOUD.remove(c.cid, cloudFail, !!(CLOUD.owner && !c.mine)); if (CLOUD.owner && !c.mine) { CLOUD.dismissFlags(c.cid, cloudFail); } $('detailBg').className = 'bg'; if (selId === id) { selId = null; } toast('Report deleted'); return; }
    each(userItems, function (x) { if (x.id !== id) { keep.push(x); } });
    userItems = keep; lsSet('datasaster_reports', userItems);
    $('detailBg').className = 'bg'; if (selId === id) { selId = null; }
    refresh(); toast('Report deleted');
  }
  var auditList = null, auditBusy = false;
  /* Agency assessments shown in a report's details. Separate from the community report itself. */
  function assessHtml(r) {
    var al = assessFor(r.cid), h = '', mine = null, o = '';
    h += '<h3>Agency assessments</h3>';
    if (!al.length) { h += '<div class="m">No agency has assessed this report yet.</div>'; }
    each(al, function (a) {
      var ms = a.time && a.time.toMillis ? a.time.toMillis() : 0;
      if (CLOUD.agency && a.agency === CLOUD.agency) { mine = a; }
      h += '<div class="trow"><div><b>' + esc(a.agency) + ': ' + ASTAT[a.status] + '</b><small>' + (ms ? fmtFull(ms) : 'saving') + (a.note ? ' \u00b7 ' + esc(a.note) : '') + '</small></div></div>';
    });
    h += '<div class="m">An assessment is the agency\'s view and is kept apart from the community report. "Not corroborated" does not mean the report is false.</div>';
    if (CLOUD.role === 'agency' && CLOUD.agency && CLOUD.agency.indexOf('/') < 0 && CLOUD.can(r.type)) {
      each(ASORDER, function (k) { o += '<option value="' + k + '"' + (mine && mine.status === k ? ' selected' : '') + '>' + ASTAT[k] + '</option>'; });
      h += '<label class="l" for="asStatus">Your assessment (' + esc(CLOUD.agency) + ')</label><select id="asStatus">' + o + '</select>';
      h += '<label class="l" for="asNote">Public note (optional, up to 500 characters)</label><textarea id="asNote" maxlength="500">' + esc(mine ? mine.note : '') + '</textarea>';
      h += '<div class="acts"><button class="btn primary" data-assess="' + r.id + '">Save assessment</button></div>';
    }
    return h;
  }
  function agencyNote() {
    var t = [];
    each(CLOUD.types, function (k) { t.push(TSHORT[k] || k); });
    return 'Agency account' + (CLOUD.agency ? ': ' + esc(CLOUD.agency) : '') + '. You can verify and resolve reports of: ' + (t.length ? esc(t.join(', ')) : 'no hazard types yet') + '. You cannot delete reports.';
  }
  function auditHtml() {
    var h = '<div class="trow"><div><b>Audit log</b><small>The last 50 admin and agency actions. Only you can read it.</small></div><button class="btn sm" data-auditload="1">' + (auditBusy ? 'Loading...' : (auditList ? 'Refresh' : 'Load')) + '</button></div>';
    if (auditList && !auditList.length) { h += '<div class="trow"><div><small>No actions logged yet.</small></div></div>'; }
    each(auditList || [], function (a) {
      var ms = a.time && a.time.toMillis ? a.time.toMillis() : 0;
      h += '<div class="trow"><div><b>' + esc(a.action) + ' &middot; ' + esc(a.agency) + '</b><small>' + (ms ? fmtFull(ms) : 'pending') + ' &middot; ' + esc(a.targetType || 'report') + ' ' + esc(a.targetId) + (a.note ? ' &middot; ' + esc(a.note) : '') + '</small></div></div>';
    });
    return h;
  }
  /* Official advisories: posted by agency accounts, shown to everyone in their own section. */
  var advAll = [], advForm = null;
  var ADV_HOURS = [[6, '6 hours'], [12, '12 hours'], [24, '1 day'], [48, '2 days'], [72, '3 days'], [168, '7 days'], [336, '14 days']];
  function canAdv() { return !!(cloudOn() && CLOUD.role === 'agency' && CLOUD.agency && CLOUD.agency.indexOf('/') < 0 && CLOUD.types.length); }
  function advActive(a) { return a.status === 'published' && a.expiresAt > Date.now(); }
  function advById(id) { var f = null; each(advAll, function (a) { if (a._id === id) { f = a; } }); return f; }
  function advCard(a) {
    var st = a.status === 'withdrawn' ? 'Withdrawn' : (a.expiresAt > Date.now() ? 'Active' : 'Expired'), ms = a.time && a.time.toMillis ? a.time.toMillis() : 0, h = '';
    h += '<div class="adv' + (st === 'Active' ? '' : ' old') + '"><div class="advh"><span class="advbadge">OFFICIAL</span><b>' + esc(a.agency) + '</b><span class="m">' + esc(TSHORT[a.hazard] || a.hazard) + ' \u00b7 ' + st + '</span></div>';
    h += '<h3>' + esc(a.title) + '</h3>';
    h += '<div class="m">' + (a.areas ? 'Areas: ' + esc(a.areas) + ' \u00b7 ' : '') + 'Valid until ' + fmtFull(a.expiresAt) + ' \u00b7 Revision ' + esc(a.rev) + (ms ? ' \u00b7 Updated ' + fmtFull(ms) : '') + '</div>';
    h += '<p>' + esc(a.desc) + '</p>';
    h += '<div class="m">' + (/^https:\/\//.test(a.sourceUrl) ? '<a href="' + esc(a.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Original source</a>' : 'No valid source link') + (a.refNo ? ' \u00b7 Ref. ' + esc(a.refNo) : '') + '</div>';
    if (a.status === 'published' && ((canAdv() && a.agency === CLOUD.agency) || (cloudOn() && CLOUD.owner))) {
      h += '<div class="acts">' + (canAdv() && a.agency === CLOUD.agency ? '<button class="btn sm" data-advedit="' + a._id + '">Edit (new revision)</button>' : '') + '<button class="btn sm danger" data-advwd="' + a._id + '">Withdraw</button></div>';
    }
    return h + '</div>';
  }
  function renderAdvList() {
    var el = $('advList'), act = [], old = [], h = '';
    if (!el) { return; }
    each(advAll, function (a) { if (advActive(a)) { act.push(a); } else { old.push(a); } });
    each(act, function (a) { h += advCard(a); });
    if (!act.length) { h += '<div class="empty">' + (cloudOn() ? 'No active official advisories right now.' : 'Official advisories need the shared connection, which is not available.') + '</div>'; }
    if (old.length && settings.showOldAdv) { h += '<div class="advold"><div class="m">Expired and withdrawn (' + old.length + ')</div>'; each(old, function (a) { h += advCard(a); }); h += '</div>'; }
    el.innerHTML = h;
    var osw = $('advOldSw');
    if (osw) { osw.className = 'sw' + (settings.showOldAdv ? ' on' : ''); osw.setAttribute('aria-pressed', settings.showOldAdv ? 'true' : 'false'); }
    if ($('advOldCnt')) { $('advOldCnt').textContent = old.length ? ' (' + old.length + ')' : ''; }
    if ($('advCount')) { $('advCount').textContent = act.length; }
  }
  function renderAdvForm() {
    var el = $('advForm'), v, o = '', h;
    if (!el) { return; }
    if (!advForm || !canAdv()) { el.innerHTML = ''; return; }
    v = advForm.v || {};
    h = '<label class="l" for="avHaz">Hazard</label><select id="avHaz">';
    each(CLOUD.types, function (k) { if (TSHORT[k]) { h += '<option value="' + k + '"' + (v.hazard === k ? ' selected' : '') + '>' + TSHORT[k] + '</option>'; } });
    h += '</select><label class="l" for="avTitle">Title</label><input type="text" id="avTitle" maxlength="120" value="' + esc(v.title || '') + '">';
    h += '<label class="l" for="avAreas">Affected areas</label><input type="text" id="avAreas" maxlength="200" value="' + esc(v.areas || '') + '" placeholder="Provinces or cities">';
    h += '<label class="l" for="avDesc">Advisory text</label><textarea id="avDesc" maxlength="1500">' + esc(v.desc || '') + '</textarea>';
    h += '<label class="l" for="avUrl">Original source link (https, required)</label><input type="url" id="avUrl" maxlength="300" value="' + esc(v.sourceUrl || '') + '" placeholder="https://">';
    h += '<label class="l" for="avRef">Official reference or bulletin number (optional)</label><input type="text" id="avRef" maxlength="40" value="' + esc(v.refNo || '') + '">';
    each(ADV_HOURS, function (x) { o += '<option value="' + x[0] + '"' + (x[0] === 24 ? ' selected' : '') + '>' + x[1] + '</option>'; });
    h += '<label class="l" for="avHrs">Valid for (from now)</label><select id="avHrs">' + o + '</select>';
    h += '<div class="hint">' + (advForm.id ? 'Saving creates a new revision. The earlier text is kept in the history.' : 'Publish only information your agency has issued. It appears publicly under ' + esc(CLOUD.agency) + '.') + '</div>';
    h += '<div class="acts" style="margin-top:10px"><button class="btn primary" data-advsave="1">' + (advForm.id ? 'Save revision' : 'Publish advisory') + '</button><button class="btn" data-advcancel="1">Cancel</button></div>';
    el.innerHTML = h;
  }
  function renderAdv() { var b = $('advNew'); if (b) { b.hidden = !(canAdv() && !advForm); } renderAdvForm(); renderAdvList(); }
  /* Short privacy notice. We use no ad or marketing cookies; this tells people what is stored on their device. Not a consent gate. */
  function initNotice() {
    var seen = false, d;
    try { seen = window.localStorage.getItem('datasaster_notice') === '1'; } catch (e) { seen = false; }
    if (seen || $('noticeBar') || tourOpen()) { return; }
    d = document.createElement('div'); d.id = 'noticeBar'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Privacy notice');
    d.innerHTML = '<span>DATAsaster saves your settings, reports you post from this device and a random sign-in ID in your browser so the app works. No ads. <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a></span><button class="btn sm primary" id="noticeOk" type="button">OK</button>';
    document.body.appendChild(d);
    $('noticeOk').addEventListener('click', function () { try { window.localStorage.setItem('datasaster_notice', '1'); } catch (e) {} if (d.parentNode) { d.parentNode.removeChild(d); } });
  }
  /* ---------- First-time guide: a short step-by-step walkthrough. Shown once per browser; reopen from Settings > About or the Help tab. ---------- */
  var TOUR_KEY = 'datasaster_tour', tourDlg = null, tourStep = 0, tourLast = null;
  function isPhone() { return window.matchMedia ? window.matchMedia('(max-width:900px)').matches : window.innerWidth <= 900; }
  function tourOpen() { return !!(tourDlg && !tourDlg.hidden); }
  function tourSteps() {
    var L = window.PLACES && PLACES.get(), ph = isPhone();
    return [
      { ic: 'info', t: 'Welcome to DATAsaster', b: '<p>See floods, fires, earthquakes, volcanoes, typhoons and landslides in the Philippines on one map, with community reports and official advisories.</p><p>This guide takes about a minute. You can skip it and open it again later from Settings.</p><div class="safe"><b>Not an official warning channel.</b> In an emergency, call 911 or your local hotline first.</div>' },
      { ic: 'pin', t: 'Choose your area', b: '<p>Pick your region, province and city so reports and announcements near you come first.</p><p>Then choose how wide to look: <b>This city only</b>, <b>+ province</b> or <b>+ region</b>. Choose <b>Nationwide</b> to see everything.</p>'
          + (L ? '<div class="tdone">' + icon('check', 15) + ' Your area: <b>' + esc(PLACES.label(L)) + '</b> (' + (locOn() ? SCOPE_TXT[PLACES.scope()] : 'Nationwide view') + ')</div>' : '')
          + '<button type="button" class="btn ' + (L ? '' : 'primary ') + 'tact" id="tourLoc">' + icon('pin', 15) + (L ? ' Change my area' : ' Choose my area') + '</button>'
          + '<p class="m">You can change it any time with the ' + icon('pin', 13) + ' button at the top, or in Settings &gt; Your area.</p>', loc: true },
      { ic: ph ? 'list' : 'layers', t: 'Find your way around', b: ph
          ? '<p>Use the tabs at the bottom of the screen:</p><ul class="tlist"><li>' + icon('pin', 15) + '<span><b>Map</b>: incidents as markers. Pinch to zoom.</span></li><li>' + icon('list', 15) + '<span><b>Feed</b>: the same incidents as a list.</span></li><li>' + icon('news', 15) + '<span><b>News</b>: official advisories and headlines.</span></li><li>' + icon('phone', 15) + '<span><b>Help</b>: emergency hotlines. Tap a number to call.</span></li></ul>'
          : '<ul class="tlist"><li>' + icon('list', 15) + '<span><b>Feed</b> on the left: every incident as a list.</span></li><li>' + icon('pin', 15) + '<span><b>Map</b> on the right: the same incidents as markers.</span></li><li>' + icon('news', 15) + '<span>Scroll down for <b>official advisories</b>, <b>headlines</b> and <b>emergency hotlines</b>.</span></li></ul>' },
      { ic: 'sliders', t: 'Filter what you see', b: '<ul class="tlist"><li>' + icon('drop', 15) + '<span>Tap a category such as <b>General</b>, <b>Flooding</b> or <b>Fire</b> to show one kind of hazard.</span></li><li>' + icon('refresh', 15) + '<span>Use the date menu beside the categories to look back as far as 30 days.</span></li><li>' + icon('search', 15) + '<span>In the feed, search by place, or tap <b>Filters</b> for distance, status and severity.</span></li></ul>' },
      { ic: 'alert', t: 'Read a report', b: '<p>Tap a marker or a row to open the details: photos, severity, place and time.</p><p>Community reports are <b>unverified</b> until a partner or agency checks them. Look for the verified and agency tags before you act on a report.</p>' },
      { ic: 'plus', t: 'Report an incident', b: '<p>Tap <b>' + icon('plus', 13) + ' Report</b> at the top. Choose the type and severity, set the location on the map or with your GPS, and add up to 3 photos.</p><div class="safe"><b>Stay safe.</b> Never go near floodwater, fire or unstable ground for a photo. Do not include faces, number plates or home addresses.</div>' },
      { ic: 'sliders', t: 'Alerts and settings', b: '<p>Open <b>' + icon('sliders', 13) + ' Settings</b> to:</p><ul class="tlist"><li>' + icon('alert', 15) + '<span>turn on <b>alerts</b> for serious reports near you,</span></li><li>' + icon('moon', 15) + '<span>switch between dark and light,</span></li><li>' + icon('layers', 15) + '<span>choose categories and sources.</span></li></ul><p class="m">To see this guide again, go to Settings &gt; About' + (ph ? ' or the Help tab' : '') + '.</p>' }
    ];
  }
  function drawTour() {
    var S = tourSteps(), s, i, dots = '';
    if (!tourDlg) { return; }
    if (tourStep >= S.length) { tourStep = S.length - 1; }
    s = S[tourStep];
    for (i = 0; i < S.length; i++) { dots += '<span class="' + (i === tourStep ? 'on' : (i < tourStep ? 'past' : '')) + '"></span>'; }
    tourDlg.querySelector('.box').innerHTML = '<button type="button" class="btn x" id="tourX" aria-label="Close guide">&times;</button>'
      + '<div class="tstep"><span class="tic">' + icon(s.ic, 22) + '</span><small class="k">Step ' + (tourStep + 1) + ' of ' + S.length + '</small></div>'
      + '<h2 id="tourH">' + s.t + '</h2><div class="tbody" id="tourD">' + s.b + '</div>'
      + '<div class="tdots" aria-hidden="true">' + dots + '</div>'
      + '<div class="tnav">' + (tourStep < S.length - 1 ? '<button type="button" class="btn tskip" id="tourSkip">Skip guide</button>' : '<span></span>')
      + '<span class="sp"></span>' + (tourStep > 0 ? '<button type="button" class="btn" id="tourBack">' + icon('left', 15) + ' Back</button>' : '')
      + '<button type="button" class="btn primary" id="tourNext">' + (tourStep < S.length - 1 ? 'Next ' + icon('right', 15) : 'Start using DATAsaster') + '</button></div>';
  }
  function closeTour() {
    if (!tourDlg) { return; }
    tourDlg.hidden = true; lsSet(TOUR_KEY, '1');
    document.removeEventListener('keydown', tourKey, true);
    if (tourLast && tourLast.focus) { try { tourLast.focus(); } catch (e) {} }
    initNotice();
  }
  function tourGo(i) { tourStep = i; drawTour(); var nb = $('tourNext'); if (nb) { nb.focus(); } }
  function tourKey(e) {
    if (!tourOpen() || (locDlg && !locDlg.hidden)) { return; }
    if (e.key === 'Escape' || e.keyCode === 27) { e.stopPropagation(); closeTour(); return; }
    if (e.key === 'Tab' || e.keyCode === 9) {
      var f = tourDlg.querySelectorAll('button'), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }
  function openTour(i) {
    if (!tourDlg) {
      tourDlg = document.createElement('div'); tourDlg.className = 'pmodal tour'; tourDlg.id = 'tourModal'; tourDlg.hidden = true;
      tourDlg.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="tourH" aria-describedby="tourD"></div>';
      document.body.appendChild(tourDlg);
      tourDlg.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('button') : null, n = tourSteps().length;
        e.stopPropagation();
        if (!t) { return; }
        if (t.id === 'tourX' || t.id === 'tourSkip') { closeTour(); }
        else if (t.id === 'tourBack') { tourGo(Math.max(0, tourStep - 1)); }
        else if (t.id === 'tourNext') { if (tourStep >= n - 1) { closeTour(); } else { tourGo(tourStep + 1); } }
        else if (t.id === 'tourLoc') { tourDlg.hidden = true; locAfter = function () { tourDlg.hidden = false; drawTour(); var nb = $('tourNext'); if (nb) { nb.focus(); } }; openLoc(); }
      });
    }
    var nb0 = $('noticeBar'); if (nb0 && nb0.parentNode) { nb0.parentNode.removeChild(nb0); }
    var pm = $('partnerModal'); if (pm) { pm.hidden = true; }
    tourLast = document.activeElement; tourStep = i || 0;
    drawTour(); tourDlg.hidden = false;
    document.addEventListener('keydown', tourKey, true);
    $('tourNext').focus();
  }
  function maybeTour() {
    if (lsGet(TOUR_KEY) === '1' || window.location.hash) { return; }
    openTour(0);
  }
  var toastT = null;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.className = 'toast show'; if (toastT) { clearTimeout(toastT); } toastT = setTimeout(function () { t.className = 'toast'; }, 2200); }

  /* ---------- settings ---------- */
  var viewing = 'dash';
  function trow(key, label, desc, on) { return '<div class="trow"><div><b>' + label + '</b>' + (desc ? '<small>' + desc + '</small>' : '') + '</div><button class="sw' + (on ? ' on' : '') + '" data-tog="' + key + '" aria-label="' + label + '"></button></div>'; }
  function tile(attr, val, ic, label, sub, on) { return '<button class="opt' + (on ? ' on' : '') + '" ' + attr + '="' + val + '">' + icon(ic, 18) + '<span><b>' + label + '</b><small>' + sub + '</small></span></button>'; }
  function sect(ic, title, sub, body) { return '<section class="sc"><h3><span class="bx">' + icon(ic, 16) + '</span><span>' + title + '<small>' + sub + '</small></span></h3>' + body + '</section>'; }
  /* ---------- Settings: sidebar, search, per-section reset, save indicator ---------- */
  var svPanel = 'area', svQuery = '', svSaveT = null;
  var RESETS = {
    appearance: ['theme', 'basemap', 'region'],
    feed: ['cats', 'sources', 'demo', 'showUnverified', 'showPhotos', 'showOldAdv', 'liveQuakes', 'minMag', 'liveNews', 'refresh'],
    alerts: ['alerts', 'alertKm']
  };
  function tip(t) { return ' <span class="tip" tabindex="0" role="note" title="' + esc(t) + '" aria-label="' + esc(t) + '">?</span>'; }
  function selRow(label, desc, key, opts, cur, off, tipText) {
    var h = '<div class="trow"><div><b>' + label + (tipText ? tip(tipText) : '') + '</b>' + (desc ? '<small>' + desc + '</small>' : '') + '</div><select class="ssel" data-sel="' + key + '"' + (off ? ' disabled' : '') + ' aria-label="' + label + '">';
    each(opts, function (o) { h += '<option value="' + o[0] + '"' + (String(cur) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; });
    return h + '</select></div>';
  }
  function mkRow(label, desc, kw, html, block) {
    var h = block ? '<div class="svrow"><div class="svrl"><b>' + esc(label) + '</b>' + (desc ? '<small>' + esc(desc) + '</small>' : '') + '</div>' + html + '</div>' : html;
    return { t: label, d: desc || '', kw: kw || '', h: h };
  }
  function linkRow(label, desc, href, kw) {
    return mkRow(label, desc, kw, '<div class="trow"><div><b>' + esc(label) + '</b>' + (desc ? '<small>' + esc(desc) + '</small>' : '') + '</div><a class="btn sm" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">Open</a></div>', false);
  }
  function acctRoleText() {
    if (CLOUD.owner) { return 'Owner: you can verify, resolve and delete any shared report.'; }
    if (CLOUD.role === 'agency') { return agencyNote(); }
    if (CLOUD.media) { return 'Media account' + (CLOUD.outlet ? ': ' + esc(CLOUD.outlet) : '') + '. Your reports are shown under your outlet name. You can add reports. You cannot resolve or delete anything.'; }
    return 'Signed in, but this account has no extra permissions.';
  }
  function areaPanel() {
    var r = [], L = window.PLACES && PLACES.get(), on = locOn(), sc = window.PLACES ? PLACES.scope() : 'prov', b;
    if (!window.PLACES) { return null; }
    b = '<div class="trow"><div><b>' + (L ? esc(PLACES.label(L)) : 'No area chosen') + '</b><small>' + (L ? (on ? 'Reports and announcements for this area come first.' : 'Saved, but you are viewing the whole country.') : 'You are seeing reports from all over the Philippines.') + '</small></div><button type="button" class="btn sm' + (L ? '' : ' primary') + '" data-locopen="1">' + (L ? 'Change area' : 'Choose area') + '</button></div>';
    r.push(mkRow('Your area', 'Region, province, city and barangay.', 'location place city province region barangay area', b, false));
    b = '<div class="opts">'
      + tile('data-locsc', 'city', 'pin', 'This city only', 'Your city or municipality', L && on && sc === 'city')
      + tile('data-locsc', 'prov', 'layers', '+ province', 'Your city and the rest of its province', L && on && sc === 'prov')
      + tile('data-locsc', 'reg', 'radar', '+ region', 'The whole region around you', L && on && sc === 'reg')
      + tile('data-locsc', 'nat', 'nav', 'Nationwide', 'Every report in the Philippines', !L || !on)
      + '</div>' + (L ? '' : '<div class="hint">Choose an area first to use the first three options.</div>');
    r.push(mkRow('Show reports from', 'How wide an area the map, feed and announcements cover.', 'scope nationwide province region city only radius wide', b, true));
    if (L && on && orgCovers() === 'no') { r.push(mkRow('Partner coverage', '', 'partner lgu office coverage', '<div class="trow"><div><b>No partner office yet</b><small>No partner office covers this area yet. Reports here are public and unverified.</small></div></div>', false)); }
    return { id: 'area', label: 'Your area', ic: 'pin', desc: 'Choose your area and how wide to look. The choice stays on this device.', rows: r, reset: false };
  }
  function partnerPanel() {
    var r = [];
    r.push(mkRow('Run your area’s disaster dashboard', 'For LGUs, barangays, HOAs and response teams.', 'partner partnership lgu barangay hoa response team dashboard apply', '<div class="svpartner"><small>For LGUs, barangays, HOAs and response teams</small><b>Run your area’s disaster dashboard on DATAsaster</b><p>Review community reports and publish announcements to residents in your area. Applications are reviewed by the DATAsaster team.</p><div class="acts"><a class="btn" href="partner.html">Learn about partnership</a><a class="btn primary" href="apply.html">Apply for partnership</a></div></div>', false));
    r.push(linkRow('Partner organization console', 'Already approved? Sign in to your organization’s console.', 'console.html', 'console sign in partner organization'));
    return { id: 'partner', label: 'Partnership', ic: 'users', desc: 'For local governments, barangays, HOAs and response teams.', rows: r, reset: false };
  }
  function svPanels() {
    var s = settings, P = [], r, b, fg, ap = areaPanel();
    if (ap) { P.push(ap); }
    /* Appearance and map */
    r = [];
    r.push(mkRow('Theme', 'Dark for low light, light for daytime.', 'dark light colours mode', '<div class="opts">' + tile('data-theme-set', 'dark', 'moon', 'Dark', 'Low-light console', s.theme === 'dark') + tile('data-theme-set', 'light', 'sun', 'Light', 'Daylight contrast', s.theme === 'light') + '</div>', true));
    r.push(mkRow('Basemap', 'The map style behind the markers.', 'map tiles street dark light', '<div class="opts">' + tile('data-base', 'dark', 'moon', 'Dark', 'Low-glare basemap', s.basemap === 'dark') + tile('data-base', 'street', 'pin', 'Street', 'Roads and labels', s.basemap === 'street') + tile('data-base', 'light', 'sun', 'Light', 'Pale basemap', s.basemap === 'light') + '</div>', true));
    b = []; each(['ph', 'luzon', 'visayas', 'mindanao', 'ncr'], function (k) { b.push([k, REGION_NAMES[k]]); });
    r.push(mkRow('Opening view', 'Where the map zooms to.', 'region luzon visayas mindanao manila', selRow('Opening view', 'Where the map zooms to.', 'region', b, s.region), false));
    P.push({ id: 'appearance', label: 'Appearance & map', ic: 'moon', desc: 'Theme, basemap and where the map opens.', rows: r, reset: true });
    /* Feed and data */
    r = [];
    b = '<div class="catchips">'; each(TORDER, function (t) { b += '<button class="cat' + (s.cats[t] ? ' on' : '') + '" data-tog="cat:' + t + '">' + icon(TYPES[t].ic, 15) + ' ' + TYPES[t].label + '</button>'; }); b += '</div><div class="hint">At least one category stays on.</div>';
    r.push(mkRow('Categories', 'What appears in the feed and on the map.', 'hazard flood fire earthquake volcano typhoon landslide', b, true));
    b = '<div class="srcgrid">'; each(SRC_KEYS, function (k) { b += '<div class="srci"><span>' + SRC[k].name + '</span><button class="sw' + (s.sources[k] !== false ? ' on' : '') + '" data-tog="src:' + k + '" aria-label="' + SRC[k].name + '"></button></div>'; }); b += '</div>';
    r.push(mkRow('Sources', 'Agencies and news outlets to include.', 'pagasa phivolcs ndrrmc bfp usgs emsc news outlets abs gma rappler inquirer philstar', b, true));
    r.push(mkRow('Sample records', 'Labelled demonstration incidents.', 'demo fake test', trow('demo', 'Sample records', 'Labelled demonstration incidents.', s.demo), false));
    r.push(mkRow('Unverified reports', 'Community reports without review.', 'community unverified', trow('showUnverified', 'Unverified reports', 'Community reports without review.', s.showUnverified), false));
    r.push(mkRow('Photos', 'Thumbnails in the feed and details.', 'images pictures', trow('showPhotos', 'Photos', 'Thumbnails in the feed and details.', s.showPhotos), false));
    r.push(mkRow('Expired and withdrawn advisories', 'Also list advisories that are no longer current.', 'official agency advisory history', trow('showOldAdv', 'Expired and withdrawn advisories', 'Also list advisories that are no longer current, under the active ones.', s.showOldAdv), false));
    r.push(mkRow('Live earthquakes', 'USGS and EMSC, updated every minute while the app is open.', 'quake usgs emsc', trow('liveQuakes', 'Live earthquakes', 'USGS and EMSC, updated every minute while the app is open.', s.liveQuakes), false));
    b = []; each([2.5, 3, 4, 4.5, 5], function (mg) { b.push([mg, 'M' + mg.toFixed(1) + ' and above']); });
    r.push(mkRow('Smallest earthquake', 'Hide weaker earthquakes from the live feeds.', 'magnitude quake', selRow('Smallest earthquake', s.liveQuakes ? 'Hide weaker earthquakes from the live feeds.' : 'Turn on Live earthquakes to use this.', 'minmag', b, s.minMag, !s.liveQuakes, 'A lower number shows more, weaker earthquakes. Most below M3.0 are not felt.'), false));
    r.push(mkRow('Live headlines', 'Google News, from the selected outlets.', 'news', trow('liveNews', 'Live headlines', 'Google News, from the selected outlets.', s.liveNews), false));
    r.push(mkRow('Auto refresh', 'Reload earthquakes, headlines and live layers on a timer.', 'update reload timer data', selRow('Auto refresh', 'Reload earthquakes, headlines and live layers on a timer while the app is open.', 'refresh', [['0', 'Off'], ['5', 'Every 5 minutes'], ['15', 'Every 15 minutes']], s.refresh, false, 'Uses mobile data each time it reloads.'), false));
    r.push(mkRow('Install app', 'Add DATAsaster to your home screen.', 'pwa home screen offline', '<div class="trow"><div><b>Install app</b><small>' + (deferredPrompt ? 'Add DATAsaster to your home screen.' : 'iPhone: Share, then Add to Home Screen. Android or desktop: use Install in the browser menu.') + '</small></div>' + (deferredPrompt ? '<button class="btn sm" data-install="1">Install</button>' : '') + '</div>', false));
    P.push({ id: 'feed', label: 'Feed & data', ic: 'layers', desc: 'What is shown, which sources are used and how often data reloads.', rows: r, reset: true });
    /* Alerts */
    r = [];
    r.push(mkRow('Alerts', 'Notice while the app is open for new High or Critical shared reports near you and earthquakes M4.5 or stronger.', 'notification location nearby', trow('alerts', 'Alerts', 'Notice and notification while the app is open: new High or Critical shared reports near you, and new earthquakes M4.5 or stronger. Needs location permission.', s.alerts), false));
    r.push(mkRow('Alert distance', 'How close a report must be.', 'km radius', selRow('Alert distance', s.alerts ? 'How close a report must be to alert you.' : 'Turn on Alerts to use this.', 'alertkm', [[10, 'Within 10 km'], [25, 'Within 25 km'], [50, 'Within 50 km'], [100, 'Within 100 km']], s.alertKm, !s.alerts, 'Distance is measured from your device location.'), false));
    P.push({ id: 'alerts', label: 'Alerts', ic: 'alert', desc: 'Heads-up for serious reports and earthquakes. Works only while the app is open.', rows: r, reset: true });
    /* Account */
    r = [];
    if (!cloudOn()) {
      r.push(mkRow('Accounts', '', 'sign in', '<div class="empty">Accounts are not available because the shared connection is off.</div>', false));
    } else if (CLOUD.email) {
      r.push(mkRow('Signed in', 'Your account', 'email sign out logout', '<div class="trow"><div><b>' + esc(CLOUD.email) + '</b><small>' + acctRoleText() + '</small></div><button class="btn sm" data-adminout="1">Sign out</button></div>', false));
      r.push(mkRow('Change password', 'Use at least 8 characters.', 'password security', '<form class="svpw" id="cpForm" novalidate><input type="text" name="username" autocomplete="username" value="' + esc(CLOUD.email) + '" readonly hidden tabindex="-1" aria-hidden="true"><label class="l" for="cpOld">Current password</label><input type="password" id="cpOld" autocomplete="current-password"><label class="l" for="cpNew">New password</label><input type="password" id="cpNew" autocomplete="new-password" minlength="8"><label class="l" for="cpNew2">Repeat new password</label><input type="password" id="cpNew2" autocomplete="new-password" minlength="8"><div class="acts"><button class="btn primary" type="submit" data-chgpw="1" id="cpBtn">Change password</button></div><div class="cpmsg" id="cpMsg" role="status" aria-live="polite"></div></form>', true));
    } else {
      r.push(mkRow('Sign in', 'For moderators, agencies and media accounts created by the DATAsaster team. Everyone else is signed in automatically and needs nothing here.', 'login admin agency media', '<form class="svpw" id="adForm" novalidate><label class="l" for="adEmail">Email</label><input type="email" id="adEmail" name="email" autocomplete="username" autocapitalize="off" spellcheck="false" inputmode="email"><label class="l" for="adPw">Password</label><input type="password" id="adPw" autocomplete="current-password"><div class="acts"><button class="btn primary" type="submit" data-adminlogin="1">Sign in</button></div></form>', true));
    }
    r.push(linkRow('Partner organization console', 'For approved LGUs, barangays, HOAs and response teams.', 'console.html', 'lgu console partner organization'));
    P.push({ id: 'account', label: 'Account', ic: 'user', desc: 'Sign in, sign out and change your password.', rows: r, reset: false });
    /* Admin tools */
    if (CLOUD.admin) {
      r = []; fg = flagGroups();
      r.push(mkRow('Review reports', 'Open the list of reports you can assess, verify or resolve.', 'review queue', '<div class="trow"><div><b>Review reports</b><small>Open the list of reports you can assess, verify or resolve.</small></div><button class="btn sm" data-view="review">Open</button></div>', false));
      if (CLOUD.owner) { r.push(mkRow('Audit log', 'The last 50 admin and agency actions.', 'history actions', auditHtml(), false)); }
      r.push(mkRow('Export reports', 'Downloads the latest 200 shared reports as a CSV file.', 'csv download', '<div class="trow"><div><b>Export reports</b><small>Downloads the latest 200 shared reports as a CSV file.</small></div><button class="btn sm" data-export="1">Export CSV</button></div>', false));
      b = '<div class="trow"><div><b>Flagged reports (' + fg.length + ')</b><small>Reports that visitors marked as fake or wrong.</small></div></div>';
      if (!fg.length) { b += '<div class="empty" style="padding:14px">Nothing is flagged right now.</div>'; }
      each(fg, function (g) { b += '<div class="trow"><div><b>' + esc(g.r.title) + '</b><small>' + g.list.length + ' flag' + (g.list.length > 1 ? 's' : '') + ': ' + esc(g.list[0].reason) + '</small></div><div><button class="btn sm" data-flagopen="' + g.r.id + '">Open</button> ' + (CLOUD.owner ? '<button class="btn sm" data-flagdismiss="' + g.r.cid + '">Dismiss</button> <button class="btn sm danger" data-del="' + g.r.id + '">Delete</button>' : '') + '</div></div>'; });
      r.push(mkRow('Flagged reports', 'Reports that visitors marked as fake or wrong.', 'flags moderation fake', b, false));
      P.push({ id: 'admin', label: 'Admin tools', ic: 'sliders', desc: 'Moderation tools for owner and agency accounts.', rows: r, reset: false });
    }
    /* Privacy and security */
    r = [];
    r.push(linkRow('Privacy Policy', 'What the app stores and who receives data.', 'privacy.html', 'privacy data'));
    r.push(linkRow('Terms and Conditions', 'The rules for using DATAsaster.', 'terms.html', 'terms rules legal'));
    r.push(mkRow('Password', 'Change the password of a signed-in staff account.', 'change password security', '<div class="trow"><div><b>Password</b><small>' + (cloudOn() && CLOUD.email ? 'Change the password of your signed-in account.' : 'Available after you sign in to a moderator, agency or media account.') + '</small></div>' + (cloudOn() && CLOUD.email ? '<button class="btn sm" data-svp="account">Change password</button>' : '') + '</div>', false));
    r.push(mkRow('Data on this device', 'What this browser keeps.', 'storage local cache', '<div class="trow"><div><b>Data on this device</b><small>Your settings, ' + userItems.length + ' report' + (userItems.length === 1 ? '' : 's') + ' saved from this device, a cached copy of the app for offline use, and a random sign-in ID. Nothing is used for advertising.</small></div></div>', false));
    if (!CLOUD.media) { r.push(mkRow('Delete my reports', 'Removes reports you posted from this device.', 'remove erase', '<div class="trow"><div><b>Delete my reports</b><small>Removes the reports you posted from this device, including shared ones.</small></div><button class="btn sm danger" data-clearmine="1">Delete (' + (userItems.length + myCloud().length) + ')</button></div>', false)); }
    r.push(mkRow('Reset all settings', 'Puts every setting in every section back to its default.', 'default restore', '<div class="trow"><div><b>Reset all settings</b><small>Puts every setting in every section back to its default. Your reports are not touched.</small></div><button class="btn sm danger" data-reset="1">Reset all</button></div>', false));
    P.push(partnerPanel());
    P.push({ id: 'privacy', label: 'Privacy & security', ic: 'lock', desc: 'Legal pages, your password and the data kept on this device.', rows: r, reset: false });
    /* About */
    r = [];
    r.push(mkRow('App guide', 'Show the step-by-step guide for first-time users again.', 'help tutorial guide how to start onboarding walkthrough', '<div class="trow"><div><b>App guide</b><small>Show the step-by-step guide for first-time users again.</small></div><button class="btn sm" data-tour="1">Open guide</button></div>', false));
    r.push(mkRow('DATAsaster', 'Version and build', 'version name logo', '<div class="svabout"><img src="icon-192.png" width="56" height="56" alt="DATAsaster logo"><div><b>' + esc(APP_INFO.name) + '</b><small>Philippine disaster map, community reports and official advisories</small><small>Version ' + esc(APP_INFO.version) + ' \u00b7 build ' + esc(APP_INFO.build) + '</small></div></div>', false));
    b = ''; each(APP_INFO.releases, function (rl) { b += '<div class="rel"><b>Version ' + esc(rl.v) + '</b> <span class="m">' + esc(rl.date) + '</span><ul>'; each(rl.notes, function (nt) { b += '<li>' + esc(nt) + '</li>'; }); b += '</ul></div>'; });
    r.push(mkRow('Release notes', 'What changed in each version.', 'changelog updates new', b, true));
    if (APP_INFO.changelogUrl) { r.push(linkRow('Changelog', 'The full list of changes.', APP_INFO.changelogUrl, 'history')); }
    if (APP_INFO.docsUrl) { r.push(linkRow('Documentation', 'How the app works.', APP_INFO.docsUrl, 'docs guide')); }
    if (APP_INFO.helpUrl) { r.push(linkRow('Help center', 'Answers to common questions.', APP_INFO.helpUrl, 'faq support')); }
    if (APP_INFO.contactEmail) {
      r.push(linkRow('Contact support', 'Email the DATAsaster team.', 'mailto:' + APP_INFO.contactEmail, 'help email'));
      r.push(linkRow('Report a bug', 'Tell us what went wrong.', 'mailto:' + APP_INFO.contactEmail + '?subject=' + encodeURIComponent('DATAsaster bug report (version ' + APP_INFO.version + ')'), 'issue problem'));
    }
    r.push(linkRow('Privacy Policy', 'What the app stores and who receives data.', 'privacy.html', 'privacy'));
    r.push(linkRow('Terms and Conditions', 'The rules for using DATAsaster.', 'terms.html', 'terms'));
    r.push(linkRow('Partner with us', 'How LGUs, agencies and media outlets can take part.', 'partner.html', 'lgu agency media join'));
    r.push(linkRow('Apply for partnership', 'Cities, municipalities, barangays, HOAs and response teams can apply.', 'apply.html', 'lgu apply partnership barangay hoa')); 
    r.push(mkRow('Open-source licenses', 'Libraries and data this app builds on.', 'leaflet firebase osm license', '<ul class="svlic"><li><b>Leaflet</b> 1.9.4, BSD 2-Clause License</li><li><b>Firebase JavaScript SDK</b> 10.14.1, Apache License 2.0</li><li>Map data \u00a9 OpenStreetMap contributors; tiles by Esri and CARTO</li><li>Weather and hazard data: RainViewer, Open-Meteo, NASA EONET, USGS, EMSC</li></ul>', true));
    P.push({ id: 'about', label: 'About', ic: 'info', desc: 'Version, release notes, help and legal information.', rows: r, reset: false });
    return P;
  }
  function svBuild() {
    var panels = svPanels(), cur = null, nav = '', main = '', q = svQuery.replace(/^\s+|\s+$/g, '').toLowerCase(), found = 0, hits;
    each(panels, function (p) { if (p.id === svPanel) { cur = p; } });
    if (!cur) { cur = panels[0]; svPanel = cur.id; }
    each(panels, function (p) { var on = p.id === svPanel && !q; nav += '<button type="button" role="tab" class="svn' + (on ? ' on' : '') + '" data-svp="' + p.id + '" aria-selected="' + (on ? 'true' : 'false') + '">' + icon(p.ic, 16) + '<span>' + p.label + '</span></button>'; });
    if (q) {
      each(panels, function (p) {
        hits = '';
        each(p.rows, function (rw) { if ((rw.t + ' ' + rw.d + ' ' + rw.kw).toLowerCase().indexOf(q) > -1) { hits += rw.h; found++; } });
        if (hits) { main += '<div class="svgrp"><h3>' + p.label + '</h3>' + hits + '</div>'; }
      });
      if (!found) { main = '<div class="empty">No settings match \u201c' + esc(svQuery) + '\u201d. Try a shorter word.</div>'; }
      main = '<div class="svp-head"><div><h2>Search results</h2><p class="m">' + found + ' setting' + (found === 1 ? '' : 's') + ' found.</p></div></div>' + main;
    } else {
      main = '<div class="svp-head"><div><h2>' + cur.label + '</h2><p class="m">' + cur.desc + '</p></div>' + (cur.reset ? '<button class="btn sm" data-svreset="' + cur.id + '">Reset this section</button>' : '') + '</div>';
      each(cur.rows, function (rw) { main += rw.h; });
    }
    return { nav: nav, main: main };
  }
  function renderSettings() {
    var o = svBuild(), h, keepY = window.pageYOffset || 0;
    h = '<div class="sv2"><div class="sv2-top"><div><div class="m">Preferences</div><h1>Settings</h1></div><div class="sv2-tools"><div class="search"><span class="ics">' + icon('search', 15) + '</span><input type="text" id="svSearch" name="settings-filter" placeholder="Search settings" value="' + esc(svQuery) + '" aria-label="Search settings" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" data-form-type="other"><button type="button" class="svclr" id="svClr" data-svclear="1" aria-label="Clear search"' + (svQuery ? '' : ' hidden') + '>' + icon('x', 13) + '</button></div><span class="svsave" id="svSave" aria-live="polite">Changes save on this device</span><button class="btn" data-view="dash">' + icon('back', 15) + ' Back</button></div></div>';
    h += '<div class="sv2-body"><nav class="svnav" id="svNav" role="tablist" aria-label="Settings sections">' + o.nav + '</nav><div class="svmain" id="svMain">' + o.main + '</div></div></div>';
    $('viewSettings').innerHTML = h;
    window.scrollTo(0, keepY);
  }
  function svUpdate(animate) {
    var o = svBuild(), m = $('svMain');
    if (!m) { return; }
    $('svNav').innerHTML = o.nav; m.innerHTML = o.main;
    if (animate) { m.className = 'svmain'; void m.offsetWidth; m.className = 'svmain fadein'; }
  }
  function flashSaved(ok) {
    var el = $('svSave');
    if (!el) { return; }
    el.className = 'svsave ' + (ok ? 'ok' : 'err');
    el.textContent = ok ? '\u2713 Saved on this device' : 'Not saved: this browser blocks storage';
    if (svSaveT) { clearTimeout(svSaveT); }
    svSaveT = setTimeout(function () { var e2 = $('svSave'); if (e2) { e2.className = 'svsave'; e2.textContent = 'Changes save on this device'; } }, 2200);
  }
  function resetSection(id) {
    var keys = RESETS[id], ok;
    if (!keys) { return; }
    ok = window.confirm('Reset the ' + id.replace('appearance', 'Appearance & map').replace('feed', 'Feed & data').replace('alerts', 'Alerts') + ' settings to their defaults? Other sections are not changed.');
    if (!ok) { return; }
    each(keys, function (k) { settings[k] = clone(DEFAULTS[k]); });
    saveSettings(); applyTheme(); setTiles(); renderBase(); fitRegion(); refresh(); renderAdvList();
    if (id === 'feed') { loadQuakes(); loadNews(); }
    svUpdate(false);
  }
  /* Review queue: every shared report the signed-in admin or agency may act on (owner: all hazard types). */
  var reviewF = 'need', reviewT = 'all';
  function reviewScope() { var out = []; each(cloudItems, function (r) { if (CLOUD.admin && CLOUD.can(r.type)) { out.push(r); } }); out.sort(function (a, b) { return b.time - a.time; }); return out; }
  function myAssessed(r) {
    var al = assessFor(r.cid), k;
    if (CLOUD.role === 'agency') { for (k = 0; k < al.length; k++) { if (al[k].agency === CLOUD.agency) { return true; } } return false; }
    return al.length > 0;
  }
  function reviewHit(r, f) {
    if (f === 'need') { return !r.resolved && !myAssessed(r); }
    if (f === 'done') { return myAssessed(r); }
    if (f === 'open') { return !r.resolved; }
    if (f === 'resolved') { return !!r.resolved; }
    return true;
  }
  function renderReview() {
    var el = $('viewReview'), scope, list = [], cnt = {}, h, tl = [], who;
    if (!el || !CLOUD.admin) { return; }
    scope = reviewScope();
    each(CLOUD.owner ? ['flood', 'fire', 'quake', 'volcano', 'typhoon', 'landslide'] : CLOUD.types, function (k) { if (TSHORT[k]) { tl.push(k); } });
    if (reviewT !== 'all' && tl.indexOf(reviewT) < 0) { reviewT = 'all'; }
    each(scope, function (r) { if (reviewT === 'all' || r.type === reviewT) { list.push(r); } });
    each(['need', 'done', 'open', 'resolved', 'all'], function (f) { cnt[f] = 0; each(list, function (r) { if (reviewHit(r, f)) { cnt[f]++; } }); });
    who = CLOUD.owner ? 'Owner: all hazard types' : esc(CLOUD.agency) + ': ' + esc(tl.map(function (k) { return TSHORT[k]; }).join(', '));
    h = '<div class="sec" style="padding-top:16px"><h2>Review reports <span class="sp"></span><button class="btn sm" data-rvrefresh="1">' + icon('refresh', 13) + ' Refresh</button></h2>';
    h += '<div class="m" style="margin-bottom:10px">' + who + '. Shows the latest 200 shared reports of your hazard types. Open a report to assess, verify or resolve it.</div>';
    h += '<div class="fsum" style="margin-bottom:8px">';
    each([['need', 'Needs review'], ['done', CLOUD.owner ? 'Assessed' : 'Assessed by us'], ['open', 'Not resolved'], ['resolved', 'Resolved'], ['all', 'All']], function (x) {
      h += '<button data-rvf="' + x[0] + '" class="' + (reviewF === x[0] ? 'on' : '') + '"><b>' + cnt[x[0]] + '</b> ' + x[1] + '</button><span class="m">\u00b7</span>';
    });
    h += '</div>';
    if (tl.length > 1) {
      h += '<div class="fsum" style="margin-bottom:10px"><span class="m">Hazard:</span><button data-rvt="all" class="' + (reviewT === 'all' ? 'on' : '') + '">All</button>';
      each(tl, function (k) { h += '<button data-rvt="' + k + '" class="' + (reviewT === k ? 'on' : '') + '">' + TSHORT[k] + '</button>'; });
      h += '</div>';
    }
    h += '<div style="border-top:1px solid var(--line)">';
    var shown = 0;
    each(list, function (r) {
      var t = TYPES[r.type];
      if (!reviewHit(r, reviewF) || !t) { return; }
      shown++;
      h += '<div class="row' + (r.resolved ? ' res' : '') + '" data-rvopen="' + r.id + '"><div>' + statusLine(r, t) + '<h3>' + esc(r.title) + '</h3><div class="m">' + esc(r.place) + '</div><div class="m">' + trustLine(r) + ' \u00b7 <button class="link" data-rvopen="' + r.id + '">Open</button></div></div></div>';
    });
    if (!shown) { h += '<div class="empty">' + (scope.length ? 'No reports in this list.' : 'No shared reports of your hazard types yet.') + '</div>'; }
    h += '</div></div>';
    el.innerHTML = h;
  }
  function syncAdminUi() {
    var b = $('btnRev');
    if (b) { b.hidden = !CLOUD.admin; }
    if (!CLOUD.admin && viewing === 'review') { showView('dash'); }
  }
  function showView(v) {
    viewing = v;
    document.body.setAttribute('data-view', v);
    $('viewDash').hidden = v !== 'dash';
    $('viewSettings').hidden = v !== 'settings';
    $('viewReview').hidden = v !== 'review';
    if (v === 'review') { renderReview(); }
    $('btnRev').innerHTML = v === 'review' ? icon('back', 15) + '<span class="lbl"> Dashboard</span>' : icon('list', 15) + '<span class="lbl"> Review</span>';
    if (v === 'settings') { renderSettings(); }
    $('btnSet').innerHTML = v === 'settings' ? icon('back', 15) + '<span class="lbl"> Dashboard</span>' : icon('sliders', 15) + '<span class="lbl"> Settings</span>';
    window.scrollTo(0, 0);
    if (v === 'dash' && map) { setTimeout(function () { map.invalidateSize(); }, 50); }
  }

  var deferredPrompt = null;
  function setPane(p) {
    var prevPane = document.body.getAttribute('data-pane');
    document.body.setAttribute('data-pane', p);
    each(document.getElementsByClassName('tabbar')[0].getElementsByTagName('button'), function (b) { b.className = b.getAttribute('data-pane') === p ? 'on' : ''; });
    if (prevPane !== p) { window.scrollTo(0, 0); }
    if (p === 'map' && map) { setTimeout(function () { map.invalidateSize(); }, 60); }
  }
  function initApp() {
    var tb = '', net = $('net');
    each([['map', 'pin', 'Map'], ['feed', 'list', 'Feed'], ['news', 'news', 'News'], ['contacts', 'phone', 'Help']], function (x) { tb += '<button data-pane="' + x[0] + '">' + icon(x[1], 20) + '<span>' + x[2] + '</span></button>'; });
    $('tabbar').innerHTML = tb;
    setPane('map');
    function netState() { net.hidden = navigator.onLine !== false; }
    window.addEventListener('online', function () { netState(); loadQuakes(); loadNews(); refreshLayers(); });
    window.addEventListener('offline', netState);
    netState();
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; if (viewing === 'settings') { renderSettings(); } });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') { navigator.serviceWorker.register('sw.js').catch(function () {}); }
  }

  /* ---------- wiring ---------- */
  function refresh() { renderBar(); renderFeed(); drawMarkers(); renderLegend(); }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (window.__refT) { clearInterval(window.__refT); window.__refT = null; }
    if (settings.refresh > 0) { window.__refT = setInterval(function () { loadQuakes(); loadNews(); refreshLayers(); }, settings.refresh * 60000); }
  }
  var ACTIONS = ['data-tf', 'data-tr', 'data-id', 'data-open', 'data-showall', 'data-close', 'data-base', 'data-layer', 'data-sevf', 'data-layers-refresh', 'data-legend', 'data-fly', 'data-del', 'data-tog', 'data-clearmine', 'data-reset', 'data-newsretry', 'data-view', 'data-theme-set', 'data-pane', 'data-install', 'data-resolve', 'data-showres', 'data-adminlogin', 'data-adminout', 'data-sv', 'data-verify', 'data-flag', 'data-share', 'data-export', 'data-flagopen', 'data-flagdismiss', 'data-photo', 'data-pdel', 'data-auditload', 'data-assess', 'data-advnew', 'data-advedit', 'data-advcancel', 'data-advsave', 'data-advwd', 'data-rvf', 'data-rvt', 'data-rvopen', 'data-rvrefresh', 'data-infotab', 'data-svp', 'data-svreset', 'data-chgpw', 'data-goto', 'data-openreport', 'data-account', 'data-ftf', 'data-svclear', 'data-locopen', 'data-locnat', 'data-locon', 'data-locsc', 'data-tour'];
  function findAction(el) {
    var i;
    /* Stop at <body>: it carries data-view / data-pane for the CSS, and those names are also action names. Without this stop, every click
       inside Settings counted as 'show Settings', which re-drew the page, dropped focus and erased what was being typed. */
    while (el && el !== document && el !== document.body) {
      if (el.getAttribute) { for (i = 0; i < ACTIONS.length; i++) { if (el.hasAttribute(ACTIONS[i])) { return [ACTIONS[i], el.getAttribute(ACTIONS[i])]; } } }
      el = el.parentNode;
    }
    return null;
  }
  function onDocClick(e) {
    var a = findAction(e.target), n, v, parts;
    if (!a) { if (panelOpen && !$('lpanel').contains(e.target) && e.target !== $('btnLayers') && !$('btnLayers').contains(e.target)) { panelOpen = false; $('lpanel').hidden = true; } return; }
    n = a[0]; v = a[1];
    if ((n === 'data-adminlogin' || n === 'data-chgpw') && e.preventDefault) { e.preventDefault(); }
    if (n === 'data-adminlogin') {
      var em = $('adEmail').value.replace(/^\s+|\s+$/g, ''), pw = $('adPw').value;
      if (!em || !pw) { toast('Enter email and password'); return; }
      CLOUD.login(em, pw, function () { toast('Signed in'); }, function (er) { alert('Sign-in failed.\n\nError: ' + (er && er.code ? er.code : 'unknown') + (er && er.message ? '\n' + er.message : '')); });
      return;
    }
    if (n === 'data-sv') {
      var sr = byId(v);
      if (sr && window.MAPS_EMBED_KEY) { $('svBox').innerHTML = '<iframe title="Street view" style="width:100%;height:300px;border:0;border-radius:8px;margin-top:12px" loading="lazy" allowfullscreen src="https://www.google.com/maps/embed/v1/streetview?key=' + encodeURIComponent(window.MAPS_EMBED_KEY) + '&location=' + sr.lat + ',' + sr.lng + '&fov=90"></iframe><div class="m">Needs internet. Street view may be old or missing on some roads.</div>'; }
      return;
    }
    if (n === 'data-verify') { var vr = cloudById(v); if (vr && CLOUD.admin && CLOUD.can(vr.type)) { CLOUD.setVerified(vr.cid, vr.trust !== 'verified', cloudFail); toast(vr.trust === 'verified' ? 'Verification removed' : 'Marked as verified'); } return; }
    if (n === 'data-flag') {
      var fr = byId(v), why;
      if (!fr || !fr.cloud || !CLOUD.uid) { return; }
      why = window.prompt('Why are you flagging this report? (fake, wrong place, offensive, duplicate...)', '');
      if (why === null) { return; }
      why = why.replace(/^\s+|\s+$/g, '').substring(0, 200) || 'No reason given';
      CLOUD.flag(fr.cid, why, function () { flagged[fr.cid] = 1; lsSet('datasaster_flagged', flagged); toast('Thanks, an admin will review this report'); openDetail(v); }, cloudFail);
      return;
    }
    if (n === 'data-share') {
      var sh = byId(v), url;
      if (!sh) { return; }
      url = location.href.split('#')[0] + '#r=' + sh.id;
      if (navigator.share) { navigator.share({ title: sh.title, url: url }).catch(function () {}); }
      else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { window.prompt('Copy this link', url); }); }
      else { window.prompt('Copy this link', url); }
      return;
    }
    if (n === 'data-photo') {
      var pi = v.lastIndexOf('#'), pr = byId(v.substring(0, pi));
      if (pr) { lbOpen(photosOf(pr), parseInt(v.substring(pi + 1), 10) || 0); }
      return;
    }
    if (n === 'data-pdel') { var di = parseInt(v, 10); if (di >= 0 && di < pendImgs.length) { pendImgs.splice(di, 1); renderPrevs(); } return; }
    if (n === 'data-export') { if (CLOUD.admin) { exportCsv(); } return; }
    if (n === 'data-flagopen') { showView('dash'); select(v, true); openDetail(v); return; }
    if (n === 'data-flagdismiss') { if (!CLOUD.owner) { return; } CLOUD.dismissFlags(v, cloudFail); toast('Flags dismissed'); return; }
    if (n === 'data-infotab') {
      var tabAdv = $('tabAdv'), tabNews = $('tabNews'), secEl = $(v === 'news' ? 'newsSec' : 'advSec');
      document.body.setAttribute('data-info', v);
      tabAdv.className = v === 'adv' ? 'on' : ''; tabNews.className = v === 'news' ? 'on' : '';
      tabAdv.setAttribute('aria-selected', v === 'adv' ? 'true' : 'false'); tabNews.setAttribute('aria-selected', v === 'news' ? 'true' : 'false');
      secEl.className = secEl.className.replace(/\s*fadein/g, ''); void secEl.offsetWidth; secEl.className += ' fadein';
      return;
    }
    if (n === 'data-rvf') { reviewF = v; renderReview(); return; }
    if (n === 'data-rvt') { reviewT = v; renderReview(); return; }
    if (n === 'data-rvrefresh') { renderReview(); return; }
    if (n === 'data-rvopen') { e.stopPropagation(); if (byId(v)) { openDetail(v); } return; }
    if (n === 'data-advnew') { if (canAdv()) { advForm = { id: '', rev: 0, issuedAt: 0, v: {} }; renderAdv(); } return; }
    if (n === 'data-advcancel') { advForm = null; renderAdv(); return; }
    if (n === 'data-advedit') {
      var ea = advById(v);
      if (ea && canAdv() && ea.agency === CLOUD.agency && ea.status === 'published') { advForm = { id: ea._id, rev: ea.rev, issuedAt: ea.issuedAt, v: ea }; renderAdv(); }
      return;
    }
    if (n === 'data-advwd') {
      var wa = advById(v);
      if (!wa || wa.status !== 'published' || !window.confirm('Withdraw this advisory? It stays in the history.')) { return; }
      if (CLOUD.owner) { CLOUD.ownerWithdraw(wa._id, cloudFail); }
      else if (canAdv() && wa.agency === CLOUD.agency) { CLOUD.saveAdv({ id: wa._id, rev: wa.rev, issuedAt: wa.issuedAt, title: wa.title, hazard: wa.hazard, areas: wa.areas, desc: wa.desc, sourceUrl: wa.sourceUrl, refNo: wa.refNo, expiresAt: wa.expiresAt, status: 'withdrawn' }, cloudFail); }
      toast('Advisory withdrawn');
      return;
    }
    if (n === 'data-advsave') {
      if (!canAdv() || !advForm || !$('avTitle')) { return; }
      var trim = function (x) { return String(x || '').replace(/^\s+|\s+$/g, ''); };
      var av = { id: advForm.id, rev: advForm.rev, issuedAt: advForm.issuedAt, hazard: $('avHaz').value, title: trim($('avTitle').value), areas: trim($('avAreas').value), desc: trim($('avDesc').value), sourceUrl: trim($('avUrl').value), refNo: trim($('avRef').value), status: 'published' };
      if (!av.title || !av.desc) { alert('Please fill in the title and the advisory text.'); return; }
      if (!/^https:\/\/\S{4,300}$/.test(av.sourceUrl)) { alert('The original source link must start with https://'); return; }
      if (CLOUD.types.indexOf(av.hazard) < 0) { return; }
      av.expiresAt = Date.now() + parseInt($('avHrs').value, 10) * 3600000;
      if (!av.id) { av.issuedAt = Date.now(); }
      CLOUD.saveAdv(av, cloudFail);
      advForm = null; renderAdv(); toast(av.id ? 'Revision saved' : 'Advisory published');
      return;
    }
    if (n === 'data-assess') {
      var asr = cloudById(v) || byId(v);
      if (asr && asr.cloud && CLOUD.role === 'agency' && CLOUD.can(asr.type) && $('asStatus')) {
        CLOUD.saveAssess(asr.cid, $('asStatus').value, $('asNote') ? $('asNote').value : '', cloudFail);
        toast('Assessment saved');
      }
      return;
    }
    if (n === 'data-auditload') {
      if (!CLOUD.owner || auditBusy) { return; }
      auditBusy = true; renderSettings();
      CLOUD.listAudit(function (l) { auditList = l; auditBusy = false; renderSettings(); }, function (er) { auditBusy = false; renderSettings(); alert('Could not load the audit log.\n\nError: ' + (er && er.code ? er.code : 'unknown')); });
      return;
    }
    if (n === 'data-adminout') { auditList = null; CLOUD.logout(); toast('Signed out'); return; }
    if (n === 'data-tf') { tf = v; selId = null; refresh(); return; }
    if (n === 'data-tr') { trF = (trF === v) ? 'all' : v; refresh(); return; }
    if (n === 'data-open') { e.stopPropagation(); select(v, true); openDetail(v); return; }
    if (n === 'data-id') { select(v, true); return; }
    if (n === 'data-showall') { range = 'all'; $('range').value = 'all'; $('day').hidden = true; refresh(); return; }
    if (n === 'data-close') { $('detailBg').className = 'bg'; return; }
    if (n === 'data-view') { showView(v); return; }
    if (n === 'data-resolve') { toggleResolved(v); return; }
    if (n === 'data-showres') { statusF = 'all'; $('statusSel').value = 'all'; refresh(); return; }
    if (n === 'data-pane') { setPane(v); return; }
    if (n === 'data-install') { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; renderSettings(); } return; }
    if (n === 'data-theme-set') { settings.theme = v; saveSettings(); applyTheme(); renderSettings(); return; }
    if (n === 'data-base') { settings.basemap = v; saveSettings(); setTiles(); renderBase(); if (viewing === 'settings') { renderSettings(); } return; }
    if (n === 'data-layer') { settings.layers[v] = !settings.layers[v]; saveSettings(); if (v === 'reports') { drawMarkers(); renderBar(); } applyLayers(); return; }
    if (n === 'data-sevf') { sevF = (sevF === parseInt(v, 10)) ? -1 : parseInt(v, 10); $('sevSel').value = String(sevF); refresh(); return; }
    if (n === 'data-layers-refresh') { refreshLayers(); return; }
    if (n === 'data-legend') { legendOpen = !legendOpen; renderLegend(); return; }
    if (n === 'data-fly') { $('detailBg').className = 'bg'; select(v, true); return; }
    if (n === 'data-del') { deleteReport(v); return; }
    if (n === 'data-newsretry') { loadNews(); return; }
    if (n === 'data-tog') {
      parts = v.split(':');
      if (parts[0] === 'cat') { if (settings.cats[parts[1]] && !(function () { var c = 0; each(TORDER, function (t) { if (settings.cats[t]) { c++; } }); return c > 1; })()) { return; } settings.cats[parts[1]] = !settings.cats[parts[1]]; if (tf === parts[1] && !settings.cats[parts[1]]) { tf = 'all'; } }
      else if (parts[0] === 'src') { settings.sources[parts[1]] = !(settings.sources[parts[1]] !== false); }
      else { settings[v] = !settings[v]; }
      saveSettings(); if (viewing === 'settings') { renderSettings(); } refresh();
      if (v === 'showOldAdv') { renderAdvList(); }
      if (v === 'alerts' && settings.alerts) { enableAlerts(); }
      if (v === 'liveQuakes') { loadQuakes(); }
      if (v === 'liveNews' || (parts[0] === 'src' && NEWS_KEYS.indexOf(parts[1]) >= 0)) { loadNews(); }
      return;
    }
    if (n === 'data-clearmine') { if (CLOUD.media) { return; } if (window.confirm('Delete all your reports? This cannot be undone.')) { each(myCloud(), function (x) { CLOUD.remove(x.cid, cloudFail); }); userItems = []; lsSet('datasaster_reports', userItems); renderSettings(); refresh(); } return; }
    if (n === 'data-reset') { if (window.confirm('Reset all settings to defaults?')) { settings = clone(DEFAULTS); saveSettings(); applyTheme(); setTiles(); renderBase(); fitRegion(); applyLayers(); renderSettings(); refresh(); renderAdvList(); loadQuakes(); loadNews(); } return; }
    if (n === 'data-locopen') { openLoc(); return; }
    if (n === 'data-locnat') { PLACES.setOn(false); return; }
    if (n === 'data-locon') { PLACES.setOn(true); return; }
    if (n === 'data-locsc') {
      if (v === 'nat') { PLACES.setOn(false); return; }
      if (!PLACES.get()) { openLoc(v); return; }
      PLACES.setScope(v); if (!locOn()) { PLACES.setOn(true); }
      return;
    }
    if (n === 'data-tour') { openTour(0); return; }
    if (n === 'data-svclear') { svQuery = ''; var si = $('svSearch'); if (si) { si.value = ''; si.focus(); } svUpdate(false); var cb = $('svClr'); if (cb) { cb.hidden = true; } return; }
    if (n === 'data-svp') { svPanel = v; svQuery = ''; renderSettings(); return; }
    if (n === 'data-svreset') { resetSection(v); return; }
    if (n === 'data-chgpw') {
      var cp0 = $('cpOld').value, cp1 = $('cpNew').value, cp2 = $('cpNew2').value, cpm = $('cpMsg'), cpb = $('cpBtn');
      var say = function (t, kind) { cpm.className = 'cpmsg ' + (kind || ''); cpm.textContent = t; };
      if (!cp0 || !cp1 || !cp2) { say('Fill in all three boxes.', 'err'); return; }
      if (cp1.length < 8) { say('The new password must be at least 8 characters.', 'err'); return; }
      if (cp1 !== cp2) { say('The new passwords do not match.', 'err'); return; }
      if (cp1 === cp0) { say('The new password must be different from the current one.', 'err'); return; }
      cpb.disabled = true; say('Updating password...', '');
      CLOUD.changePassword(cp0, cp1, function () { cpb.disabled = false; $('cpOld').value = ''; $('cpNew').value = ''; $('cpNew2').value = ''; say('Password changed. Use the new password the next time you sign in.', 'ok'); }, function (er) {
        var cd = er && er.code ? er.code : 'unknown';
        cpb.disabled = false;
        say(cd === 'auth/wrong-password' || cd === 'auth/invalid-credential' ? 'Your current password is not correct.' : cd === 'auth/weak-password' ? 'That password is too weak. Use at least 8 characters.' : cd === 'auth/too-many-requests' ? 'Too many attempts. Wait a few minutes and try again.' : cd === 'auth/network-request-failed' ? 'No connection. Check your internet and try again.' : cd === 'auth/requires-recent-login' ? 'Please sign out, sign in again and retry.' : 'Could not change the password (' + cd + ').', 'err');
      });
      return;
    }
    if (n === 'data-goto') { var gt = $(v); if (gt && gt.scrollIntoView) { gt.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
    if (n === 'data-openreport') { openReport(false); return; }
    if (n === 'data-account') { svPanel = 'account'; svQuery = ''; showView('settings'); window.scrollTo(0, 0); return; }
    if (n === 'data-ftf') { tf = v; selId = null; refresh(); window.scrollTo(0, 0); return; }
  }
  document.addEventListener('click', function (e) {
    var y = window.pageYOffset || 0, rb = $('rows'), ry = rb ? rb.scrollTop : 0, pane0 = document.body.getAttribute('data-pane'), view0 = viewing;
    onDocClick(e);
    if (document.body.getAttribute('data-pane') === pane0 && viewing === view0) {
      window.scrollTo(0, y);
      if (rb) { rb.scrollTop = ry; }
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target, k = el.getAttribute ? el.getAttribute('data-sel') : null;
    if (!k) { return; }
    if (k === 'region') { settings.region = el.value; fitRegion(); }
    if (k === 'minmag') { settings.minMag = parseFloat(el.value); refresh(); }
    if (k === 'alertkm') { settings.alertKm = parseInt(el.value, 10); }
    if (k === 'refresh') { settings.refresh = parseInt(el.value, 10); applyTheme(); }
    saveSettings();
  });
  document.addEventListener('keydown', function (e) {
    if (lbOpen_()) {
      if (e.keyCode === 27) { lbClose(); return; }
      if (e.keyCode === 37) { lbStep(-1); return; }
      if (e.keyCode === 39) { lbStep(1); return; }
      return;
    }
    if (e.keyCode === 27) { $('detailBg').className = 'bg'; if (viewing === 'settings' || viewing === 'review') { showView('dash'); } closeReport(); endPick(); }
  });
  function bgClose(id, fn) { $(id).addEventListener('mousedown', function (e) { if (e.target === $(id)) { fn(); } }); }

  function start() {
    var tick;
    buildDemo();
    each(userItems, function (u) { u.own = true; u.trust = 'unverified'; u.srcLabel = u.srcLabel || 'Community report'; if (!u.obs) { u.obs = []; } });
    $('logo').innerHTML = icon('radar', 26);
    $('btnSet').innerHTML = icon('sliders', 15) + '<span class="lbl"> Settings</span>';
    $('btnRev').innerHTML = icon('list', 15) + '<span class="lbl"> Review</span>';
    $('btnRev').addEventListener('click', function () { showView(viewing === 'review' ? 'dash' : 'review'); });
    $('btnRep').innerHTML = icon('plus', 15) + '<span class="lbl"> Report incident</span><span class="lbl2"> Report</span>';
    $('btnLayers').innerHTML = icon('layers', 15) + ' Live layers';
    $('newsRef').innerHTML = icon('refresh', 13) + ' Refresh';
    $('icS').innerHTML = icon('search', 15);
    $('rX').innerHTML = icon('x');
    fillReport(); rTypeChanged(); renderContacts(); applyTheme(); renderBase(); renderNews(); renderAdv(); maybeTour(); initNotice();
    initMap(); refresh(); applyLayers(); renderLegend();

    $('q').addEventListener('input', function () { query = this.value.toLowerCase(); refresh(); });
    $('sevSel').addEventListener('change', function () { sevF = parseInt(this.value, 10); refresh(); });
    $('statusSel').addEventListener('change', function () { statusF = this.value; refresh(); });
    $('sortSel').addEventListener('change', function () {
      sortBy = this.value;
      if (sortBy === 'near' && !userPos) { getPos(function (ok) { if (!ok) { toast('Location is not available'); } refresh(); }); }
      refresh();
    });
    $('nearSel').addEventListener('change', function () {
      var v = parseInt(this.value, 10), sel = this;
      if (!v) { nearKm = 0; refresh(); return; }
      if (userPos) { nearKm = v; refresh(); return; }
      toast('Finding your location...');
      getPos(function (ok) { if (ok) { nearKm = v; refresh(); } else { sel.value = '0'; nearKm = 0; toast('Location is not available'); } });
    });
    $('range').addEventListener('change', function () {
      range = this.value;
      if (range === 'day') { if (!dayVal) { dayVal = manilaDay(Date.now()); } $('day').value = dayVal; $('day').hidden = false; } else { $('day').hidden = true; }
      refresh();
    });
    $('day').addEventListener('change', function () { dayVal = this.value; refresh(); });
    $('btnSet').addEventListener('click', function () { showView(viewing === 'settings' ? 'dash' : 'settings'); });
    $('btnRep').addEventListener('click', function () { openReport(false); });
    document.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'svSearch') {
        // the browser's saved-email autofill fills this box without the person typing: undo it
        if (document.activeElement !== e.target) { e.target.value = svQuery; return; }
        svQuery = e.target.value; svUpdate(false);
        var c = $('svClr'); if (c) { c.hidden = !svQuery; }
      }
    });
    document.addEventListener('submit', function (e) {
      var f = e.target, b;
      if (!f || (f.id !== 'adForm' && f.id !== 'cpForm')) { return; }
      e.preventDefault();
      b = f.querySelector('[data-adminlogin],[data-chgpw]'); if (b) { b.click(); }
    });
    $('fToggle').addEventListener('click', function () { var fh = $('fToggle').parentNode.parentNode, op = fh.className.indexOf(' open') < 0; fh.className = op ? fh.className + ' open' : fh.className.replace(' open', ''); $('fToggle').setAttribute('aria-expanded', op ? 'true' : 'false'); });
    $('btnLayers').addEventListener('click', function () { panelOpen = !panelOpen; $('lpanel').hidden = !panelOpen; if (panelOpen) { renderPanel(); } });
    $('newsSrc').addEventListener('change', function () { var y = window.pageYOffset || 0; newsF = this.value; renderNews(true); window.scrollTo(0, y); });
    $('newsRef').addEventListener('click', loadNews);
    $('rCancel').addEventListener('click', closeReport); $('rX').addEventListener('click', closeReport);
    $('rSave').addEventListener('click', saveReport);
    $('rType').addEventListener('change', rTypeChanged); $('rSev').addEventListener('change', rSevHelp);
    $('rDepth').addEventListener('input', function () { var v = parseFloat(this.value), cm; if (isNaN(v)) { return; } cm = $('rUnit').value === 'm' ? v * 100 : v; $('rSev').value = String(cm < 25 ? 0 : (cm < 60 ? 1 : (cm < 110 ? 2 : 3))); rSevHelp(); });
    $('rPhoto').addEventListener('change', onPhoto);
    renderPrevs();
    $('lbClose').innerHTML = icon('x', 20); $('lbPrev').innerHTML = icon('left', 24); $('lbNext').innerHTML = icon('right', 24);
    $('lbClose').addEventListener('click', lbClose);
    $('lbPrev').addEventListener('click', function () { lbStep(-1); });
    $('lbNext').addEventListener('click', function () { lbStep(1); });
    $('lbZoomBtn').addEventListener('click', function () { lbZoom($('lbBox').className.indexOf('zoomed') < 0); });
    $('lbImg').addEventListener('click', function () { lbZoom($('lbBox').className.indexOf('zoomed') < 0); });
    $('lbBg').addEventListener('mousedown', function (e) { if (e.target === $('lbBg') || e.target === $('lbBox')) { lbClose(); } });
    $('rPick').addEventListener('click', function () { picking = true; $('reportBg').className = 'bg'; $('pickbar').style.display = 'block'; });
    $('rGps').addEventListener('click', gps);
    $('pickCancel').addEventListener('click', function () { endPick(); openReport(true); });
    bgClose('detailBg', function () { $('detailBg').className = 'bg'; });
    bgClose('reportBg', closeReport);
    tick = function () { $('clk').textContent = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' }); };
    tick(); setInterval(tick, 1000);
    window.addEventListener('resize', function () { if (map) { map.invalidateSize(); } });
    loadQuakeCache(); refresh();
    setInterval(function () { if (!document.hidden && navigator.onLine !== false) { loadQuakes(); } }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && Date.now() - quakeAt > 45000) { loadQuakes(); } });
    initApp();
    pendingHash = /^#r=[A-Za-z0-9_-]{1,60}$/.test(location.hash || '') ? location.hash.substring(3) : '';
    if (settings.alerts && cloudOn()) { getPos(function () { refresh(); }); setInterval(function () { getPos(function () {}); }, 600000); }
    initCloud(); initLoc();
    tryHash();
    loadQuakes(); loadNews();
  }
  start();
})();
