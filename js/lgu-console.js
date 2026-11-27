/* LGU organization console (phase 2). Own small Firebase start-up; does not load the map app.
   WHO CAN SEE WHAT is decided by firestore.rules, not by this file: this file only asks for the signed-in admin's own organization.
   Incidents are the public shared reports, filtered here to the organization's hazard types and coverage box; writes are checked by the rules. */
(function () {
  'use strict';
  var TYPE = { flood: 'Flooding', fire: 'Fire', quake: 'Earthquake', volcano: 'Volcanic', typhoon: 'Typhoon', landslide: 'Landslide' };
  var SEV = ['Low', 'Moderate', 'High', 'Critical'], SEVC = ['#34d399', '#fbbf24', '#fb923c', '#ef4444'];
  var TABS = [['overview', 'Overview'], ['incidents', 'Incidents'], ['ann', 'Announcements'], ['reports', 'Reports'], ['settings', 'Settings']];
  var db = null, auth = null, user = null, member = null, org = null, reports = [], anns = [], tab = 'overview', stopR = null, stopA = null;
  var annTab = 'active', form = null, confirmId = '', openRow = '', sSec = 'profile', rf = { from: '', to: '', cat: '', st: '' }, MAIL = 'aitetha8@gmail.com';
  function $(id) { return document.getElementById(id); }
  function each(a, f) { var i; for (i = 0; i < a.length; i++) { f(a[i], i); } }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function p2(n) { return n < 10 ? '0' + n : String(n); }
  function manila(ms) { return new Date(ms + 8 * 3600000); }
  function fmt(ms) { return new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function fmtDay(ms) { return new Date(ms).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' }); }
  function dayKey(ms) { return manila(ms).toISOString().substring(0, 10); }
  function ago(ms) {
    var s = Math.max(0, (Date.now() - ms) / 1000);
    if (s < 60) { return 'just now'; } if (s < 3600) { return Math.floor(s / 60) + ' min ago'; }
    if (s < 86400) { return Math.floor(s / 3600) + ' h ago'; } return Math.floor(s / 86400) + ' d ago';
  }
  function toast(m) { var t = $('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(function () { t.className = 'toast'; }, 2600); }
  function errMsg(er) { return er && er.code === 'permission-denied' ? 'Not allowed. Your account may not cover this record, or the organization is not active.' : 'Something went wrong (' + ((er && er.code) || 'unknown') + '). Try again.'; }
  function csvCell(v) { var q = String(v == null ? '' : v).replace(/\r?\n/g, ' '); if (/^[=+\-@\t]/.test(q)) { q = "'" + q; } return '"' + q.replace(/"/g, '""') + '"'; }
  function download(name, rows) {
    var csv = rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'), blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  /* ---------- my incidents: the organization's hazard types AND coverage box ---------- */
  function mine(r) {
    var t = org && org.types || [];
    return typeof r.lat === 'number' && typeof r.lng === 'number' && t.indexOf(r.type) > -1
      && r.lat >= org.south && r.lat <= org.north && r.lng >= org.west && r.lng <= org.east;
  }
  function incidents() { return reports.filter(mine); }
  function stat(r) { return r.resolved ? 'res' : (r.verified ? 'act' : 'unv'); }
  function chip(r) { var k = stat(r); return '<span class="chip ' + k + '">' + (k === 'res' ? 'RESOLVED' : (k === 'act' ? 'ACTIVE &middot; VERIFIED' : 'UNVERIFIED')) + '</span>'; }
  function sevHtml(r) { var s = r.sev | 0; return '<span class="dot" style="background:' + SEVC[s] + '"></span>' + SEV[s]; }
  function annState(a) { var n = Date.now(); if (a.status === 'draft') { return 'draft'; } if (a.startsAt > n) { return 'sched'; } return a.endsAt > n ? 'active' : 'ended'; }
  function annOf(st) { return anns.filter(function (a) { return annState(a) === st; }).sort(function (a, b) { return (b.startsAt || 0) - (a.startsAt || 0); }); }

  /* ---------- shell ---------- */
  function setShell() {
    var on = !!(user && member && org);
    $('ctabs').hidden = !on; $('btnOut').hidden = !user; $('btnNew').hidden = !on;
    $('who').innerHTML = on ? '<span class="partnertag">PARTNER</span><b style="color:var(--text)">' + esc(org.name) + '</b> <span class="m">&middot; ' + esc([org.city, org.province].filter(Boolean).join(', ')) + ' &middot; Organization admin</span>' : 'Sign in to continue';
    if (on) {
      var h = '', n = incidents().filter(function (r) { return !r.resolved && !r.verified; }).length;
      each(TABS, function (t) { h += '<button type="button" data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + (t[0] === 'settings' ? 'Settings' : t[1]) + (t[0] === 'incidents' && n ? '<span class="n">' + n + '</span>' : '') + '</button>'; });
      $('ctabs').innerHTML = h;
    }
  }
  function view() {
    var el = $('app');
    setShell();
    if (!db) { el.innerHTML = '<p class="m" style="padding:24px 0">The console is not available right now. Please try again later or email ' + MAIL + '.</p>'; return; }
    if (!user) { el.innerHTML = signIn(); return; }
    if (!member) { el.innerHTML = '<div class="cpanel signin"><div class="body"><h2 style="font-size:18px;margin-bottom:6px">This account is not an organization admin</h2><p class="m">You are signed in as ' + esc(user.email || '') + '. Organization access is set up by the DATAsaster team after a partnership is approved. <a href="apply.html">Apply for partnership</a> or email ' + MAIL + '.</p><p><button class="btn" data-act="out" type="button">Sign out</button></p></div></div>'; return; }
    if (!org) { el.innerHTML = '<p class="m" style="padding:24px 0">Loading your organization...</p>'; return; }
    if (org.status !== 'active') { el.innerHTML = '<div class="cpanel signin"><div class="body"><h2 style="font-size:18px;margin-bottom:6px">Organization not active</h2><p class="m">' + esc(org.name) + ' is currently ' + esc(org.status || 'inactive') + '. Email ' + MAIL + ' for help.</p></div></div>'; return; }
    el.innerHTML = tab === 'overview' ? vOverview() : (tab === 'incidents' ? vIncidents() : (tab === 'ann' ? vAnn() : (tab === 'reports' ? vReports() : vSettings())));
  }
  function signIn() {
    return '<form class="cpanel signin cform" id="siForm" novalidate><div class="body"><h2 style="font-size:20px;margin-bottom:4px">Organization sign in</h2><p class="m" style="margin:0 0 14px">For approved LGUs, barangays, HOAs and response teams. Everyone else uses the public map without signing in.</p>'
      + '<div class="field"><label class="l" for="siEm">Email</label><input type="email" id="siEm" autocomplete="username"></div>'
      + '<div class="field"><label class="l" for="siPw">Password</label><input type="password" id="siPw" autocomplete="current-password"></div>'
      + '<div class="err" id="siErr" role="alert"></div><button class="btn primary" type="submit">Sign in</button> <button class="btn" type="button" data-act="forgot">Forgot password?</button> <a class="btn" href="apply.html">Apply for partnership</a></div></form>';
  }

  /* ---------- overview ---------- */
  function incRow(r, withAct) {
    return '<tr><td><b>' + esc(r.title) + '</b><small>' + esc(r.place || 'No place name') + ' &middot; ' + (r.media ? esc(r.media) : 'Community report') + '</small></td><td>' + esc(TYPE[r.type] || r.type) + '</td><td>' + sevHtml(r) + '</td><td>' + chip(r) + '</td><td>' + ago(r.time) + '</td>'
      + (withAct ? '<td class="act"><button class="btn sm" data-act="detail" data-id="' + r._id + '" type="button">Details</button>' + (!r.resolved && !r.verified ? '<button class="btn sm" data-act="verify" data-id="' + r._id + '" type="button">Verify</button>' : '') + '<button class="btn sm" data-act="resolve" data-id="' + r._id + '" type="button">' + (r.resolved ? 'Reopen' : 'Mark resolved') + '</button></td>' : '') + '</tr>'
      + (withAct && openRow === r._id ? '<tr class="detail"><td colspan="6">' + esc(r.desc || 'No description.') + '<br><a href="./#r=c' + esc(r._id) + '" target="_blank" rel="noopener">Open on the public map</a></td></tr>' : '');
  }
  function legend() { return '<div class="legendrow"><span><span class="chip unv">UNVERIFIED</span> Needs a look</span><span><span class="chip act">ACTIVE</span> Confirmed, ongoing</span><span><span class="chip res">RESOLVED</span> Closed out</span></div>'; }
  function vOverview() {
    var inc = incidents(), act = inc.filter(function (r) { return !r.resolved; }), res = inc.length - act.length, unv = act.filter(function (r) { return !r.verified; }).length, wk = inc.filter(function (r) { return r.resolved && r.resAt > Date.now() - 7 * 86400000; }).length,
      live = annOf('active'), ev = live.filter(function (a) { return a.type === 'evacuation'; }).length, need = act.slice(0, 6), h, types = (org.types || []).map(function (t) { return TYPE[t] || t; }).join(', ');
    h = '<div class="chead"><div><h1>Overview</h1><p>Incidents inside ' + esc(org.name) + '. Based on the latest 200 shared reports.</p></div><div class="sp"></div><button class="btn" data-act="refresh" type="button">Refresh</button></div>';
    h += '<div class="stats"><div class="stat"><small>Total reported incidents</small><b>' + inc.length + '</b><span>Your area and hazard types</span></div>'
      + '<div class="stat warn"><small><span class="dot" style="background:#fb923c"></span>Active incidents</small><b style="color:#fb923c">' + act.length + '</b><span>' + unv + ' need review</span></div>'
      + '<div class="stat"><small><span class="dot" style="background:#34d399"></span>Resolved incidents</small><b style="color:#34d399">' + res + '</b><span>' + wk + ' this week</span></div>'
      + '<div class="stat"><small>Current announcements</small><b>' + live.length + '</b><span>' + ev + ' evacuation &middot; ' + (live.length - ev) + ' general</span></div></div>';
    h += '<div class="cgrid2"><div class="cpanel"><div class="ph"><h2>Incidents needing action</h2><small>Your hazard types: ' + esc(types || 'none set') + '</small><div class="sp"></div><button class="btn sm" data-tab="incidents" type="button">Open all incidents</button></div>';
    h += need.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Incident</th><th>Category</th><th>Severity</th><th>Status</th><th>Reported</th></tr></thead><tbody>' + need.map(function (r) { return incRow(r, false); }).join('') + '</tbody></table></div>' + legend() : '<div class="body m">Nothing needs action right now.</div>';
    h += '</div><div class="cpanel"><div class="ph"><h2>Live announcements</h2><div class="sp"></div><button class="btn sm" data-tab="ann" type="button">Manage</button></div>';
    h += live.length ? live.slice(0, 4).map(function (a) { return '<div class="annrow">' + annChip(a) + '<h3>' + esc(a.title) + '</h3><div class="meta">Ends ' + fmt(a.endsAt) + '</div></div>'; }).join('') : '<div class="body m">No live announcements.</div>';
    return h + '</div></div>';
  }
  function annChip(a) { return '<span class="chip ' + (a.type === 'evacuation' ? 'evac' : 'gen') + '">' + (a.type === 'evacuation' ? 'EVACUATION' : 'GENERAL') + '</span>'; }

  /* ---------- incidents ---------- */
  function vIncidents() {
    var inc = incidents(), h = '<div class="chead"><div><h1>Incidents</h1><p>Community reports for your hazard types and area. Verify or resolve them here.</p></div></div><div class="cpanel">';
    h += inc.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Incident</th><th>Category</th><th>Severity</th><th>Status</th><th>Reported</th><th></th></tr></thead><tbody>' + inc.map(function (r) { return incRow(r, true); }).join('') + '</tbody></table></div>' + legend() : '<div class="body m">No community reports in your area yet.</div>';
    return h + '</div>';
  }

  /* ---------- announcements ---------- */
  function liLocal(ms) { return manila(ms).toISOString().substring(0, 16); }
  function fromLocal(v) { var t = Date.parse(v + ':00+08:00'); return isNaN(t) ? 0 : t; }
  function newForm() { var n = Date.now(); return { id: '', type: 'evacuation', title: '', desc: '', areas: '', startsAt: n, endsAt: n + 86400000, err: '' }; }
  function vAnn() {
    var tabs = [['active', 'Active'], ['sched', 'Scheduled'], ['draft', 'Drafts'], ['ended', 'Ended']], list = annOf(annTab), h;
    h = '<div class="chead"><div><h1>Announcements</h1><p>Manual announcements shown on the public dashboard under your organization\'s name. No SMS or push messages.</p></div></div><div class="cgrid2" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)"><div id="annFormBox">' + (form ? vForm() : '<div class="cpanel"><div class="body"><button class="btn primary" data-act="newann" type="button">+ New announcement</button></div></div>') + '</div>';
    h += '<div class="cpanel"><div class="subtabs2">' + tabs.map(function (t) { return '<button type="button" data-annt="' + t[0] + '" class="' + (annTab === t[0] ? 'on' : '') + '">' + t[1] + ' ' + annOf(t[0]).length + '</button>'; }).join('') + '</div><div id="annList">' + vAnnList(list) + '</div></div></div>';
    return h;
  }
  function vAnnList(list) {
    if (!list.length) { return '<div class="body m">Nothing here.</div>'; }
    return list.map(function (a) {
      var st = annState(a), c = confirmId === a._id;
      return '<div class="annrow">' + annChip(a) + ' <span class="meta">' + (st === 'draft' ? 'Draft' : 'Starts ' + fmt(a.startsAt) + ' &middot; Ends ' + fmt(a.endsAt)) + '</span><h3>' + esc(a.title) + '</h3><div class="acts"><button class="btn sm" data-act="editann" data-id="' + a._id + '" type="button">Edit</button>'
        + (st === 'active' ? '<button class="btn sm" data-act="endann" data-id="' + a._id + '" type="button">End now</button>' : '') + '<button class="btn sm danger" data-act="delann" data-id="' + a._id + '" type="button">Delete</button></div></div>'
        + (c ? '<div class="confirm"><b>Delete "' + esc(a.title) + '"?</b><p class="m" style="margin:4px 0 8px">It is removed from the public dashboard now. To keep a record, choose End now instead.</p><button class="btn sm" data-act="keepann" type="button">Keep announcement</button> <button class="btn sm danger" data-act="delann2" data-id="' + a._id + '" type="button">Delete announcement</button></div>' : '');
    }).join('');
  }
  function vForm() {
    var f = form, pv = '<span class="chip ' + (f.type === 'evacuation' ? 'evac' : 'gen') + '">' + (f.type === 'evacuation' ? 'EVACUATION' : 'GENERAL') + '</span> <span class="chip gen">PARTNER LGU</span> <b>' + esc(org.name) + '</b><div style="margin-top:6px"><b>' + esc(f.title || 'Title') + '</b></div><div class="m">' + esc((f.desc || 'Description').substring(0, 140)) + '</div>';
    return '<form class="cpanel cform" id="annForm" novalidate><div class="ph"><h2>' + (f.id ? 'Edit announcement' : 'New announcement') + '</h2><small>Shows on the public dashboard under your organization\'s name until it ends.</small></div><div class="body">'
      + '<div class="field"><span class="l">Type</span><div class="radios"><label><input type="radio" name="atype" value="evacuation"' + (f.type === 'evacuation' ? ' checked' : '') + '> Evacuation</label><label><input type="radio" name="atype" value="general"' + (f.type === 'general' ? ' checked' : '') + '> General emergency information</label></div></div>'
      + '<div class="field"><label class="l" for="aTitle">Title</label><input type="text" id="aTitle" maxlength="120" value="' + esc(f.title) + '"></div>'
      + '<div class="field"><label class="l" for="aDesc">Description</label><textarea id="aDesc" maxlength="1500">' + esc(f.desc) + '</textarea></div>'
      + '<div class="row2c"><div class="field"><label class="l" for="aStart">Starts (Manila time)</label><input type="datetime-local" id="aStart" value="' + liLocal(f.startsAt) + '"></div><div class="field"><label class="l" for="aEnd">Ends (Manila time)</label><input type="datetime-local" id="aEnd" value="' + liLocal(f.endsAt) + '"></div></div>'
      + '<div class="field"><label class="l" for="aAreas">Affected areas <span class="m" style="font-weight:400">Optional</span></label><input type="text" id="aAreas" maxlength="200" value="' + esc(f.areas) + '"></div>'
      + '<div class="m" style="font-size:11px;font-weight:700;letter-spacing:.06em">PUBLIC PREVIEW</div><div class="preview" id="aPrev">' + pv + '</div>'
      + '<div class="err" id="aErr" role="alert">' + esc(f.err) + '</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="saveann" data-st="draft">Save draft</button><button class="btn primary" type="button" data-act="saveann" data-st="published">Publish announcement</button><button class="btn" type="button" data-act="cancelann">Cancel</button></div></div></form>';
  }
  function readForm() {
    var r = document.querySelector('input[name=atype]:checked');
    form.type = r ? r.value : form.type; form.title = $('aTitle').value.replace(/^\s+|\s+$/g, ''); form.desc = $('aDesc').value.replace(/^\s+|\s+$/g, ''); form.areas = $('aAreas').value.replace(/^\s+|\s+$/g, '');
    form.startsAt = fromLocal($('aStart').value) || form.startsAt; form.endsAt = fromLocal($('aEnd').value) || form.endsAt;
  }
  function saveAnn(status) {
    var f, d, ref, now = Date.now();
    readForm(); f = form; f.err = '';
    if (f.title.length < 3) { f.err = 'Enter a title (at least 3 characters).'; }
    else if (f.desc.length < 3) { f.err = 'Enter a description.'; }
    else if (f.endsAt <= f.startsAt) { f.err = 'The end time must be after the start time.'; }
    else if (f.endsAt > now + 30 * 86400000) { f.err = 'An announcement can run for at most 30 days.'; }
    if (f.err) { $('aErr').textContent = f.err; return; }
    d = { orgId: org.id, orgName: org.name, type: f.type, title: f.title, desc: f.desc, areas: f.areas, startsAt: f.startsAt, endsAt: f.endsAt, status: status, uid: user.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    ref = f.id ? db.collection('announcements').doc(f.id) : db.collection('announcements').doc();
    ref.set(d).then(function () { toast(status === 'published' ? 'Announcement published' : 'Draft saved'); form = null; if (status === 'published') { annTab = f.startsAt > Date.now() ? 'sched' : 'active'; } else { annTab = 'draft'; } if (tab === 'ann') { view(); } }, function (er) { f.err = errMsg(er); if ($('aErr')) { $('aErr').textContent = f.err; } });
  }
  function annById(id) { var r = null; each(anns, function (a) { if (a._id === id) { r = a; } }); return r; }
  function annWrite(a, extra, msg) {
    var d = { orgId: a.orgId, orgName: org.name, type: a.type, title: a.title, desc: a.desc, areas: a.areas || '', startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, uid: user.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, k;
    for (k in extra) { d[k] = extra[k]; }
    db.collection('announcements').doc(a._id).set(d).then(function () { toast(msg); }, function (er) { toast(errMsg(er)); });
  }

  /* ---------- reports ---------- */
  function filteredInc() {
    return incidents().filter(function (r) {
      var k = dayKey(r.time);
      return (!rf.from || k >= rf.from) && (!rf.to || k <= rf.to) && (!rf.cat || r.type === rf.cat) && (!rf.st || stat(r) === rf.st);
    });
  }
  function bars(map, labels) {
    var keys = Object.keys(map), max = 1, h = '';
    each(keys, function (k) { if (map[k] > max) { max = map[k]; } });
    each(keys, function (k) { h += '<div class="brow"><span>' + esc(labels[k] || k) + '</span><div><div class="bar0" style="width:' + Math.round(map[k] / max * 100) + '%"></div></div><b>' + map[k] + '</b></div>'; });
    return h || '<div class="m">No incidents in this range.</div>';
  }
  function vReports() {
    var inc = filteredInc(), cat = {}, st = {}, h, opts = '<option value="">All categories</option>';
    each(inc, function (r) { cat[r.type] = (cat[r.type] || 0) + 1; st[stat(r)] = (st[stat(r)] || 0) + 1; });
    each(org.types || [], function (t) { opts += '<option value="' + t + '"' + (rf.cat === t ? ' selected' : '') + '>' + esc(TYPE[t] || t) + '</option>'; });
    h = '<div class="chead"><div><h1>Reports</h1><p>Your organization\'s records only.</p></div></div>';
    h += '<form class="cpanel cform" id="rfForm"><div class="body"><div class="filters"><div class="field"><label class="l" for="rfFrom">From</label><input type="date" id="rfFrom" value="' + esc(rf.from) + '"></div><div class="field"><label class="l" for="rfTo">To</label><input type="date" id="rfTo" value="' + esc(rf.to) + '"></div>'
      + '<div class="field"><label class="l" for="rfCat">Category</label><select id="rfCat">' + opts + '</select></div><div class="field"><label class="l" for="rfSt">Status</label><select id="rfSt"><option value="">All statuses</option><option value="unv"' + (rf.st === 'unv' ? ' selected' : '') + '>Unverified</option><option value="act"' + (rf.st === 'act' ? ' selected' : '') + '>Active</option><option value="res"' + (rf.st === 'res' ? ' selected' : '') + '>Resolved</option></select></div>'
      + '<div class="field" style="flex:none"><button class="btn" type="button" data-act="rfreset">Reset filters</button> <button class="btn primary" type="submit">Apply filters</button></div></div></div></form>';
    h += '<div class="cgrid2" style="grid-template-columns:1fr 1fr"><div class="cpanel"><div class="ph"><h2>By category</h2><small>' + inc.length + ' incidents in range</small></div><div class="body bars">' + bars(cat, TYPE) + '</div></div>'
      + '<div class="cpanel"><div class="ph"><h2>By status</h2></div><div class="body bars">' + bars(st, { unv: 'Unverified', act: 'Active', res: 'Resolved' }) + '</div></div></div>';
    h += '<div class="cpanel"><div class="ph"><h2>Incidents</h2><small>Showing ' + Math.min(inc.length, 50) + ' of ' + inc.length + '</small><div class="sp"></div><button class="btn sm" data-act="csv" type="button">Export incidents CSV</button></div>';
    h += inc.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Severity</th><th>Status</th><th>Location</th></tr></thead><tbody>' + inc.slice(0, 50).map(function (r) { return '<tr><td>' + fmtDay(r.time) + '</td><td>' + esc(r.title) + '</td><td>' + esc(TYPE[r.type] || r.type) + '</td><td>' + SEV[r.sev | 0] + '</td><td>' + chip(r) + '</td><td>' + esc(r.place || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="body m">No incidents match these filters.</div>';
    return h + '</div><p class="m">Trends, PDF reports and historical analysis are planned for a later update.</p>';
  }
  function exportCsv() {
    var rows = [['Date', 'Title', 'Category', 'Severity', 'Status', 'Place', 'Latitude', 'Longitude', 'Details']];
    each(filteredInc(), function (r) { rows.push([dayKey(r.time), r.title, TYPE[r.type] || r.type, SEV[r.sev | 0], r.resolved ? 'Resolved' : (r.verified ? 'Active (verified)' : 'Unverified'), r.place || '', r.lat, r.lng, r.desc || '']); });
    download('datasaster-incidents-' + dayKey(Date.now()) + '.csv', rows);
  }

  /* ---------- settings ---------- */
  function vSettings() {
    var h = '<div class="chead"><div><p class="m" style="margin:0">' + esc(org.name) + '</p><h1>Settings</h1></div></div><div class="snav">' + [['profile', 'Public profile'], ['coverage', 'Coverage'], ['account', 'Account']].map(function (s) { return '<button type="button" data-ssec="' + s[0] + '" class="' + (sSec === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div>';
    if (sSec === 'profile') {
      h += '<form class="cpanel cform" id="profForm" novalidate><div class="ph"><h2>Public profile</h2><small>Shown on your announcements.</small></div><div class="body"><div class="row2c"><div class="field"><label class="l">Organization name</label><input type="text" value="' + esc(org.name) + '" disabled></div><div class="field"><label class="l">Type</label><input type="text" value="' + esc(org.type + ' - ' + [org.city, org.province].filter(Boolean).join(', ')) + '" disabled></div></div>'
        + '<div class="hint" style="margin:-6px 0 12px">Set at approval. <a href="mailto:' + MAIL + '?subject=' + encodeURIComponent('Change organization details: ' + org.name) + '">Ask DATAsaster to change it</a></div>'
        + '<div class="field"><label class="l" for="pAddr">Office address</label><input type="text" id="pAddr" maxlength="200" value="' + esc(org.address || '') + '"></div>'
        + '<div class="row2c"><div class="field"><label class="l" for="pHot">Public hotline</label><input type="tel" id="pHot" maxlength="30" value="' + esc(org.hotline || '') + '"></div><div class="field"><label class="l" for="pMail">Public email <span class="m" style="font-weight:400">Optional</span></label><input type="email" id="pMail" maxlength="120" value="' + esc(org.publicEmail || '') + '"></div></div>'
        + '<div class="err" id="pErr" role="alert"></div><button class="btn primary" type="submit">Save profile</button></div></form>';
    } else if (sSec === 'coverage') {
      h += '<div class="cpanel"><div class="ph"><h2>Coverage</h2><small>Read only. Set by the DATAsaster team.</small></div><div class="body"><p><b>Hazard types:</b> ' + esc((org.types || []).map(function (t) { return TYPE[t] || t; }).join(', ') || 'none') + '</p><p><b>Area (latitude, longitude):</b> ' + esc(org.south + ' to ' + org.north + ', ' + org.west + ' to ' + org.east) + '</p><p class="m">You see and act on community reports only for these hazard types inside this area. To change it, email <a href="mailto:' + MAIL + '">' + MAIL + '</a>.</p></div></div>';
    } else {
      h += '<div class="cpanel"><div class="ph"><h2>Account</h2></div><div class="body"><p>Signed in as <b>' + esc(user.email || '') + '</b></p><button class="btn" data-act="out" type="button">Sign out</button></div></div>';
    }
    return h;
  }
  function saveProfile() {
    var a = $('pAddr').value.replace(/^\s+|\s+$/g, ''), hot = $('pHot').value.replace(/^\s+|\s+$/g, ''), em = $('pMail').value.replace(/^\s+|\s+$/g, ''), e = '';
    if (a.length < 3) { e = 'Enter the office address.'; }
    else if (hot && !/^[0-9+() -]{3,30}$/.test(hot)) { e = 'Use only digits, spaces, + ( ) and - in the hotline.'; }
    else if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { e = 'Enter a full email address, like name@example.com.'; }
    $('pErr').textContent = e; if (e) { return; }
    db.collection('organizations').doc(org.id).update({ address: a, hotline: hot, publicEmail: em, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { org.address = a; org.hotline = hot; org.publicEmail = em; toast('Profile saved'); }, function (er) { $('pErr').textContent = errMsg(er); });
  }

  /* ---------- incident actions ---------- */
  function repById(id) { var r = null; each(reports, function (x) { if (x._id === id) { r = x; } }); return r; }
  function incAct(act, id) {
    var r = repById(id), f;
    if (!r || !mine(r)) { return; }
    if (act === 'verify') { f = { verified: true, vOrg: org.id }; }
    else { f = r.resolved ? { resolved: false, resAt: 0, vOrg: org.id } : { resolved: true, resAt: Date.now(), vOrg: org.id }; }
    db.collection('reports').doc(id).update(f).then(function () { toast(act === 'verify' ? 'Marked verified' : (r.resolved ? 'Reopened' : 'Marked resolved')); }, function (er) { toast(errMsg(er)); });
  }

  /* ---------- data ---------- */
  function watch() {
    stopW();
    stopR = db.collection('reports').orderBy('time', 'desc').limit(200).onSnapshot(function (snap) {
      var l = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; l.push(x); }); reports = l;
      if (tab === 'overview' || tab === 'incidents' || tab === 'reports') { if (!(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) { view(); } } else { setShell(); }
    }, function () {});
    stopA = db.collection('announcements').where('orgId', '==', org.id).onSnapshot(function (snap) {
      var l = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; l.push(x); }); anns = l;
      if (tab === 'ann') { var b = $('annList'); if (b) { b.innerHTML = vAnnList(annOf(annTab)); var t = document.querySelectorAll('[data-annt]'); each(t, function (x) { x.textContent = x.textContent.replace(/\s\d+$/, '') + ' ' + annOf(x.getAttribute('data-annt')).length; }); } } else if (tab === 'overview') { view(); }
    }, function () {});
  }
  function stopW() { if (stopR) { stopR(); stopR = null; } if (stopA) { stopA(); stopA = null; } }
  function loadMember(u) {
    member = null; org = null; reports = []; anns = []; stopW(); view();
    db.collection('orgMembers').doc(u.uid).get().then(function (d) {
      if (!d.exists || (d.data() || {}).role !== 'orgadmin') { member = null; view(); return; }
      member = d.data();
      return db.collection('organizations').doc(member.orgId).get().then(function (o) {
        if (!o.exists) { org = null; $('app').innerHTML = '<p class="m" style="padding:24px 0">Your organization record was not found. Email ' + MAIL + '.</p>'; return; }
        org = o.data(); org.id = o.id; view(); if (org.status === 'active') { watch(); }
      });
    }).catch(function () { member = null; view(); });
  }

  /* ---------- events ---------- */
  function onClick(ev) {
    var t = ev.target, n, a, id;
    while (t && t !== document && !(t.getAttribute && (t.getAttribute('data-act') || t.getAttribute('data-tab') || t.getAttribute('data-annt') || t.getAttribute('data-ssec')))) { t = t.parentNode; }
    if (!t || t === document) { return; }
    if ((n = t.getAttribute('data-tab'))) { tab = n; form = null; confirmId = ''; view(); window.scrollTo(0, 0); return; }
    if ((n = t.getAttribute('data-annt'))) { annTab = n; confirmId = ''; view(); return; }
    if ((n = t.getAttribute('data-ssec'))) { sSec = n; view(); return; }
    a = t.getAttribute('data-act'); id = t.getAttribute('data-id');
    if (a === 'forgot') { var fe = $('siEm').value.replace(/^\s+|\s+$/g, ''); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fe)) { $('siErr').textContent = 'Type your email above first, then choose Forgot password.'; return; } auth.sendPasswordResetEmail(fe).then(function () { $('siErr').textContent = ''; toast('If that email has an account, a reset link is on its way.'); }, function () { toast('Could not send the email. Try again later.'); }); return; }
    if (a === 'out') { stopW(); auth.signOut(); return; }
    if (a === 'refresh') { toast('Up to date'); view(); return; }
    if (a === 'verify' || a === 'resolve') { incAct(a, id); return; }
    if (a === 'detail') { openRow = openRow === id ? '' : id; view(); return; }
    if (a === 'csv') { exportCsv(); return; }
    if (a === 'rfreset') { rf = { from: '', to: '', cat: '', st: '' }; view(); return; }
    if (a === 'newann') { form = newForm(); view(); return; }
    if (a === 'cancelann') { form = null; view(); return; }
    if (a === 'saveann') { saveAnn(t.getAttribute('data-st')); return; }
    if (a === 'editann') { var x = annById(id); if (x) { form = { id: x._id, type: x.type, title: x.title, desc: x.desc, areas: x.areas || '', startsAt: x.startsAt, endsAt: x.endsAt, err: '' }; if (tab !== 'ann') { tab = 'ann'; } view(); window.scrollTo(0, 0); } return; }
    if (a === 'endann') { var y = annById(id); if (y) { annWrite(y, { endsAt: Date.now(), status: 'published' }, 'Announcement ended'); } return; }
    if (a === 'delann') { confirmId = id; var b = $('annList'); if (b) { b.innerHTML = vAnnList(annOf(annTab)); } return; }
    if (a === 'keepann') { confirmId = ''; var b2 = $('annList'); if (b2) { b2.innerHTML = vAnnList(annOf(annTab)); } return; }
    if (a === 'delann2') { db.collection('announcements').doc(id).delete().then(function () { toast('Announcement deleted'); }, function (er) { toast(errMsg(er)); }); confirmId = ''; return; }
  }
  function init() {
    var cfg = window.FIREBASE_CONFIG;
    document.addEventListener('click', onClick);
    $('btnOut').addEventListener('click', function () { stopW(); auth.signOut(); });
    $('btnNew').addEventListener('click', function () { tab = 'ann'; form = newForm(); view(); window.scrollTo(0, 0); });
    document.addEventListener('submit', function (ev) {
      var f = ev.target; ev.preventDefault();
      if (f.id === 'siForm') {
        var em = $('siEm').value.replace(/^\s+|\s+$/g, ''), pw = $('siPw').value;
        if (!em || !pw) { $('siErr').textContent = 'Enter your email and password.'; return; }
        $('siErr').textContent = '';
        auth.signInWithEmailAndPassword(em, pw).catch(function (er) { var e2 = $('siErr'); if (e2) { e2.textContent = er && (er.code === 'auth/too-many-requests') ? 'Too many attempts. Wait a few minutes and try again.' : 'Sign-in failed. Check your email and password.'; } });
      } else if (f.id === 'rfForm') { rf = { from: $('rfFrom').value, to: $('rfTo').value, cat: $('rfCat').value, st: $('rfSt').value }; view(); }
      else if (f.id === 'profForm') { saveProfile(); }
    });
    document.addEventListener('input', function (ev) {
      if (form && $('aPrev') && /^a(Title|Desc)$/.test(ev.target.id || '')) { readForm(); var pv = $('aPrev'); pv.querySelectorAll('div')[0].innerHTML = '<b>' + esc(form.title || 'Title') + '</b>'; pv.querySelectorAll('div')[1].textContent = (form.desc || 'Description').substring(0, 140); }
    });
    document.addEventListener('change', function (ev) { if (form && ev.target.name === 'atype') { readForm(); view(); } });
    setInterval(function () { $('clk').textContent = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' }); }, 1000);
    $('clk').textContent = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' });
    if (!cfg || !cfg.apiKey || !window.firebase) { view(); return; }
    try {
      firebase.initializeApp(cfg);
      if (firebase.appCheck) {
        try {
          if (window.APPCHECK_ENTERPRISE_KEY) { firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(window.APPCHECK_ENTERPRISE_KEY), true); }
          else if (window.APPCHECK_SITE_KEY) { firebase.appCheck().activate(window.APPCHECK_SITE_KEY, true); }
        } catch (e0) {}
      }
      db = firebase.firestore(); auth = firebase.auth();
    } catch (e) { db = null; view(); return; }
    auth.onAuthStateChanged(function (u) {
      if (u && !u.isAnonymous) { user = u; loadMember(u); }
      else { user = null; member = null; org = null; stopW(); view(); }
    });
  }
  init();
}());
