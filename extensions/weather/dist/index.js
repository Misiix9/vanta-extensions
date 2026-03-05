(function(vanta) {

  var WMO_CODES = {
    0: ['Clear sky', '\u2600\ufe0f'],
    1: ['Mainly clear', '\ud83c\udf24\ufe0f'],
    2: ['Partly cloudy', '\u26c5'],
    3: ['Overcast', '\u2601\ufe0f'],
    45: ['Foggy', '\ud83c\udf2b\ufe0f'],
    48: ['Rime fog', '\ud83c\udf2b\ufe0f'],
    51: ['Light drizzle', '\ud83c\udf26\ufe0f'],
    53: ['Moderate drizzle', '\ud83c\udf26\ufe0f'],
    55: ['Dense drizzle', '\ud83c\udf26\ufe0f'],
    61: ['Slight rain', '\ud83c\udf27\ufe0f'],
    63: ['Moderate rain', '\ud83c\udf27\ufe0f'],
    65: ['Heavy rain', '\ud83c\udf27\ufe0f'],
    71: ['Slight snow', '\ud83c\udf28\ufe0f'],
    73: ['Moderate snow', '\ud83c\udf28\ufe0f'],
    75: ['Heavy snow', '\ud83c\udf28\ufe0f'],
    77: ['Snow grains', '\u2744\ufe0f'],
    80: ['Slight showers', '\ud83c\udf26\ufe0f'],
    81: ['Moderate showers', '\ud83c\udf27\ufe0f'],
    82: ['Violent showers', '\ud83c\udf27\ufe0f'],
    85: ['Slight snow showers', '\ud83c\udf28\ufe0f'],
    86: ['Heavy snow showers', '\ud83c\udf28\ufe0f'],
    95: ['Thunderstorm', '\u26c8\ufe0f'],
    96: ['Thunderstorm with hail', '\u26c8\ufe0f'],
    99: ['Thunderstorm with heavy hail', '\u26c8\ufe0f']
  };

  function wmoLabel(code) {
    var entry = WMO_CODES[code];
    return entry ? entry[0] : 'Unknown';
  }

  function wmoEmoji(code) {
    var entry = WMO_CODES[code];
    return entry ? entry[1] : '\u2753';
  }

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function WeatherView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.weather-root { padding: 16px; font-family: inherit; color: var(--vanta-text, #e8e8e8); height: 100%; overflow-y: auto; box-sizing: border-box; }',
      '.weather-search-row { display: flex; gap: 8px; margin-bottom: 16px; }',
      '.weather-input { flex: 1; background: rgba(255,255,255,0.06); color: var(--vanta-text, #e8e8e8); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 8px 12px; font-size: 13px; outline: none; }',
      '.weather-input:focus { border-color: var(--vanta-accent, #7b35f0); }',
      '.weather-input::placeholder { color: var(--vanta-text-dim, #888); }',
      '.weather-btn { background: var(--vanta-accent, #7b35f0); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-size: 13px; white-space: nowrap; }',
      '.weather-btn:hover { opacity: 0.9; }',
      '.weather-btn-sm { background: transparent; color: var(--vanta-text-dim, #888); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px; }',
      '.weather-btn-sm:hover { color: var(--vanta-text, #e8e8e8); border-color: var(--vanta-accent, #7b35f0); }',
      '.weather-btn-danger { background: transparent; color: #e85454; border: 1px solid rgba(232,84,84,0.3); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px; }',
      '.weather-btn-danger:hover { background: rgba(232,84,84,0.1); }',
      '.weather-results { background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 8px; margin-bottom: 16px; overflow: hidden; }',
      '.weather-result-item { padding: 10px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); font-size: 13px; }',
      '.weather-result-item:last-child { border-bottom: none; }',
      '.weather-result-item:hover { background: rgba(255,255,255,0.04); }',
      '.weather-result-name { color: var(--vanta-text, #e8e8e8); }',
      '.weather-result-country { color: var(--vanta-text-dim, #888); font-size: 12px; }',
      '.weather-current { background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 12px; padding: 20px; margin-bottom: 16px; }',
      '.weather-current-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }',
      '.weather-location { font-size: 16px; font-weight: 600; color: var(--vanta-text, #e8e8e8); }',
      '.weather-condition { font-size: 13px; color: var(--vanta-text-dim, #888); margin-top: 4px; }',
      '.weather-emoji { font-size: 40px; line-height: 1; }',
      '.weather-temp { font-size: 36px; font-weight: 700; color: var(--vanta-text, #e8e8e8); margin-bottom: 12px; }',
      '.weather-details { display: flex; gap: 20px; }',
      '.weather-detail { font-size: 13px; color: var(--vanta-text-dim, #888); }',
      '.weather-detail span { color: var(--vanta-text, #e8e8e8); font-weight: 500; }',
      '.weather-forecast { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }',
      '.weather-forecast-card { background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 10px; padding: 14px; text-align: center; }',
      '.weather-forecast-day { font-size: 12px; font-weight: 600; color: var(--vanta-text-dim, #888); margin-bottom: 6px; text-transform: uppercase; }',
      '.weather-forecast-emoji { font-size: 24px; margin-bottom: 6px; }',
      '.weather-forecast-temps { font-size: 13px; color: var(--vanta-text, #e8e8e8); }',
      '.weather-forecast-lo { color: var(--vanta-text-dim, #888); margin-left: 4px; }',
      '.weather-saved-section { margin-top: 8px; }',
      '.weather-section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vanta-text-dim, #888); margin-bottom: 8px; font-weight: 600; }',
      '.weather-saved-grid { display: flex; flex-wrap: wrap; gap: 8px; }',
      '.weather-saved-chip { display: flex; align-items: center; gap: 6px; background: var(--vanta-surface, #111); border: 1px solid var(--vanta-border, rgba(255,255,255,0.08)); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 13px; color: var(--vanta-text, #e8e8e8); }',
      '.weather-saved-chip:hover { border-color: var(--vanta-accent, #7b35f0); }',
      '.weather-remove-btn { background: none; border: none; color: var(--vanta-text-dim, #888); cursor: pointer; font-size: 14px; padding: 0 2px; line-height: 1; }',
      '.weather-remove-btn:hover { color: #e85454; }',
      '.weather-loading { text-align: center; padding: 40px 0; color: var(--vanta-text-dim, #888); font-size: 14px; }',
      '.weather-error { text-align: center; padding: 20px; color: #e85454; font-size: 13px; background: rgba(232,84,84,0.06); border-radius: 8px; margin-bottom: 12px; }',
      '.weather-actions { display: flex; gap: 8px; margin-bottom: 16px; }'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'weather-root';

    var state = {
      loading: true,
      error: null,
      locationName: '',
      lat: null,
      lon: null,
      current: null,
      daily: null,
      searchQuery: '',
      searchResults: null,
      savedLocations: [],
      isSaved: false
    };

    function render() {
      root.innerHTML = '';

      var searchRow = document.createElement('div');
      searchRow.className = 'weather-search-row';
      var searchInput = document.createElement('input');
      searchInput.className = 'weather-input';
      searchInput.type = 'text';
      searchInput.placeholder = 'Search city\u2026';
      searchInput.value = state.searchQuery;

      var searchTimeout = null;
      searchInput.addEventListener('input', function(e) {
        state.searchQuery = e.target.value;
        clearTimeout(searchTimeout);
        if (state.searchQuery.length >= 2) {
          searchTimeout = setTimeout(function() { searchCity(state.searchQuery); }, 350);
        } else {
          state.searchResults = null;
          render();
        }
      });
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          state.searchQuery = '';
          state.searchResults = null;
          render();
        }
      });
      searchRow.appendChild(searchInput);
      root.appendChild(searchRow);

      if (state.searchResults && state.searchResults.length > 0) {
        var resultsDiv = document.createElement('div');
        resultsDiv.className = 'weather-results';
        state.searchResults.forEach(function(r) {
          var item = document.createElement('div');
          item.className = 'weather-result-item';
          var nameSpan = document.createElement('span');
          nameSpan.className = 'weather-result-name';
          nameSpan.textContent = r.name;
          var countrySpan = document.createElement('span');
          countrySpan.className = 'weather-result-country';
          var parts = [];
          if (r.admin1) parts.push(r.admin1);
          if (r.country) parts.push(r.country);
          countrySpan.textContent = parts.join(', ');
          item.appendChild(nameSpan);
          item.appendChild(countrySpan);
          item.addEventListener('click', function() {
            state.searchQuery = '';
            state.searchResults = null;
            loadWeather(r.latitude, r.longitude, r.name + (r.country ? ', ' + r.country : ''));
          });
          resultsDiv.appendChild(item);
        });
        root.appendChild(resultsDiv);
        setTimeout(function() { searchInput.focus(); }, 0);
        return;
      }

      if (state.searchResults && state.searchResults.length === 0) {
        var noRes = document.createElement('div');
        noRes.className = 'weather-error';
        noRes.textContent = 'No cities found';
        root.appendChild(noRes);
      }

      if (state.loading) {
        var ld = document.createElement('div');
        ld.className = 'weather-loading';
        ld.textContent = 'Loading weather\u2026';
        root.appendChild(ld);
        renderSaved();
        return;
      }

      if (state.error) {
        var errDiv = document.createElement('div');
        errDiv.className = 'weather-error';
        errDiv.textContent = state.error;
        root.appendChild(errDiv);
        renderSaved();
        return;
      }

      if (state.current) {
        var card = document.createElement('div');
        card.className = 'weather-current';

        var hdr = document.createElement('div');
        hdr.className = 'weather-current-header';
        var leftCol = document.createElement('div');
        var loc = document.createElement('div');
        loc.className = 'weather-location';
        loc.textContent = state.locationName;
        leftCol.appendChild(loc);
        var cond = document.createElement('div');
        cond.className = 'weather-condition';
        cond.textContent = wmoLabel(state.current.weather_code);
        leftCol.appendChild(cond);
        hdr.appendChild(leftCol);
        var emojiDiv = document.createElement('div');
        emojiDiv.className = 'weather-emoji';
        emojiDiv.textContent = wmoEmoji(state.current.weather_code);
        hdr.appendChild(emojiDiv);
        card.appendChild(hdr);

        var tempDiv = document.createElement('div');
        tempDiv.className = 'weather-temp';
        tempDiv.textContent = Math.round(state.current.temperature_2m) + '\u00b0C';
        card.appendChild(tempDiv);

        var detailsDiv = document.createElement('div');
        detailsDiv.className = 'weather-details';
        var humDetail = document.createElement('div');
        humDetail.className = 'weather-detail';
        humDetail.innerHTML = 'Humidity <span>' + state.current.relative_humidity_2m + '%</span>';
        detailsDiv.appendChild(humDetail);
        var windDetail = document.createElement('div');
        windDetail.className = 'weather-detail';
        windDetail.innerHTML = 'Wind <span>' + state.current.wind_speed_10m + ' km/h</span>';
        detailsDiv.appendChild(windDetail);
        card.appendChild(detailsDiv);
        root.appendChild(card);

        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'weather-actions';
        if (state.isSaved) {
          var removeBtn = document.createElement('button');
          removeBtn.className = 'weather-btn-danger';
          removeBtn.textContent = 'Remove from saved';
          removeBtn.addEventListener('click', function() { removeSavedLocation(state.locationName); });
          actionsDiv.appendChild(removeBtn);
        } else {
          var saveBtn = document.createElement('button');
          saveBtn.className = 'weather-btn-sm';
          saveBtn.textContent = 'Save location';
          saveBtn.addEventListener('click', function() { saveCurrentLocation(); });
          actionsDiv.appendChild(saveBtn);
        }
        root.appendChild(actionsDiv);
      }

      if (state.daily) {
        var forecastGrid = document.createElement('div');
        forecastGrid.className = 'weather-forecast';

        for (var i = 0; i < state.daily.time.length; i++) {
          var fCard = document.createElement('div');
          fCard.className = 'weather-forecast-card';
          var dayLabel = document.createElement('div');
          dayLabel.className = 'weather-forecast-day';
          var d = new Date(state.daily.time[i] + 'T00:00:00');
          dayLabel.textContent = i === 0 ? 'Today' : DAYS[d.getDay()];
          fCard.appendChild(dayLabel);
          var fEmoji = document.createElement('div');
          fEmoji.className = 'weather-forecast-emoji';
          fEmoji.textContent = wmoEmoji(state.daily.weather_code[i]);
          fCard.appendChild(fEmoji);
          var fTemps = document.createElement('div');
          fTemps.className = 'weather-forecast-temps';
          fTemps.innerHTML = Math.round(state.daily.temperature_2m_max[i]) + '\u00b0' +
            '<span class="weather-forecast-lo">' + Math.round(state.daily.temperature_2m_min[i]) + '\u00b0</span>';
          fCard.appendChild(fTemps);
          forecastGrid.appendChild(fCard);
        }
        root.appendChild(forecastGrid);
      }

      renderSaved();
    }

    function renderSaved() {
      if (state.savedLocations.length === 0) return;
      var section = document.createElement('div');
      section.className = 'weather-saved-section';
      var title = document.createElement('div');
      title.className = 'weather-section-title';
      title.textContent = 'Saved Locations';
      section.appendChild(title);
      var grid = document.createElement('div');
      grid.className = 'weather-saved-grid';
      state.savedLocations.forEach(function(loc) {
        var chip = document.createElement('div');
        chip.className = 'weather-saved-chip';
        var nameSpan = document.createElement('span');
        nameSpan.textContent = loc.name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.addEventListener('click', function() {
          loadWeather(loc.lat, loc.lon, loc.name);
        });
        chip.appendChild(nameSpan);
        var rmBtn = document.createElement('button');
        rmBtn.className = 'weather-remove-btn';
        rmBtn.textContent = '\u00d7';
        rmBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          removeSavedLocation(loc.name);
        });
        chip.appendChild(rmBtn);
        grid.appendChild(chip);
      });
      section.appendChild(grid);
      root.appendChild(section);
    }

    function searchCity(query) {
      var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=5';
      api.network.fetch(url, { method: 'GET' }).then(function(text) {
        var data = JSON.parse(text);
        state.searchResults = data.results || [];
        render();
      }).catch(function() {
        state.searchResults = [];
        render();
      });
    }

    function loadWeather(lat, lon, name) {
      state.loading = true;
      state.error = null;
      state.lat = lat;
      state.lon = lon;
      state.locationName = name;
      state.isSaved = state.savedLocations.some(function(l) { return l.name === name; });
      render();

      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
        '&longitude=' + lon +
        '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3';

      api.network.fetch(url, { method: 'GET' }).then(function(text) {
        var data = JSON.parse(text);
        state.current = data.current;
        state.daily = data.daily;
        state.loading = false;
        render();
      }).catch(function(err) {
        state.loading = false;
        state.error = 'Failed to fetch weather: ' + err;
        render();
      });
    }

    function loadSavedLocations() {
      return api.storage.get('saved_locations').then(function(val) {
        if (val) {
          try { state.savedLocations = JSON.parse(val); } catch(e) { state.savedLocations = []; }
        }
      }).catch(function() {});
    }

    function persistSaved() {
      return api.storage.set('saved_locations', JSON.stringify(state.savedLocations));
    }

    function saveCurrentLocation() {
      if (!state.lat || !state.lon || !state.locationName) return;
      var exists = state.savedLocations.some(function(l) { return l.name === state.locationName; });
      if (!exists) {
        state.savedLocations.push({ name: state.locationName, lat: state.lat, lon: state.lon });
        persistSaved();
      }
      state.isSaved = true;
      render();
      api.toast({ title: 'Saved', message: state.locationName + ' added to saved locations', type: 'success' });
    }

    function removeSavedLocation(name) {
      state.savedLocations = state.savedLocations.filter(function(l) { return l.name !== name; });
      persistSaved();
      if (state.locationName === name) state.isSaved = false;
      render();
    }

    function autoDetectAndLoad() {
      api.network.fetch('https://ipapi.co/json/', { method: 'GET' }).then(function(text) {
        var geo = JSON.parse(text);
        var name = geo.city || 'Unknown';
        if (geo.country_name) name += ', ' + geo.country_name;
        loadWeather(geo.latitude, geo.longitude, name);
      }).catch(function() {
        state.loading = false;
        state.error = 'Could not detect your location. Search for a city above.';
        render();
      });
    }

    loadSavedLocations().then(function() {
      render();
      autoDetectAndLoad();
    });

    $$anchor.before(style);
    $$anchor.before(root);
  }

  vanta.registerExtension('weather', {
    commands: { 'current': { component: WeatherView } }
  });

})(window.__vanta_host);
