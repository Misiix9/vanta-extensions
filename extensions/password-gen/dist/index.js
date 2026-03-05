(function(vanta) {
  function PasswordGenView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.pwd-root{padding:16px;font-family:-apple-system,system-ui,sans-serif;color:var(--vanta-text,#e8e8e8)}',
      '.pwd-title{font-size:16px;font-weight:600;margin-bottom:16px}',
      '.pwd-display{background:var(--vanta-surface,#111);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:10px;padding:20px;margin-bottom:16px;text-align:center;position:relative;min-height:32px;display:flex;align-items:center;justify-content:center}',
      '.pwd-text{font-family:"SF Mono",SFMono-Regular,ui-monospace,"DejaVu Sans Mono",Menlo,Consolas,monospace;font-size:18px;font-weight:500;word-break:break-all;line-height:1.5;letter-spacing:.5px;user-select:all}',
      '.pwd-strength{margin-bottom:16px}',
      '.pwd-strength-bar{width:100%;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden}',
      '.pwd-strength-fill{height:100%;border-radius:2px;transition:width .3s ease,background .3s ease}',
      '.pwd-strength-label{display:flex;justify-content:space-between;align-items:center;margin-top:6px}',
      '.pwd-strength-text{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}',
      '.pwd-strength-bits{font-size:11px;color:var(--vanta-text-dim,#888)}',
      '.pwd-actions{display:flex;gap:8px;margin-bottom:20px}',
      '.pwd-btn{flex:1;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s;border:none}',
      '.pwd-btn:active{transform:scale(.97)}',
      '.pwd-btn-gen{background:var(--vanta-accent,#7b35f0);color:#fff}',
      '.pwd-btn-gen:hover{opacity:.85}',
      '.pwd-btn-copy{background:var(--vanta-surface,#111);color:var(--vanta-text,#e8e8e8);border:1px solid var(--vanta-border,rgba(255,255,255,0.08)) !important}',
      '.pwd-btn-copy:hover{border-color:var(--vanta-accent,#7b35f0) !important}',
      '.pwd-options{background:var(--vanta-surface,#111);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:10px;padding:16px}',
      '.pwd-opt-title{font-size:11px;color:var(--vanta-text-dim,#888);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}',
      '.pwd-slider-row{display:flex;align-items:center;gap:12px;margin-bottom:16px}',
      '.pwd-slider-label{font-size:13px;flex-shrink:0;min-width:54px}',
      '.pwd-slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;outline:none}',
      '.pwd-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--vanta-accent,#7b35f0);cursor:pointer;border:2px solid var(--vanta-bg,#000)}',
      '.pwd-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--vanta-accent,#7b35f0);cursor:pointer;border:2px solid var(--vanta-bg,#000)}',
      '.pwd-slider-val{font-size:14px;font-weight:600;min-width:32px;text-align:right;font-family:"SF Mono",SFMono-Regular,monospace}',
      '.pwd-checks{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.pwd-check{display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border-radius:6px;transition:background .1s}',
      '.pwd-check:hover{background:rgba(255,255,255,0.03)}',
      '.pwd-checkbox{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--vanta-border,rgba(255,255,255,0.15));background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}',
      '.pwd-checkbox.checked{background:var(--vanta-accent,#7b35f0);border-color:var(--vanta-accent,#7b35f0)}',
      '.pwd-check-label{font-size:13px;user-select:none}'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'pwd-root';

    $$anchor.before(style);
    $$anchor.before(root);

    var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var LOWER = 'abcdefghijklmnopqrstuvwxyz';
    var DIGITS = '0123456789';
    var SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    var length = 16;
    var useUpper = true;
    var useLower = true;
    var useDigits = true;
    var useSymbols = false;
    var currentPassword = '';

    var passwordEl, strengthFill, strengthText, strengthBits, sliderVal;

    var svgCheck = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    function generate() {
      var charset = '';
      if (useUpper) charset += UPPER;
      if (useLower) charset += LOWER;
      if (useDigits) charset += DIGITS;
      if (useSymbols) charset += SYMBOLS;

      if (!charset) {
        useLower = true;
        charset = LOWER;
        updateCheckboxes();
      }

      var arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      var pw = '';
      for (var i = 0; i < length; i++) {
        pw += charset[arr[i] % charset.length];
      }
      currentPassword = pw;
      updateDisplay();
    }

    function getStrength() {
      var types = 0;
      if (/[A-Z]/.test(currentPassword)) types++;
      if (/[a-z]/.test(currentPassword)) types++;
      if (/[0-9]/.test(currentPassword)) types++;
      if (/[^A-Za-z0-9]/.test(currentPassword)) types++;

      var len = currentPassword.length;
      if (len >= 25 && types >= 4) return { level: 'very-strong', label: 'Very Strong', color: '#3b82f6', pct: 100 };
      if (len >= 16 && types >= 3) return { level: 'strong', label: 'Strong', color: '#22c55e', pct: 75 };
      if (len >= 10 && types >= 2) return { level: 'medium', label: 'Medium', color: '#f59e0b', pct: 50 };
      return { level: 'weak', label: 'Weak', color: '#ef4444', pct: 25 };
    }

    function estimateEntropy() {
      var poolSize = 0;
      if (/[A-Z]/.test(currentPassword)) poolSize += 26;
      if (/[a-z]/.test(currentPassword)) poolSize += 26;
      if (/[0-9]/.test(currentPassword)) poolSize += 10;
      if (/[^A-Za-z0-9]/.test(currentPassword)) poolSize += 32;
      if (poolSize === 0) return 0;
      return Math.round(currentPassword.length * Math.log2(poolSize));
    }

    function updateDisplay() {
      if (passwordEl) passwordEl.textContent = currentPassword;
      var s = getStrength();
      if (strengthFill) {
        strengthFill.style.width = s.pct + '%';
        strengthFill.style.background = s.color;
      }
      if (strengthText) {
        strengthText.textContent = s.label;
        strengthText.style.color = s.color;
      }
      if (strengthBits) {
        strengthBits.textContent = estimateEntropy() + ' bits of entropy';
      }
    }

    var checkboxEls = {};

    function updateCheckboxes() {
      var states = { upper: useUpper, lower: useLower, digits: useDigits, symbols: useSymbols };
      for (var key in states) {
        if (checkboxEls[key]) {
          checkboxEls[key].className = 'pwd-checkbox' + (states[key] ? ' checked' : '');
          checkboxEls[key].innerHTML = states[key] ? svgCheck : '';
        }
      }
    }

    function render() {
      root.innerHTML = '';

      var title = document.createElement('div');
      title.className = 'pwd-title';
      title.textContent = 'Password Generator';
      root.appendChild(title);

      var display = document.createElement('div');
      display.className = 'pwd-display';
      passwordEl = document.createElement('div');
      passwordEl.className = 'pwd-text';
      display.appendChild(passwordEl);
      root.appendChild(display);

      var strengthWrap = document.createElement('div');
      strengthWrap.className = 'pwd-strength';
      var bar = document.createElement('div');
      bar.className = 'pwd-strength-bar';
      strengthFill = document.createElement('div');
      strengthFill.className = 'pwd-strength-fill';
      bar.appendChild(strengthFill);
      strengthWrap.appendChild(bar);
      var labelRow = document.createElement('div');
      labelRow.className = 'pwd-strength-label';
      strengthText = document.createElement('span');
      strengthText.className = 'pwd-strength-text';
      strengthBits = document.createElement('span');
      strengthBits.className = 'pwd-strength-bits';
      labelRow.appendChild(strengthText);
      labelRow.appendChild(strengthBits);
      strengthWrap.appendChild(labelRow);
      root.appendChild(strengthWrap);

      var actions = document.createElement('div');
      actions.className = 'pwd-actions';

      var genBtn = document.createElement('button');
      genBtn.className = 'pwd-btn pwd-btn-gen';
      genBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>';
      var genText = document.createElement('span');
      genText.textContent = 'Generate';
      genBtn.appendChild(genText);
      genBtn.onclick = generate;
      actions.appendChild(genBtn);

      var copyBtn = document.createElement('button');
      copyBtn.className = 'pwd-btn pwd-btn-copy';
      copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      var copyText = document.createElement('span');
      copyText.textContent = 'Copy';
      copyBtn.appendChild(copyText);
      copyBtn.onclick = async function() {
        if (!currentPassword) return;
        await api.clipboard.copy(currentPassword);
        api.toast({ title: 'Copied!', message: 'Password copied to clipboard', type: 'success' });
      };
      actions.appendChild(copyBtn);
      root.appendChild(actions);

      var options = document.createElement('div');
      options.className = 'pwd-options';

      var optTitle = document.createElement('div');
      optTitle.className = 'pwd-opt-title';
      optTitle.textContent = 'Options';
      options.appendChild(optTitle);

      var sliderRow = document.createElement('div');
      sliderRow.className = 'pwd-slider-row';
      var sliderLabel = document.createElement('span');
      sliderLabel.className = 'pwd-slider-label';
      sliderLabel.textContent = 'Length';
      sliderRow.appendChild(sliderLabel);

      var slider = document.createElement('input');
      slider.className = 'pwd-slider';
      slider.type = 'range';
      slider.min = '8';
      slider.max = '128';
      slider.value = String(length);
      sliderRow.appendChild(slider);

      sliderVal = document.createElement('span');
      sliderVal.className = 'pwd-slider-val';
      sliderVal.textContent = String(length);
      sliderRow.appendChild(sliderVal);

      slider.oninput = function() {
        length = parseInt(slider.value);
        sliderVal.textContent = String(length);
        generate();
      };

      options.appendChild(sliderRow);

      var checks = document.createElement('div');
      checks.className = 'pwd-checks';

      function addCheck(key, label, checked) {
        var wrap = document.createElement('label');
        wrap.className = 'pwd-check';
        var box = document.createElement('div');
        box.className = 'pwd-checkbox' + (checked ? ' checked' : '');
        box.innerHTML = checked ? svgCheck : '';
        checkboxEls[key] = box;
        wrap.appendChild(box);
        var lbl = document.createElement('span');
        lbl.className = 'pwd-check-label';
        lbl.textContent = label;
        wrap.appendChild(lbl);
        wrap.onclick = function(e) {
          e.preventDefault();
          if (key === 'upper') useUpper = !useUpper;
          else if (key === 'lower') useLower = !useLower;
          else if (key === 'digits') useDigits = !useDigits;
          else if (key === 'symbols') useSymbols = !useSymbols;
          var active = useUpper || useLower || useDigits || useSymbols;
          if (!active) {
            if (key === 'lower') useLower = true;
            else { useLower = true; }
          }
          updateCheckboxes();
          generate();
        };
        checks.appendChild(wrap);
      }

      addCheck('upper', 'Uppercase (A-Z)', useUpper);
      addCheck('lower', 'Lowercase (a-z)', useLower);
      addCheck('digits', 'Numbers (0-9)', useDigits);
      addCheck('symbols', 'Symbols (!@#$)', useSymbols);

      options.appendChild(checks);
      root.appendChild(options);

      generate();
    }

    render();
  }

  vanta.registerExtension('password-gen', {
    commands: { 'generate': { component: PasswordGenView } }
  });
})(window.__vanta_host);
