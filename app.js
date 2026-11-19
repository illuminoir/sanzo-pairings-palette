(function () {
  var RAW = window.SANZO_DATA;

  function fits(lab) {
    var L = lab[0], a = lab[1], b = lab[2];
    var C = Math.hypot(a, b);
    var h = Math.atan2(b, a) * 180 / Math.PI;
    if (h < 0) h += 360;
    if (L < 22) return C < 12 || (h >= 10 && h < 265);
    if (C < 12) return L < 60 && b >= 0;
    if (h >= 10 && h <= 115 && C <= 85) {
      if (L >= 84 && h >= 65 && C <= 28 && b > 0) return true;
      if (L > 58 && C < 20 && h < 65) return false;
      if (h >= 70 && h <= 105 && C >= 35 && C <= 75 && L >= 40 && L <= 78) return true;
      if (L >= 18 && L <= 72 && C >= 14) return !(C > 45 && L > 62);
      if (L > 72 && L <= 80 && h >= 65 && C <= 35) return true;
    }
    if (h > 115 && h <= 200 && L >= 18 && L <= 62 && C >= 10) return true;
    if (h > 200 && h <= 260 && L < 42 && C <= 45) return true;
    return false;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  var colors = RAW.colors.map(function (c) { return { n: c.n, hex: c.h, lab: c.lab, fit: fits(c.lab) }; });
  var byName = new Map(colors.map(function (c) { return [c.n, c]; }));
  var combos = RAW.combos.map(function (names, i) {
    return { id: RAW.ids[i], cols: names.map(function (n) { return byName.get(n); }) };
  });

  function hueInfo(c) {
    var C = Math.hypot(c.lab[1], c.lab[2]);
    var h = Math.atan2(c.lab[2], c.lab[1]) * 180 / Math.PI;
    if (h < 0) h += 360;
    return { C: C, h: h, L: c.lab[0] };
  }
  var sorted = colors.slice().sort(function (x, y) {
    var p = hueInfo(x), q = hueInfo(y);
    var pn = p.C < 8, qn = q.C < 8;
    if (pn !== qn) return pn ? 1 : -1;
    if (pn) return p.L - q.L;
    return (p.h - q.h) || (p.L - q.L);
  });

  function combosWith(names) {
    return combos.filter(function (cb) {
      return names.every(function (n) { return cb.cols.some(function (c) { return c.n === n; }); });
    });
  }
  function fitCount(cb) { return cb.cols.filter(function (c) { return c.fit; }).length; }
  function byFit(a, b) { return (fitCount(b) - fitCount(a)) || (a.id - b.id); }

  var first = combos[0];
  var state = {
    mode: 'one',
    q: '',
    onlyFit: true,
    sel: {
      one: [byName.has('Brown') ? 'Brown' : colors.filter(function (c) { return c.fit; })[0].n],
      two: [first.cols[0].n, first.cols[2].n]
    }
  };

  function buildGrid() {
    var q = state.q.trim().toLowerCase();
    var list = sorted.filter(function (c) {
      return (!q || c.n.toLowerCase().indexOf(q) !== -1) && (!state.onlyFit || c.fit);
    });
    var root = $('scroller');
    root.textContent = '';
    if (!list.length) {
      var p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'No colors match that search.';
      root.appendChild(p);
      return;
    }
    function add(title, arr) {
      if (!arr.length) return;
      var h = document.createElement('h3');
      h.className = 'grp';
      h.textContent = title + ' · ' + arr.length;
      var g = document.createElement('div');
      g.className = 'grid';
      arr.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sw';
        b.style.backgroundColor = c.hex;
        b.dataset.name = c.n;
        b.title = c.n;
        b.setAttribute('aria-label', c.n);
        b.setAttribute('aria-pressed', 'false');
        g.appendChild(b);
      });
      root.appendChild(h);
      root.appendChild(g);
    }
    add('In your palette', list.filter(function (c) { return c.fit; }));
    add('Outside your palette', list.filter(function (c) { return !c.fit; }));
    updateGrid();
  }

  function updateGrid() {
    var arr = state.sel[state.mode];
    var compat = null;
    if (state.mode === 'two' && arr.length === 1) {
      compat = new Set([arr[0]]);
      combosWith([arr[0]]).forEach(function (cb) { cb.cols.forEach(function (c) { compat.add(c.n); }); });
    }
    $('scroller').querySelectorAll('.sw').forEach(function (b) {
      var n = b.dataset.name;
      b.setAttribute('aria-pressed', arr.indexOf(n) !== -1 ? 'true' : 'false');
      b.classList.toggle('dim', !!compat && !compat.has(n));
    });
  }

  function renderTray() {
    var arr = state.sel[state.mode];
    var cap = state.mode === 'one' ? 1 : 2;
    var labels = state.mode === 'one' ? ['Your color'] : ['First color', 'Second color'];
    var html = '';
    for (var i = 0; i < cap; i++) {
      var c = arr[i] ? byName.get(arr[i]) : null;
      if (c) {
        html += '<div class="slot"><span class="slot-sw" style="background:' + c.hex + '"></span>' +
          '<span class="slot-txt"><span class="slot-lab">' + labels[i] + '</span>' +
          '<span class="slot-name">' + esc(c.n) + '</span><span class="slot-hex">' + c.hex + '</span></span>' +
          '<button type="button" class="x" data-remove="' + esc(c.n) + '" aria-label="Remove ' + esc(c.n) + '">×</button></div>';
      } else {
        html += '<div class="slot empty"><span class="slot-sw"></span>' +
          '<span class="slot-txt"><span class="slot-lab">' + labels[i] + '</span>' +
          '<span class="slot-name">Pick below</span></span></div>';
      }
    }
    $('tray').innerHTML = html;
    $('pick-h').textContent = state.mode === 'one' ? 'Pick a color' : 'Pick two colors';
  }

  function card(cb, picked, mode) {
    var k = fitCount(cb);
    var strip = cb.cols.map(function (c) { return '<div style="background:' + c.hex + '"></div>'; }).join('');
    var names = cb.cols.map(function (c) {
      var isP = picked.indexOf(c.n) !== -1;
      var role = isP ? 'Picked' : (mode === 'two' && picked.length === 2 ? 'Third' : 'Partner');
      return '<div class="nm"><span class="role' + (isP ? ' picked' : '') + '">' + role + '</span>' +
        '<span class="nm-name">' + esc(c.n) + '</span>' +
        '<button type="button" class="hex" data-hex="' + c.hex + '" aria-label="Copy ' + c.hex + '">' + c.hex + '</button>' +
        (c.fit ? '' : '<span class="off">outside palette</span>') + '</div>';
    }).join('');
    return '<article class="combo"><div class="combo-top"><span class="cid">No. ' + cb.id + '</span>' +
      '<span class="badge' + (k === 3 ? ' full' : '') + '">' + k + ' of 3 in your palette</span></div>' +
      '<div class="strip" role="img" aria-label="' + esc(cb.cols.map(function (c) { return c.n; }).join(', ')) + '">' + strip + '</div>' +
      '<div class="names">' + names + '</div></article>';
  }
  function head(t, s) { return '<div class="res-head"><h2>' + t + '</h2><p>' + s + '</p></div>'; }
  function empty(msg) { return '<div class="empty">' + msg + '</div>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function renderResults() {
    var mode = state.mode, arr = state.sel[mode], html = '', l;
    if (!arr.length) {
      html = empty(mode === 'one' ? 'Pick a color to see the two that go with it.' : 'Pick two colors to see which third one goes with them.');
    } else if (mode === 'one' || arr.length === 1) {
      l = combosWith(arr).sort(byFit);
      html = head(plural(l.length, 'combination', 'combinations') + ' with ' + esc(arr[0]),
        mode === 'one' ? 'Best palette fit first.' : 'Pick a second color to narrow it down. Colors that never pair with it are dimmed.') +
        l.map(function (cb) { return card(cb, arr, 'one'); }).join('');
    } else {
      l = combosWith(arr).sort(byFit);
      if (l.length) {
        html = head(plural(l.length, 'combination contains', 'combinations contain') + ' both ' + esc(arr[0]) + ' and ' + esc(arr[1]),
          'The third color in each one is the one to add.') +
          l.map(function (cb) { return card(cb, arr, 'two'); }).join('');
      } else {
        var part = combos.filter(function (cb) {
          return arr.some(function (n) { return cb.cols.some(function (c) { return c.n === n; }); });
        }).sort(byFit);
        html = head('No combination pairs ' + esc(arr[0]) + ' with ' + esc(arr[1]),
          'The book never uses these two together. These combinations each contain one of them.') +
          part.map(function (cb) {
            return card(cb, arr.filter(function (n) { return cb.cols.some(function (c) { return c.n === n; }); }), 'one');
          }).join('');
      }
    }
    $('results').innerHTML = html;
  }

  function renderAll() { renderTray(); updateGrid(); renderResults(); }

  function pick(name, dimmed) {
    var arr = state.sel[state.mode];
    var cap = state.mode === 'one' ? 1 : 2;
    var i = arr.indexOf(name);
    if (dimmed) { arr.length = 0; arr.push(name); }
    else if (i !== -1) arr.splice(i, 1);
    else { arr.push(name); while (arr.length > cap) arr.shift(); }
    renderAll();
  }

  $('scroller').addEventListener('click', function (e) {
    var b = e.target.closest('.sw');
    if (b) pick(b.dataset.name, b.classList.contains('dim'));
  });
  $('tray').addEventListener('click', function (e) {
    var x = e.target.closest('[data-remove]');
    if (!x) return;
    var arr = state.sel[state.mode];
    var i = arr.indexOf(x.dataset.remove);
    if (i !== -1) arr.splice(i, 1);
    renderAll();
  });
  $('q').addEventListener('input', function (e) { state.q = e.target.value; buildGrid(); });
  $('onlyfit').addEventListener('change', function (e) { state.onlyFit = e.target.checked; buildGrid(); });

  function setMode(m) {
    state.mode = m;
    $('mode-one').setAttribute('aria-pressed', m === 'one' ? 'true' : 'false');
    $('mode-two').setAttribute('aria-pressed', m === 'two' ? 'true' : 'false');
    renderAll();
  }
  $('mode-one').addEventListener('click', function () { setMode('one'); });
  $('mode-two').addEventListener('click', function () { setMode('two'); });

  var tt;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('on'); }, 1800);
  }
  function copyHex(hex, el) {
    function fallback() {
      try {
        var r = document.createRange();
        r.selectNodeContents(el);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        toast(hex + ' selected, copy it from the selection');
      } catch (err) { /* nothing more to try */ }
    }
    try {
      navigator.clipboard.writeText(hex).then(function () { toast('Copied ' + hex); }, fallback);
    } catch (err) { fallback(); }
  }
  $('results').addEventListener('click', function (e) {
    var h = e.target.closest('.hex');
    if (h) copyHex(h.dataset.hex, h);
  });

  buildGrid();
  renderAll();
})();
