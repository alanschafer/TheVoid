(function () {
  'use strict';
  var root = document.documentElement;
  var base = root.getAttribute('data-base') || '';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var announceEl = $('#announce');
  function announce(msg) { if (announceEl) { announceEl.textContent = ''; setTimeout(function () { announceEl.textContent = msg; }, 30); } }

  /* ---------- storage with graceful fallback ---------- */
  var memory = {};
  var store = {
    get: function (k) { try { var v = window.localStorage.getItem(k); return v === null ? (memory[k] || null) : v; } catch (e) { return memory[k] || null; } },
    set: function (k, v) { memory[k] = v; try { window.localStorage.setItem(k, v); } catch (e) {} }
  };
  function readJSON(k, d) { try { return JSON.parse(store.get(k)) || d; } catch (e) { return d; } }

  /* ---------- theme ---------- */
  var themeBtn = $('#theme-toggle');
  function paintTheme() {
    var light = root.getAttribute('data-theme') === 'light';
    if (themeBtn) { themeBtn.textContent = light ? 'Dark' : 'Light'; themeBtn.setAttribute('aria-label', 'Switch to ' + (light ? 'dark' : 'light') + ' mode'); }
    var meta = $('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', light ? '#f1ede3' : '#0a0a09');
    paintDust();
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next); store.set('void-theme', next); paintTheme();
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menu-toggle'), nav = $('#primary-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open); menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; menuBtn.focus(); } });
  }

  /* ---------- search index ---------- */
  var index = null, indexPromise = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (!indexPromise) indexPromise = fetch(base + '/search.json').then(function (r) { return r.json(); }).then(function (d) { index = d; return d; });
    return indexPromise;
  }

  /* ---------- search dialog ---------- */
  var dialog = $('#search-dialog'), input = $('#global-search'), results = $('#search-results'), status = $('#search-status');
  var lastFocus = null;
  function openSearch() {
    if (!dialog) return;
    lastFocus = document.activeElement;
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); } else dialog.setAttribute('open', '');
    loadIndex().catch(function () { status.textContent = 'Search is unavailable right now.'; });
    input.focus(); input.select();
  }
  function closeSearch() { if (dialog.open) dialog.close(); }
  function snippet(text, pos, len) {
    var s = Math.max(0, pos - 60), e = Math.min(text.length, pos + len + 110);
    return (s ? '… ' : '') + text.slice(s, e) + (e < text.length ? ' …' : '');
  }
  function runSearch() {
    var q = input.value.trim(); results.textContent = '';
    if (q.length < 2) { status.textContent = q ? 'Keep typing.' : 'Search across every book and section.'; return; }
    if (!index) { status.textContent = 'Searching…'; loadIndex().then(runSearch, function () { status.textContent = 'Search is unavailable right now.'; }); return; }
    var lq = q.toLowerCase(), hits = [];
    index.forEach(function (d) {
      var tp = d.title.toLowerCase().indexOf(lq), bp = d.text.toLowerCase().indexOf(lq);
      if (tp > -1 || bp > -1) hits.push({ d: d, pos: bp, score: tp > -1 ? 2 : 1 });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    status.textContent = hits.length ? hits.length + (hits.length === 1 ? ' result' : ' results') + ' for “' + q + '”' : 'Nothing found for “' + q + '”. Try a shorter or different word.';
    hits.slice(0, 8).forEach(function (h) {
      var a = document.createElement('a'); a.href = h.d.url;
      var t = document.createElement('span'); t.textContent = h.d.book ? h.d.type + ' · ' + h.d.book : h.d.type;
      var n = document.createElement('strong'); n.textContent = h.d.title;
      a.appendChild(t); a.appendChild(n);
      if (h.pos > -1) {
        var sn = snippet(h.d.text, h.pos, q.length), at = sn.toLowerCase().indexOf(lq);
        var p = document.createElement('p'); p.appendChild(document.createTextNode(sn.slice(0, at)));
        var m = document.createElement('mark'); m.textContent = sn.slice(at, at + q.length); p.appendChild(m);
        p.appendChild(document.createTextNode(sn.slice(at + q.length))); a.appendChild(p);
      }
      results.appendChild(a);
    });
  }
  if (dialog) {
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
    $('#search-close').addEventListener('click', closeSearch);
    input.addEventListener('input', runSearch);
    dialog.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closeSearch(); } });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeSearch(); });
    dialog.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { e.preventDefault(); openSearch(); }
  });

  /* ---------- saved records ---------- */
  function savedList() { return readJSON('void-saved', []); }
  function paintSaveButtons() {
    var list = savedList();
    $$('[data-save]').forEach(function (b) {
      var on = list.indexOf(b.getAttribute('data-save')) > -1, isBook = b.classList.contains('button');
      var noun = isBook ? 'book' : 'section';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Saved ✓' : 'Save ' + noun + ' +';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-save]'); if (!b) return;
    var id = b.getAttribute('data-save'), list = savedList(), i = list.indexOf(id);
    if (i > -1) list.splice(i, 1); else list.push(id);
    store.set('void-saved', JSON.stringify(list)); paintSaveButtons();
    announce(i > -1 ? 'Removed from your shelf' : 'Saved to your shelf');
  });
  paintSaveButtons();

  /* ---------- reading place ---------- */
  var bookId = document.body.getAttribute('data-book');
  var rec = document.body.getAttribute('data-record');
  var reads = readJSON('void-reads', {});
  if (document.body.classList.contains('reader') && rec && bookId && !document.body.classList.contains('complete')) {
    var h1 = $('h1'), mark = { url: location.pathname, title: h1 ? h1.textContent : 'Last section', book: bookId };
    reads[bookId] = mark; store.set('void-reads', JSON.stringify(reads)); store.set('void-last', JSON.stringify(mark));
  }
  var last = readJSON('void-last', null);
  $$('.resume-book').forEach(function (a) {
    var r = reads[a.getAttribute('data-book')];
    if (r && r.url) { a.href = r.url; if (a.firstChild) a.firstChild.textContent = 'Continue reading '; }
  });

  /* ---------- saved page ---------- */
  var savedWrap = $('#saved-records');
  if (savedWrap) {
    var empty = $('#saved-empty'), card = $('#continue-card');
    if (last && last.url) { card.hidden = false; $('#continue-title').textContent = last.title; $('#continue-link').href = last.url; }
    loadIndex().then(function (idx) {
      var list = savedList(), recs = idx.filter(function (d) { return list.indexOf(d.id) > -1; });
      empty.hidden = recs.length > 0; savedWrap.textContent = '';
      if (!recs.length) return;
      var table = document.createElement('div'); table.className = 'record-table';
      recs.forEach(function (d) {
        var row = document.createElement('div'); row.className = 'saved-row';
        var a = document.createElement('a'); a.className = 'record-row'; a.href = d.url;
        var left = document.createElement('div'); var s = document.createElement('strong'); s.textContent = d.title; left.appendChild(s);
        var t = document.createElement('span'); t.className = 'row-type'; t.textContent = d.book ? d.type + ' · ' + d.book : d.type;
        var ar = document.createElement('span'); ar.setAttribute('aria-hidden', 'true'); ar.textContent = '↗';
        a.appendChild(left); a.appendChild(t); a.appendChild(ar);
        var rm = document.createElement('button'); rm.className = 'saved-remove'; rm.textContent = 'Remove'; rm.setAttribute('aria-label', 'Remove ' + d.title + ' from shelf');
        rm.addEventListener('click', function () {
          store.set('void-saved', JSON.stringify(savedList().filter(function (x) { return x !== d.id; }))); row.remove(); announce(d.title + ' removed');
          if (!$('.saved-row', savedWrap)) { table.remove(); empty.hidden = false; }
        });
        row.appendChild(a); row.appendChild(rm); table.appendChild(row);
      });
      savedWrap.appendChild(table);
    }).catch(function () { empty.hidden = false; });
  }

  /* ---------- archive ---------- */
  var archive = $('#archive-records');
  if (archive) {
    var rows = $$('.record-row', archive), q = $('#archive-search'), sort = $('#archive-sort'), count = $('#archive-count'), clear = $('#clear-filters'), emptyA = $('#archive-empty');
    var state = { type: 'All', tag: '', q: '', book: '' }, fullText = null, bookSel = $('#archive-book');
    var params = new URLSearchParams(location.search); if (params.get('tag')) state.tag = params.get('tag').toLowerCase();
    if (params.get('book')) state.book = params.get('book');
    loadIndex().then(function (idx) { fullText = {}; idx.forEach(function (d) { fullText[d.id] = (d.title + ' ' + d.text).toLowerCase(); }); apply(); }).catch(function () {});
    function apply() {
      var shown = 0, ql = state.q.toLowerCase();
      rows.forEach(function (r) {
        var id = r.getAttribute('data-id'), tags = ' ' + r.getAttribute('data-tags') + ' ';
        var ok = (state.type === 'All' || r.getAttribute('data-type') === state.type) && (!state.book || r.getAttribute('data-book') === state.book) && (!state.tag || tags.indexOf(' ' + state.tag + ' ') > -1) &&
          (!ql || r.getAttribute('data-title').toLowerCase().indexOf(ql) > -1 || (fullText && fullText[id] && fullText[id].indexOf(ql) > -1));
        r.hidden = !ok; if (ok) shown++;
      });
      count.textContent = shown + (shown === 1 ? ' record' : ' records');
      emptyA.hidden = shown > 0; $('.archive-table').hidden = shown === 0;
      clear.hidden = state.type === 'All' && !state.tag && !state.q && !state.book;
      if (bookSel) bookSel.value = state.book;
      $$('.filter-button').forEach(function (b) { var on = b.getAttribute('data-filter') === state.type; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
      $$('.tag-button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tag') === state.tag); b.setAttribute('aria-pressed', b.getAttribute('data-tag') === state.tag); });
    }
    function reorder() {
      var by = sort.value, parent = rows[0].parentNode;
      var sorted = rows.slice().sort(function (a, b) {
        if (by === 'title') return a.getAttribute('data-title').localeCompare(b.getAttribute('data-title'));
        if (by === 'type') return a.getAttribute('data-type').localeCompare(b.getAttribute('data-type')) || (a.getAttribute('data-order') - b.getAttribute('data-order'));
        return a.getAttribute('data-order') - b.getAttribute('data-order');
      });
      sorted.forEach(function (r) { parent.appendChild(r); });
    }
    q.addEventListener('input', function () { state.q = q.value.trim(); apply(); });
    sort.addEventListener('change', reorder);
    if (bookSel) bookSel.addEventListener('change', function () { state.book = bookSel.value; apply(); });
    $$('.filter-button').forEach(function (b) { b.addEventListener('click', function () { state.type = b.getAttribute('data-filter'); apply(); }); });
    $$('.tag-button').forEach(function (b) { b.addEventListener('click', function () { state.tag = state.tag === b.getAttribute('data-tag') ? '' : b.getAttribute('data-tag'); apply(); }); });
    function reset() { state = { type: 'All', tag: '', q: '', book: '' }; q.value = ''; sort.value = 'order'; reorder(); apply(); }
    clear.addEventListener('click', reset); $('[data-reset-archive]').addEventListener('click', reset);
    apply();
  }


  /* ---------- keep the current section in view inside a long sidebar ---------- */
  var sbar = $('.reader-sidebar'), cur = sbar && $('[aria-current="page"]', sbar);
  if (sbar && cur) sbar.scrollTop = Math.max(0, cur.offsetTop - sbar.clientHeight / 3);
  /* ---------- reader tools ---------- */
  var size = parseFloat(getComputedStyle(root).getPropertyValue('--reading-size')) || 1.1875;
  function setSize(v) { size = Math.max(1, Math.min(1.75, v)); root.style.setProperty('--reading-size', size + 'rem'); store.set('void-size', String(size)); announce('Text size ' + Math.round(size * 16) + ' pixels'); }
  var dn = $('#size-down'), up = $('#size-up');
  if (dn) dn.addEventListener('click', function () { setSize(size - 0.0625); });
  if (up) up.addEventListener('click', function () { setSize(size + 0.0625); });
  var copy = $('#copy-link');
  if (copy) copy.addEventListener('click', function () {
    var ok = function () { copy.textContent = 'Link copied ✓'; setTimeout(function () { copy.textContent = 'Copy link ↗'; }, 1800); announce('Link copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(ok, function () { copy.textContent = 'Copy not available'; });
    else copy.textContent = 'Copy not available';
  });
  var pr = $('[data-print]'); if (pr) pr.addEventListener('click', function () { window.print(); });
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (dialog && dialog.open)) return;
    var tag = (e.target && e.target.tagName) || ''; if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    var sel = e.key === 'ArrowLeft' ? 'a[rel="prev"]' : e.key === 'ArrowRight' ? 'a[rel="next"]' : null;
    var l = sel && $(sel); if (l) location.href = l.href;
  });
  var bar = $('#reading-progress');

  /* ---------- the void: dust, parallax, scroll ---------- */
  var canvas = $('#void-dust'), ctx = canvas && canvas.getContext('2d'), art = $('.void-art');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)'), dust = [], cw = 0, ch = 0, dpr = 1, raf = 0, t0 = performance.now();
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function sizeDust() {
    if (!canvas) return;
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cw = canvas.width = Math.max(1, Math.round(r.width * dpr)); ch = canvas.height = Math.max(1, Math.round(r.height * dpr));
    var n = r.width < 800 ? 90 : 170; dust = [];
    for (var i = 0; i < n; i++) {
      var rr = 1.08 + Math.pow(Math.random(), 1.7) * 1.9;
      dust.push({ r: rr, a: Math.random() * 6.283, w: (0.012 / Math.pow(rr, 1.5)) * (0.7 + Math.random() * .6), s: .5 + Math.random() * 1.1, o: .15 + Math.random() * .6, k: .7 + Math.random() * .22, ph: Math.random() * 6.283 });
    }
  }
  function paintDust(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    var light = root.getAttribute('data-theme') === 'light', cx = cw * .696, cy = ch * .479, R = cw * .126, tilt = -.38, ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.fillStyle = light ? '40,34,24' : '233,222,200';
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i], ang = d.a + (time || 0) * d.w * .06, x = Math.cos(ang) * d.r * R, y = Math.sin(ang) * d.r * R * d.k;
      var px = cx + x * ct - y * st, py = cy + x * st + y * ct;
      var tw = .65 + .35 * Math.sin((time || 0) * .0008 + d.ph);
      ctx.beginPath(); ctx.fillStyle = 'rgba(' + (light ? '40,34,24' : '233,222,200') + ',' + (d.o * tw * (1.15 - (d.r - 1) / 3)).toFixed(3) + ')';
      ctx.arc(px, py, d.s * dpr, 0, 6.283); ctx.fill();
    }
  }
  function frame(now) {
    raf = 0; var t = now - t0;
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    if (art) { art.style.setProperty('--px', mouse.x.toFixed(3)); art.style.setProperty('--py', mouse.y.toFixed(3)); }
    paintDust(t); schedule();
  }
  function schedule() { if (!raf && !reduce.matches && !document.hidden && canvas) raf = requestAnimationFrame(frame); }
  function onScroll() {
    var h = Math.max(1, root.scrollHeight - window.innerHeight), p = Math.min(1, Math.max(0, window.scrollY / h)), y = window.scrollY / Math.max(1, window.innerHeight);
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    var bg = $('.void-bg');
    if (bg && document.body.classList.contains('home')) { bg.style.setProperty('--fade', Math.max(.18, 1 - y * .8).toFixed(3)); bg.style.setProperty('--scroll', Math.min(y, 1.5).toFixed(3)); }
  }
  var tick = false;
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; onScroll(); }); } }, { passive: true });
  window.addEventListener('resize', function () { sizeDust(); paintDust(performance.now() - t0); onScroll(); });
  window.addEventListener('pointermove', function (e) { mouse.tx = e.clientX / window.innerWidth - .5; mouse.ty = e.clientY / window.innerHeight - .5; }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } else schedule(); });
  reduce.addEventListener && reduce.addEventListener('change', function () { if (reduce.matches) { mouse.tx = mouse.ty = 0; paintDust(0); } else schedule(); });
  sizeDust(); paintTheme(); onScroll(); schedule();
})();
