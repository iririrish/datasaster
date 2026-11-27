/* LGU Partnership application form (phase 1). Own small Firebase start-up, so this page does not load the map app.
   One submit = ONE write batch: the application, the optional private document, and applyLimits/<uid> (the rate limit).
   firestore.rules checks all three together, so one batch cannot carry two applications. */
(function () {
  'use strict';
  var MAX_FILE = 614400, TYPES = { 'application/pdf': 1, 'image/jpeg': 1, 'image/png': 1 }, DRAFT = 'datasaster_apply_draft';
  var TEXT = ['orgName', 'province', 'city', 'barangay', 'address', 'repName', 'position', 'email', 'phone', 'purpose', 'message'];
  var db = null, auth = null, uid = '', file = null, busy = false;
  function $(id) { return document.getElementById(id); }
  function each(a, f) { var i; for (i = 0; i < a.length; i++) { f(a[i], i); } }
  function trim(s) { return String(s == null ? '' : s).replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' '); }
  function lsGet() { try { return JSON.parse(window.localStorage.getItem(DRAFT) || 'null'); } catch (e) { return null; } }
  function lsSet(v) { try { if (v === null) { window.localStorage.removeItem(DRAFT); } else { window.localStorage.setItem(DRAFT, JSON.stringify(v)); } } catch (e) {} }

  function radio() { var r = document.querySelector('input[name=orgType]:checked'); return r ? r.value : ''; }
  function values() {
    var v = {}; each(TEXT, function (k) { v[k] = k === 'message' ? String($(k).value || '').replace(/^\s+|\s+$/g, '') : trim($(k).value); });
    v.orgType = radio(); v.agreed = $('agreed').checked; return v;
  }

  /* Returns { field: message } for everything wrong. Same limits as firestore.rules. */
  function check(v) {
    var e = {};
    if (v.orgName.length < 3) { e.orgName = 'Enter the full name of your organization.'; }
    if (!v.orgType) { e.orgType = 'Choose your organization type.'; }
    if (v.province.length < 2) { e.province = 'Enter the province.'; }
    if (v.city.length < 2) { e.city = 'Enter the city or municipality.'; }
    if (v.orgType === 'Barangay' && v.barangay.length < 2) { e.barangay = 'Enter the barangay.'; }
    if (v.address.length < 3) { e.address = 'Enter the office address.'; }
    if (v.repName.length < 3) { e.repName = 'Enter the representative\'s full name.'; }
    if (v.position.length < 2) { e.position = 'Enter the position.'; }
    if (!/^[^@\s]+@[^@\s]+$/.test(v.email)) { e.email = 'Enter an email address like name@example.com.'; }
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) { e.email = 'Add the domain ending, like @gmail.com, so we can reach you.'; }
    if (!/^[0-9+() -]{7,20}$/.test(v.phone)) { e.phone = 'Enter a phone number with 7 to 20 digits. Use only digits, spaces, + ( ) and -.'; }
    if (!v.purpose) { e.purpose = 'Choose a purpose.'; }
    if (!v.agreed) { e.agreed = 'Please confirm to continue.'; }
    return e;
  }
  function showErrors(e) {
    var first = null;
    each(document.querySelectorAll('.field'), function (f) {
      var k = f.getAttribute('data-f'), m = e[k], d = f.querySelector('.err');
      if (m) { f.className = 'field' + (f.className.indexOf('full') > -1 ? ' full' : '') + ' bad'; if (d) { d.textContent = m; } if (!first) { first = f; } }
      else { f.className = f.className.replace(/\s*\bbad\b/, ''); if (d) { d.textContent = ''; } }
    });
    if (first) { var inp = first.querySelector('input,select,textarea'); if (inp) { inp.focus(); } }
  }
  function formErr(msg) { var b = $('formErr'); b.textContent = msg || ''; b.hidden = !msg; if (msg) { b.scrollIntoView({ block: 'nearest' }); } }

  /* draft: text fields only, never the file */
  function saveDraft() { var v = values(); delete v.agreed; lsSet(v); }
  function loadDraft() {
    var d = lsGet(); if (!d) { return; }
    each(TEXT, function (k) { if (typeof d[k] === 'string') { $(k).value = d[k]; } });
    if (d.orgType) { each(document.getElementsByName('orgType'), function (r) { if (r.value === d.orgType) { r.checked = true; } }); }
  }

  /* file: checked by type, size and the first bytes, then turned into base64 text */
  function magicOk(buf, type) {
    var b = new Uint8Array(buf);
    if (type === 'application/pdf') { return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; }
    if (type === 'image/jpeg') { return b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF; }
    if (type === 'image/png') { return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47; }
    return false;
  }
  function b64(buf) {
    var b = new Uint8Array(buf), s = '', i, n = 0x8000;
    for (i = 0; i < b.length; i += n) { s += String.fromCharCode.apply(null, b.subarray(i, i + n)); }
    return window.btoa(s);
  }
  function typeOf(f) {
    if (TYPES[f.type]) { return f.type; }
    var n = String(f.name || '').toLowerCase();
    if (/\.pdf$/.test(n)) { return 'application/pdf'; } if (/\.jpe?g$/.test(n)) { return 'image/jpeg'; } if (/\.png$/.test(n)) { return 'image/png'; }
    return '';
  }
  function setFileError(m) { var f = document.querySelector('.field[data-f=doc]'); f.className = 'field full' + (m ? ' bad' : ''); f.querySelector('.err').textContent = m || ''; }
  function clearFile() { file = null; $('docFile').value = ''; $('fileRow').hidden = true; }
  function takeFile(f) {
    var t, r;
    setFileError('');
    if (!f) { return; }
    t = typeOf(f);
    if (!t) { clearFile(); setFileError('Use a PDF, JPG or PNG file.'); return; }
    if (f.size > MAX_FILE) { clearFile(); setFileError('That file is ' + Math.round(f.size / 1024) + ' KB. The limit is 600 KB. Make it smaller, or email it after applying.'); return; }
    if (f.size < 1) { clearFile(); setFileError('That file is empty.'); return; }
    r = new FileReader();
    r.onload = function () {
      if (!magicOk(r.result, t)) { clearFile(); setFileError('That file does not look like a real ' + (t === 'application/pdf' ? 'PDF' : (t === 'image/png' ? 'PNG' : 'JPG')) + '.'); return; }
      file = { name: String(f.name).replace(/[^A-Za-z0-9._ -]/g, '_').substring(0, 100) || 'document', type: t, size: f.size, data: b64(r.result) };
      $('fileName').textContent = file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)'; $('fileRow').hidden = false;
    };
    r.onerror = function () { clearFile(); setFileError('Could not read that file. Try again.'); };
    r.readAsArrayBuffer(f);
  }

  function refNo() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', i, a = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (i = 0; i < 6; i++) { s += A.charAt(a[i] % A.length); }
    return 'LGU-' + new Date().getFullYear() + '-' + s;
  }

  function submit(ev) {
    var v, e, ref, ts, b, lim, ref0, app;
    ev.preventDefault();
    if (busy) { return; }
    formErr('');
    v = values(); e = check(v); showErrors(e);
    if (Object.keys(e).length) { return; }
    if (!db || !uid) { formErr('Not connected yet. Check your internet connection and try again in a moment.'); return; }
    busy = true; $('send').disabled = true; $('sendNote').textContent = 'Sending...';
    ts = firebase.firestore.FieldValue.serverTimestamp();
    ref0 = db.collection('applications').doc(); ref = refNo();
    app = { uid: uid, refNo: ref, status: 'pending', time: ts, orgName: v.orgName, orgType: v.orgType, province: v.province, city: v.city, barangay: v.barangay, address: v.address,
      repName: v.repName, position: v.position, email: v.email, phone: v.phone, purpose: v.purpose, message: v.message,
      hasDoc: !!file, docName: file ? file.name : '', docType: file ? file.type : '', docSize: file ? file.size : 0, agreed: true };
    b = db.batch();
    b.set(ref0, app);
    if (file) { b.set(db.collection('applicationDocs').doc(ref0.id), { uid: uid, data: file.data }); }
    lim = db.collection('applyLimits').doc(uid);
    b.set(lim, { lastApply: ts, appId: ref0.id });
    b.commit().then(function () {
      lsSet(null); busy = false;
      $('doneRef').textContent = ref; $('doneMail').textContent = v.email;
      $('frm').hidden = true; $('done').hidden = false; window.scrollTo(0, 0);
    }, function (er) {
      busy = false; $('send').disabled = false; $('sendNote').textContent = '';
      if (er && er.code === 'permission-denied') { formErr('The application was not accepted. You can send one application every 10 minutes from the same device. If you just sent one, please wait. Otherwise check each field and try again.'); }
      else if (er && (er.code === 'unavailable' || er.code === 'deadline-exceeded')) { formErr('Could not reach the server. Check your internet connection and try again.'); }
      else { formErr('Something went wrong (' + ((er && er.code) || 'unknown') + '). Your answers are still here. Please try again.'); }
    });
  }

  function start() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || !window.firebase) { $('sendNote').textContent = 'Online applications are not available right now. Please contact us by email instead.'; return; }
    try {
      firebase.initializeApp(cfg);
      if (firebase.appCheck) {
        try {
          if (window.APPCHECK_ENTERPRISE_KEY) { firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(window.APPCHECK_ENTERPRISE_KEY), true); }
          else if (window.APPCHECK_SITE_KEY) { firebase.appCheck().activate(window.APPCHECK_SITE_KEY, true); }
        } catch (e0) {}
      }
      db = firebase.firestore(); auth = firebase.auth();
    } catch (e) { $('sendNote').textContent = 'Online applications are not available right now. Please contact us by email instead.'; return; }
    auth.onAuthStateChanged(function (u) {
      if (u) { uid = u.uid; $('send').disabled = false; $('sendNote').textContent = 'You will get a reference number right away.'; }
      else { auth.signInAnonymously().catch(function () { $('sendNote').textContent = 'Could not connect. Check your internet connection and reload the page.'; }); }
    });
  }

  function init() {
    var drop = $('drop');
    loadDraft();
    $('frm').addEventListener('submit', submit);
    $('frm').addEventListener('input', saveDraft);
    $('frm').addEventListener('change', saveDraft);
    $('docFile').addEventListener('change', function () { takeFile(this.files && this.files[0]); });
    $('fileRm').addEventListener('click', function () { clearFile(); setFileError(''); });
    each(['dragenter', 'dragover'], function (n) { drop.addEventListener(n, function (ev) { ev.preventDefault(); drop.className = 'drop over'; }); });
    each(['dragleave', 'drop'], function (n) { drop.addEventListener(n, function (ev) { ev.preventDefault(); drop.className = 'drop'; if (n === 'drop' && ev.dataTransfer && ev.dataTransfer.files) { takeFile(ev.dataTransfer.files[0]); } }); });
    start();
  }
  init();
}());
