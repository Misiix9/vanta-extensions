(function(vanta) {
  function SysInfoView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.si-root{padding:16px;font-family:-apple-system,system-ui,sans-serif;color:var(--vanta-text,#e8e8e8)}',
      '.si-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}',
      '.si-title{font-size:16px;font-weight:600}',
      '.si-refresh{background:var(--vanta-accent,#7b35f0);color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px;transition:opacity .15s}',
      '.si-refresh:hover{opacity:.85}',
      '.si-refresh:active{transform:scale(.97)}',
      '.si-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.si-card{background:var(--vanta-surface,#111);border:1px solid var(--vanta-border,rgba(255,255,255,0.08));border-radius:10px;padding:14px}',
      '.si-card.si-full{grid-column:1/-1}',
      '.si-label{font-size:11px;color:var(--vanta-text-dim,#888);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}',
      '.si-value{font-size:14px;font-weight:500;word-break:break-word;line-height:1.4}',
      '.si-bar-track{width:100%;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-top:10px}',
      '.si-bar-fill{height:100%;border-radius:3px;transition:width .5s ease,background .3s ease}',
      '.si-bar-info{display:flex;justify-content:space-between;font-size:11px;color:var(--vanta-text-dim,#888);margin-top:4px}',
      '.si-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px 0;color:var(--vanta-text-dim,#888);font-size:13px}',
      '.si-spinner{width:24px;height:24px;border:2px solid var(--vanta-border,rgba(255,255,255,0.08));border-top-color:var(--vanta-accent,#7b35f0);border-radius:50%;animation:si-spin .6s linear infinite}',
      '@keyframes si-spin{to{transform:rotate(360deg)}}'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'si-root';

    $$anchor.before(style);
    $$anchor.before(root);

    function barColor(pct) {
      if (pct > 90) return '#ef4444';
      if (pct > 70) return '#f59e0b';
      return 'var(--vanta-accent, #7b35f0)';
    }

    function humanSize(kb) {
      if (kb < 1024) return kb + ' KB';
      if (kb < 1048576) return (kb / 1024).toFixed(1) + ' MB';
      return (kb / 1048576).toFixed(1) + ' GB';
    }

    function esc(s) {
      var d = document.createElement('span');
      d.textContent = s;
      return d.innerHTML;
    }

    function makeCard(label, value, full) {
      var c = document.createElement('div');
      c.className = 'si-card' + (full ? ' si-full' : '');
      var l = document.createElement('div');
      l.className = 'si-label';
      l.textContent = label;
      var v = document.createElement('div');
      v.className = 'si-value';
      v.textContent = value;
      c.appendChild(l);
      c.appendChild(v);
      return c;
    }

    function makeBarCard(label, used, total, pct, full) {
      var c = document.createElement('div');
      c.className = 'si-card' + (full ? ' si-full' : '');
      var color = barColor(pct);
      c.innerHTML =
        '<div class="si-label">' + esc(label) + '</div>' +
        '<div class="si-value">' + esc(used) + ' / ' + esc(total) + '</div>' +
        '<div class="si-bar-track"><div class="si-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
        '<div class="si-bar-info"><span>' + pct + '% used</span></div>';
      return c;
    }

    function showLoading() {
      root.innerHTML =
        '<div class="si-loading">' +
          '<div class="si-spinner"></div>' +
          '<div>Gathering system info\u2026</div>' +
        '</div>';
    }

    async function refresh() {
      showLoading();
      try {
        var r = await Promise.allSettled([
          api.shell.execute('hostname', []),
          api.shell.execute('uname', ['-sr']),
          api.shell.execute('uptime', ['-p']),
          api.shell.execute('sh', ['-c', "lscpu | grep 'Model name' | head -1 | sed 's/.*: *//' "]),
          api.shell.execute('free', []),
          api.shell.execute('df', ['-h', '/'])
        ]);

        var v = function(i) {
          return r[i].status === 'fulfilled' ? r[i].value.trim() : 'N/A';
        };

        var hostname = v(0);
        var os = v(1);
        var uptime = v(2).replace(/^up\s+/, '');
        var cpu = v(3) || 'Unknown CPU';

        var ramUsed = '?', ramTotal = '?', ramPct = 0;
        if (r[4].status === 'fulfilled') {
          var memLine = r[4].value.split('\n').find(function(l) {
            return /^Mem:/.test(l);
          });
          if (memLine) {
            var mp = memLine.split(/\s+/);
            var totalKb = parseInt(mp[1]) || 1;
            var usedKb = parseInt(mp[2]) || 0;
            ramPct = Math.round((usedKb / totalKb) * 100);
            ramTotal = humanSize(totalKb);
            ramUsed = humanSize(usedKb);
          }
        }

        var diskUsed = '?', diskTotal = '?', diskPct = 0;
        if (r[5].status === 'fulfilled') {
          var lines = r[5].value.trim().split('\n');
          if (lines.length > 1) {
            var dp = lines[1].split(/\s+/);
            diskTotal = dp[1] || '?';
            diskUsed = dp[2] || '?';
            diskPct = parseInt(dp[4]) || 0;
          }
        }

        root.innerHTML = '';

        var header = document.createElement('div');
        header.className = 'si-header';
        var title = document.createElement('span');
        title.className = 'si-title';
        title.textContent = 'System Info';
        header.appendChild(title);

        var btn = document.createElement('button');
        btn.className = 'si-refresh';
        btn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>' +
          '<path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>';
        var btnText = document.createElement('span');
        btnText.textContent = 'Refresh';
        btn.appendChild(btnText);
        btn.onclick = refresh;
        header.appendChild(btn);
        root.appendChild(header);

        var grid = document.createElement('div');
        grid.className = 'si-grid';
        grid.appendChild(makeCard('Hostname', hostname));
        grid.appendChild(makeCard('Operating System', os));
        grid.appendChild(makeCard('Uptime', uptime));
        grid.appendChild(makeCard('CPU', cpu, true));
        grid.appendChild(makeBarCard('RAM', ramUsed, ramTotal, ramPct));
        grid.appendChild(makeBarCard('Disk (/)', diskUsed, diskTotal, diskPct));
        root.appendChild(grid);
      } catch (e) {
        root.innerHTML =
          '<div class="si-loading" style="color:#ef4444">' +
          'Failed to load system info: ' + esc(String(e)) +
          '</div>';
      }
    }

    refresh();
  }

  vanta.registerExtension('sysinfo', {
    commands: { 'overview': { component: SysInfoView } }
  });
})(window.__vanta_host);
