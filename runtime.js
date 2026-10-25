/*
 * Pathly prototype runtime
 * ------------------------
 * A tiny template renderer used by every page in this site.
 * Each page has:
 *   - <script type="text/x-template" id="dc-template">  the page markup with {{holes}},
 *     <sc-for list="{{ items }}" as="item"> loops and <sc-if value="{{ flag }}"> branches
 *   - <script type="application/json" id="dc-props">     default settings (e.g. school color)
 *   - a `class Component extends DCLogic { renderVals() { ... } }` that supplies data
 *     and click handlers. Calling this.setState({...}) re-draws the page.
 * No build step or framework needed — open any .html file in a browser.
 */
(function () {
  'use strict';

  var VOID = { input: 1, meta: 1, link: 1, br: 1, img: 1, hr: 1, source: 1, area: 1, col: 1, wbr: 1 };
  var HOLE = /\{\{([^}]*)\}\}/g;
  var WHOLE = /^\s*\{\{([^}]*)\}\}\s*$/;

  function parse(src) {
    var root = { children: [] };
    var stack = [root];
    var tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>\/"]+(?:\s*=\s*"[^"]*")?)*)\s*(\/?)>/g;
    var last = 0, m;
    while ((m = tagRe.exec(src))) {
      if (m.index > last) stack[stack.length - 1].children.push({ text: src.slice(last, m.index) });
      last = tagRe.lastIndex;
      var tag = m[2];
      if (m[1]) {
        for (var i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === tag) { stack.length = i; break; }
        }
        continue;
      }
      var attrs = [], a, attrRe = /([^\s=]+)(?:\s*=\s*"([^"]*)")?/g;
      while ((a = attrRe.exec(m[3]))) attrs.push([a[1], a[2] === undefined ? null : a[2]]);
      var node = { tag: tag, attrs: attrs, children: [] };
      stack[stack.length - 1].children.push(node);
      if (!VOID[tag.toLowerCase()] && !m[4]) stack.push(node);
    }
    if (last < src.length) stack[stack.length - 1].children.push({ text: src.slice(last) });
    return root.children;
  }

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.'), v, found = false;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { v = scope[i][parts[0]]; found = true; break; }
    }
    if (!found) return undefined;
    for (var k = 1; k < parts.length; k++) { if (v == null) return undefined; v = v[parts[k]]; }
    return v;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : esc(v); });
  }
  function attrValue(n, name) {
    for (var i = 0; i < n.attrs.length; i++) if (n.attrs[i][0] === name) return n.attrs[i][1];
    return null;
  }
  function resolve(v, scope) {
    if (v == null) return undefined;
    var w = v.match(WHOLE);
    return w ? lookup(w[1], scope) : interp(v, scope);
  }

  function render(nodes, scope, handlers) {
    var out = '';
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.text !== undefined) { out += interp(n.text, scope); continue; }
      if (n.tag === 'sc-for') {
        var list = resolve(attrValue(n, 'list'), scope) || [];
        var as = attrValue(n, 'as') || 'item';
        for (var j = 0; j < list.length; j++) {
          var s = { $index: j }; s[as] = list[j];
          out += render(n.children, scope.concat([s]), handlers);
        }
        continue;
      }
      if (n.tag === 'sc-if') {
        if (resolve(attrValue(n, 'value'), scope)) out += render(n.children, scope, handlers);
        continue;
      }
      if (n.tag === 'helmet') continue;
      out += '<' + n.tag;
      var events = [];
      for (var k = 0; k < n.attrs.length; k++) {
        var name = n.attrs[k][0], val = n.attrs[k][1];
        if (name.indexOf('hint-') === 0) continue;
        if (val === null) { out += ' ' + name; continue; }
        var whole = val.match(WHOLE);
        if (/^on[A-Z]/.test(name)) {
          var fn = whole ? lookup(whole[1], scope) : null;
          if (typeof fn === 'function') { handlers.push([name.slice(2).toLowerCase(), fn]); events.push(handlers.length - 1); }
          continue;
        }
        if (whole) {
          var raw = lookup(whole[1], scope);
          if (raw === false || raw == null) continue;
          if (raw === true) { out += ' ' + name; continue; }
          out += ' ' + name + '="' + esc(raw) + '"';
          continue;
        }
        out += ' ' + name + '="' + interp(val, scope) + '"';
      }
      if (events.length) out += ' data-dc-on="' + events.join(',') + '"';
      out += '>';
      if (!VOID[n.tag.toLowerCase()]) out += render(n.children, scope, handlers) + '</' + n.tag + '>';
    }
    return out;
  }

  var schedule = function () {};

  window.DCLogic = function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  };
  window.DCLogic.prototype.setState = function (patch) {
    if (typeof patch === 'function') patch = patch(this.state, this.props);
    this.state = Object.assign({}, this.state, patch);
    schedule();
  };
  window.DCLogic.prototype.forceUpdate = function () { schedule(); };

  function mount() {
    var tree = parse(document.getElementById('dc-template').textContent);
    var defs = {};
    try { defs = JSON.parse(document.getElementById('dc-props').textContent || '{}'); } catch (e) {}
    var props = {};
    Object.keys(defs).forEach(function (k) {
      if (k.charAt(0) !== '$' && defs[k] && 'default' in defs[k]) props[k] = defs[k].default;
    });
    /* global Component */
    var comp = new Component(props);
    var app = document.getElementById('app');

    function draw() {
      // keep anything the visitor typed when the page re-draws
      var saved = {};
      app.querySelectorAll('input[id], textarea[id], select[id]').forEach(function (el) {
        saved[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      });
      var focusedId = document.activeElement && document.activeElement.id;
      var handlers = [];
      app.innerHTML = render(tree, [comp.renderVals()], handlers);
      app.querySelectorAll('[data-dc-on]').forEach(function (el) {
        el.getAttribute('data-dc-on').split(',').forEach(function (idx) {
          var h = handlers[Number(idx)];
          el.addEventListener(h[0], function (e) { h[1](e); });
        });
      });
      Object.keys(saved).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = saved[id]; else el.value = saved[id];
      });
      if (focusedId && document.getElementById(focusedId)) document.getElementById(focusedId).focus();
    }

    var pending = false;
    schedule = function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; draw(); });
    };
    draw();
    if (typeof comp.componentDidMount === 'function') comp.componentDidMount();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
