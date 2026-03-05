(function(vanta) {
  function ClipboardToolsView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.clip-root{padding:16px;font-family:-apple-system,system-ui,sans-serif;color:var(--vanta-text,#e8e8e8)}',
      '.clip-title{font-size:16px;font-weight:600;margin-bottom:14px}',
      '.clip-section{margin-bottom:14px}',
      '.clip-label{font-size:11px;color:var(--vanta-text-dim,#888);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}',
      '.clip-textarea{width:100%;min-height:90px;padding:10px 12px;background:rgba(255,255,255,0.06);color:var(--vanta-text,#e8e8e8);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:8px;font-size:13px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;line-height:1.5}',
      '.clip-textarea:focus{border-color:var(--vanta-accent,#7b35f0)}',
      '.clip-textarea::placeholder{color:var(--vanta-text-dim,#888)}',
      '.clip-textarea[readonly]{opacity:.85;cursor:default}',
      '.clip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;margin-bottom:14px}',
      '.clip-btn{padding:8px 10px;background:var(--vanta-surface,#111);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:6px;color:var(--vanta-text,#e8e8e8);font-size:11px;font-weight:500;cursor:pointer;text-align:center;transition:all .15s;white-space:nowrap}',
      '.clip-btn:hover{background:rgba(255,255,255,0.06);border-color:var(--vanta-accent,#7b35f0)}',
      '.clip-btn:active{transform:scale(.97)}',
      '.clip-btn.active{border-color:var(--vanta-accent,#7b35f0);background:rgba(123,53,240,0.12)}',
      '.clip-copy{background:var(--vanta-accent,#7b35f0);color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;transition:opacity .15s;display:flex;align-items:center;gap:6px}',
      '.clip-copy:hover{opacity:.85}',
      '.clip-copy:active{transform:scale(.97)}',
      '.clip-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px}',
      '.clip-clear{background:transparent;border:1px solid var(--vanta-border,rgba(255,255,255,0.08));color:var(--vanta-text-dim,#888);padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;transition:all .15s}',
      '.clip-clear:hover{border-color:var(--vanta-text-dim,#888);color:var(--vanta-text,#e8e8e8)}',
      '.clip-swap{background:transparent;border:1px solid var(--vanta-border,rgba(255,255,255,0.08));color:var(--vanta-text-dim,#888);padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;transition:all .15s;display:flex;align-items:center;gap:4px}',
      '.clip-swap:hover{border-color:var(--vanta-text-dim,#888);color:var(--vanta-text,#e8e8e8)}'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'clip-root';

    $$anchor.before(style);
    $$anchor.before(root);

    function toTitleCase(s) {
      return s.replace(/\w\S*/g, function(t) {
        return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase();
      });
    }

    function toCamelCase(s) {
      return s
        .replace(/[^a-zA-Z0-9]+(.)/g, function(_, c) { return c.toUpperCase(); })
        .replace(/^[A-Z]/, function(c) { return c.toLowerCase(); });
    }

    function toSnakeCase(s) {
      return s
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
    }

    function toKebabCase(s) {
      return s
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    }

    function trimWhitespace(s) {
      return s.split('\n').map(function(l) {
        return l.trim().replace(/\s+/g, ' ');
      }).join('\n').trim();
    }

    function removeDuplicateLines(s) {
      var seen = {};
      return s.split('\n').filter(function(line) {
        if (seen[line]) return false;
        seen[line] = true;
        return true;
      }).join('\n');
    }

    function b64Encode(s) {
      try {
        return btoa(unescape(encodeURIComponent(s)));
      } catch (e) { return 'Error: ' + e.message; }
    }

    function b64Decode(s) {
      try {
        return decodeURIComponent(escape(atob(s.trim())));
      } catch (e) { return 'Error: Invalid Base64 input'; }
    }

    function jsonPrettify(s) {
      try {
        return JSON.stringify(JSON.parse(s), null, 2);
      } catch (e) { return 'Error: Invalid JSON'; }
    }

    function jsonMinify(s) {
      try {
        return JSON.stringify(JSON.parse(s));
      } catch (e) { return 'Error: Invalid JSON'; }
    }

    var transforms = [
      { label: 'UPPERCASE', fn: function(s) { return s.toUpperCase(); } },
      { label: 'lowercase', fn: function(s) { return s.toLowerCase(); } },
      { label: 'Title Case', fn: toTitleCase },
      { label: 'camelCase', fn: toCamelCase },
      { label: 'snake_case', fn: toSnakeCase },
      { label: 'kebab-case', fn: toKebabCase },
      { label: 'Trim Whitespace', fn: trimWhitespace },
      { label: 'Remove Dupes', fn: removeDuplicateLines },
      { label: 'URL Encode', fn: function(s) { return encodeURIComponent(s); } },
      { label: 'URL Decode', fn: function(s) { try { return decodeURIComponent(s); } catch(e) { return 'Error: Invalid encoding'; } } },
      { label: 'Base64 Encode', fn: b64Encode },
      { label: 'Base64 Decode', fn: b64Decode },
      { label: 'JSON Prettify', fn: jsonPrettify },
      { label: 'JSON Minify', fn: jsonMinify }
    ];

    var inputArea, outputArea;
    var activeBtn = null;
    var lastTransformFn = null;

    function render() {
      root.innerHTML = '';

      var title = document.createElement('div');
      title.className = 'clip-title';
      title.textContent = 'Clipboard Tools';
      root.appendChild(title);

      var inputSection = document.createElement('div');
      inputSection.className = 'clip-section';
      var inputLabel = document.createElement('div');
      inputLabel.className = 'clip-label';
      inputLabel.textContent = 'Input';
      inputSection.appendChild(inputLabel);
      inputArea = document.createElement('textarea');
      inputArea.className = 'clip-textarea';
      inputArea.placeholder = 'Paste or type text here\u2026';
      inputArea.oninput = function() {
        if (lastTransformFn) {
          outputArea.value = lastTransformFn(inputArea.value);
        }
      };
      inputSection.appendChild(inputArea);
      root.appendChild(inputSection);

      var gridLabel = document.createElement('div');
      gridLabel.className = 'clip-label';
      gridLabel.textContent = 'Transforms';
      root.appendChild(gridLabel);

      var grid = document.createElement('div');
      grid.className = 'clip-grid';

      transforms.forEach(function(t) {
        var btn = document.createElement('button');
        btn.className = 'clip-btn';
        btn.textContent = t.label;
        btn.onclick = function() {
          if (activeBtn) activeBtn.className = 'clip-btn';
          activeBtn = btn;
          btn.className = 'clip-btn active';
          lastTransformFn = t.fn;
          outputArea.value = t.fn(inputArea.value);
        };
        grid.appendChild(btn);
      });
      root.appendChild(grid);

      var outputSection = document.createElement('div');
      outputSection.className = 'clip-section';
      var outputLabel = document.createElement('div');
      outputLabel.className = 'clip-label';
      outputLabel.textContent = 'Output';
      outputSection.appendChild(outputLabel);
      outputArea = document.createElement('textarea');
      outputArea.className = 'clip-textarea';
      outputArea.readOnly = true;
      outputArea.placeholder = 'Transformed text appears here\u2026';
      outputSection.appendChild(outputArea);
      root.appendChild(outputSection);

      var actions = document.createElement('div');
      actions.className = 'clip-actions';

      var swapBtn = document.createElement('button');
      swapBtn.className = 'clip-swap';
      swapBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
      var swapText = document.createElement('span');
      swapText.textContent = 'Swap';
      swapBtn.appendChild(swapText);
      swapBtn.onclick = function() {
        var tmp = outputArea.value;
        inputArea.value = tmp;
        outputArea.value = '';
        if (activeBtn) { activeBtn.className = 'clip-btn'; activeBtn = null; }
        lastTransformFn = null;
      };
      actions.appendChild(swapBtn);

      var clearBtn = document.createElement('button');
      clearBtn.className = 'clip-clear';
      clearBtn.textContent = 'Clear';
      clearBtn.onclick = function() {
        inputArea.value = '';
        outputArea.value = '';
        if (activeBtn) { activeBtn.className = 'clip-btn'; activeBtn = null; }
        lastTransformFn = null;
      };
      actions.appendChild(clearBtn);

      var copyBtn = document.createElement('button');
      copyBtn.className = 'clip-copy';
      copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      var copyText = document.createElement('span');
      copyText.textContent = 'Copy Result';
      copyBtn.appendChild(copyText);
      copyBtn.onclick = async function() {
        var text = outputArea.value;
        if (!text) {
          api.toast({ title: 'Nothing to copy', type: 'info' });
          return;
        }
        await api.clipboard.copy(text);
        api.toast({ title: 'Copied!', message: 'Result copied to clipboard', type: 'success' });
      };
      actions.appendChild(copyBtn);

      root.appendChild(actions);
    }

    render();
  }

  vanta.registerExtension('clipboard-tools', {
    commands: { 'format': { component: ClipboardToolsView } }
  });
})(window.__vanta_host);
