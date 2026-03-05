(function(vanta) {

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function complementaryHex(hex) {
    var rgb = hexToRgb(hex);
    var r = 255 - rgb.r, g = 255 - rgb.g, b = 255 - rgb.b;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function formatHex(hex) {
    return hex.toUpperCase();
  }

  function formatRgb(rgb) {
    return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
  }

  function formatHsl(hsl) {
    return 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
  }

  function ColorPickerView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.cp-root { padding: 16px; font-family: inherit; color: var(--vanta-text, #e8e8e8); height: 100%; overflow-y: auto; box-sizing: border-box; }',
      '.cp-preview-row { display: flex; gap: 12px; align-items: stretch; margin-bottom: 16px; }',
      '.cp-swatch-wrap { position: relative; width: 80px; height: 80px; border-radius: 12px; overflow: hidden; border: 2px solid var(--vanta-border, rgba(255,255,255,0.08)); flex-shrink: 0; cursor: pointer; }',
      '.cp-swatch-wrap input[type="color"] { position: absolute; inset: 0; width: 100%; height: 100%; border: none; padding: 0; cursor: pointer; opacity: 0; }',
      '.cp-swatch-bg { width: 100%; height: 100%; }',
      '.cp-comp-wrap { display: flex; flex-direction: column; gap: 6px; }',
      '.cp-comp-label { font-size: 12px; color: var(--vanta-text-dim, #888); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }',
      '.cp-comp-swatch { width: 48px; height: 48px; border-radius: 8px; border: 2px solid var(--vanta-border, rgba(255,255,255,0.08)); }',
      '.cp-formats { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }',
      '.cp-format-row { display: flex; align-items: center; background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 8px; overflow: hidden; cursor: pointer; }',
      '.cp-format-row:hover { border-color: var(--vanta-accent, #7b35f0); }',
      '.cp-format-label { font-size: 11px; font-weight: 700; color: var(--vanta-text-dim, #888); text-transform: uppercase; padding: 10px 12px; width: 40px; text-align: center; letter-spacing: 0.5px; }',
      '.cp-format-value { flex: 1; font-size: 14px; color: var(--vanta-text, #e8e8e8); padding: 10px 14px; font-family: monospace; }',
      '.cp-copy-hint { font-size: 11px; color: var(--vanta-text-dim, #888); padding: 10px 12px; }',
      '.cp-section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vanta-text-dim, #888); margin-bottom: 8px; margin-top: 8px; font-weight: 600; }',
      '.cp-recent-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }',
      '.cp-recent-swatch { aspect-ratio: 1; border-radius: 8px; cursor: pointer; border: 2px solid var(--vanta-border, rgba(255,255,255,0.08)); transition: border-color 0.15s; }',
      '.cp-recent-swatch:hover { border-color: var(--vanta-accent, #7b35f0); }',
      '.cp-hex-input-row { display: flex; gap: 8px; margin-bottom: 16px; }',
      '.cp-hex-input { flex: 1; background: rgba(255,255,255,0.06); color: var(--vanta-text, #e8e8e8); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 8px 12px; font-size: 14px; font-family: monospace; outline: none; }',
      '.cp-hex-input:focus { border-color: var(--vanta-accent, #7b35f0); }',
      '.cp-hex-input::placeholder { color: var(--vanta-text-dim, #888); }',
      '.cp-empty { text-align: center; padding: 16px; color: var(--vanta-text-dim, #888); font-size: 13px; }'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'cp-root';

    var state = {
      color: '#7B35F0',
      recentColors: []
    };

    function copyFormat(text, label) {
      api.clipboard.copy(text).then(function() {
        api.toast({ title: 'Copied', message: label + ': ' + text, type: 'success' });
      });
    }

    function addToRecent(hex) {
      hex = hex.toUpperCase();
      state.recentColors = state.recentColors.filter(function(c) { return c !== hex; });
      state.recentColors.unshift(hex);
      if (state.recentColors.length > 12) state.recentColors = state.recentColors.slice(0, 12);
      api.storage.set('cp_recent', JSON.stringify(state.recentColors));
    }

    function render() {
      root.innerHTML = '';
      var hex = formatHex(state.color);
      var rgb = hexToRgb(state.color);
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      var comp = complementaryHex(state.color);

      // Color input + swatch row
      var previewRow = document.createElement('div');
      previewRow.className = 'cp-preview-row';

      var swatchWrap = document.createElement('div');
      swatchWrap.className = 'cp-swatch-wrap';
      var swatchBg = document.createElement('div');
      swatchBg.className = 'cp-swatch-bg';
      swatchBg.style.background = hex;
      swatchWrap.appendChild(swatchBg);
      var colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = state.color;
      colorInput.addEventListener('input', function(e) {
        state.color = e.target.value;
        addToRecent(state.color);
        render();
      });
      swatchWrap.appendChild(colorInput);
      previewRow.appendChild(swatchWrap);

      // Complementary
      var compWrap = document.createElement('div');
      compWrap.className = 'cp-comp-wrap';
      var compLabel = document.createElement('div');
      compLabel.className = 'cp-comp-label';
      compLabel.textContent = 'Complementary';
      compWrap.appendChild(compLabel);
      var compSwatch = document.createElement('div');
      compSwatch.className = 'cp-comp-swatch';
      compSwatch.style.background = comp;
      compSwatch.style.cursor = 'pointer';
      compSwatch.title = comp.toUpperCase();
      compSwatch.addEventListener('click', function() {
        copyFormat(comp.toUpperCase(), 'Complementary');
      });
      compWrap.appendChild(compSwatch);
      var compHexLabel = document.createElement('div');
      compHexLabel.style.fontSize = '12px';
      compHexLabel.style.color = 'var(--vanta-text-dim, #888)';
      compHexLabel.style.fontFamily = 'monospace';
      compHexLabel.style.marginTop = '2px';
      compHexLabel.textContent = comp.toUpperCase();
      compWrap.appendChild(compHexLabel);
      previewRow.appendChild(compWrap);

      root.appendChild(previewRow);

      // Hex input
      var hexRow = document.createElement('div');
      hexRow.className = 'cp-hex-input-row';
      var hexInput = document.createElement('input');
      hexInput.className = 'cp-hex-input';
      hexInput.type = 'text';
      hexInput.value = hex;
      hexInput.placeholder = '#000000';
      hexInput.addEventListener('input', function(e) {
        var v = e.target.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          state.color = v;
          addToRecent(state.color);
          render();
        }
      });
      hexInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var v = e.target.value.trim();
          if (/^#[0-9a-fA-F]{3,6}$/.test(v)) {
            state.color = v.length === 4
              ? '#' + v[1]+v[1]+v[2]+v[2]+v[3]+v[3]
              : v;
            addToRecent(state.color);
            render();
          }
        }
      });
      hexRow.appendChild(hexInput);
      root.appendChild(hexRow);

      // Format rows
      var formats = document.createElement('div');
      formats.className = 'cp-formats';

      var fmts = [
        { label: 'HEX', value: hex },
        { label: 'RGB', value: formatRgb(rgb) },
        { label: 'HSL', value: formatHsl(hsl) }
      ];

      fmts.forEach(function(f) {
        var row = document.createElement('div');
        row.className = 'cp-format-row';
        row.addEventListener('click', function() { copyFormat(f.value, f.label); });
        var label = document.createElement('div');
        label.className = 'cp-format-label';
        label.textContent = f.label;
        row.appendChild(label);
        var val = document.createElement('div');
        val.className = 'cp-format-value';
        val.textContent = f.value;
        row.appendChild(val);
        var hint = document.createElement('div');
        hint.className = 'cp-copy-hint';
        hint.textContent = 'Click to copy';
        row.appendChild(hint);
        formats.appendChild(row);
      });
      root.appendChild(formats);

      // Recent colors
      if (state.recentColors.length > 0) {
        var rTitle = document.createElement('div');
        rTitle.className = 'cp-section-title';
        rTitle.textContent = 'Recent Colors';
        root.appendChild(rTitle);
        var rGrid = document.createElement('div');
        rGrid.className = 'cp-recent-grid';
        state.recentColors.forEach(function(c) {
          var swatch = document.createElement('div');
          swatch.className = 'cp-recent-swatch';
          swatch.style.background = c;
          swatch.title = c;
          swatch.addEventListener('click', function() {
            state.color = c;
            render();
          });
          rGrid.appendChild(swatch);
        });
        root.appendChild(rGrid);
      } else {
        var emptyMsg = document.createElement('div');
        emptyMsg.className = 'cp-empty';
        emptyMsg.textContent = 'Pick a color to get started';
        root.appendChild(emptyMsg);
      }
    }

    function loadRecent() {
      return api.storage.get('cp_recent').then(function(val) {
        if (val) {
          try { state.recentColors = JSON.parse(val); } catch(e) { state.recentColors = []; }
        }
      }).catch(function() {});
    }

    loadRecent().then(function() { render(); });

    $$anchor.before(style);
    $$anchor.before(root);
  }

  vanta.registerExtension('color-picker', {
    commands: { 'pick': { component: ColorPickerView } }
  });

})(window.__vanta_host);
