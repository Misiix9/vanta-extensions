(function(vanta) {
  function NetworkView($$anchor, $$props) {
    var api = $$props.api;

    var style = document.createElement('style');
    style.textContent = [
      '.nt-root { padding: 16px; color: var(--text-primary, var(--vanta-text, #f5f5f5)); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }',
      '.nt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }',
      '.nt-title { font-size: 16px; font-weight: 600; }',
      '.nt-section { margin-bottom: 12px; background: var(--surface, var(--vanta-surface, #0a0a0a)); border: 1px solid var(--border, var(--vanta-border, rgba(255,255,255,0.08))); border-radius: 8px; padding: 12px 16px; }',
      '.nt-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--accent, var(--vanta-accent, #7b35f0)); margin-bottom: 10px; font-weight: 600; }',
      '.nt-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; }',
      '.nt-row + .nt-row { border-top: 1px solid var(--border, var(--vanta-border, rgba(255,255,255,0.05))); }',
      '.nt-label { color: var(--text-secondary, var(--vanta-text-dim, #888)); font-size: 13px; }',
      '.nt-value { font-size: 13px; font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace; color: var(--text-primary, var(--vanta-text, #f5f5f5)); text-align: right; max-width: 60%; word-break: break-all; }',
      '.nt-value.loading { color: var(--text-secondary, var(--vanta-text-dim, #666)); font-style: italic; font-family: inherit; }',
      '.nt-value.error { color: #f44; font-family: inherit; }',
      '.nt-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--accent, var(--vanta-accent, #7b35f0)); border: none; border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer; transition: opacity 0.15s; }',
      '.nt-btn:hover { opacity: 0.85; }',
      '.nt-btn:disabled { opacity: 0.4; cursor: not-allowed; }',
      '.nt-ping-block { margin-top: 8px; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-family: "SF Mono", "Fira Code", monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.6; color: var(--text-secondary, var(--vanta-text-dim, #aaa)); max-height: 140px; overflow-y: auto; }',
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'nt-root';

    var fields = {};

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    }

    function makeRow(parent, label, key) {
      var row = el('div', 'nt-row');
      row.appendChild(el('span', 'nt-label', label));
      var val = el('span', 'nt-value loading', 'loading\u2026');
      fields[key] = val;
      row.appendChild(val);
      parent.appendChild(row);
    }

    function setField(key, value, isError) {
      var f = fields[key];
      if (!f) return;
      f.textContent = value;
      f.className = isError ? 'nt-value error' : 'nt-value';
    }

    var header = el('div', 'nt-header');
    header.appendChild(el('span', 'nt-title', 'Network Info'));
    var refreshBtn = el('button', 'nt-btn', '\u21BB Refresh');
    header.appendChild(refreshBtn);
    root.appendChild(header);

    var ipSection = el('div', 'nt-section');
    ipSection.appendChild(el('div', 'nt-section-title', 'IP Addresses'));
    makeRow(ipSection, 'Local IP', 'localIp');
    makeRow(ipSection, 'Public IP', 'publicIp');
    root.appendChild(ipSection);

    var dnsSection = el('div', 'nt-section');
    dnsSection.appendChild(el('div', 'nt-section-title', 'DNS Configuration'));
    makeRow(dnsSection, 'Nameserver', 'dns');
    makeRow(dnsSection, 'Search Domain', 'dnsSearch');
    root.appendChild(dnsSection);

    var gwSection = el('div', 'nt-section');
    gwSection.appendChild(el('div', 'nt-section-title', 'Gateway'));
    makeRow(gwSection, 'Default Gateway', 'gateway');
    makeRow(gwSection, 'Interface', 'gwInterface');
    root.appendChild(gwSection);

    var pingSection = el('div', 'nt-section');
    pingSection.appendChild(el('div', 'nt-section-title', 'Ping Test (8.8.8.8)'));
    makeRow(pingSection, 'Status', 'pingStatus');
    makeRow(pingSection, 'Avg Latency', 'pingLatency');
    var pingOutput = el('div', 'nt-ping-block', '');
    pingOutput.style.display = 'none';
    pingSection.appendChild(pingOutput);
    root.appendChild(pingSection);

    $$anchor.before(style);
    $$anchor.before(root);

    function resetFields() {
      Object.keys(fields).forEach(function(key) {
        var f = fields[key];
        f.textContent = 'loading\u2026';
        f.className = 'nt-value loading';
      });
      pingOutput.textContent = '';
      pingOutput.style.display = 'none';
    }

    async function loadAll() {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '\u21BB Loading\u2026';
      resetFields();

      try {
        var localRaw = await api.shell.execute('hostname', ['-I']);
        var ips = localRaw.trim().split(/\s+/);
        setField('localIp', ips[0] || 'unknown');
      } catch (err) {
        setField('localIp', 'failed to retrieve', true);
      }

      try {
        var pub = await api.network.fetch('https://api.ipify.org');
        setField('publicIp', pub.trim());
      } catch (err) {
        setField('publicIp', 'failed to retrieve', true);
      }

      try {
        var resolv = await api.shell.execute('cat', ['/etc/resolv.conf']);
        var nameservers = [];
        var searchDomains = [];
        resolv.split('\n').forEach(function(line) {
          line = line.trim();
          if (line.startsWith('nameserver ')) {
            nameservers.push(line.replace('nameserver ', '').trim());
          } else if (line.startsWith('search ')) {
            searchDomains.push(line.replace('search ', '').trim());
          }
        });
        setField('dns', nameservers.join(', ') || 'none');
        setField('dnsSearch', searchDomains.join(', ') || 'none');
      } catch (err) {
        setField('dns', 'failed to read', true);
        setField('dnsSearch', 'failed to read', true);
      }

      try {
        var routeRaw = await api.shell.execute('bash', ['-c', 'ip route | grep default']);
        var parts = routeRaw.trim().split(/\s+/);
        var gwIdx = parts.indexOf('via');
        var devIdx = parts.indexOf('dev');
        setField('gateway', gwIdx >= 0 ? parts[gwIdx + 1] : routeRaw.trim());
        setField('gwInterface', devIdx >= 0 ? parts[devIdx + 1] : 'unknown');
      } catch (err) {
        setField('gateway', 'failed to retrieve', true);
        setField('gwInterface', 'failed to retrieve', true);
      }

      try {
        setField('pingStatus', 'testing\u2026');
        fields['pingStatus'].className = 'nt-value loading';
        var pingRaw = await api.shell.execute('ping', ['-c', '3', '-W', '3', '8.8.8.8']);
        pingOutput.textContent = pingRaw.trim();
        pingOutput.style.display = 'block';

        var avgMatch = pingRaw.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)/);
        if (avgMatch) {
          setField('pingLatency', avgMatch[1] + ' ms');
          setField('pingStatus', '\u2713 Reachable');
        } else {
          var timeMatch = pingRaw.match(/time[=<]([\d.]+)\s*ms/);
          setField('pingLatency', timeMatch ? timeMatch[1] + ' ms' : 'see output');
          setField('pingStatus', '\u2713 Reachable');
        }
      } catch (err) {
        setField('pingStatus', '\u2717 Unreachable', true);
        setField('pingLatency', 'N/A', true);
        pingOutput.textContent = String(err);
        pingOutput.style.display = 'block';
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

  vanta.registerExtension('network-test', {
    commands: {
      'info': {
        component: NetworkView
      }
    }
  });
})(window.__vanta_host);
