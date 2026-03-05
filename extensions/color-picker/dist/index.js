(function (vanta) {
  var STYLE_ID = 'vanta-ext-color-picker-css';
  var MAX_RECENT = 12;

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function complementaryHex(hex) {
    var c = hexToRgb(hex);
    return '#' + [255 - c.r, 255 - c.g, 255 - c.b]
      .map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.cp-root{display:flex;flex-direction:column;gap:16px;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--text-primary,#ebebeb);box-sizing:border-box}',
      '.cp-root *{box-sizing:border-box}',

      '.cp-picker{display:flex;align-items:center;gap:14px}',
      '.cp-input-wrap{position:relative;width:52px;height:52px;border-radius:12px;overflow:hidden;border:2px solid var(--border,rgba(255,255,255,0.1));flex-shrink:0;cursor:pointer}',
      '.cp-color-input{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);border:none;padding:0;background:none;cursor:pointer}',
      '.cp-color-input::-webkit-color-swatch-wrapper{padding:0}',
      '.cp-color-input::-webkit-color-swatch{border:none;border-radius:0}',
      '.cp-color-input::-moz-color-swatch{border:none}',
      '.cp-swatch{flex:1;height:52px;border-radius:10px;border:1px solid var(--border,rgba(255,255,255,0.1));transition:background-color 120ms ease;cursor:pointer}',
      '.cp-swatch:hover{opacity:0.85}',

      '.cp-conversions{display:flex;flex-direction:column;gap:2px;background:var(--surface,#111);border-radius:10px;padding:6px 12px;border:1px solid var(--border,rgba(255,255,255,0.1))}',
      '.cp-format-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border,rgba(255,255,255,0.06))}',
      '.cp-format-row:last-child{border-bottom:none}',
      '.cp-format-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary,#888);width:30px;flex-shrink:0}',
      '.cp-format-value{flex:1;font-size:13px;font-family:"SF Mono","Fira Code","Cascadia Code",monospace;color:var(--text-primary,#ebebeb);cursor:pointer;user-select:all;transition:color 120ms}',
      '.cp-format-value:hover{color:var(--accent,#7b35f0)}',
      '.cp-copy-btn{padding:4px 10px;font-size:11px;font-weight:600;background:transparent;border:1px solid var(--border,rgba(255,255,255,0.12));border-radius:6px;color:var(--text-secondary,#888);cursor:pointer;transition:all 120ms ease;flex-shrink:0}',
      '.cp-copy-btn:hover{background:var(--accent,#7b35f0);border-color:var(--accent,#7b35f0);color:#fff}',

      '.cp-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-secondary,#888)}',

      '.cp-complementary{display:flex;flex-direction:column;gap:8px}',
      '.cp-comp-content{display:flex;align-items:center;gap:12px;background:var(--surface,#111);border-radius:10px;padding:10px 12px;border:1px solid var(--border,rgba(255,255,255,0.1))}',
      '.cp-comp-swatch{width:36px;height:36px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,0.1));flex-shrink:0;transition:background-color 120ms ease}',
      '.cp-comp-value{flex:1;font-size:13px;font-family:"SF Mono","Fira Code","Cascadia Code",monospace;color:var(--text-primary,#ebebeb)}',

      '.cp-recent{display:flex;flex-direction:column;gap:8px}',
      '.cp-recent-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}',
      '.cp-recent-swatch{width:100%;aspect-ratio:1;border-radius:8px;border:2px solid transparent;cursor:pointer;transition:all 120ms ease;padding:0;background:none}',
      '.cp-recent-swatch:hover{border-color:var(--accent,#7b35f0);transform:scale(1.12)}',

      '.cp-empty{font-size:12px;color:var(--text-secondary,#888);padding:4px 0;font-style:italic}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function ColorPickerView($$anchor, $$props) {
    var props = typeof $$props === 'function' ? $$props() : $$props;
    var api = props && props.api;
    if (!api || !$$anchor) return;
    var container = $$anchor.parentNode;

    injectStyles();

    var currentColor = '#7b35f0';
    var recentColors = [];

    var root = el('div', 'cp-root');

    // ── Picker row ──
    var picker = el('div', 'cp-picker');

    var inputWrap = el('div', 'cp-input-wrap');
    var colorInput = el('input', 'cp-color-input', { type: 'color', value: currentColor });
    inputWrap.appendChild(colorInput);

    var swatch = el('div', 'cp-swatch');
    swatch.style.backgroundColor = currentColor;
    swatch.title = 'Click to copy HEX';
    swatch.addEventListener('click', function () {
      api.clipboard.copy(currentColor.toUpperCase());
      api.toast({ title: 'Copied!', message: currentColor.toUpperCase(), type: 'success' });
    });

    picker.appendChild(inputWrap);
    picker.appendChild(swatch);
    root.appendChild(picker);

    // ── Conversions ──
    var conversions = el('div', 'cp-conversions');

    function makeRow(label, getVal) {
      var row = el('div', 'cp-format-row');
      var lbl = el('span', 'cp-format-label');
      lbl.textContent = label;
      var val = el('span', 'cp-format-value');
      val.addEventListener('click', function () {
        api.clipboard.copy(getVal());
        api.toast({ title: 'Copied!', message: getVal(), type: 'success' });
      });
      var btn = el('button', 'cp-copy-btn');
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        api.clipboard.copy(getVal());
        api.toast({ title: 'Copied!', message: getVal(), type: 'success' });
      });
      row.appendChild(lbl);
      row.appendChild(val);
      row.appendChild(btn);
      return { row: row, val: val };
    }

    var hexRow = makeRow('HEX', function () { return currentColor.toUpperCase(); });
    var rgbRow = makeRow('RGB', function () {
      var c = hexToRgb(currentColor);
      return 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')';
    });
    var hslRow = makeRow('HSL', function () {
      var c = hexToRgb(currentColor);
      var h = rgbToHsl(c.r, c.g, c.b);
      return 'hsl(' + h.h + ', ' + h.s + '%, ' + h.l + '%)';
    });

    conversions.appendChild(hexRow.row);
    conversions.appendChild(rgbRow.row);
    conversions.appendChild(hslRow.row);
    root.appendChild(conversions);

    // ── Complementary ──
    var compSection = el('div', 'cp-complementary');
    var compTitle = el('span', 'cp-section-title');
    compTitle.textContent = 'Complementary';
    var compContent = el('div', 'cp-comp-content');
    var compSwatch = el('div', 'cp-comp-swatch');
    var compValue = el('span', 'cp-comp-value');
    var compBtn = el('button', 'cp-copy-btn');
    compBtn.textContent = 'Copy';
    compBtn.addEventListener('click', function () {
      var comp = complementaryHex(currentColor).toUpperCase();
      api.clipboard.copy(comp);
      api.toast({ title: 'Copied!', message: comp, type: 'success' });
    });
    compContent.appendChild(compSwatch);
    compContent.appendChild(compValue);
    compContent.appendChild(compBtn);
    compSection.appendChild(compTitle);
    compSection.appendChild(compContent);
    root.appendChild(compSection);

    // ── Recent Colors ──
    var recentSection = el('div', 'cp-recent');
    var recentTitle = el('span', 'cp-section-title');
    recentTitle.textContent = 'Recent Colors';
    var recentGrid = el('div', 'cp-recent-grid');
    var recentEmpty = el('div', 'cp-empty');
    recentEmpty.textContent = 'No recent colors yet';
    recentSection.appendChild(recentTitle);
    recentSection.appendChild(recentGrid);
    recentSection.appendChild(recentEmpty);
    root.appendChild(recentSection);

    // ── State helpers ──
    function refresh() {
      swatch.style.backgroundColor = currentColor;
      colorInput.value = currentColor;

      hexRow.val.textContent = currentColor.toUpperCase();

      var rgb = hexToRgb(currentColor);
      rgbRow.val.textContent = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';

      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hslRow.val.textContent = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';

      var comp = complementaryHex(currentColor);
      compSwatch.style.backgroundColor = comp;
      compValue.textContent = comp.toUpperCase();
    }

    function renderRecents() {
      recentGrid.innerHTML = '';
      recentEmpty.style.display = recentColors.length === 0 ? '' : 'none';
      recentColors.forEach(function (color) {
        var sw = el('button', 'cp-recent-swatch');
        sw.style.backgroundColor = color;
        sw.title = color.toUpperCase();
        sw.addEventListener('click', function () {
          currentColor = color;
          refresh();
        });
        recentGrid.appendChild(sw);
      });
    }

    function pushRecent(color) {
      recentColors = recentColors.filter(function (c) { return c !== color; });
      recentColors.unshift(color);
      if (recentColors.length > MAX_RECENT) recentColors = recentColors.slice(0, MAX_RECENT);
      renderRecents();
      api.storage.set('cp-recent-colors', JSON.stringify(recentColors));
    }

    // ── Events ──
    colorInput.addEventListener('input', function (e) {
      currentColor = e.target.value;
      refresh();
    });
    colorInput.addEventListener('change', function (e) {
      pushRecent(e.target.value);
    });

    // ── Init ──
    refresh();
    renderRecents();

    api.storage.get('cp-recent-colors').then(function (stored) {
      if (stored) {
        try {
          recentColors = JSON.parse(stored);
          renderRecents();
        } catch (_) { /* ignore */ }
      }
    });

    container.appendChild(root);
  }

  vanta.registerExtension('color-picker', {
    commands: {
      'pick': {
        component: ColorPickerView
      }
    }
  });
})(window.__vanta_host);
