(function(vanta) {
  function SpotifyPlayer($$anchor, $$props) {
    var api = $$props.api;
    var token = null;
    var clientId = null;
    var refreshTimer = null;
    var progressTimer = null;
    var currentTrack = null;
    var isPlaying = false;
    var progressMs = 0;
    var durationMs = 0;
    var shuffleState = false;
    var repeatState = 'off';
    var nowPlayingContainer = null;
    var progressFillEl = null;
    var progressCurEl = null;
    var playPauseBtnRef = null;
    var shuffleBtnRef = null;
    var repeatBtnRef = null;
    var searchTimeout = null;

    var style = document.createElement('style');
    style.textContent = [
      '.spot-root{padding:16px;font-family:-apple-system,system-ui,sans-serif;color:var(--vanta-text,#e8e8e8);min-height:200px}',

      '.spot-setup{display:flex;flex-direction:column;align-items:center;gap:14px;padding:20px 16px;text-align:center}',
      '.spot-setup-icon{opacity:.35}',
      '.spot-setup-title{font-size:18px;font-weight:600;margin-top:2px}',
      '.spot-step-label{font-size:11px;color:var(--vanta-text-dim,#888);font-weight:500;text-transform:uppercase;letter-spacing:.5px}',

      '.spot-instructions{text-align:left;font-size:12.5px;color:var(--vanta-text,#e8e8e8);line-height:1.7;background:var(--vanta-surface,#111);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:10px;padding:16px 20px;width:100%;max-width:420px;box-sizing:border-box}',
      '.spot-instructions-heading{font-weight:600;margin-bottom:8px;font-size:13px}',
      '.spot-instructions ol{margin:0;padding-left:20px}',
      '.spot-instructions li{margin-bottom:6px}',
      '.spot-instructions ul{margin:4px 0 0;padding-left:18px;list-style:disc}',
      '.spot-instructions ul li{margin-bottom:2px;color:var(--vanta-text-dim,#888);font-size:12px}',
      '.spot-instructions a{color:var(--vanta-accent,#7b35f0);text-decoration:none;cursor:pointer}',
      '.spot-instructions a:hover{text-decoration:underline}',
      '.spot-instructions code{background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:3px;font-size:11px;font-family:ui-monospace,monospace}',
      '.spot-instructions strong{color:var(--vanta-text,#e8e8e8);font-weight:600}',

      '.spot-setup-desc{font-size:13px;color:var(--vanta-text-dim,#888);line-height:1.6;max-width:420px}',
      '.spot-setup-desc strong{color:var(--vanta-text,#e8e8e8)}',

      '.spot-input{width:100%;max-width:420px;padding:10px 14px;background:rgba(255,255,255,0.06);color:var(--vanta-text,#e8e8e8);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:8px;font-size:13px;outline:none;box-sizing:border-box;transition:border-color .15s}',
      '.spot-input:focus{border-color:var(--vanta-accent,#7b35f0)}',
      '.spot-input::placeholder{color:var(--vanta-text-dim,#888)}',

      '.spot-btn{background:var(--vanta-accent,#7b35f0);color:#fff;border:none;padding:9px 24px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:opacity .15s}',
      '.spot-btn:hover{opacity:.85}',
      '.spot-btn:active{transform:scale(.97)}',
      '.spot-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}',
      '.spot-btn-outline{background:transparent;border:1px solid var(--vanta-border,rgba(255,255,255,0.08));color:var(--vanta-text-dim,#888)}',
      '.spot-btn-outline:hover{border-color:var(--vanta-text-dim,#888);color:var(--vanta-text,#e8e8e8)}',
      '.spot-btn-sm{font-size:11px;padding:5px 14px}',

      '.spot-tabs{display:flex;gap:2px;background:var(--vanta-surface,#111);border-radius:8px;padding:3px;margin-bottom:16px}',
      '.spot-tab{flex:1;padding:7px 0;text-align:center;font-size:12px;font-weight:500;border:none;border-radius:6px;cursor:pointer;background:transparent;color:var(--vanta-text-dim,#888);transition:all .15s}',
      '.spot-tab.active{background:var(--vanta-accent,#7b35f0);color:#fff}',

      '.spot-now{display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 0}',
      '.spot-track{font-size:16px;font-weight:600;text-align:center;line-height:1.3}',
      '.spot-artist{font-size:13px;color:var(--vanta-text-dim,#888);text-align:center}',

      '.spot-progress-wrap{width:100%;max-width:360px}',
      '.spot-progress-bar{width:100%;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;cursor:pointer;transition:height .1s}',
      '.spot-progress-bar:hover{height:6px}',
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
      '.spot-empty-icon{margin-bottom:12px;opacity:.3}',

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

      '.spot-footer{display:flex;justify-content:center;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid var(--vanta-border,rgba(255,255,255,0.08))}',
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
      var args = ['-s', '-w', '\n%{http_code}', '-X', method,
        '-H', 'Authorization: Bearer ' + token,
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify(body)];
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
      if (searchTimeout) { clearTimeout(searchTimeout); searchTimeout = null; }
    }

    function showStep1() {
      clearTimers();
      currentTrack = null;
      root.innerHTML = '';

      var wrap = document.createElement('div');
      wrap.className = 'spot-setup';

      wrap.innerHTML =
        '<div class="spot-setup-icon">' + svgMusic + '</div>' +
        '<div class="spot-setup-title">Connect to Spotify</div>' +
        '<div class="spot-step-label">Step 1 of 2</div>' +
        '<div class="spot-instructions">' +
          '<div class="spot-instructions-heading">How to connect Spotify:</div>' +
          '<ol>' +
            '<li>Go to <a class="spot-dash-link">developer.spotify.com/dashboard</a></li>' +
            '<li>Log in with your Spotify account</li>' +
            '<li>Click <strong>\u201CCreate App\u201D</strong>' +
              '<ul>' +
                '<li>Name: <strong>Vanta</strong></li>' +
                '<li>Description: <strong>Music controls for Vanta launcher</strong></li>' +
                '<li>Redirect URI: <code>http://localhost:1/callback</code></li>' +
                '<li>Check <strong>\u201CWeb API\u201D</strong> under APIs used</li>' +
                '<li>Click <strong>Save</strong></li>' +
              '</ul>' +
            '</li>' +
            '<li>On your app page, copy the <strong>Client ID</strong></li>' +
            '<li>Paste it below</li>' +
          '</ol>' +
        '</div>';

      var input = document.createElement('input');
      input.className = 'spot-input';
      input.type = 'text';
      input.placeholder = 'Paste your Client ID\u2026';
      wrap.appendChild(input);

      var btn = document.createElement('button');
      btn.className = 'spot-btn';
      btn.textContent = 'Next';
      btn.onclick = async function() {
        var val = input.value.trim();
        if (!val) return;
        btn.textContent = 'Saving\u2026';
        btn.disabled = true;
        try {
          clientId = val;
          await api.storage.set('spotify-client-id', val);
          showStep2();
        } catch (e) {
          btn.textContent = 'Next';
          btn.disabled = false;
          api.toast({ title: 'Error', message: 'Failed to save Client ID', type: 'error' });
        }
      };
      wrap.appendChild(btn);

      root.appendChild(wrap);

      var dashLink = wrap.querySelector('.spot-dash-link');
      if (dashLink) {
        dashLink.onclick = function(e) {
          e.preventDefault();
          api.shell.execute('xdg-open', ['https://developer.spotify.com/dashboard']).catch(function() {});
        };
      }

      input.focus();
    }

    function showStep2() {
      clearTimers();
      root.innerHTML = '';

      var scopes = 'user-read-playback-state+user-modify-playback-state+user-read-currently-playing';
      var authUrl = 'https://accounts.spotify.com/authorize' +
        '?client_id=' + encodeURIComponent(clientId) +
        '&response_type=token' +
        '&redirect_uri=' + encodeURIComponent('http://localhost:1/callback') +
        '&scope=' + scopes +
        '&show_dialog=true';

      var wrap = document.createElement('div');
      wrap.className = 'spot-setup';

      wrap.innerHTML =
        '<div class="spot-setup-icon">' + svgMusic + '</div>' +
        '<div class="spot-setup-title">Authorize Spotify</div>' +
        '<div class="spot-step-label">Step 2 of 2</div>' +
        '<div class="spot-setup-desc">' +
          'Click the button below. Your browser will open Spotify\u2019s authorization page.<br><br>' +
          'After clicking <strong>\u201CAgree\u201D</strong>, you\u2019ll be redirected to a page that won\u2019t load \u2014 <strong>that\u2019s normal</strong>.<br><br>' +
          'Copy the <strong>entire URL</strong> from your browser\u2019s address bar and paste it below.' +
        '</div>';

      var openBtn = document.createElement('button');
      openBtn.className = 'spot-btn';
      openBtn.textContent = 'Open Spotify Authorization';
      openBtn.onclick = function() {
        api.shell.execute('xdg-open', [authUrl]).catch(function() {
          api.toast({ title: 'Error', message: 'Could not open browser', type: 'error' });
        });
        setTimeout(function() { urlInput.focus(); }, 300);
      };
      wrap.appendChild(openBtn);

      var urlInput = document.createElement('input');
      urlInput.className = 'spot-input';
      urlInput.type = 'text';
      urlInput.placeholder = 'Paste the redirect URL here\u2026';
      wrap.appendChild(urlInput);

      var errEl = document.createElement('div');
      errEl.className = 'spot-err';
      errEl.style.display = 'none';
      wrap.appendChild(errEl);

      var connectBtn = document.createElement('button');
      connectBtn.className = 'spot-btn';
      connectBtn.textContent = 'Connect';
      connectBtn.onclick = async function() {
        var url = urlInput.value.trim();
        if (!url) return;
        errEl.style.display = 'none';

        var hash = url.split('#')[1] || '';
        var params = new URLSearchParams(hash);
        var accessToken = params.get('access_token');

        if (!accessToken) {
          errEl.textContent = 'Could not find an access token in the URL. Make sure you copied the entire URL from your browser.';
          errEl.style.display = '';
          return;
        }

        connectBtn.textContent = 'Connecting\u2026';
        connectBtn.disabled = true;
        try {
          token = accessToken;
          await api.storage.set('spotify-token', accessToken);
          api.toast({ title: 'Connected to Spotify', type: 'success' });
          showPlayer();
        } catch (e) {
          connectBtn.textContent = 'Connect';
          connectBtn.disabled = false;
          api.toast({ title: 'Error', message: 'Failed to save token', type: 'error' });
        }
      };
      wrap.appendChild(connectBtn);

      var changeBtn = document.createElement('button');
      changeBtn.className = 'spot-btn spot-btn-outline spot-btn-sm';
      changeBtn.textContent = '\u2190 Change Client ID';
      changeBtn.onclick = function() { showStep1(); };
      wrap.appendChild(changeBtn);

      root.appendChild(wrap);
    }

    function showExpired() {
      clearTimers();
      token = null;
      currentTrack = null;
      api.storage.set('spotify-token', '');
      root.innerHTML = '';

      if (!clientId) {
        showStep1();
        return;
      }

      var wrap = document.createElement('div');
      wrap.className = 'spot-setup';

      wrap.innerHTML =
        '<div class="spot-setup-icon">' + svgMusic + '</div>' +
        '<div class="spot-setup-title">Session Expired</div>' +
        '<div class="spot-setup-desc">' +
          'Your token has expired (tokens last ~1 hour).<br>' +
          'Click below to reconnect \u2014 your Client ID is still saved.' +
        '</div>';

      var btn = document.createElement('button');
      btn.className = 'spot-btn';
      btn.textContent = 'Reconnect';
      btn.onclick = function() { showStep2(); };
      wrap.appendChild(btn);

      root.appendChild(wrap);
    }

    function showPlayer() {
      clearTimers();
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

      var footer = document.createElement('div');
      footer.className = 'spot-footer';

      var reconnectBtn = document.createElement('button');
      reconnectBtn.className = 'spot-btn spot-btn-outline';
      reconnectBtn.textContent = 'Reconnect';
      reconnectBtn.onclick = function() {
        token = null;
        currentTrack = null;
        api.storage.set('spotify-token', '');
        clearTimers();
        showStep2();
      };

      var disconnectBtn = document.createElement('button');
      disconnectBtn.className = 'spot-btn spot-btn-outline';
      disconnectBtn.textContent = 'Disconnect';
      disconnectBtn.onclick = async function() {
        token = null;
        clientId = null;
        currentTrack = null;
        await api.storage.set('spotify-token', '');
        await api.storage.set('spotify-client-id', '');
        clearTimers();
        showStep1();
      };

      footer.appendChild(reconnectBtn);
      footer.appendChild(disconnectBtn);
      root.appendChild(footer);

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
        container.appendChild(wrap);
        return;
      }

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

      var progBar = progWrap.querySelector('.spot-progress-bar');
      progBar.onclick = function(e) {
        if (durationMs <= 0) return;
        var rect = progBar.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        var seekMs = Math.floor(ratio * durationMs);
        progressMs = seekMs;
        updateProgressUI();
        spotApi('PUT', '/me/player/seek?position_ms=' + seekMs);
      };

      wrap.appendChild(progWrap);

      var controls = document.createElement('div');
      controls.className = 'spot-controls';

      shuffleBtnRef = makeCtrl(svgShuffle, shuffleState, function() {
        spotApi('PUT', '/me/player/shuffle?state=' + (!shuffleState));
        shuffleState = !shuffleState;
        shuffleBtnRef.className = 'spot-ctrl' + (shuffleState ? ' active' : '');
      });
      var btnPrev = makeCtrl(svgPrev, false, function() {
        spotApi('POST', '/me/player/previous');
        setTimeout(fetchNowPlaying, 300);
      });

      playPauseBtnRef = document.createElement('button');
      playPauseBtnRef.className = 'spot-ctrl-main';
      playPauseBtnRef.innerHTML = isPlaying ? svgPause : svgPlay;
      playPauseBtnRef.onclick = function() {
        if (isPlaying) {
          spotApi('PUT', '/me/player/pause');
          isPlaying = false;
        } else {
          spotApi('PUT', '/me/player/play');
          isPlaying = true;
        }
        playPauseBtnRef.innerHTML = isPlaying ? svgPause : svgPlay;
      };

      var btnNext = makeCtrl(svgNext, false, function() {
        spotApi('POST', '/me/player/next');
        setTimeout(fetchNowPlaying, 300);
      });

      repeatBtnRef = makeCtrl(svgRepeat, repeatState !== 'off', function() {
        var next = repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off';
        spotApi('PUT', '/me/player/repeat?state=' + next);
        repeatState = next;
        repeatBtnRef.className = 'spot-ctrl' + (repeatState !== 'off' ? ' active' : '');
      });

      controls.appendChild(shuffleBtnRef);
      controls.appendChild(btnPrev);
      controls.appendChild(playPauseBtnRef);
      controls.appendChild(btnNext);
      controls.appendChild(repeatBtnRef);
      wrap.appendChild(controls);

      container.appendChild(wrap);
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
          showExpired();
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
            if (playPauseBtnRef) playPauseBtnRef.innerHTML = isPlaying ? svgPause : svgPlay;
            if (shuffleBtnRef) shuffleBtnRef.className = 'spot-ctrl' + (shuffleState ? ' active' : '');
            if (repeatBtnRef) repeatBtnRef.className = 'spot-ctrl' + (repeatState !== 'off' ? ' active' : '');
          }
        }
      } catch (e) { /* retry on next interval */ }
    }

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
        if (searchTimeout) clearTimeout(searchTimeout);
        var q = input.value.trim();
        if (!q) { results.innerHTML = ''; return; }
        searchTimeout = setTimeout(function() { doSearch(q, results); }, 400);
      };

      input.focus();
    }

    async function doSearch(query, container) {
      container.innerHTML = '<div class="spot-loading">Searching\u2026</div>';
      try {
        var raw = await spotApi('GET', '/search?q=' + encodeURIComponent(query) + '&type=track&limit=12');
        var resp = parseResponse(raw);

        if (resp.code === 401) {
          showExpired();
          return;
        }

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
        var raw = await spotApiBody('PUT', '/me/player/play', { uris: [uri] });
        var resp = parseResponse(raw);

        if (resp.code === 401) {
          showExpired();
          return;
        }

        isPlaying = true;
        setTimeout(fetchNowPlaying, 500);
        api.toast({ title: 'Playing', type: 'success' });
      } catch (e) {
        api.toast({ title: 'Playback failed', message: String(e), type: 'error' });
      }
    }

    async function init() {
      try {
        clientId = (await api.storage.get('spotify-client-id')) || null;
        token = (await api.storage.get('spotify-token')) || null;
      } catch (e) {
        clientId = null;
        token = null;
      }

      if (token) {
        showPlayer();
      } else if (clientId) {
        showStep2();
      } else {
        showStep1();
      }
    }

    init();
  }

  vanta.registerExtension('spotify', {
    commands: { 'player': { component: SpotifyPlayer } }
  });
})(window.__vanta_host);
