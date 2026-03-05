(function(vanta) {

  // --- Safe math evaluator (shunting-yard + postfix) ---

  function tokenize(expr) {
    var tokens = [];
    var i = 0;
    var len = expr.length;
    while (i < len) {
      var ch = expr[i];
      if (ch === ' ') { i++; continue; }
      if ('0123456789.'.indexOf(ch) !== -1) {
        var num = '';
        while (i < len && '0123456789.'.indexOf(expr[i]) !== -1) { num += expr[i]; i++; }
        tokens.push({ type: 'num', value: parseFloat(num) });
        continue;
      }
      if ('+-*/^'.indexOf(ch) !== -1) {
        var isUnary = ch === '-' && (tokens.length === 0 ||
          tokens[tokens.length - 1].type === 'op' ||
          tokens[tokens.length - 1].type === 'lparen');
        if (isUnary) {
          tokens.push({ type: 'op', value: 'neg' });
        } else {
          tokens.push({ type: 'op', value: ch });
        }
        i++;
        continue;
      }
      if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
      if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
      i++;
    }
    return tokens;
  }

  var PREC = { '+': 2, '-': 2, '*': 3, '/': 3, '^': 4, 'neg': 5 };
  var RIGHT_ASSOC = { '^': true, 'neg': true };

  function shuntingYard(tokens) {
    var output = [];
    var ops = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === 'num') {
        output.push(t);
      } else if (t.type === 'op') {
        while (ops.length > 0) {
          var top = ops[ops.length - 1];
          if (top.type !== 'op') break;
          if (RIGHT_ASSOC[t.value]) {
            if (PREC[top.value] > PREC[t.value]) { output.push(ops.pop()); } else { break; }
          } else {
            if (PREC[top.value] >= PREC[t.value]) { output.push(ops.pop()); } else { break; }
          }
        }
        ops.push(t);
      } else if (t.type === 'lparen') {
        ops.push(t);
      } else if (t.type === 'rparen') {
        while (ops.length > 0 && ops[ops.length - 1].type !== 'lparen') {
          output.push(ops.pop());
        }
        if (ops.length > 0) ops.pop();
      }
    }
    while (ops.length > 0) output.push(ops.pop());
    return output;
  }

  function evalPostfix(rpn) {
    var stack = [];
    for (var i = 0; i < rpn.length; i++) {
      var t = rpn[i];
      if (t.type === 'num') {
        stack.push(t.value);
      } else if (t.type === 'op') {
        if (t.value === 'neg') {
          if (stack.length < 1) return NaN;
          stack.push(-stack.pop());
        } else {
          if (stack.length < 2) return NaN;
          var b = stack.pop(), a = stack.pop();
          switch (t.value) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/': stack.push(b === 0 ? NaN : a / b); break;
            case '^': stack.push(Math.pow(a, b)); break;
          }
        }
      }
    }
    return stack.length === 1 ? stack[0] : NaN;
  }

  function safeMathEval(expr) {
    var tokens = tokenize(expr);
    if (tokens.length === 0) return null;
    var rpn = shuntingYard(tokens);
    var result = evalPostfix(rpn);
    return isNaN(result) || !isFinite(result) ? null : result;
  }

  // --- Unit conversions ---

  var CONVERSIONS = {
    'km_miles':      function(v) { return v * 0.621371; },
    'miles_km':      function(v) { return v / 0.621371; },
    'celsius_fahrenheit': function(v) { return v * 9 / 5 + 32; },
    'fahrenheit_celsius': function(v) { return (v - 32) * 5 / 9; },
    'kg_lbs':        function(v) { return v * 2.20462; },
    'lbs_kg':        function(v) { return v / 2.20462; },
    'cm_inches':     function(v) { return v / 2.54; },
    'inches_cm':     function(v) { return v * 2.54; },
    'm_feet':        function(v) { return v * 3.28084; },
    'feet_m':        function(v) { return v / 3.28084; },
    'liters_gallons': function(v) { return v * 0.264172; },
    'gallons_liters': function(v) { return v / 0.264172; },
    'g_oz':          function(v) { return v * 0.035274; },
    'oz_g':          function(v) { return v / 0.035274; }
  };

  var UNIT_ALIASES = {
    'km': 'km', 'kilometer': 'km', 'kilometers': 'km',
    'miles': 'miles', 'mile': 'miles', 'mi': 'miles',
    'celsius': 'celsius', 'c': 'celsius',
    'fahrenheit': 'fahrenheit', 'f': 'fahrenheit',
    'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
    'lbs': 'lbs', 'lb': 'lbs', 'pounds': 'lbs', 'pound': 'lbs',
    'cm': 'cm', 'centimeter': 'cm', 'centimeters': 'cm',
    'inches': 'inches', 'inch': 'inches', 'in': 'inches',
    'm': 'm', 'meter': 'm', 'meters': 'm',
    'feet': 'feet', 'foot': 'feet', 'ft': 'feet',
    'liters': 'liters', 'liter': 'liters', 'l': 'liters',
    'gallons': 'gallons', 'gallon': 'gallons', 'gal': 'gallons',
    'g': 'g', 'gram': 'g', 'grams': 'g',
    'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz'
  };

  function tryConversion(input) {
    var lower = input.toLowerCase().trim();

    // Percentage: "15% of 200"
    var pctMatch = lower.match(/^([\d.]+)\s*%\s*of\s*([\d.]+)$/);
    if (pctMatch) {
      var pct = parseFloat(pctMatch[1]);
      var base = parseFloat(pctMatch[2]);
      if (!isNaN(pct) && !isNaN(base)) {
        return { result: pct / 100 * base, label: pctMatch[1] + '% of ' + pctMatch[2] };
      }
    }

    // Unit conversion: "100 km to miles"
    var convMatch = lower.match(/^([\d.]+)\s*([a-z]+)\s+(?:to|in)\s+([a-z]+)$/);
    if (convMatch) {
      var val = parseFloat(convMatch[1]);
      var fromRaw = convMatch[2];
      var toRaw = convMatch[3];
      var fromUnit = UNIT_ALIASES[fromRaw];
      var toUnit = UNIT_ALIASES[toRaw];
      if (fromUnit && toUnit) {
        var key = fromUnit + '_' + toUnit;
        if (CONVERSIONS[key]) {
          var res = CONVERSIONS[key](val);
          return { result: res, label: val + ' ' + fromUnit + ' \u2192 ' + toUnit };
        }
      }
    }

    return null;
  }

  function formatResult(num) {
    if (Number.isInteger(num)) return num.toString();
    var s = num.toPrecision(10);
    return parseFloat(s).toString();
  }

  // --- Quick conversions ---
  var QUICK_CONVERSIONS = [
    { label: 'km \u2192 mi', from: 'km', to: 'miles' },
    { label: '\u00b0C \u2192 \u00b0F', from: 'celsius', to: 'fahrenheit' },
    { label: 'kg \u2192 lbs', from: 'kg', to: 'lbs' },
    { label: 'cm \u2192 in', from: 'cm', to: 'inches' },
    { label: 'm \u2192 ft', from: 'm', to: 'feet' },
    { label: 'L \u2192 gal', from: 'liters', to: 'gallons' }
  ];

  function CalculatorView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.calc-root { padding: 16px; font-family: inherit; color: var(--vanta-text, #e8e8e8); height: 100%; overflow-y: auto; box-sizing: border-box; }',
      '.calc-input-wrap { margin-bottom: 12px; }',
      '.calc-input { width: 100%; background: rgba(255,255,255,0.06); color: var(--vanta-text, #e8e8e8); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 8px; padding: 12px 14px; font-size: 16px; outline: none; box-sizing: border-box; font-family: inherit; }',
      '.calc-input:focus { border-color: var(--vanta-accent, #7b35f0); }',
      '.calc-input::placeholder { color: var(--vanta-text-dim, #888); }',
      '.calc-preview { background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; min-height: 24px; }',
      '.calc-preview-label { font-size: 13px; color: var(--vanta-text-dim, #888); }',
      '.calc-preview-value { font-size: 22px; font-weight: 700; color: var(--vanta-text, #e8e8e8); }',
      '.calc-preview-empty { font-size: 14px; color: var(--vanta-text-dim, #888); font-style: italic; }',
      '.calc-section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vanta-text-dim, #888); margin-bottom: 8px; margin-top: 8px; font-weight: 600; }',
      '.calc-quick-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }',
      '.calc-quick-btn { background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: var(--vanta-text, #e8e8e8); cursor: pointer; }',
      '.calc-quick-btn:hover { border-color: var(--vanta-accent, #7b35f0); }',
      '.calc-history-list { display: flex; flex-direction: column; gap: 4px; }',
      '.calc-history-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; cursor: pointer; }',
      '.calc-history-item:hover { border-color: var(--vanta-accent, #7b35f0); }',
      '.calc-history-expr { font-size: 13px; color: var(--vanta-text-dim, #888); }',
      '.calc-history-result { font-size: 14px; font-weight: 600; color: var(--vanta-text, #e8e8e8); }',
      '.calc-clear-btn { background: transparent; color: var(--vanta-text-dim, #888); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 12px; margin-top: 10px; }',
      '.calc-clear-btn:hover { color: #e85454; border-color: rgba(232,84,84,0.3); }',
      '.calc-hint { font-size: 12px; color: var(--vanta-text-dim, #888); margin-top: 12px; line-height: 1.6; }',
      '.calc-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'calc-root';

    var state = {
      input: '',
      preview: null,
      previewLabel: '',
      history: [],
      quickMode: null
    };

    function evaluate(expr) {
      if (!expr.trim()) return { result: null, label: '' };
      var conv = tryConversion(expr);
      if (conv) return { result: conv.result, label: conv.label };
      var mathResult = safeMathEval(expr);
      if (mathResult !== null) return { result: mathResult, label: expr };
      return { result: null, label: '' };
    }

    function render() {
      root.innerHTML = '';

      var inputWrap = document.createElement('div');
      inputWrap.className = 'calc-input-wrap';
      var input = document.createElement('input');
      input.className = 'calc-input';
      input.type = 'text';
      input.value = state.input;
      input.placeholder = state.quickMode
        ? 'Enter value in ' + state.quickMode.from + '\u2026'
        : 'Type expression, e.g. 2+2 or 100 km to miles\u2026';

      input.addEventListener('input', function(e) {
        state.input = e.target.value;
        var evalExpr = state.input;
        if (state.quickMode && /^[\d.]+$/.test(state.input.trim())) {
          evalExpr = state.input.trim() + ' ' + state.quickMode.from + ' to ' + state.quickMode.to;
        }
        var ev = evaluate(evalExpr);
        state.preview = ev.result;
        state.previewLabel = ev.label;
        renderPreview();
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && state.preview !== null) {
          var formatted = formatResult(state.preview);
          addHistory(state.previewLabel || state.input, formatted);
          api.clipboard.copy(formatted).then(function() {
            api.toast({ title: 'Copied', message: formatted, type: 'success' });
          });
          state.input = '';
          state.preview = null;
          state.previewLabel = '';
          state.quickMode = null;
          render();
        }
        if (e.key === 'Escape' && state.quickMode) {
          state.quickMode = null;
          state.input = '';
          state.preview = null;
          render();
        }
      });
      inputWrap.appendChild(input);
      root.appendChild(inputWrap);

      var preview = document.createElement('div');
      preview.className = 'calc-preview';
      preview.id = 'calc-preview-box';
      renderPreviewContent(preview);
      root.appendChild(preview);

      // Quick conversions
      var qTitle = document.createElement('div');
      qTitle.className = 'calc-section-title';
      qTitle.textContent = 'Quick Conversions';
      root.appendChild(qTitle);
      var qGrid = document.createElement('div');
      qGrid.className = 'calc-quick-grid';
      QUICK_CONVERSIONS.forEach(function(q) {
        var btn = document.createElement('button');
        btn.className = 'calc-quick-btn';
        btn.textContent = q.label;
        if (state.quickMode && state.quickMode.from === q.from && state.quickMode.to === q.to) {
          btn.style.borderColor = 'var(--vanta-accent, #7b35f0)';
          btn.style.color = 'var(--vanta-accent, #7b35f0)';
        }
        btn.addEventListener('click', function() {
          state.quickMode = { from: q.from, to: q.to };
          state.input = '';
          state.preview = null;
          render();
          root.querySelector('.calc-input').focus();
        });
        qGrid.appendChild(btn);
      });
      root.appendChild(qGrid);

      // History
      if (state.history.length > 0) {
        var hdrRow = document.createElement('div');
        hdrRow.className = 'calc-header-row';
        var hTitle = document.createElement('div');
        hTitle.className = 'calc-section-title';
        hTitle.style.margin = '0';
        hTitle.textContent = 'History';
        hdrRow.appendChild(hTitle);
        var clearBtn = document.createElement('button');
        clearBtn.className = 'calc-clear-btn';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', function() {
          state.history = [];
          persistHistory();
          render();
        });
        hdrRow.appendChild(clearBtn);
        root.appendChild(hdrRow);

        var hList = document.createElement('div');
        hList.className = 'calc-history-list';
        state.history.forEach(function(h) {
          var item = document.createElement('div');
          item.className = 'calc-history-item';
          var exprSpan = document.createElement('span');
          exprSpan.className = 'calc-history-expr';
          exprSpan.textContent = h.expr;
          item.appendChild(exprSpan);
          var resSpan = document.createElement('span');
          resSpan.className = 'calc-history-result';
          resSpan.textContent = h.result;
          item.appendChild(resSpan);
          item.addEventListener('click', function() {
            api.clipboard.copy(h.result).then(function() {
              api.toast({ title: 'Copied', message: h.result, type: 'success' });
            });
          });
          hList.appendChild(item);
        });
        root.appendChild(hList);
      } else {
        var hint = document.createElement('div');
        hint.className = 'calc-hint';
        hint.innerHTML = [
          'Try: <b>2 + 3 * (4 - 1)</b>',
          '<b>100 km to miles</b>',
          '<b>32 celsius to fahrenheit</b>',
          '<b>15% of 200</b>'
        ].join(' &middot; ');
        root.appendChild(hint);
      }

      setTimeout(function() { input.focus(); }, 0);
    }

    function renderPreviewContent(el) {
      el.innerHTML = '';
      if (state.preview !== null) {
        var lbl = document.createElement('span');
        lbl.className = 'calc-preview-label';
        lbl.textContent = state.previewLabel || '';
        el.appendChild(lbl);
        var val = document.createElement('span');
        val.className = 'calc-preview-value';
        val.textContent = '= ' + formatResult(state.preview);
        el.appendChild(val);
      } else {
        var empty = document.createElement('span');
        empty.className = 'calc-preview-empty';
        empty.textContent = state.input ? 'Invalid expression' : 'Result appears here';
        el.appendChild(empty);
      }
    }

    function renderPreview() {
      var box = root.querySelector('#calc-preview-box');
      if (box) renderPreviewContent(box);
    }

    function addHistory(expr, result) {
      state.history.unshift({ expr: expr, result: result });
      if (state.history.length > 20) state.history = state.history.slice(0, 20);
      persistHistory();
    }

    function persistHistory() {
      api.storage.set('calc_history', JSON.stringify(state.history));
    }

    function loadHistory() {
      return api.storage.get('calc_history').then(function(val) {
        if (val) {
          try { state.history = JSON.parse(val); } catch(e) { state.history = []; }
        }
      }).catch(function() {});
    }

    loadHistory().then(function() { render(); });

    $$anchor.before(style);
    $$anchor.before(root);
  }

  vanta.registerExtension('smart-calculator', {
    commands: { 'calculate': { component: CalculatorView } }
  });

})(window.__vanta_host);
