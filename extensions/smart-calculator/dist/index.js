(function (vanta) {
  // --- Safe expression tokenizer ---
  function tokenize(expr) {
    var tokens = [];
    var i = 0;
    while (i < expr.length) {
      if (expr[i] === " ") { i++; continue; }
      if (
        (expr[i] >= "0" && expr[i] <= "9") ||
        (expr[i] === "." && i + 1 < expr.length && expr[i + 1] >= "0" && expr[i + 1] <= "9")
      ) {
        var num = "";
        while (i < expr.length && ((expr[i] >= "0" && expr[i] <= "9") || expr[i] === ".")) {
          num += expr[i];
          i++;
        }
        var val = parseFloat(num);
        if (i < expr.length && expr[i] === "%") {
          val /= 100;
          i++;
        }
        tokens.push({ t: "n", v: val });
        continue;
      }
      if ("+-*/^".indexOf(expr[i]) >= 0) {
        tokens.push({ t: "o", v: expr[i] });
        i++;
        continue;
      }
      if (expr[i] === "(") { tokens.push({ t: "(" }); i++; continue; }
      if (expr[i] === ")") { tokens.push({ t: ")" }); i++; continue; }
      i++;
    }
    return tokens;
  }

  // --- Shunting-yard evaluator ---
  function evaluate(expr) {
    var tokens = tokenize(expr);
    if (!tokens.length) return null;

    var proc = [];
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (tk.t === "o" && tk.v === "-") {
        if (i === 0 || tokens[i - 1].t === "o" || tokens[i - 1].t === "(") {
          if (i + 1 < tokens.length && tokens[i + 1].t === "n") {
            proc.push({ t: "n", v: -tokens[i + 1].v });
            i++;
            continue;
          }
        }
      }
      proc.push(tk);
    }

    var output = [];
    var ops = [];
    var prec = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

    for (var j = 0; j < proc.length; j++) {
      var t = proc[j];
      if (t.t === "n") {
        output.push(t.v);
      } else if (t.t === "o") {
        while (ops.length) {
          var top = ops[ops.length - 1];
          if (top.t === "(") break;
          if (
            top.t === "o" &&
            (prec[top.v] > prec[t.v] ||
              (prec[top.v] === prec[t.v] && t.v !== "^"))
          ) {
            output.push(ops.pop().v);
          } else break;
        }
        ops.push(t);
      } else if (t.t === "(") {
        ops.push(t);
      } else if (t.t === ")") {
        while (ops.length && ops[ops.length - 1].t !== "(") {
          output.push(ops.pop().v);
        }
        if (ops.length) ops.pop();
      }
    }
    while (ops.length) {
      var rem = ops.pop();
      if (rem.t === "o") output.push(rem.v);
    }

    var stack = [];
    for (var k = 0; k < output.length; k++) {
      var item = output[k];
      if (typeof item === "number") {
        stack.push(item);
      } else {
        if (stack.length < 2) return null;
        var b = stack.pop();
        var a = stack.pop();
        switch (item) {
          case "+": stack.push(a + b); break;
          case "-": stack.push(a - b); break;
          case "*": stack.push(a * b); break;
          case "/": stack.push(b === 0 ? NaN : a / b); break;
          case "^": stack.push(Math.pow(a, b)); break;
        }
      }
    }
    return stack.length === 1 ? stack[0] : null;
  }

  // --- Unit conversion engine ---
  var CONVERSIONS = {
    km_miles:  function (v) { return v * 0.621371; },
    miles_km:  function (v) { return v / 0.621371; },
    c_f:       function (v) { return v * 9 / 5 + 32; },
    f_c:       function (v) { return (v - 32) * 5 / 9; },
    kg_lbs:    function (v) { return v * 2.20462; },
    lbs_kg:    function (v) { return v / 2.20462; },
    cm_in:     function (v) { return v / 2.54; },
    in_cm:     function (v) { return v * 2.54; },
  };

  var CONV_LABELS = {
    km_miles: ["km", "miles"],
    miles_km: ["miles", "km"],
    c_f: ["\u00B0C", "\u00B0F"],
    f_c: ["\u00B0F", "\u00B0C"],
    kg_lbs: ["kg", "lbs"],
    lbs_kg: ["lbs", "kg"],
    cm_in: ["cm", "inches"],
    in_cm: ["inches", "cm"],
  };

  var ALIASES = {
    km: "km", kilometers: "km", kilometre: "km", kilometres: "km",
    mi: "miles", mile: "miles", miles: "miles",
    c: "c", celsius: "c", fahrenheit: "f", f: "f",
    kg: "kg", kilogram: "kg", kilograms: "kg",
    lb: "lbs", lbs: "lbs", pound: "lbs", pounds: "lbs",
    cm: "cm", centimeter: "cm", centimeters: "cm", centimetre: "cm",
    in: "in", inch: "in", inches: "in",
  };

  var UNIT_MAP = {
    km: "km", miles: "miles",
    c: "c", f: "f",
    kg: "kg", lbs: "lbs",
    cm: "cm", in: "in",
  };

  function resolveUnit(raw) {
    return ALIASES[raw.toLowerCase().replace(/\u00B0/g, "")] || null;
  }

  function tryConversion(input) {
    var m = input.match(
      /^([\d.]+)\s*([a-zA-Z\u00B0]+)\s+(?:to|in)\s+([a-zA-Z\u00B0]+)$/i
    );
    if (!m) return null;
    var val = parseFloat(m[1]);
    if (isNaN(val)) return null;
    var from = resolveUnit(m[2]);
    var to = resolveUnit(m[3]);
    if (!from || !to) return null;
    var fromKey = UNIT_MAP[from];
    var toKey = UNIT_MAP[to];
    if (!fromKey || !toKey) return null;
    var key = fromKey + "_" + toKey;
    var fn = CONVERSIONS[key];
    if (!fn) return null;
    var labels = CONV_LABELS[key];
    return {
      value: val,
      from: labels[0],
      to: labels[1],
      result: fn(val),
      label: labels[1],
    };
  }

  // --- "X% of Y" pattern ---
  function tryPercentOf(input) {
    var m = input.match(/^([\d.]+)\s*%\s+of\s+([\d.]+)$/i);
    if (!m) return null;
    var pct = parseFloat(m[1]);
    var base = parseFloat(m[2]);
    if (isNaN(pct) || isNaN(base)) return null;
    return (pct / 100) * base;
  }

  function fmtNum(n) {
    if (n === null || n === undefined || isNaN(n)) return "Error";
    if (!isFinite(n)) return n > 0 ? "\u221E" : "-\u221E";
    return String(parseFloat(n.toPrecision(12)));
  }

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var CSS = [
    ".calc{font-family:system-ui,-apple-system,sans-serif;padding:12px;display:flex;flex-direction:column;gap:14px}",
    ".calc-display{background:var(--vanta-surface,#0c0c0c);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,12px);padding:20px;display:flex;flex-direction:column;gap:10px}",
    ".calc-input{width:100%;padding:12px 14px;background:var(--vanta-bg,#000);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,8px);color:var(--vanta-text,#ebebeb);font-size:18px;font-family:ui-monospace,'SF Mono',monospace;outline:none;transition:border-color .14s,box-shadow .14s;box-sizing:border-box}",
    ".calc-input:focus{border-color:var(--vanta-accent,#7b35f0);box-shadow:0 0 0 1px var(--vanta-accent-glow,rgba(123,53,240,.3))}",
    ".calc-input::placeholder{color:var(--vanta-text-dim,#444)}",
    ".calc-preview{font-size:28px;font-weight:700;color:var(--vanta-text,#ebebeb);font-family:ui-monospace,'SF Mono',monospace;min-height:36px;text-align:right}",
    ".calc-preview--dim{color:var(--vanta-text-dim,#444);font-size:14px;font-weight:400}",
    ".calc-section{display:flex;flex-direction:column;gap:8px}",
    ".calc-section-hdr{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--vanta-text-dim,#555);display:flex;justify-content:space-between;align-items:center}",
    ".calc-convs{display:flex;flex-wrap:wrap;gap:6px}",
    ".calc-conv{padding:6px 12px;background:rgba(123,53,240,.1);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:6px;color:var(--vanta-text-dim,#888);font-size:12px;cursor:pointer;transition:background .14s,color .14s}",
    ".calc-conv:hover{background:rgba(123,53,240,.22);color:var(--vanta-text,#ebebeb)}",
    ".calc-hist{background:var(--vanta-surface,#0c0c0c);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,12px);padding:16px;display:flex;flex-direction:column;gap:8px}",
    ".calc-hist-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--vanta-bg,#000);border-radius:var(--vanta-radius,8px);cursor:pointer;transition:background .14s}",
    ".calc-hist-item:hover{background:rgba(123,53,240,.08)}",
    ".calc-hist-expr{font-size:13px;color:var(--vanta-text-dim,#888);font-family:ui-monospace,'SF Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".calc-hist-eq{font-size:14px;font-weight:600;color:var(--vanta-text,#ebebeb);font-family:ui-monospace,'SF Mono',monospace;flex-shrink:0}",
    ".calc-btn-clear{padding:4px 10px;font-size:11px;background:none;border:1px solid rgba(255,68,68,.25);border-radius:6px;color:#f55;cursor:pointer;transition:background .14s}",
    ".calc-btn-clear:hover{background:rgba(255,68,68,.1)}",
    ".calc-empty{text-align:center;padding:16px;color:var(--vanta-text-dim,#555);font-size:13px}",
    ".calc-hint{font-size:11px;color:var(--vanta-text-dim,#444);line-height:1.6;padding:0 2px}",
  ].join("\n");

  function CalcView($$anchor, $$props) {
    var api = $$props.api;
    var history = [];

    var style = document.createElement("style");
    style.textContent = CSS;

    var root = h("div", "calc");
    root.appendChild(style);
    $$anchor.before(root);

    // --- Display ---
    var display = h("div", "calc-display");

    var calcInput = document.createElement("input");
    calcInput.type = "text";
    calcInput.className = "calc-input";
    calcInput.placeholder = "e.g.  (2+3)*4   or   100 km to miles";
    calcInput.setAttribute("autocomplete", "off");
    calcInput.setAttribute("spellcheck", "false");
    display.appendChild(calcInput);

    var preview = h("div", "calc-preview");
    display.appendChild(preview);
    root.appendChild(display);

    // --- Quick conversions ---
    var convSection = h("div", "calc-section");
    convSection.appendChild(h("div", "calc-section-hdr", "Quick Conversions"));

    var convRow = h("div", "calc-convs");
    var QUICK = [
      ["km \u2192 mi", "1 km to miles"],
      ["mi \u2192 km", "1 miles to km"],
      ["\u00B0C \u2192 \u00B0F", "1 c to f"],
      ["\u00B0F \u2192 \u00B0C", "1 f to c"],
      ["kg \u2192 lbs", "1 kg to lbs"],
      ["lbs \u2192 kg", "1 lbs to kg"],
      ["cm \u2192 in", "1 cm to inches"],
      ["in \u2192 cm", "1 inches to cm"],
    ];
    QUICK.forEach(function (q) {
      var btn = h("button", "calc-conv", q[0]);
      btn.addEventListener("click", function () {
        calcInput.value = q[1];
        calcInput.focus();
        calcInput.setSelectionRange(0, 1);
        updatePreview();
      });
      convRow.appendChild(btn);
    });
    convSection.appendChild(convRow);
    root.appendChild(convSection);

    // --- History ---
    var histBox = h("div", "calc-hist");

    var histHdr = h("div", "calc-section-hdr");
    histHdr.appendChild(document.createTextNode("History"));
    var clearBtn = h("button", "calc-btn-clear", "Clear");
    histHdr.appendChild(clearBtn);
    histBox.appendChild(histHdr);

    var histList = h("div");
    histBox.appendChild(histList);
    root.appendChild(histBox);

    // --- Hint ---
    root.appendChild(
      h(
        "div",
        "calc-hint",
        "Operators: + \u2212 * / ^ (power)  |  15% = 0.15  |  " +
          '"5% of 200" = 10  |  "100 km to miles"  |  Enter copies result'
      )
    );

    // --- Logic ---
    function computeResult(val) {
      if (!val) return null;

      var conv = tryConversion(val);
      if (conv) return { display: fmtNum(conv.result) + " " + conv.label, raw: fmtNum(conv.result) };

      var pctOf = tryPercentOf(val);
      if (pctOf !== null) return { display: fmtNum(pctOf), raw: fmtNum(pctOf) };

      var result = evaluate(val);
      if (result !== null && !isNaN(result)) return { display: fmtNum(result), raw: fmtNum(result) };

      return null;
    }

    function updatePreview() {
      var val = calcInput.value.trim();
      if (!val) {
        preview.innerHTML = "";
        var dim = h("span", "calc-preview--dim", "Result appears here");
        preview.appendChild(dim);
        return;
      }
      var res = computeResult(val);
      if (res) {
        preview.textContent = res.display;
      } else {
        preview.innerHTML = "";
        preview.appendChild(h("span", "calc-preview--dim", "\u2026"));
      }
    }

    function addToHistory(expr, resultStr) {
      history.unshift({ expr: expr, result: resultStr, ts: Date.now() });
      if (history.length > 50) history.pop();
      api.storage.set("calc_history", JSON.stringify(history));
      renderHistory();
    }

    function renderHistory() {
      histList.innerHTML = "";
      if (!history.length) {
        histList.appendChild(h("div", "calc-empty", "No calculations yet"));
        return;
      }
      history.slice(0, 20).forEach(function (entry) {
        var item = h("div", "calc-hist-item");

        var exprSpan = h("span", "calc-hist-expr", entry.expr);
        item.appendChild(exprSpan);

        var eqSpan = h("span", "calc-hist-eq", "= " + entry.result);
        item.appendChild(eqSpan);

        item.addEventListener("click", function () {
          calcInput.value = entry.expr;
          calcInput.focus();
          updatePreview();
        });
        histList.appendChild(item);
      });
    }

    async function clearHistory() {
      history = [];
      await api.storage.set("calc_history", JSON.stringify(history));
      renderHistory();
      api.toast({ title: "History Cleared", type: "success" });
    }

    // --- Events ---
    calcInput.addEventListener("input", updatePreview);

    calcInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.stopPropagation();
        var val = calcInput.value.trim();
        if (!val) return;
        var res = computeResult(val);
        if (res) {
          addToHistory(val, res.display);
          api.clipboard.copy(res.raw);
          api.toast({ title: "Copied", message: res.display, type: "success" });
        }
      }
    });

    clearBtn.addEventListener("click", clearHistory);

    // --- Init ---
    (async function () {
      try {
        var stored = await api.storage.get("calc_history");
        if (stored) history = JSON.parse(stored);
      } catch (_) {}
      renderHistory();
      updatePreview();
      setTimeout(function () { calcInput.focus(); }, 50);
    })();
  }

  vanta.registerExtension("smart-calculator", {
    commands: {
      calculate: {
        component: CalcView,
      },
    },
  });
})(window.__vanta_host);
