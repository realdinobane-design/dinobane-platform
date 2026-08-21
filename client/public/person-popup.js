/* ============================================================
   DinoBane — Power Map person popup (person-popup.js)
   ------------------------------------------------------------
   Turns any timeline (or any page) into a cross-linked record.
   Names that exist on the power map become live links; clicking
   one opens that person's file — bio, affiliations, money,
   controversies, sources — as a popup. No page navigation.

   USAGE (any page):
     1) <script src="powermap-data.js"></script>
     2) <script src="person-popup.js"></script>
     3) Put  data-powerlink  on the container(s) you want linked:
           <div class="timeline" data-powerlink> ... </div>
        Nothing is linked unless you opt in with that attribute.

   React / client-rendered pages: call  window.PowerLink.scan()
   after the route has rendered (names are linked idempotently —
   already-linked text is skipped).

   Optional config before loading this file:
     window.POWERLINK = { mapUrl: 'powermap.html' };
   ============================================================ */
(function () {
  'use strict';

  var CFG = Object.assign({ mapUrl: 'powermap.html' }, window.POWERLINK || {});

  /* ---------- indexes from powermap-data.js globals ---------- */
  var NN = {}; N.forEach(function (n) { NN[n[0]] = n; });
  var EDGE_BY = {};
  E.forEach(function (e) {
    (EDGE_BY[e[0]] = EDGE_BY[e[0]] || []).push(e);
    (EDGE_BY[e[1]] = EDGE_BY[e[1]] || []).push(e);
  });
  var KIND_LABEL = { money: 'money', own: 'ownership', party: 'party', law: 'legal', personal: 'personal', state: 'state', work: 'work' };
  var TYPE_LABEL = { money: 'Money', media: 'Media', party: 'Party', person: 'Person', lobby: 'Lobby', scandal: 'Scandal' };
  var RING_LABEL = ['Core power', 'Inner ring', 'Outer ring', 'Periphery'];

  /* ---------- name index with conservative surname aliases ---------- */
  var BLOCKED_SURNAMES = { brown: 1, khan: 1, fink: 1, lowe: 1, wallace: 1, cameron: 1, gardiner: 1, tabor: 1, singer: 1, archer: 1, mears: 1, marshall: 1, hester: 1, campbell: 1, robinson: 1, johnson: 1, mittal: 1 };
  var aliases = {}; // display text -> node id
  N.forEach(function (n) { aliases[n[1]] = n[0]; });
  var seenSurnames = {};
  N.forEach(function (n) {
    if (n[2] !== 'person') return;
    var parts = n[1].split(/\s+/);
    var sur = parts[parts.length - 1].replace(/^Sir\s+/i, '');
    if (sur.length < 5) return;
    if (BLOCKED_SURNAMES[sur.toLowerCase()]) return;
    if (seenSurnames[sur]) { aliases[sur] && delete aliases[sur]; return; } // collision — drop
    seenSurnames[sur] = 1;
    aliases[sur] = n[0];
  });

  var names = Object.keys(aliases).sort(function (a, b) { return b.length - a.length; });
  var rx = new RegExp('\\b(' + names.map(function (s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|') + ')\\b', 'g');

  /* ---------- CSS ---------- */
  var css = ''
    + '.pwr-link{background:none;border:0;padding:0;font:inherit;color:#f7e017;font-weight:600;cursor:pointer;'
    + 'text-decoration:none;border-bottom:1px dashed rgba(247,224,23,.55)}'
    + '.pwr-link:hover{border-bottom-style:solid}'
    + '.pwr-bg{position:fixed;inset:0;background:rgba(4,4,5,.72);backdrop-filter:blur(6px);z-index:900;'
    + 'display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .18s}'
    + '.pwr-bg.open{opacity:1}'
    + '.pwr-card{width:min(560px,100%);max-height:86vh;overflow:auto;background:#101013;color:#f5f2ea;'
    + 'border:1px solid #2c2c33;border-radius:14px;padding:28px 30px;position:relative;'
    + 'font-family:Inter,system-ui,sans-serif;line-height:1.6;transform:translateY(8px);transition:transform .18s}'
    + '.pwr-bg.open .pwr-card{transform:none}'
    + '.pwr-card::-webkit-scrollbar{width:8px}.pwr-card::-webkit-scrollbar-thumb{background:#2c2c33;border-radius:4px}'
    + '.pwr-close{position:absolute;top:12px;right:14px;background:none;border:0;color:#9b978c;font-size:24px;cursor:pointer;line-height:1}'
    + '.pwr-close:hover{color:#f7e017}'
    + '.pwr-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;'
    + 'background:rgba(247,224,23,.1);color:#f7e017;border:1px solid rgba(247,224,23,.3);border-radius:99px;padding:4px 12px;margin-bottom:10px}'
    + '.pwr-name{font-family:"Archivo Black",Impact,sans-serif;font-size:26px;line-height:1.1;text-transform:uppercase;margin:0 34px 4px 0}'
    + '.pwr-ring{font-size:12.5px;color:#9b978c;margin-bottom:16px}'
    + '.pwr-sec{margin-top:18px}'
    + '.pwr-sec-label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9b978c;margin-bottom:8px}'
    + '.pwr-desc{font-size:14px;line-height:1.65;color:#d8d4c8;margin:0}'
    + '.pwr-fact{display:flex;gap:10px;font-size:13.5px;padding:4px 0}'
    + '.pwr-fact b{color:#9b978c;font-weight:600;min-width:86px;flex-shrink:0}'
    + '.pwr-role{border-left:2px solid #f7e017;padding:2px 0 2px 12px;margin:10px 0}'
    + '.pwr-role h4{font-size:13.5px;margin:0 0 2px}'
    + '.pwr-role .pwr-org{font-size:12px;color:#f7e017;margin-bottom:3px}'
    + '.pwr-role p{font-size:12.5px;color:#a8a49a;margin:0;line-height:1.55}'
    + '.pwr-conn{display:flex;gap:10px;align-items:baseline;font-size:13px;padding:5px 0;border-bottom:1px solid #1c1c22}'
    + '.pwr-conn:last-child{border-bottom:0}'
    + '.pwr-conn b{color:#f5f2ea}'
    + '.pwr-conn .pwr-cl{color:#9b978c;font-size:12px;flex:1}'
    + '.pwr-kind{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9b978c;'
    + 'border:1px solid #2c2c33;border-radius:99px;padding:2px 8px;flex-shrink:0}'
    + '.pwr-kind.k-money,.pwr-kind.k-own{color:#e5484d;border-color:rgba(229,72,77,.4)}'
    + '.pwr-contra{border:1px solid #2c2c33;border-left:3px solid #e5484d;border-radius:8px;padding:10px 14px;margin:8px 0}'
    + '.pwr-contra h4{font-size:13px;margin:0 0 4px;color:#f5f2ea}'
    + '.pwr-contra p{font-size:12.5px;color:#a8a49a;margin:0;line-height:1.55}'
    + '.pwr-src{font-size:12px;color:#9b978c;line-height:1.7}'
    + '.pwr-open{display:inline-block;margin-top:20px;font-size:13px;font-weight:700;color:#f7e017;text-decoration:none}'
    + '.pwr-open:hover{text-decoration:underline}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- text-node scanner ---------- */
  function linkify(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('a,button,script,style,textarea,.pwr-card,.pwr-link')) return NodeFilter.FILTER_REJECT;
        rx.lastIndex = 0;
        return rx.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var hits = [], node;
    while ((node = walker.nextNode())) hits.push(node);
    hits.forEach(function (textNode) {
      var frag = document.createDocumentFragment();
      var text = textNode.nodeValue, last = 0, m;
      rx.lastIndex = 0;
      while ((m = rx.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pwr-link';
        b.dataset.pwr = aliases[m[1]];
        b.textContent = m[1];
        frag.appendChild(b);
        last = m.index + m[1].length;
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
    return hits.length;
  }

  /* ---------- popup ---------- */
  var bg = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function cardHTML(id) {
    var n = NN[id]; if (!n) return '<p>Not on the map.</p>';
    var demog = (typeof DEMOG !== 'undefined') && DEMOG[id];
    var camp = (typeof CAMP !== 'undefined') && CAMP[id];
    var roles = (typeof ROLES !== 'undefined' && ROLES[id]) || [];
    var contros = (typeof CONTRO !== 'undefined' && CONTRO[id]) || [];
    var conns = (EDGE_BY[id] || []).map(function (e) {
      var out = e[0] === id, other = NN[out ? e[1] : e[0]];
      return { name: other ? other[1] : (out ? e[1] : e[0]), label: e[3], kind: e[4], out: out, otherId: other ? other[0] : null };
    });

    var h = '<button class="pwr-close" aria-label="Close">&times;</button>'
      + '<span class="pwr-tag">' + esc(TYPE_LABEL[n[2]] || n[2]) + '</span>'
      + '<h3 class="pwr-name">' + esc(n[1]) + '</h3>'
      + '<div class="pwr-ring">Ring ' + n[3] + ' — ' + esc(RING_LABEL[n[3]] || '') + ' · on the power map</div>'
      + '<div class="pwr-sec"><div class="pwr-sec-label">Who they are</div><p class="pwr-desc">' + esc(n[4]) + '</p></div>';

    if (camp || demog) {
      h += '<div class="pwr-sec"><div class="pwr-sec-label">Positioning</div>';
      if (camp) h += '<div class="pwr-fact"><b>Alignment</b><span>' + esc(camp) + '</span></div>';
      if (demog && demog[2]) h += '<div class="pwr-fact"><b>Party</b><span>' + esc(demog[2]) + '</span></div>';
      h += '</div>';
    }
    if (roles.length) {
      h += '<div class="pwr-sec"><div class="pwr-sec-label">Career &amp; power</div>' + roles.map(function (r) {
        return '<div class="pwr-role"><h4>' + esc(r[0]) + '</h4><div class="pwr-org">' + esc(r[1]) + '</div><p>' + esc(r[2]) + '</p></div>';
      }).join('') + '</div>';
    }
    if (conns.length) {
      h += '<div class="pwr-sec"><div class="pwr-sec-label">Affiliations &amp; connections</div>' + conns.map(function (c) {
        var inner = '<b>' + esc(c.name) + '</b><span class="pwr-cl">' + esc(c.label) + '</span><span class="pwr-kind k-' + esc(c.kind) + '">' + esc(KIND_LABEL[c.kind] || c.kind) + '</span>';
        return c.otherId
          ? '<div class="pwr-conn"><button class="pwr-link" data-pwr="' + esc(c.otherId) + '" style="border-bottom:0">' + inner.replace('<b>', '<b style="color:#f7e017">') + '</button></div>'
          : '<div class="pwr-conn">' + inner + '</div>';
      }).join('') + '</div>';
    }
    if (contros.length) {
      h += '<div class="pwr-sec"><div class="pwr-sec-label">Controversies</div>' + contros.map(function (c) {
        return '<div class="pwr-contra"><h4>' + esc(c[0]) + '</h4><p>' + esc(c[1]) + '</p></div>';
      }).join('') + '</div>';
    }
    if (n[5]) {
      h += '<div class="pwr-sec"><div class="pwr-sec-label">Sources</div><p class="pwr-src">'
        + n[5].split(';').map(function (s) { return esc(s.trim()); }).filter(Boolean).join('<br>') + '</p></div>';
    }
    h += '<a class="pwr-open" href="' + esc(CFG.mapUrl) + '">Open in the full Power Map →</a>';
    return h;
  }

  function open(id) {
    close();
    bg = document.createElement('div');
    bg.className = 'pwr-bg';
    bg.innerHTML = '<div class="pwr-card" role="dialog" aria-modal="true">' + cardHTML(id) + '</div>';
    document.body.appendChild(bg);
    requestAnimationFrame(function () { bg.classList.add('open'); });
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    bg.querySelector('.pwr-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }
  function close() {
    if (!bg) return;
    bg.remove(); bg = null;
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  /* connections inside a popup are themselves clickable — swap content in place */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pwr-link');
    if (!b) return;
    e.preventDefault();
    var id = b.dataset.pwr;
    if (bg && b.closest('.pwr-card')) {
      bg.querySelector('.pwr-card').innerHTML = cardHTML(id);
      bg.querySelector('.pwr-card').scrollTop = 0;
      bg.querySelector('.pwr-close').addEventListener('click', close);
    } else {
      open(id);
    }
  });

  /* ---------- public API ---------- */
  window.PowerLink = {
    scan: function (root) {
      var scopes;
      if (root) scopes = [root];
      else scopes = document.querySelectorAll('[data-powerlink]');
      var count = 0;
      scopes.forEach(function (s) { count += linkify(s); });
      return count;
    },
    open: open,
    close: close
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.PowerLink.scan(); });
  } else {
    window.PowerLink.scan();
  }
})();
