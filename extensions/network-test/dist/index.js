(function(vanta) {
  function NetworkInfoView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.net-root { display:flex; flex-direction:column; height:100%; padding:12px; gap:10px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:12px; color:var(--vanta-text,#e8e8e8); box-sizing:border-box; }',
      '.net-header { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }',
      '.net-title { font-size:13px; font-weight:600; color:var(--vanta-text,#e8e8e8); }',
      '.net-refresh-btn { background:var(--vanta-accent,#7b35f0); color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:11px; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:4px; }',
      '.net-refresh-btn:hover { opacity:0.85; }',
      '.net-refresh-btn:disabled { opacity:0.5; cursor:default; }',
      '.net-cards { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; min-height:0; }',
      '.net-cards::-webkit-scrollbar { width:6px; }',
      '.net-cards::-webkit-scrollbar-track { background:transparent; }',
      '.net-cards::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }',
      '.net-card { background:var(--vanta-surface,#111); border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); border-radius:8px; overflow:hidden; flex-shrink:0; }',
      '.net-card-title { padding:8px 12px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--vanta-text-dim,#888); border-bottom:1px solid var(--vanta-border,rgba(255,255,255,0.08)); }',
      '.net-card-body { padding:10px 12px; }',
      '.net-mono { font-family:"SF Mono",SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace; font-size:11px; white-space:pre-wrap; word-break:break-all; line-height:1.5; color:var(--vanta-text,#e8e8e8); margin:0; }',
      '.net-loading { color:var(--vanta-text-dim,#888); font-style:italic; font-size:11px; }',
      '.net-error { color:#f04040; font-size:11px; }',
      '.net-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; vertical-align:middle; }',
      '.net-dot-ok { background:#4ade80; }',
      '.net-dot-err { background:#f04040; }',
      '.net-dot-wait { background:#f0a030; }'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'net-root';

    var header = document.createElement('div');
    header.className = 'net-header';
    var title = document.createElement('span');
    title.className = 'net-title';
    title.textContent = 'Network Info';
    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'net-refresh-btn';
    refreshBtn.innerHTML = '\u21BB Refresh';
    refreshBtn.addEventListener('click', function() { loadAll(); });
    header.appendChild(title);
    header.appendChild(refreshBtn);

    var cards = document.createElement('div');
    cards.className = 'net-cards';

    var sections = [
      { id: 'local',   title: 'Local IPs' },
      { id: 'public',  title: 'Public IP' },
      { id: 'dns',     title: 'DNS Servers' },
      { id: 'gateway', title: 'Default Gateway' },
      { id: 'ping',    title: 'Ping Test (8.8.8.8)' }
    ];

    var bodyEls = {};

    sections.forEach(function(sec) {
      var card = document.createElement('div');
      card.className = 'net-card';
      var cardTitle = document.createElement('div');
      cardTitle.className = 'net-card-title';
      cardTitle.textContent = sec.title;
      var cardBody = document.createElement('div');
      cardBody.className = 'net-card-body';
      var pre = document.createElement('pre');
      pre.className = 'net-mono net-loading';
      pre.textContent = 'Loading\u2026';
      cardBody.appendChild(pre);
      card.appendChild(cardTitle);
      card.appendChild(cardBody);
      cards.appendChild(card);
      bodyEls[sec.id] = pre;
    });

    root.appendChild(header);
    root.appendChild(cards);

    function setResult(id, text, isError) {
      var el = bodyEls[id];
      if (!el) return;
      el.className = 'net-mono' + (isError ? ' net-error' : '');
      el.textContent = text.trim() || '(no data)';
    }

    function setLoading(id) {
      var el = bodyEls[id];
      if (!el) return;
      el.className = 'net-mono net-loading';
      el.textContent = 'Loading\u2026';
    }

    function loadAll() {
      refreshBtn.disabled = true;
      Object.keys(bodyEls).forEach(setLoading);

      var tasks = [
        api.shell.execute('hostname', ['-I']).then(function(r) {
          var ips = r.trim().split(/\s+/).filter(Boolean);
          setResult('local', ips.join('\n'));
        }).catch(function(e) { setResult('local', String(e), true); }),

        api.network.fetch('https://api.ipify.org').then(function(r) {
          setResult('public', r.trim());
        }).catch(function(e) { setResult('public', String(e), true); }),

        api.shell.execute('bash', ['-c', 'cat /etc/resolv.conf | grep nameserver']).then(function(r) {
          var lines = r.trim().split('\n').map(function(l) { return l.replace('nameserver', '').trim(); }).filter(Boolean);
          setResult('dns', lines.join('\n'));
        }).catch(function(e) { setResult('dns', String(e), true); }),

        api.shell.execute('bash', ['-c', 'ip route | grep default']).then(function(r) {
          setResult('gateway', r.trim());
        }).catch(function(e) { setResult('gateway', String(e), true); }),

        api.shell.execute('bash', ['-c', 'ping -c 3 -W 3 8.8.8.8']).then(function(r) {
          setResult('ping', r.trim());
        }).catch(function(e) { setResult('ping', String(e), true); })
      ];

      Promise.all(tasks).finally(function() {
        refreshBtn.disabled = false;
      });
    }

    $$anchor.before(style);
    $$anchor.before(root);

    loadAll();
  }

  vanta.registerExtension('network-test', {
    commands: { 'info': { component: NetworkInfoView } }
  });
})(window.__vanta_host);
