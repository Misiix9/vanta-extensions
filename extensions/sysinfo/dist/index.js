(function(vanta) {
  function SysinfoView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.si-root { padding: 16px; color: var(--text-primary, var(--vanta-text, #f5f5f5)); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }',
      '.si-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }',
      '.si-title { font-size: 16px; font-weight: 600; }',
      '.si-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }',
      '.si-card { background: var(--surface, var(--vanta-surface, #0a0a0a)); border: 1px solid var(--border, var(--vanta-border, rgba(255,255,255,0.08))); border-radius: 8px; padding: 14px 16px; }',
      '.si-card.full { grid-column: 1 / -1; }',
      '.si-card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--accent, var(--vanta-accent, #7b35f0)); margin-bottom: 6px; font-weight: 600; }',
      '.si-card-value { font-size: 14px; font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace; color: var(--text-primary, var(--vanta-text, #f5f5f5)); line-height: 1.4; word-break: break-word; }',
      '.si-card-value.loading { color: var(--text-secondary, var(--vanta-text-dim, #666)); font-style: italic; font-family: inherit; }',
      '.si-card-value.error { color: #f44; font-family: inherit; }',
      '.si-card-sub { font-size: 12px; color: var(--text-secondary, var(--vanta-text-dim, #888)); margin-top: 4px; }',
      '.si-usage-track { width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-top: 8px; }',
      '.si-usage-bar { height: 100%; background: var(--accent, var(--vanta-accent, #7b35f0)); border-radius: 3px; transition: width 0.4s ease; }',
      '.si-usage-bar.warn { background: #f90; }',
      '.si-usage-bar.crit { background: #f44; }',
      '.si-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--accent, var(--vanta-accent, #7b35f0)); border: none; border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer; transition: opacity 0.15s; }',
      '.si-btn:hover { opacity: 0.85; }',
      '.si-btn:disabled { opacity: 0.4; cursor: not-allowed; }',
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'si-root';

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    }

    var cards = {};

    function makeCard(parent, key, label, opts) {
      var card = el('div', 'si-card' + (opts && opts.full ? ' full' : ''));
      card.appendChild(el('div', 'si-card-label', label));
      var val = el('div', 'si-card-value loading', 'loading\u2026');
      cards[key] = { value: val, card: card };
      card.appendChild(val);
      if (opts && opts.sub) {
        var sub = el('div', 'si-card-sub', '');
        cards[key].sub = sub;
        card.appendChild(sub);
      }
      if (opts && opts.bar) {
        var track = el('div', 'si-usage-track');
        var bar = el('div', 'si-usage-bar');
        bar.style.width = '0%';
        track.appendChild(bar);
        card.appendChild(track);
        cards[key].bar = bar;
      }
      parent.appendChild(card);
    }

    function setCard(key, value, opts) {
      var c = cards[key];
      if (!c) return;
      c.value.textContent = value;
      c.value.className = opts && opts.error ? 'si-card-value error' : 'si-card-value';
      if (opts && opts.sub !== undefined && c.sub) {
        c.sub.textContent = opts.sub;
      }
      if (opts && opts.pct !== undefined && c.bar) {
        var pct = Math.max(0, Math.min(100, opts.pct));
        c.bar.style.width = pct + '%';
        c.bar.className = 'si-usage-bar' + (pct > 90 ? ' crit' : pct > 70 ? ' warn' : '');
      }
    }

    var header = el('div', 'si-header');
    header.appendChild(el('span', 'si-title', 'System Info'));
    var refreshBtn = el('button', 'si-btn', '\u21BB Refresh');
    header.appendChild(refreshBtn);
    root.appendChild(header);

    var grid = el('div', 'si-grid');
    makeCard(grid, 'hostname', 'Hostname');
    makeCard(grid, 'os', 'Operating System');
    makeCard(grid, 'uptime', 'Uptime');
    makeCard(grid, 'cpu', 'CPU', { full: true });
    makeCard(grid, 'ram', 'Memory (RAM)', { sub: true, bar: true });
    makeCard(grid, 'disk', 'Disk Usage (/)', { sub: true, bar: true });
    root.appendChild(grid);

    $$anchor.before(style);
    $$anchor.before(root);

    function resetAll() {
      Object.keys(cards).forEach(function(key) {
        var c = cards[key];
        c.value.textContent = 'loading\u2026';
        c.value.className = 'si-card-value loading';
        if (c.sub) c.sub.textContent = '';
        if (c.bar) {
          c.bar.style.width = '0%';
          c.bar.className = 'si-usage-bar';
        }
      });
    }

    async function loadAll() {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '\u21BB Loading\u2026';
      resetAll();

      try {
        var hn = await api.shell.execute('hostname');
        setCard('hostname', hn.trim());
      } catch (e) {
        setCard('hostname', 'failed', { error: true });
      }

      try {
        var os = await api.shell.execute('uname', ['-sr']);
        setCard('os', os.trim());
      } catch (e) {
        setCard('os', 'failed', { error: true });
      }

      try {
        var up = await api.shell.execute('uptime', ['-p']);
        setCard('uptime', up.trim().replace(/^up\s+/, ''));
      } catch (e) {
        setCard('uptime', 'failed', { error: true });
      }

      try {
        var cpuRaw = await api.shell.execute('bash', ['-c', 'lscpu | grep "Model name"']);
        var cpuName = cpuRaw.replace(/^.*Model name:\s*/, '').trim();
        setCard('cpu', cpuName || cpuRaw.trim());
      } catch (e) {
        setCard('cpu', 'failed to retrieve', { error: true });
      }

      try {
        var memRaw = await api.shell.execute('bash', ['-c', 'free -h | grep Mem']);
        var memParts = memRaw.trim().split(/\s+/);
        var memTotal = memParts[1] || '?';
        var memUsed = memParts[2] || '?';

        var memPctRaw = await api.shell.execute('bash', ['-c', "free | grep Mem | awk '{printf \"%.0f\", $3/$2 * 100}'"]);
        var memPct = parseInt(memPctRaw.trim(), 10) || 0;

        setCard('ram', memUsed + ' / ' + memTotal, {
          sub: memPct + '% used',
          pct: memPct,
        });
      } catch (e) {
        setCard('ram', 'failed', { error: true });
      }

      try {
        var diskRaw = await api.shell.execute('df', ['-h', '/']);
        var diskLines = diskRaw.trim().split('\n');
        if (diskLines.length >= 2) {
          var dp = diskLines[1].split(/\s+/);
          var diskTotal = dp[1] || '?';
          var diskUsed = dp[2] || '?';
          var diskPctStr = dp[4] || '0%';
          var diskPct = parseInt(diskPctStr, 10) || 0;

          setCard('disk', diskUsed + ' / ' + diskTotal, {
            sub: diskPctStr + ' used',
            pct: diskPct,
          });
        } else {
          setCard('disk', diskRaw.trim());
        }
      } catch (e) {
        setCard('disk', 'failed', { error: true });
      }

      refreshBtn.disabled = false;
      refreshBtn.textContent = '\u21BB Refresh';
    }

    refreshBtn.addEventListener('click', function() {
      if (!root.isConnected) return;
      loadAll();
    });

    loadAll();
  }

  vanta.registerExtension('sysinfo', {
    commands: {
      'overview': {
        component: SysinfoView
      }
    }
  });
})(window.__vanta_host);
