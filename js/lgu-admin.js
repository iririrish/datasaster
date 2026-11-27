/* LGU super admin page (phase 3). OWNER ONLY: the real check is firestore.rules (isOwner), this page only reads the owner's admins/<uid> document
   to decide what to show. Applications, private notes, uploaded letters, organizations, organization admins and announcement moderation. */
(function () {
  'use strict';
  var TYPES = ['flood', 'fire', 'quake', 'volcano', 'typhoon', 'landslide'], TL = { flood: 'Flooding', fire: 'Fire', quake: 'Earthquake', volcano: 'Volcanic', typhoon: 'Typhoon', landslide: 'Landslide' };
  var ST = { pending: 'Pending', review: 'Under Review', approved: 'Approved', rejected: 'Rejected' }, STC = { pending: 'unv', review: 'act', approved: 'res', rejected: 'gen' };
  var db, auth, user = null, owner = false, tab = 'apps', apps = [], orgs = [], anns = [], members = [], notes = [], sel = '', selOrg = '', form = null, msg = '', filt = { st: '', q: '' }, confirm = '', busy = false;
  var unsub = [], unMem = null, unNotes = null, MAIL = 'aitetha8@gmail.com';
  function $(id) { return document.getElementById(id); }
  function each(a, f) { var i; for (i = 0; i < a.length; i++) { f(a[i], i); } }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ms(v) { return v && v.toMillis ? v.toMillis() : (typeof v === 'number' ? v : 0); }
  function fmt(v) { var t = ms(v); return t ? new Date(t).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'; }
  function fmtD(t) { return new Date(t).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(function () { t.className = 'toast'; }, 2800); }
  function errMsg(er) { return er && er.code === 'permission-denied' ? 'Not allowed. Only the owner account can do this, and the data must be valid.' : 'Something went wrong (' + ((er && (er.code || er.message)) || 'unknown') + ').'; }
  function byId(l, id) { var r = null; each(l, function (x) { if (x._id === id) { r = x; } }); return r; }
  function snapList(snap) { var l = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; l.push(x); }); return l; }
  function chip(k, t) { return '<span class="chip ' + k + '">' + t + '</span>'; }
  function ts() { return firebase.firestore.FieldValue.serverTimestamp(); }
  function randId(n) { var A = 'abcdefghijklmnopqrstuvwxyz0123456789', s = '', i, a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a); for (i = 0; i < n; i++) { s += A.charAt(a[i] % A.length); } return s; }

  /* ---------- shell ---------- */
  function setShell() {
    var on = !!(user && owner), n = apps.filter(function (a) { return a.status === 'pending'; }).length, h = '';
    $('ctabs').hidden = !on; $('btnOut').hidden = !user;
    $('who').innerHTML = on ? '<span class="partnertag">SUPER ADMIN</span><span class="m">' + esc(user.email || '') + '</span>' : 'Sign in to continue';
    if (on) { each([['apps', 'Applications'], ['orgs', 'Organizations & roles'], ['anns', 'Announcements']], function (t) { h += '<button type="button" data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + t[1] + (t[0] === 'apps' && n ? '<span class="n">' + n + '</span>' : '') + '</button>'; }); $('ctabs').innerHTML = h; }
  }
  function view() {
    var el = $('app'), keep = document.activeElement && document.activeElement.id;
    setShell();
    if (!db) { el.innerHTML = '<p class="m" style="padding:24px 0">Not available right now.</p>'; return; }
    if (!user) { el.innerHTML = '<form class="cpanel signin cform" id="siForm" novalidate><div class="body"><h2 style="font-size:20px;margin-bottom:4px">Super admin sign in</h2><p class="m" style="margin:0 0 14px">For the DATAsaster owner account only.</p><div class="field"><label class="l" for="siEm">Email</label><input type="email" id="siEm" autocomplete="username"></div><div class="field"><label class="l" for="siPw">Password</label><input type="password" id="siPw" autocomplete="current-password"></div><div class="err" id="siErr" role="alert"></div><button class="btn primary" type="submit">Sign in</button></div></form>'; return; }
    if (!owner) { el.innerHTML = '<div class="cpanel signin"><div class="body"><h2 style="font-size:18px;margin-bottom:6px">Owner account required</h2><p class="m">' + esc(user.email || '') + ' is not the owner account. The owner has an <code>admins</code> document without a role (or with role owner).</p><button class="btn" data-act="out" type="button">Sign out</button></div></div>'; return; }
    el.innerHTML = tab === 'apps' ? vApps() : (tab === 'orgs' ? vOrgs() : vAnns());
    if (keep && $(keep) && /INPUT|TEXTAREA/.test($(keep).tagName) && keep !== 'siEm') { try { $(keep).focus(); if ($(keep).setSelectionRange && $(keep).type === 'text') { var L = $(keep).value.length; $(keep).setSelectionRange(L, L); } } catch (e) {} }
  }

  /* ---------- applications ---------- */
  function appsFiltered() {
    var q = filt.q.toLowerCase();
    return apps.filter(function (a) { return (!filt.st || a.status === filt.st) && (!q || (a.orgName + ' ' + a.refNo + ' ' + a.repName + ' ' + a.city + ' ' + a.province + ' ' + a.email).toLowerCase().indexOf(q) > -1); });
  }
  function vApps() {
    var c = { pending: 0, review: 0, approved: 0, rejected: 0 }, l = appsFiltered(), h;
    each(apps, function (a) { if (c[a.status] !== undefined) { c[a.status]++; } });
    h = '<div class="chead"><div><h1>Partnership applications</h1><p>Review submissions, add private notes and approve or reject. Applicants are contacted by email.</p></div></div><div class="stats">';
    each(['pending', 'review', 'approved', 'rejected'], function (k) { h += '<div class="stat"><small>' + ST[k] + '</small><b>' + c[k] + '</b></div>'; });
    h += '</div><div class="cpanel cform"><div class="body"><div class="filters"><div class="field"><label class="l" for="fSt">Status</label><select id="fSt"><option value="">All statuses</option>' + ['pending', 'review', 'approved', 'rejected'].map(function (k) { return '<option value="' + k + '"' + (filt.st === k ? ' selected' : '') + '>' + ST[k] + '</option>'; }).join('') + '</select></div><div class="field" style="flex:2"><label class="l" for="fQ">Search</label><input type="text" id="fQ" placeholder="Organization, reference, name, place" value="' + esc(filt.q) + '"></div></div></div></div>';
    h += '<div class="cgrid2" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="cpanel"><div class="ph"><h2>Applications</h2><small>' + l.length + ' shown</small></div>';
    h += l.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Reference</th><th>Organization</th><th>Submitted</th><th>Status</th></tr></thead><tbody>' + l.map(function (a) { return '<tr data-act="pick" data-id="' + a._id + '" style="cursor:pointer' + (sel === a._id ? ';background:var(--panel2)' : '') + '"><td>' + esc(a.refNo) + '</td><td><b>' + esc(a.orgName) + '</b><small>' + esc(a.orgType) + ' &middot; ' + esc(a.city) + ', ' + esc(a.province) + '</small></td><td>' + fmt(a.time) + '</td><td>' + chip(STC[a.status] || 'gen', ST[a.status] || esc(a.status)) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="body m">No applications' + (apps.length ? ' match these filters.' : ' yet.') + '</div>';
    h += '</div><div id="appDetail">' + vAppDetail() + '</div></div>';
    return h;
  }
  function row(k, v) { return '<tr><td class="m" style="width:38%">' + k + '</td><td>' + (v === '' || v == null ? '<span class="m">-</span>' : v) + '</td></tr>'; }
  function vAppDetail() {
    var a = byId(apps, sel), h, base;
    if (!a) { return '<div class="cpanel"><div class="body m">Choose an application to review it.</div></div>'; }
    base = ms(a.decidedAt) || ms(a.time);
    h = '<div class="cpanel"><div class="ph"><h2>' + esc(a.orgName) + '</h2>' + chip(STC[a.status] || 'gen', ST[a.status] || esc(a.status)) + '</div><div class="tblwrap"><table class="tbl"><tbody>'
      + row('Reference', esc(a.refNo)) + row('Type', esc(a.orgType)) + row('Location', esc([a.barangay, a.city, a.province].filter(Boolean).join(', '))) + row('Office address', esc(a.address))
      + row('Representative', esc(a.repName) + ' (' + esc(a.position) + ')') + row('Email', '<a href="mailto:' + esc(a.email) + '">' + esc(a.email) + '</a>') + row('Phone', esc(a.phone))
      + row('Purpose', esc(a.purpose)) + row('Message', esc(a.message).replace(/\n/g, '<br>')) + row('Submitted', fmt(a.time))
      + row('Letter of intent', a.hasDoc ? '<button class="btn sm" data-act="doc" data-id="' + a._id + '" type="button">View ' + esc(a.docName) + '</button> <small>' + Math.max(1, Math.round((a.docSize || 0) / 1024)) + ' KB</small>' : 'None')
      + (a.orgId ? row('Organization', '<a href="#" data-act="goorg" data-id="' + esc(a.orgId) + '">' + esc(a.orgId) + '</a>') : '') + '</tbody></table></div>'
      + '<div class="body"><div class="m" style="font-size:11px;font-weight:700;letter-spacing:.06em;margin-bottom:6px">STATUS</div><div class="acts" style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<button class="btn sm" data-act="setst" data-st="pending" data-id="' + a._id + '" type="button"' + (a.status === 'pending' ? ' disabled' : '') + '>Pending</button><button class="btn sm" data-act="setst" data-st="review" data-id="' + a._id + '" type="button"' + (a.status === 'review' ? ' disabled' : '') + '>Under Review</button>'
      + (a.status !== 'approved' ? '<button class="btn sm primary" data-act="approve" data-id="' + a._id + '" type="button">Approve and create organization</button>' : '') + (a.status !== 'rejected' ? '<button class="btn sm danger" data-act="setst" data-st="rejected" data-id="' + a._id + '" type="button">Reject</button>' : '')
      + '<a class="btn sm" href="mailto:' + esc(a.email) + '?subject=' + encodeURIComponent('DATAsaster partnership application ' + a.refNo) + '">Email applicant</a></div></div></div>';
    h += '<div class="cpanel"><div class="ph"><h2>Private notes</h2><small>Only you can see these.</small></div><div id="noteList">' + vNotes() + '</div><div class="body cform"><div class="field"><textarea id="noteText" maxlength="2000" placeholder="Add a private note"></textarea></div><button class="btn sm" data-act="addnote" data-id="' + a._id + '" type="button">Add note</button></div></div>';
    h += '<div class="cpanel"><div class="ph"><h2>Retention</h2></div><div class="body"><p class="m" style="margin-top:0">Per the Privacy Policy: ' + (a.status === 'approved' ? 'the letter is deleted 90 days after approval; the application 12 months after the partnership ends.' : 'the letter is deleted 90 days and the application 12 months after the decision.') + (a.status === 'pending' || a.status === 'review' ? ' No decision yet.' : ' Decision date: ' + fmtD(base) + '. Letter due: ' + fmtD(base + 90 * 86400000) + (a.status === 'rejected' ? '. Application due: ' + fmtD(base + 365 * 86400000) : '') + '.') + '</p>'
      + (a.hasDoc ? '<button class="btn sm danger" data-act="deldoc" data-id="' + a._id + '" type="button">Delete letter now</button> ' : '') + '<button class="btn sm danger" data-act="delapp" data-id="' + a._id + '" type="button">Delete application</button>'
      + (confirm && confirm.id === a._id ? '<div class="confirm" style="margin-top:10px"><b>' + (confirm.kind === 'app' ? 'Delete this application, its notes and its letter?' : 'Delete the uploaded letter?') + '</b><p class="m" style="margin:4px 0 8px">This cannot be undone.</p><button class="btn sm" data-act="keep" type="button">Keep</button> <button class="btn sm danger" data-act="del2" type="button">Delete</button></div>' : '') + '</div></div>';
    return h;
  }
  function vNotes() { return notes.length ? notes.map(function (n) { return '<div class="annrow"><div class="meta">' + fmt(n.time) + (n.by ? ' &middot; ' + esc(n.by) : '') + '</div>' + esc(n.text).replace(/\n/g, '<br>') + '</div>'; }).join('') : '<div class="body m">No notes yet.</div>'; }
  function pick(id) {
    sel = id; confirm = ''; notes = []; if (unNotes) { unNotes(); unNotes = null; }
    if (id) { unNotes = db.collection('applications').doc(id).collection('notes').orderBy('time', 'desc').onSnapshot(function (s) { notes = snapList(s); var b = $('noteList'); if (b) { b.innerHTML = vNotes(); } }, function () {}); }
    view();
  }
  function setStatus(id, st) {
    var f = { status: st, updatedAt: ts() };
    if (st === 'approved' || st === 'rejected') { f.decidedAt = Date.now(); } else { f.decidedAt = 0; }
    return db.collection('applications').doc(id).update(f).then(function () { toast('Status: ' + ST[st]); }, function (er) { toast(errMsg(er)); });
  }
  function viewDoc(id) {
    var a = byId(apps, id), w;
    if (!a) { return; }
    w = window.open('', '_blank');
    db.collection('applicationDocs').doc(id).get().then(function (d) {
      var bin, arr, i, blob, type = a.docType;
      if (!d.exists || ['application/pdf', 'image/jpeg', 'image/png'].indexOf(type) < 0) { if (w) { w.close(); } toast('No letter found.'); return; }
      bin = atob(d.data().data); arr = new Uint8Array(bin.length); for (i = 0; i < bin.length; i++) { arr[i] = bin.charCodeAt(i); }
      blob = new Blob([arr], { type: type });
      if (w) { w.location.href = URL.createObjectURL(blob); } else { toast('Allow pop-ups to view the letter.'); }
    }, function (er) { if (w) { w.close(); } toast(errMsg(er)); });
  }
  function addNote(id) {
    var t = $('noteText').value.replace(/^\s+|\s+$/g, '');
    if (!t) { return; }
    db.collection('applications').doc(id).collection('notes').doc().set({ text: t, time: ts(), by: user.email || '' }).then(function () { $('noteText').value = ''; toast('Note added'); }, function (er) { toast(errMsg(er)); });
  }
  function deleteApp(id, docOnly) {
    var a = byId(apps, id);
    if (docOnly) {
      return db.collection('applicationDocs').doc(id).delete().then(function () { toast('Letter deleted'); }, function (er) { toast(errMsg(er)); });
    }
    return db.collection('applications').doc(id).collection('notes').get().then(function (s) {
      var b = db.batch(); s.forEach(function (d) { b.delete(d.ref || db.collection('applications').doc(id).collection('notes').doc(d.id)); });
      if (a && a.hasDoc) { b.delete(db.collection('applicationDocs').doc(id)); }
      b.delete(db.collection('applications').doc(id)); return b.commit();
    }).then(function () { sel = ''; toast('Application deleted'); view(); }, function (er) { toast(errMsg(er)); });
  }

  /* ---------- organization form (used for approval and editing) ---------- */
  function orgFormFrom(a, o) {
    if (o) { return { id: o._id, edit: true, appId: o.appId || '', name: o.name, type: o.type, province: o.province, city: o.city, barangay: o.barangay || '', address: o.address, hotline: o.hotline || '', publicEmail: o.publicEmail || '', types: (o.types || []).slice(), south: o.south, north: o.north, west: o.west, east: o.east, status: o.status, err: '' }; }
    return { id: '', edit: false, appId: a._id, name: a.orgName, type: a.orgType, province: a.province, city: a.city, barangay: a.barangay || '', address: a.address, hotline: '', publicEmail: '', types: TYPES.slice(), south: '', north: '', west: '', east: '', status: 'active', err: '' };
  }
  function vOrgForm() {
    var f = form;
    return '<form class="cpanel cform" id="orgForm" novalidate><div class="ph"><h2>' + (f.edit ? 'Edit organization' : 'Create organization') + '</h2><small>' + (f.edit ? '' : 'From the application. Set the hazard types and the area it covers.') + '</small></div><div class="body">'
      + '<div class="row2c"><div class="field"><label class="l" for="oName">Name</label><input type="text" id="oName" maxlength="120" value="' + esc(f.name) + '"></div><div class="field"><label class="l" for="oType">Type</label><select id="oType">' + ['City', 'Municipality', 'Barangay', 'HOA', 'Other'].map(function (t) { return '<option' + (f.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div></div>'
      + '<div class="row2c"><div class="field"><label class="l" for="oProv">Province</label><input type="text" id="oProv" value="' + esc(f.province) + '"></div><div class="field"><label class="l" for="oCity">City / Municipality</label><input type="text" id="oCity" value="' + esc(f.city) + '"></div></div>'
      + '<div class="row2c"><div class="field"><label class="l" for="oBrgy">Barangay <span class="m" style="font-weight:400">Optional</span></label><input type="text" id="oBrgy" value="' + esc(f.barangay) + '"></div><div class="field"><label class="l" for="oAddr">Office address</label><input type="text" id="oAddr" value="' + esc(f.address) + '"></div></div>'
      + '<div class="row2c"><div class="field"><label class="l" for="oHot">Public hotline <span class="m" style="font-weight:400">Optional</span></label><input type="tel" id="oHot" value="' + esc(f.hotline) + '"></div><div class="field"><label class="l" for="oMail">Public email <span class="m" style="font-weight:400">Optional</span></label><input type="email" id="oMail" value="' + esc(f.publicEmail) + '"></div></div>'
      + '<div class="field"><span class="l">Hazard types this organization can act on</span><div class="radios">' + TYPES.map(function (t) { return '<label><input type="checkbox" name="otype" value="' + t + '"' + (f.types.indexOf(t) > -1 ? ' checked' : '') + '> ' + TL[t] + '</label>'; }).join('') + '</div></div>'
      + '<div class="field"><span class="l">Coverage box (decimal degrees)</span><div class="row2c"><input type="text" id="oS" placeholder="South latitude, e.g. 13.70" value="' + esc(f.south) + '"><input type="text" id="oN" placeholder="North latitude, e.g. 13.80" value="' + esc(f.north) + '"></div><div class="row2c" style="margin-top:8px"><input type="text" id="oW" placeholder="West longitude, e.g. 121.00" value="' + esc(f.west) + '"><input type="text" id="oE" placeholder="East longitude, e.g. 121.10" value="' + esc(f.east) + '"></div><div class="hint">The organization sees and acts on community reports only inside this box. Read a box off the map at bboxfinder.com. Philippines only.</div></div>'
      + (f.edit ? '<div class="field"><label class="l" for="oStat">Status</label><select id="oStat"><option value="active"' + (f.status === 'active' ? ' selected' : '') + '>Active</option><option value="suspended"' + (f.status === 'suspended' ? ' selected' : '') + '>Suspended</option></select></div>' : '')
      + '<div class="err" id="oErr" role="alert">' + esc(f.err) + '</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">' + (f.edit ? 'Save organization' : 'Approve and create organization') + '</button><button class="btn" type="button" data-act="cancelform">Cancel</button></div></div></form>';
  }
  function readOrgForm() {
    var f = form, t = [], n;
    f.name = $('oName').value.replace(/^\s+|\s+$/g, ''); f.type = $('oType').value; f.province = $('oProv').value.replace(/^\s+|\s+$/g, ''); f.city = $('oCity').value.replace(/^\s+|\s+$/g, '');
    f.barangay = $('oBrgy').value.replace(/^\s+|\s+$/g, ''); f.address = $('oAddr').value.replace(/^\s+|\s+$/g, ''); f.hotline = $('oHot').value.replace(/^\s+|\s+$/g, ''); f.publicEmail = $('oMail').value.replace(/^\s+|\s+$/g, '');
    each(document.querySelectorAll('input[name=otype]:checked'), function (c) { t.push(c.value); }); f.types = t;
    f.south = $('oS').value; f.north = $('oN').value; f.west = $('oW').value; f.east = $('oE').value; if ($('oStat')) { f.status = $('oStat').value; }
    n = ['south', 'north', 'west', 'east']; each(n, function (k) { f[k] = String(f[k]).replace(/^\s+|\s+$/g, ''); });
  }
  function saveOrg() {
    var f, S, N, W, E, d, id, b, e = '';
    readOrgForm(); f = form; S = parseFloat(f.south); N = parseFloat(f.north); W = parseFloat(f.west); E = parseFloat(f.east);
    if (f.name.length < 3) { e = 'Enter the organization name.'; } else if (f.province.length < 2 || f.city.length < 2) { e = 'Enter the province and city or municipality.'; } else if (f.address.length < 3) { e = 'Enter the office address.'; }
    else if (f.hotline && !/^[0-9+() -]{3,30}$/.test(f.hotline)) { e = 'Hotline: digits, spaces, + ( ) and - only.'; } else if (f.publicEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.publicEmail)) { e = 'Enter a full public email address.'; }
    else if (!f.types.length) { e = 'Choose at least one hazard type.'; } else if (isNaN(S) || isNaN(N) || isNaN(W) || isNaN(E)) { e = 'Enter all four coverage numbers.'; }
    else if (S >= N || W >= E) { e = 'South must be less than north, and west less than east.'; } else if (S < 4 || N > 22 || W < 116 || E > 127) { e = 'The box must be inside the Philippines (latitude 4 to 22, longitude 116 to 127).'; }
    f.err = e; if (e) { $('oErr').textContent = e; return; }
    id = f.edit ? f.id : (f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 30) + '-' + randId(4));
    d = { name: f.name, type: f.type, province: f.province, city: f.city, barangay: f.barangay, address: f.address, hotline: f.hotline, publicEmail: f.publicEmail, status: f.edit ? f.status : 'active', types: f.types, south: S, north: N, west: W, east: E, appId: f.appId || '', updatedAt: ts() };
    b = db.batch(); b.set(db.collection('organizations').doc(id), d);
    if (!f.edit && f.appId) { b.update(db.collection('applications').doc(f.appId), { status: 'approved', decidedAt: Date.now(), orgId: id, updatedAt: ts() }); }
    b.commit().then(function () { toast(f.edit ? 'Organization saved' : 'Approved. Organization created.'); form = null; tab = 'orgs'; selOrg = id; watchMembers(id); view(); }, function (er) { f.err = errMsg(er); if ($('oErr')) { $('oErr').textContent = f.err; } });
  }

  /* ---------- organizations and admins ---------- */
  function vOrgs() {
    var h = '<div class="chead"><div><h1>Organizations &amp; roles</h1><p>Approved partner organizations and the people who can sign in for them. Create an organization by approving an application.</p></div></div>';
    if (form) { return h + vOrgForm(); }
    h += '<div class="cgrid2" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="cpanel"><div class="ph"><h2>Organizations</h2><small>' + orgs.length + '</small></div>';
    h += orgs.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Organization</th><th>Hazard types</th><th>Status</th></tr></thead><tbody>' + orgs.map(function (o) { return '<tr data-act="pickorg" data-id="' + o._id + '" style="cursor:pointer' + (selOrg === o._id ? ';background:var(--panel2)' : '') + '"><td><b>' + esc(o.name) + '</b><small>' + esc(o.type) + ' &middot; ' + esc(o.city) + ', ' + esc(o.province) + '</small></td><td>' + esc((o.types || []).map(function (t) { return TL[t] || t; }).join(', ')) + '</td><td>' + chip(o.status === 'active' ? 'res' : 'gen', o.status === 'active' ? 'ACTIVE' : 'SUSPENDED') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="body m">No organizations yet. Approve an application to create one.</div>';
    h += '</div><div id="orgDetail">' + vOrgDetail() + '</div></div>';
    return h;
  }
  function vOrgDetail() {
    var o = byId(orgs, selOrg), h;
    if (!o) { return '<div class="cpanel"><div class="body m">Choose an organization.</div></div>'; }
    h = '<div class="cpanel"><div class="ph"><h2>' + esc(o.name) + '</h2>' + chip(o.status === 'active' ? 'res' : 'gen', o.status === 'active' ? 'ACTIVE' : 'SUSPENDED') + '</div><div class="tblwrap"><table class="tbl"><tbody>' + row('Coverage', esc(o.south + ' to ' + o.north + ', ' + o.west + ' to ' + o.east)) + row('Address', esc(o.address)) + row('Hotline', esc(o.hotline || '')) + row('Public email', esc(o.publicEmail || '')) + '</tbody></table></div>'
      + '<div class="body"><button class="btn sm" data-act="editorg" data-id="' + o._id + '" type="button">Edit</button> <button class="btn sm ' + (o.status === 'active' ? 'danger' : '') + '" data-act="toggleorg" data-id="' + o._id + '" type="button">' + (o.status === 'active' ? 'Suspend' : 'Activate') + '</button></div></div>';
    h += '<div class="cpanel"><div class="ph"><h2>Organization admins</h2></div>' + (members.length ? members.map(function (m) { return '<div class="annrow" style="display:flex;gap:8px;align-items:center"><div style="flex:1"><b>' + esc(m.email || '(no email saved)') + '</b><div class="meta">Role: organization admin &middot; ' + esc(m._id) + '</div></div><button class="btn sm danger" data-act="rmmem" data-id="' + esc(m._id) + '" type="button">Remove</button></div>'; }).join('') : '<div class="body m">No admin yet.</div>')
      + '<form class="body cform" id="memForm" novalidate><div class="field"><label class="l" for="mEm">Add an admin by email</label><input type="email" id="mEm" placeholder="name@example.com" value="' + esc(msg && msg.email || '') + '"></div><div class="hint" style="margin:-6px 0 10px">Creates their account and emails them a link to set a password (sent by Firebase, it may land in spam).</div><div class="field"><label class="l" for="mUid">Or link an existing account by its UID <span class="m" style="font-weight:400">Optional</span></label><input type="text" id="mUid" placeholder="Firebase Authentication user UID"></div><div class="err" id="mErr" role="alert">' + esc(msg && msg.err || '') + '</div><button class="btn primary" type="submit">Add admin</button></form></div>';
    return h;
  }
  function watchMembers(oid) {
    if (unMem) { unMem(); unMem = null; } members = [];
    if (oid) { unMem = db.collection('orgMembers').where('orgId', '==', oid).onSnapshot(function (s) { members = snapList(s); var b = $('orgDetail'); if (b && tab === 'orgs' && !form) { b.innerHTML = vOrgDetail(); } }, function () {}); }
  }
  function addAdmin() {
    var em = $('mEm').value.replace(/^\s+|\s+$/g, '').toLowerCase(), uid = $('mUid').value.replace(/^\s+|\s+$/g, ''), o = byId(orgs, selOrg), cfg = window.FIREBASE_CONFIG, app2, a2, pw;
    function fail(t) { msg = { err: t, email: em }; var e = $('mErr'); if (e) { e.textContent = t; } busy = false; }
    function link(u, note) {
      db.collection('orgMembers').doc(u).set({ role: 'orgadmin', orgId: o._id, email: em }).then(function () { msg = null; busy = false; toast(note || 'Admin added'); }, function (er) { fail(errMsg(er)); });
    }
    if (busy || !o) { return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { fail('Enter a full email address.'); return; }
    busy = true; fail('');
    if (uid) { if (!/^[A-Za-z0-9]{20,40}$/.test(uid)) { fail('That UID does not look right.'); return; } link(uid); return; }
    try { app2 = firebase.apps.filter(function (x) { return x.name === 'invite'; })[0] || firebase.initializeApp(cfg, 'invite'); a2 = app2.auth(); } catch (e) { fail('Could not start the account helper.'); return; }
    pw = randId(24) + 'A1!';
    a2.createUserWithEmailAndPassword(em, pw).then(function (cred) {
      var u2 = cred.user.uid;
      return a2.sendPasswordResetEmail(em).catch(function () { toast('Account created, but the email could not be sent. Ask them to use "Forgot password" on the console page.'); }).then(function () { return a2.signOut(); }).then(function () { link(u2, 'Admin added. A password email was sent to ' + em); });
    }, function (er) { fail(er && er.code === 'auth/email-already-in-use' ? 'That email already has an account. Find its UID in Firebase Authentication and paste it in the UID box.' : 'Could not create the account (' + ((er && er.code) || 'unknown') + ').'); });
  }
  function toggleOrg(id) {
    var o = byId(orgs, id), d;
    if (!o) { return; }
    d = { name: o.name, type: o.type, province: o.province, city: o.city, barangay: o.barangay || '', address: o.address, hotline: o.hotline || '', publicEmail: o.publicEmail || '', status: o.status === 'active' ? 'suspended' : 'active', types: o.types, south: o.south, north: o.north, west: o.west, east: o.east, appId: o.appId || '', updatedAt: ts() };
    db.collection('organizations').doc(id).set(d).then(function () { toast(d.status === 'active' ? 'Organization activated' : 'Organization suspended'); }, function (er) { toast(errMsg(er)); });
  }

  /* ---------- announcements moderation ---------- */
  function vAnns() {
    var l = anns.slice().sort(function (a, b) { return (b.startsAt || 0) - (a.startsAt || 0); }), n = Date.now();
    return '<div class="chead"><div><h1>Announcements</h1><p>Every organization\'s announcements. Delete anything unsafe or wrong. Organizations manage their own from their console.</p></div></div><div class="cpanel">' + (l.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Announcement</th><th>Organization</th><th>Status</th><th></th></tr></thead><tbody>' + l.map(function (a) { var st = a.status === 'draft' ? 'DRAFT' : (a.startsAt > n ? 'SCHEDULED' : (a.endsAt > n ? 'ACTIVE' : 'ENDED')); return '<tr><td><b>' + esc(a.title) + '</b><small>' + esc(a.type) + ' &middot; ' + fmt(a.startsAt) + ' to ' + fmt(a.endsAt) + '</small></td><td>' + esc(a.orgName) + '</td><td>' + chip(st === 'ACTIVE' ? 'res' : (st === 'DRAFT' ? 'unv' : 'gen'), st) + '</td><td class="act">' + (confirm && confirm.id === a._id ? '<button class="btn sm" data-act="keep" type="button">Keep</button> <button class="btn sm danger" data-act="del2" type="button">Delete</button>' : '<button class="btn sm danger" data-act="delann" data-id="' + a._id + '" type="button">Delete</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="body m">No announcements yet.</div>') + '</div>';
  }

  /* ---------- data ---------- */
  function stopAll() { each(unsub, function (f) { f(); }); unsub = []; if (unMem) { unMem(); unMem = null; } if (unNotes) { unNotes(); unNotes = null; } }
  function watch() {
    stopAll();
    unsub.push(db.collection('applications').orderBy('time', 'desc').limit(300).onSnapshot(function (s) { apps = snapList(s); if (tab === 'apps') { var d = $('appDetail'); if (d && document.activeElement && document.activeElement.id === 'noteText') { setShell(); } else { view(); } } else { setShell(); } }, function () {}));
    unsub.push(db.collection('organizations').onSnapshot(function (s) { orgs = snapList(s); if (tab === 'orgs' && !form && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) { view(); } }, function () {}));
    unsub.push(db.collection('announcements').limit(200).onSnapshot(function (s) { anns = snapList(s); if (tab === 'anns') { view(); } }, function () {}));
  }
  function checkOwner(u) {
    owner = false; view();
    db.collection('admins').doc(u.uid).get().then(function (d) {
      var r = d.exists ? ((d.data() || {}).role || 'owner') : null;
      owner = !!(d.exists && (r === 'owner' || r === 'admin')); view(); if (owner) { watch(); }
    }).catch(function () { owner = false; view(); });
  }

  /* ---------- events ---------- */
  function onClick(ev) {
    var t = ev.target, n, a, id;
    while (t && t !== document && !(t.getAttribute && (t.getAttribute('data-act') || t.getAttribute('data-tab')))) { t = t.parentNode; }
    if (!t || t === document) { return; }
    if (t.tagName === 'A' && t.getAttribute('data-act') === 'goorg') { ev.preventDefault(); }
    if ((n = t.getAttribute('data-tab'))) { tab = n; form = null; confirm = ''; view(); return; }
    a = t.getAttribute('data-act'); id = t.getAttribute('data-id');
    if (a === 'out') { stopAll(); auth.signOut(); }
    else if (a === 'pick') { pick(id); }
    else if (a === 'setst') { setStatus(id, t.getAttribute('data-st')); }
    else if (a === 'approve') { form = orgFormFrom(byId(apps, id)); tab = 'orgs'; selOrg = ''; view(); window.scrollTo(0, 0); }
    else if (a === 'doc') { viewDoc(id); }
    else if (a === 'addnote') { addNote(id); }
    else if (a === 'deldoc') { confirm = { id: id, kind: 'doc' }; view(); }
    else if (a === 'delapp') { confirm = { id: id, kind: 'app' }; view(); }
    else if (a === 'keep') { confirm = ''; view(); }
    else if (a === 'del2') { var c = confirm; confirm = ''; if (c && c.kind) { deleteApp(c.id, c.kind === 'doc'); } else if (c && c.id && tab === 'anns') { db.collection('announcements').doc(c.id).delete().then(function () { toast('Announcement deleted'); }, function (er) { toast(errMsg(er)); }); } }
    else if (a === 'goorg') { tab = 'orgs'; selOrg = id; watchMembers(id); view(); }
    else if (a === 'pickorg') { selOrg = id; msg = null; watchMembers(id); view(); }
    else if (a === 'editorg') { form = orgFormFrom(null, byId(orgs, id)); view(); }
    else if (a === 'cancelform') { form = null; view(); }
    else if (a === 'toggleorg') { toggleOrg(id); }
    else if (a === 'rmmem') { db.collection('orgMembers').doc(id).delete().then(function () { toast('Admin removed'); }, function (er) { toast(errMsg(er)); }); }
    else if (a === 'delann') { confirm = { id: id }; view(); }
  }
  function init() {
    var cfg = window.FIREBASE_CONFIG;
    document.addEventListener('click', onClick);
    $('btnOut').addEventListener('click', function () { stopAll(); auth.signOut(); });
    document.addEventListener('submit', function (ev) {
      var f = ev.target; ev.preventDefault();
      if (f.id === 'siForm') {
        var em = $('siEm').value.replace(/^\s+|\s+$/g, ''), pw = $('siPw').value;
        if (!em || !pw) { $('siErr').textContent = 'Enter your email and password.'; return; }
        auth.signInWithEmailAndPassword(em, pw).catch(function () { var e2 = $('siErr'); if (e2) { e2.textContent = 'Sign-in failed. Check your email and password.'; } });
      } else if (f.id === 'orgForm') { saveOrg(); } else if (f.id === 'memForm') { addAdmin(); }
    });
    document.addEventListener('input', function (ev) { if (ev.target.id === 'fQ') { filt.q = ev.target.value; var l = $('app'); view(); } });
    document.addEventListener('change', function (ev) { if (ev.target.id === 'fSt') { filt.st = ev.target.value; view(); } });
    setInterval(function () { $('clk').textContent = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' }); }, 1000);
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
      if (u && !u.isAnonymous) { user = u; checkOwner(u); } else { user = null; owner = false; stopAll(); view(); }
    });
  }
  init();
}());
