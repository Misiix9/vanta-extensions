(function (vanta) {
  var WMO = {
    0: ["Clear sky", "\u2600\uFE0F"],
    1: ["Mainly clear", "\uD83C\uDF24\uFE0F"],
    2: ["Partly cloudy", "\u26C5"],
    3: ["Overcast", "\u2601\uFE0F"],
    45: ["Fog", "\uD83C\uDF2B\uFE0F"],
    48: ["Rime fog", "\uD83C\uDF2B\uFE0F"],
    51: ["Light drizzle", "\uD83C\uDF26\uFE0F"],
    53: ["Moderate drizzle", "\uD83C\uDF26\uFE0F"],
    55: ["Dense drizzle", "\uD83C\uDF27\uFE0F"],
    56: ["Freezing drizzle", "\uD83C\uDF27\uFE0F"],
    57: ["Heavy freezing drizzle", "\uD83C\uDF27\uFE0F"],
    61: ["Slight rain", "\uD83C\uDF26\uFE0F"],
    63: ["Moderate rain", "\uD83C\uDF27\uFE0F"],
    65: ["Heavy rain", "\uD83C\uDF27\uFE0F"],
    66: ["Freezing rain", "\uD83C\uDF27\uFE0F"],
    67: ["Heavy freezing rain", "\uD83C\uDF27\uFE0F"],
    71: ["Slight snow", "\uD83C\uDF28\uFE0F"],
    73: ["Moderate snow", "\uD83C\uDF28\uFE0F"],
    75: ["Heavy snow", "\u2744\uFE0F"],
    77: ["Snow grains", "\u2744\uFE0F"],
    80: ["Slight showers", "\uD83C\uDF26\uFE0F"],
    81: ["Moderate showers", "\uD83C\uDF27\uFE0F"],
    82: ["Violent showers", "\uD83C\uDF27\uFE0F"],
    85: ["Slight snow showers", "\uD83C\uDF28\uFE0F"],
    86: ["Heavy snow showers", "\u2744\uFE0F"],
    95: ["Thunderstorm", "\u26C8\uFE0F"],
    96: ["Thunderstorm w/ hail", "\u26C8\uFE0F"],
    99: ["Heavy thunderstorm", "\u26C8\uFE0F"],
  };

  function wmo(code) {
    var w = WMO[code];
    return w ? { desc: w[0], icon: w[1] } : { desc: "Unknown", icon: "\uD83C\uDF21\uFE0F" };
  }

  function fmtDay(dateStr) {
    var d = new Date(dateStr + "T12:00:00");
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return days[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate();
  }

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var CSS = [
    ".wx{font-family:system-ui,-apple-system,sans-serif;padding:12px;display:flex;flex-direction:column;gap:12px}",
    ".wx-search{display:flex;gap:8px}",
    ".wx-input{flex:1;padding:10px 12px;background:var(--vanta-bg,#000);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,8px);color:var(--vanta-text,#ebebeb);font-size:14px;outline:none;transition:border-color .14s}",
    ".wx-input:focus{border-color:var(--vanta-accent,#7b35f0);box-shadow:0 0 0 1px var(--vanta-accent-glow,rgba(123,53,240,.3))}",
    ".wx-input::placeholder{color:var(--vanta-text-dim,#555)}",
    ".wx-btn{padding:10px 16px;background:var(--vanta-accent,#7b35f0);color:#fff;border:none;border-radius:var(--vanta-radius,8px);font-weight:600;font-size:13px;cursor:pointer;transition:background .14s,box-shadow .14s}",
    ".wx-btn:hover{background:var(--vanta-accent-glow,#9b5ff8);box-shadow:0 0 16px var(--vanta-accent-glow,rgba(123,53,240,.4))}",
    ".wx-btn-save{padding:6px 12px;font-size:12px;background:rgba(123,53,240,.15);color:var(--vanta-accent,#7b35f0);border:none;border-radius:6px;cursor:pointer;font-weight:600;transition:background .14s}",
    ".wx-btn-save:hover{background:rgba(123,53,240,.28)}",
    ".wx-btn-rm{padding:4px 8px;font-size:11px;background:none;border:1px solid rgba(255,68,68,.25);color:#f55;cursor:pointer;border-radius:6px;transition:background .14s}",
    ".wx-btn-rm:hover{background:rgba(255,68,68,.1)}",
    ".wx-msg{padding:32px;text-align:center;font-size:13px}",
    ".wx-msg--loading{color:var(--vanta-text-dim,#888)}",
    ".wx-msg--error{color:#f55}",
    ".wx-card{background:var(--vanta-surface,#0c0c0c);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,12px);padding:20px;display:flex;flex-direction:column;gap:12px}",
    ".wx-loc-row{display:flex;align-items:center;justify-content:space-between;gap:8px}",
    ".wx-loc-name{font-size:16px;font-weight:700;color:var(--vanta-text,#ebebeb)}",
    ".wx-main{display:flex;align-items:center;gap:16px}",
    ".wx-emoji{font-size:48px;line-height:1}",
    ".wx-temp{font-size:42px;font-weight:700;color:var(--vanta-text,#ebebeb);line-height:1}",
    ".wx-cond{font-size:14px;color:var(--vanta-text-dim,#888)}",
    ".wx-stats{display:flex;gap:16px}",
    ".wx-stat{font-size:13px;color:var(--vanta-text-dim,#888)}",
    ".wx-fc{background:var(--vanta-surface,#0c0c0c);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,12px);padding:16px;display:flex;flex-direction:column;gap:12px}",
    ".wx-fc-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--vanta-text-dim,#555)}",
    ".wx-fc-grid{display:flex;gap:8px}",
    ".wx-fc-day{flex:1;background:var(--vanta-bg,#000);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,8px);padding:12px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}",
    ".wx-fc-date{font-size:11px;font-weight:600;color:var(--vanta-text-dim,#888)}",
    ".wx-fc-icon{font-size:28px;line-height:1}",
    ".wx-fc-temps{font-size:13px;font-weight:600;color:var(--vanta-text,#ebebeb)}",
    ".wx-fc-desc{font-size:11px;color:var(--vanta-text-dim,#555)}",
    ".wx-results{display:flex;flex-direction:column;gap:4px}",
    ".wx-result{display:flex;flex-direction:column;gap:2px;padding:10px 12px;background:var(--vanta-surface,#0c0c0c);border:1px solid transparent;border-radius:var(--vanta-radius,8px);color:var(--vanta-text,#ebebeb);cursor:pointer;text-align:left;transition:background .14s,border-color .14s}",
    ".wx-result:hover{background:rgba(123,53,240,.08);border-color:var(--vanta-border,rgba(123,53,240,.14))}",
    ".wx-result-name{font-weight:600;font-size:14px}",
    ".wx-result-sub{font-size:12px;color:var(--vanta-text-dim,#555)}",
    ".wx-saved{display:flex;flex-direction:column;gap:8px}",
    ".wx-saved-hdr{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--vanta-text-dim,#555);padding:4px 0}",
    ".wx-saved-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--vanta-surface,#0c0c0c);border:1px solid var(--vanta-border,rgba(123,53,240,.14));border-radius:var(--vanta-radius,8px)}",
    ".wx-saved-name{font-size:13px;font-weight:500;color:var(--vanta-text,#ebebeb);cursor:pointer;background:none;border:none;padding:0;text-align:left}",
    ".wx-saved-name:hover{color:var(--vanta-accent,#7b35f0)}",
  ].join("\n");

  function WeatherView($$anchor, $$props) {
    var api = $$props.api;
    var saved = [];

    var style = document.createElement("style");
    style.textContent = CSS;

    var root = h("div", "wx");
    root.appendChild(style);
    $$anchor.before(root);

    // --- Search row ---
    var searchRow = h("div", "wx-search");
    var input = document.createElement("input");
    input.type = "text";
    input.className = "wx-input";
    input.placeholder = "Search city\u2026";
    searchRow.appendChild(input);

    var searchBtn = h("button", "wx-btn", "Search");
    searchRow.appendChild(searchBtn);
    root.appendChild(searchRow);

    // --- Content area ---
    var content = h("div", "wx-content");
    root.appendChild(content);

    // --- Saved locations area ---
    var savedEl = h("div", "wx-saved");
    root.appendChild(savedEl);

    // --- Helpers ---
    function setMsg(el, text, type) {
      el.innerHTML = "";
      var msg = h("div", "wx-msg wx-msg--" + type, text);
      el.appendChild(msg);
    }

    // --- Fetch & render weather ---
    async function fetchWeather(lat, lon, name) {
      setMsg(content, "Loading weather data\u2026", "loading");
      try {
        var url =
          "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
          "&longitude=" + lon +
          "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
          "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
          "&timezone=auto&forecast_days=3";
        var raw = await api.network.fetch(url);
        var data = JSON.parse(raw);
        renderWeather(data, name, lat, lon);
      } catch (_) {
        setMsg(content, "Failed to load weather data.", "error");
      }
    }

    function renderWeather(data, name, lat, lon) {
      content.innerHTML = "";
      var cur = data.current;
      var w = wmo(cur.weather_code);
      var alreadySaved = saved.some(function (s) { return s.name === name; });

      // -- Current card --
      var card = h("div", "wx-card");

      var locRow = h("div", "wx-loc-row");
      locRow.appendChild(h("span", "wx-loc-name", name));
      if (!alreadySaved) {
        var saveBtn = h("button", "wx-btn-save", "Save Location");
        saveBtn.addEventListener("click", function () {
          saveLocation(name, lat, lon);
        });
        locRow.appendChild(saveBtn);
      }
      card.appendChild(locRow);

      var mainRow = h("div", "wx-main");
      mainRow.appendChild(h("span", "wx-emoji", w.icon));
      mainRow.appendChild(
        h("span", "wx-temp", Math.round(cur.temperature_2m) + "\u00B0C")
      );
      card.appendChild(mainRow);

      card.appendChild(h("span", "wx-cond", w.desc));

      var stats = h("div", "wx-stats");
      stats.appendChild(
        h("span", "wx-stat", "\uD83D\uDCA7 Humidity: " + cur.relative_humidity_2m + "%")
      );
      stats.appendChild(
        h("span", "wx-stat", "\uD83D\uDCA8 Wind: " + cur.wind_speed_10m + " km/h")
      );
      card.appendChild(stats);
      content.appendChild(card);

      // -- Forecast --
      var fc = h("div", "wx-fc");
      fc.appendChild(h("span", "wx-fc-title", "3-Day Forecast"));

      var grid = h("div", "wx-fc-grid");
      var daily = data.daily;
      for (var i = 0; i < daily.time.length; i++) {
        var dw = wmo(daily.weather_code[i]);
        var day = h("div", "wx-fc-day");
        day.appendChild(
          h("span", "wx-fc-date", i === 0 ? "Today" : fmtDay(daily.time[i]))
        );
        day.appendChild(h("span", "wx-fc-icon", dw.icon));
        day.appendChild(
          h(
            "span",
            "wx-fc-temps",
            Math.round(daily.temperature_2m_max[i]) +
              "\u00B0 / " +
              Math.round(daily.temperature_2m_min[i]) +
              "\u00B0"
          )
        );
        day.appendChild(h("span", "wx-fc-desc", dw.desc));
        grid.appendChild(day);
      }
      fc.appendChild(grid);
      content.appendChild(fc);
    }

    // --- City search ---
    async function searchCity(query) {
      var q = query.trim();
      if (!q) return;
      setMsg(content, "Searching\u2026", "loading");
      try {
        var raw = await api.network.fetch(
          "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(q) +
            "&count=5"
        );
        var data = JSON.parse(raw);
        if (!data.results || !data.results.length) {
          setMsg(content, 'No cities found for "' + q + '".', "error");
          return;
        }
        content.innerHTML = "";
        var list = h("div", "wx-results");
        data.results.forEach(function (r) {
          var parts = [r.admin1, r.country].filter(Boolean);
          var sub = parts.join(", ");
          var label = r.name + (sub ? ", " + sub : "");

          var btn = h("button", "wx-result");
          btn.appendChild(h("span", "wx-result-name", r.name));
          if (sub) btn.appendChild(h("span", "wx-result-sub", sub));
          btn.addEventListener("click", function () {
            fetchWeather(r.latitude, r.longitude, label);
          });
          list.appendChild(btn);
        });
        content.appendChild(list);
      } catch (_) {
        setMsg(content, "Search failed.", "error");
      }
    }

    // --- Saved locations ---
    async function saveLocation(name, lat, lon) {
      if (saved.some(function (s) { return s.name === name; })) {
        api.toast({ title: "Already saved", message: name, type: "info" });
        return;
      }
      saved.push({ name: name, lat: lat, lon: lon });
      await api.storage.set("weather_locations", JSON.stringify(saved));
      api.toast({ title: "Location Saved", message: name, type: "success" });
      renderSaved();
      fetchWeather(lat, lon, name);
    }

    async function removeSaved(idx) {
      saved.splice(idx, 1);
      await api.storage.set("weather_locations", JSON.stringify(saved));
      renderSaved();
    }

    function renderSaved() {
      savedEl.innerHTML = "";
      if (!saved.length) return;

      savedEl.appendChild(h("span", "wx-saved-hdr", "Saved Locations"));
      saved.forEach(function (loc, i) {
        var row = h("div", "wx-saved-row");

        var nameBtn = h("button", "wx-saved-name", loc.name);
        nameBtn.addEventListener("click", function () {
          fetchWeather(loc.lat, loc.lon, loc.name);
        });
        row.appendChild(nameBtn);

        var rmBtn = h("button", "wx-btn-rm", "\u2715");
        rmBtn.addEventListener("click", function () {
          removeSaved(i);
        });
        row.appendChild(rmBtn);

        savedEl.appendChild(row);
      });
    }

    // --- Events ---
    searchBtn.addEventListener("click", function () {
      searchCity(input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.stopPropagation();
        searchCity(input.value);
      }
    });

    // --- Init ---
    (async function () {
      try {
        var stored = await api.storage.get("weather_locations");
        if (stored) saved = JSON.parse(stored);
      } catch (_) {}
      renderSaved();

      try {
        setMsg(content, "Detecting location\u2026", "loading");
        var ipRaw = await api.network.fetch("https://ipapi.co/json/");
        var ip = JSON.parse(ipRaw);
        if (ip.latitude && ip.longitude) {
          var locName = ip.city || "Current Location";
          if (ip.country_name) locName += ", " + ip.country_name;
          fetchWeather(ip.latitude, ip.longitude, locName);
        } else {
          setMsg(
            content,
            "Could not detect location. Search for a city above.",
            "error"
          );
        }
      } catch (_) {
        setMsg(
          content,
          "Could not detect location. Search for a city above.",
          "error"
        );
      }
    })();
  }

  vanta.registerExtension("weather", {
    commands: {
      current: {
        component: WeatherView,
      },
    },
  });
})(window.__vanta_host);
