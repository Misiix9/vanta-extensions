(function(vanta) {
  function SpotifyPlayer($$anchor, $$props) {
    var api = $$props.api;
    var token = null;
    var refreshTimer = null;
    var progressTimer = null;
    var currentTrack = null;
    var isPlaying = false;
    var progressMs = 0;
    var durationMs = 0;
    var shuffleState = false;
    var repeatState = 'off';

    var style = document.createElement('style');
    style.textContent = [
      '.spot-root{padding:16px;font-family:-apple-system,system-ui,sans-serif;color:var(--vanta-text,#e8e8e8);min-height:200px}',
      '.spot-setup{display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px 16px;text-align:center}',
      '.spot-setup-title{font-size:18px;font-weight:600}',
      '.spot-setup-icon{opacity:.4}',
      '.spot-setup-steps{text-align:left;font-size:12px;color:var(--vanta-text-dim,#888);line-height:1.8;background:var(--vanta-surface,#111);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:8px;padding:12px 16px;width:100%;max-width:400px}',
      '.spot-setup-steps a{color:var(--vanta-accent,#7b35f0)}',
      '.spot-input{width:100%;max-width:400px;padding:10px 12px;background:rgba(255,255,255,0.06);color:var(--vanta-text,#e8e8e8);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:8px;font-size:13px;outline:none;box-sizing:border-box}',
      '.spot-input:focus{border-color:var(--vanta-accent,#7b35f0)}',
      '.spot-input::placeholder{color:var(--vanta-text-dim,#888)}',
      '.spot-btn{background:var(--vanta-accent,#7b35f0);color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:opacity .15s}',
      '.spot-btn:hover{opacity:.85}',
      '.spot-btn:active{transform:scale(.97)}',
      '.spot-btn-outline{background:transparent;border:1px solid var(--vanta-border,rgba(255,255,255,0.08));color:var(--vanta-text-dim,#888)}',
      '.spot-btn-outline:hover{border-color:var(--vanta-text-dim,#888);color:var(--vanta-text,#e8e8e8)}',
      '.spot-tabs{display:flex;gap:2px;background:var(--vanta-surface,#111);border-radius:8px;padding:3px;margin-bottom:16px}',
      '.spot-tab{flex:1;padding:7px 0;text-align:center;font-size:12px;font-weight:500;border:none;border-radius:6px;cursor:pointer;background:transparent;color:var(--vanta-text-dim,#888);transition:all .15s}',
      '.spot-tab.active{background:var(--vanta-accent,#7b35f0);color:#fff}',
      '.spot-now{display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 0}',
      '.spot-track{font-size:16px;font-weight:600;text-align:center;line-height:1.3}',
      '.spot-artist{font-size:13px;color:var(--vanta-text-dim,#888);text-align:center}',
      '.spot-progress-wrap{width:100%;max-width:360px}',
      '.spot-progress-bar{width:100%;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;cursor:pointer}',
      '.spot-progress-fill{height:100%;background:var(--vanta-accent,#7b35f0);border-radius:2px;transition:width .3s linear}',
      '.spot-progress-times{display:flex;justify-content:space-between;font-size:11px;color:var(--vanta-text-dim,#888);margin-top:4px}',
      '.spot-controls{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:4px}',
      '.spot-ctrl{background:none;border:none;color:var(--vanta-text-dim,#888);cursor:pointer;padding:6px;border-radius:50%;transition:all .15s;display:flex;align-items:center;justify-content:center}',
      '.spot-ctrl:hover{color:var(--vanta-text,#e8e8e8);background:rgba(255,255,255,0.06)}',
      '.spot-ctrl.active{color:var(--vanta-accent,#7b35f0)}',
      '.spot-ctrl-main{width:40px;height:40px;background:var(--vanta-accent,#7b35f0);color:#fff;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .1s}',
      '.spot-ctrl-main:hover{transform:scale(1.05)}',
      '.spot-ctrl-main:active{transform:scale(.95)}',
      '.spot-empty{text-align:center;padding:32px 0;color:var(--vanta-text-dim,#888);font-size:13px}',
      '.spot-empty-icon{font-size:32px;margin-bottom:12px;opacity:.3}',
      '.spot-search-input{width:100%;padding:10px 12px;background:rgba(255,255,255,0.06);color:var(--vanta-text,#e8e8e8);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;margin-bottom:12px}',
      '.spot-search-input:focus{border-color:var(--vanta-accent,#7b35f0)}',
      '.spot-search-input::placeholder{color:var(--vanta-text-dim,#888)}',
      '.spot-result{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .1s}',
      '.spot-result:hover{background:rgba(255,255,255,0.04)}',
      '.spot-result-info{flex:1;min-width:0}',
      '.spot-result-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.spot-result-artist{font-size:11px;color:var(--vanta-text-dim,#888);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.spot-result-dur{font-size:11px;color:var(--vanta-text-dim,#888);flex-shrink:0}',
      '.spot-result-play{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:var(--vanta-accent,#7b35f0);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}',
      '.spot-result:hover .spot-result-play{opacity:1}',
      '.spot-disconnect{display:flex;justify-content:center;margin-top:20px}',
      '.spot-loading{display:flex;justify-content:center;padding:24px;color:var(--vanta-text-dim,#888);font-size:13px}',
      '.spot-err{color:#ef4444;font-size:12px;text-align:center;padding:8px}'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'spot-root';

    $$anchor.before(style);
    $$anchor.before(root);

    var svgPrev = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>';
    var svgNext = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 6h2v12h-2zm-10 6l8.5 6V6z" transform="rotate(180 12 12)"/></svg>';
    var svgPlay = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>';
    var svgPause = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    var svgShuffle = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>';
    var svgRepeat = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
    var svgMusic = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    var svgSmallPlay = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>';

    function fmtTime(ms) {
      var s = Math.floor(ms / 1000);
      var m = Math.floor(s / 60);
      s = s % 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function esc(s) {
      var d = document.createElement('span');
      d.textContent = s;
      return d.innerHTML;
    }

    async function spotApi(method, path) {
      var args = ['-s', '-w', '\n%{http_code}', '-X', method, '-H', 'Authorization: Bearer ' + token];
      if (method === 'PUT' || method === 'POST') {
        args.push('-H', 'Content-Type: application/json');
      }
      args.push('https://api.spotify.com/v1' + path);
      return await api.shell.execute('curl', args);
    }

    async function spotApiBody(method, path, body) {
      var args = ['-s', '-w', '\n%{http_code}', '-X', method, '-H', 'Authorization: Bearer ' + token, '-H', 'Content-Type: application/json', '-d', JSON.stringify(body)];
      args.push('https://api.spotify.com/v1' + path);
      return await api.shell.execute('curl', args);
    }

    function parseResponse(raw) {
      var lines = raw.trim().split('\n');
      var code = parseInt(lines[lines.length - 1]) || 0;
      var body = lines.slice(0, -1).join('\n').trim();
      return { code: code, body: body };
    }

    function clearTimers() {
      if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
      if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    }

    function showSetup() {
      clearTimers();
      root.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'spot-setup';

      wrap.innerHTML =
        '<div class="spot-setup-icon">' + svgMusic + '</div>' +
        '<div class="spot-setup-title">Connect to Spotify</div>' +
        '<div class="spot-setup-steps">' +
          '1. Go to <a href="https://developer.spotify.com/console/get-user-player/" target="_blank">Spotify Developer Console</a><br>' +
          '2. Click <strong>Get Token</strong> and select all scopes<br>' +
          '3. Copy the token and paste it below' +
        '</div>';

      var input = document.createElement('input');
      input.className = 'spot-input';
      input.type = 'text';
      input.placeholder = 'Paste your Spotify access token\u2026';
      wrap.appendChild(input);

      var btn = document.createElement('button');
      btn.className = 'spot-btn';
      btn.textContent = 'Connect';
      btn.onclick = async function() {
        var val = input.value.trim();
        if (!val) return;
        btn.textContent = 'Connecting\u2026';
        btn.disabled = true;
        try {
          token = val;
          await api.storage.set('spotify-token', val);
          showPlayer();
        } catch (e) {
          btn.textContent = 'Connect';
          btn.disabled = false;
        }
      };
      wrap.appendChild(btn);
      root.appendChild(wrap);
    }

    function showPlayer() {
      root.innerHTML = '';

      var tabs = document.createElement('div');
      tabs.className = 'spot-tabs';
      var tabNow = document.createElement('button');
      tabNow.className = 'spot-tab active';
      tabNow.textContent = 'Now Playing';
      var tabSearch = document.createElement('button');
      tabSearch.className = 'spot-tab';
      tabSearch.textContent = 'Search';
      tabs.appendChild(tabNow);
      tabs.appendChild(tabSearch);
      root.appendChild(tabs);

      var content = document.createElement('div');
      root.appendChild(content);

      tabNow.onclick = function() {
        tabNow.className = 'spot-tab active';
        tabSearch.className = 'spot-tab';
        renderNowPlaying(content);
      };
      tabSearch.onclick = function() {
        tabSearch.className = 'spot-tab active';
        tabNow.className = 'spot-tab';
        renderSearch(content);
      };

      renderNowPlaying(content);
      startRefresh();
    }

    function startRefresh() {
      clearTimers();
      fetchNowPlaying();
      refreshTimer = setInterval(function() {
        if (!root.isConnected) { clearTimers(); return; }
        fetchNowPlaying();
      }, 5000);
      progressTimer = setInterval(function() {
        if (!root.isConnected) { clearTimers(); return; }
        if (isPlaying && durationMs > 0) {
          progressMs = Math.min(progressMs + 1000, durationMs);
          updateProgressUI();
        }
      }, 1000);
    }

    var nowPlayingContainer = null;
    var progressFillEl = null;
    var progressCurEl = null;

    function renderNowPlaying(container) {
      nowPlayingContainer = container;
      container.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'spot-now';

      if (!currentTrack) {
        wrap.innerHTML =
          '<div class="spot-empty">' +
            '<div class="spot-empty-icon">' + svgMusic + '</div>' +
            '<div>Nothing is playing</div>' +
            '<div style="font-size:11px;margin-top:4px;color:var(--vanta-text-dim,#888)">Play something on Spotify to see it here</div>' +
          '</div>';
      } else {
        var trackEl = document.createElement('div');
        trackEl.className = 'spot-track';
        trackEl.textContent = currentTrack.name;
        wrap.appendChild(trackEl);

        var artistEl = document.createElement('div');
        artistEl.className = 'spot-artist';
        artistEl.textContent = currentTrack.artist + (currentTrack.album ? ' \u2022 ' + currentTrack.album : '');
        wrap.appendChild(artistEl);

        var progWrap = document.createElement('div');
        progWrap.className = 'spot-progress-wrap';
        var pct = durationMs > 0 ? (progressMs / durationMs * 100) : 0;
        progWrap.innerHTML =
          '<div class="spot-progress-bar"><div class="spot-progress-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="spot-progress-times"><span>' + fmtTime(progressMs) + '</span><span>' + fmtTime(durationMs) + '</span></div>';
        progressFillEl = progWrap.querySelector('.spot-progress-fill');
        progressCurEl = progWrap.querySelector('.spot-progress-times span');
        wrap.appendChild(progWrap);

        var controls = document.createElement('div');
        controls.className = 'spot-controls';

        var btnShuffle = makeCtrl(svgShuffle, shuffleState, function() {
          spotApi('PUT', '/me/player/shuffle?state=' + (!shuffleState));
          shuffleState = !shuffleState;
          btnShuffle.className = 'spot-ctrl' + (shuffleState ? ' active' : '');
        });
        var btnPrev = makeCtrl(svgPrev, false, function() { spotApi('POST', '/me/player/previous'); });
        var btnPlayPause = document.createElement('button');
        btnPlayPause.className = 'spot-ctrl-main';
        btnPlayPause.innerHTML = isPlaying ? svgPause : svgPlay;
        btnPlayPause.onclick = function() {
          if (isPlaying) {
            spotApi('PUT', '/me/player/pause');
            isPlaying = false;
          } else {
            spotApi('PUT', '/me/player/play');
            isPlaying = true;
          }
          btnPlayPause.innerHTML = isPlaying ? svgPause : svgPlay;
        };
        var btnNext = makeCtrl(svgNext, false, function() { spotApi('POST', '/me/player/next'); });
        var btnRepeat = makeCtrl(svgRepeat, repeatState !== 'off', function() {
          var next = repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off';
          spotApi('PUT', '/me/player/repeat?state=' + next);
          repeatState = next;
          btnRepeat.className = 'spot-ctrl' + (repeatState !== 'off' ? ' active' : '');
        });

        controls.appendChild(btnShuffle);
        controls.appendChild(btnPrev);
        controls.appendChild(btnPlayPause);
        controls.appendChild(btnNext);
        controls.appendChild(btnRepeat);
        wrap.appendChild(controls);
      }

      container.appendChild(wrap);

      var disc = document.createElement('div');
      disc.className = 'spot-disconnect';
      var discBtn = document.createElement('button');
      discBtn.className = 'spot-btn spot-btn-outline';
      discBtn.textContent = 'Disconnect';
      discBtn.onclick = async function() {
        await api.storage.set('spotify-token', '');
        token = null;
        currentTrack = null;
        clearTimers();
        showSetup();
      };
      disc.appendChild(discBtn);
      container.appendChild(disc);
    }

    function makeCtrl(svg, active, handler) {
      var btn = document.createElement('button');
      btn.className = 'spot-ctrl' + (active ? ' active' : '');
      btn.innerHTML = svg;
      btn.onclick = handler;
      return btn;
    }

    function updateProgressUI() {
      if (progressFillEl && durationMs > 0) {
        progressFillEl.style.width = (progressMs / durationMs * 100) + '%';
      }
      if (progressCurEl) {
        progressCurEl.textContent = fmtTime(progressMs);
      }
    }

    async function fetchNowPlaying() {
      try {
        var raw = await spotApi('GET', '/me/player');
        var resp = parseResponse(raw);
        if (resp.code === 401) {
          api.toast({ title: 'Token expired', message: 'Please reconnect with a new token', type: 'error' });
          return;
        }
        if (resp.code === 204 || !resp.body) {
          if (currentTrack !== null) {
            currentTrack = null;
            isPlaying = false;
            if (nowPlayingContainer) renderNowPlaying(nowPlayingContainer);
          }
          return;
        }
        var data = JSON.parse(resp.body);
        isPlaying = !!data.is_playing;
        shuffleState = !!data.shuffle_state;
        repeatState = data.repeat_state || 'off';
        progressMs = data.progress_ms || 0;
        if (data.item) {
          durationMs = data.item.duration_ms || 0;
          var artists = (data.item.artists || []).map(function(a) { return a.name; }).join(', ');
          var newId = data.item.id || data.item.uri;
          if (!currentTrack || currentTrack.id !== newId) {
            currentTrack = {
              id: newId,
              name: data.item.name,
              artist: artists,
              album: data.item.album ? data.item.album.name : '',
              uri: data.item.uri
            };
            if (nowPlayingContainer) renderNowPlaying(nowPlayingContainer);
          } else {
            updateProgressUI();
          }
        }
      } catch (e) { /* silently retry next interval */ }
    }

    var searchTimeout = null;

    function renderSearch(container) {
      nowPlayingContainer = null;
      container.innerHTML = '';

      var input = document.createElement('input');
      input.className = 'spot-search-input';
      input.type = 'text';
      input.placeholder = 'Search for a song, artist, or album\u2026';
      container.appendChild(input);

      var results = document.createElement('div');
      container.appendChild(results);

      input.oninput = function() {
        clearTimeout(searchTimeout);
        var q = input.value.trim();
        if (!q) { results.innerHTML = ''; return; }
        searchTimeout = setTimeout(function() { doSearch(q, results); }, 400);
      };
    }

    async function doSearch(query, container) {
      container.innerHTML = '<div class="spot-loading">Searching\u2026</div>';
      try {
        var raw = await spotApi('GET', '/search?q=' + encodeURIComponent(query) + '&type=track&limit=12');
        var resp = parseResponse(raw);
        if (resp.code !== 200) {
          container.innerHTML = '<div class="spot-err">Search failed (HTTP ' + resp.code + ')</div>';
          return;
        }
        var data = JSON.parse(resp.body);
        var tracks = (data.tracks && data.tracks.items) || [];
        container.innerHTML = '';
        if (tracks.length === 0) {
          container.innerHTML = '<div class="spot-empty" style="padding:16px 0">No results found</div>';
          return;
        }
        tracks.forEach(function(track) {
          var artists = (track.artists || []).map(function(a) { return a.name; }).join(', ');
          var row = document.createElement('div');
          row.className = 'spot-result';

          var info = document.createElement('div');
          info.className = 'spot-result-info';
          var nameEl = document.createElement('div');
          nameEl.className = 'spot-result-name';
          nameEl.textContent = track.name;
          var artEl = document.createElement('div');
          artEl.className = 'spot-result-artist';
          artEl.textContent = artists;
          info.appendChild(nameEl);
          info.appendChild(artEl);
          row.appendChild(info);

          var dur = document.createElement('div');
          dur.className = 'spot-result-dur';
          dur.textContent = fmtTime(track.duration_ms);
          row.appendChild(dur);

          var playBtn = document.createElement('button');
          playBtn.className = 'spot-result-play';
          playBtn.innerHTML = svgSmallPlay;
          playBtn.onclick = function(e) {
            e.stopPropagation();
            playTrack(track.uri);
          };
          row.appendChild(playBtn);

          row.onclick = function() { playTrack(track.uri); };
          container.appendChild(row);
        });
      } catch (e) {
        container.innerHTML = '<div class="spot-err">Search failed: ' + esc(String(e)) + '</div>';
      }
    }

    async function playTrack(uri) {
      try {
        await spotApiBody('PUT', '/me/player/play', { uris: [uri] });
        isPlaying = true;
        setTimeout(fetchNowPlaying, 500);
        api.toast({ title: 'Playing', type: 'success' });
      } catch (e) {
        api.toast({ title: 'Playback failed', message: String(e), type: 'error' });
      }
    }

    async function init() {
      var stored = await api.storage.get('spotify-token');
      if (stored) {
        token = stored;
        showPlayer();
      } else {
        showSetup();
      }
    }

    init();
  }

  vanta.registerExtension('spotify', {
    commands: { 'player': { component: SpotifyPlayer } }
  });
})(window.__vanta_host);
