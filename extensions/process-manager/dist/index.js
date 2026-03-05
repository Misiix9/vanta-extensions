(function(vanta) {
  function ProcessManagerView($$anchor, $$props) {
    var api = $$props.api;
    var processes = [];
    var sortCol = 3;
    var sortAsc = false;
    var filterText = '';
    var refreshTimer = null;

    var style = document.createElement('style');
    style.textContent = [
      '.proc-root { display:flex; flex-direction:column; height:100%; padding:12px; gap:8px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:12px; color:var(--vanta-text,#e8e8e8); box-sizing:border-box; }',
      '.proc-summary { display:flex; gap:16px; padding:8px 12px; background:var(--vanta-surface,#111); border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); border-radius:8px; font-size:11px; color:var(--vanta-text-dim,#888); flex-shrink:0; align-items:center; }',
      '.proc-summary-item { display:flex; gap:4px; align-items:center; }',
      '.proc-summary-val { color:var(--vanta-text,#e8e8e8); font-weight:600; font-variant-numeric:tabular-nums; }',
      '.proc-search { flex-shrink:0; }',
      '.proc-search-input { width:100%; padding:8px 12px; background:rgba(255,255,255,0.06); color:var(--vanta-text,#e8e8e8); border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); border-radius:6px; font-size:12px; outline:none; box-sizing:border-box; font-family:inherit; }',
      '.proc-search-input:focus { border-color:var(--vanta-accent,#7b35f0); }',
      '.proc-search-input::placeholder { color:var(--vanta-text-dim,#888); }',
      '.proc-table-wrap { flex:1; overflow-y:auto; overflow-x:hidden; border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); border-radius:8px; min-height:0; }',
      '.proc-table-wrap::-webkit-scrollbar { width:6px; }',
      '.proc-table-wrap::-webkit-scrollbar-track { background:transparent; }',
      '.proc-table-wrap::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }',
      '.proc-table-wrap::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.2); }',
      '.proc-table { width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed; }',
      '.proc-table th { position:sticky; top:0; z-index:2; background:var(--vanta-surface,#111); color:var(--vanta-text-dim,#888); text-align:left; padding:6px 8px; font-weight:500; cursor:pointer; user-select:none; border-bottom:1px solid var(--vanta-border,rgba(255,255,255,0.08)); white-space:nowrap; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; }',
      '.proc-table th:hover { color:var(--vanta-text,#e8e8e8); }',
      '.proc-table td { padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.03); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-variant-numeric:tabular-nums; }',
      '.proc-table tr:hover td { background:rgba(255,255,255,0.03); }',
      '.proc-col-user { width:80px; }',
      '.proc-col-pid { width:60px; text-align:right; }',
      '.proc-col-cpu { width:60px; text-align:right; }',
      '.proc-col-mem { width:60px; text-align:right; }',
      '.proc-col-cmd { }',
      '.proc-col-act { width:46px; text-align:center; }',
      '.proc-warn { color:#f0a030; }',
      '.proc-danger { color:#f04040; }',
      '.proc-kill-btn { background:none; border:none; color:#f04040; cursor:pointer; font-size:10px; padding:2px 6px; border-radius:3px; opacity:0.6; font-family:inherit; }',
      '.proc-kill-btn:hover { opacity:1; background:rgba(240,64,64,0.15); }',
      '.proc-sort-arrow { font-size:9px; margin-left:2px; opacity:0.7; }'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'proc-root';

    var summary = document.createElement('div');
    summary.className = 'proc-summary';

    function makeStat(label) {
      var item = document.createElement('div');
      item.className = 'proc-summary-item';
      var lbl = document.createElement('span');
      lbl.textContent = label;
      var val = document.createElement('span');
      val.className = 'proc-summary-val';
      val.textContent = '\u2013';
      item.appendChild(lbl);
      item.appendChild(val);
      summary.appendChild(item);
      return val;
    }

    var countVal = makeStat('Processes: ');
    var cpuVal = makeStat('CPU: ');
    var ramVal = makeStat('RAM: ');

    var searchWrap = document.createElement('div');
    searchWrap.className = 'proc-search';
    var searchInput = document.createElement('input');
    searchInput.className = 'proc-search-input';
    searchInput.type = 'text';
    searchInput.placeholder = 'Filter processes\u2026';
    searchInput.addEventListener('input', function(e) {
      filterText = e.target.value.toLowerCase();
      renderTable();
    });
    searchWrap.appendChild(searchInput);

    var tableWrap = document.createElement('div');
    tableWrap.className = 'proc-table-wrap';
    var table = document.createElement('table');
    table.className = 'proc-table';
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    var columns = [
      { label: 'USER', key: 'user', cls: 'proc-col-user' },
      { label: 'PID', key: 'pid', cls: 'proc-col-pid' },
      { label: '%CPU', key: 'cpu', cls: 'proc-col-cpu' },
      { label: '%MEM', key: 'mem', cls: 'proc-col-mem' },
      { label: 'COMMAND', key: 'cmd', cls: 'proc-col-cmd' },
      { label: '', key: '', cls: 'proc-col-act' }
    ];

    columns.forEach(function(col, idx) {
      var th = document.createElement('th');
      th.className = col.cls;
      th.textContent = col.label;
      if (col.key) {
        var arrow = document.createElement('span');
        arrow.className = 'proc-sort-arrow';
        th.appendChild(arrow);
        th.addEventListener('click', function() {
          if (sortCol === idx) {
            sortAsc = !sortAsc;
          } else {
            sortCol = idx;
            sortAsc = (col.key === 'user' || col.key === 'cmd');
          }
          renderTable();
        });
      }
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    root.appendChild(summary);
    root.appendChild(searchWrap);
    root.appendChild(tableWrap);

    function parseProcesses(output) {
      var lines = output.trim().split('\n');
      if (lines.length < 2) return [];
      var result = [];
      for (var i = 1; i < lines.length; i++) {
        var parts = lines[i].trim().split(/\s+/);
        if (parts.length < 11) continue;
        result.push({
          user: parts[0],
          pid: parts[1],
          cpu: parseFloat(parts[2]) || 0,
          mem: parseFloat(parts[3]) || 0,
          cmd: parts.slice(10).join(' ').substring(0, 40)
        });
      }
      return result;
    }

    function colorClass(val) {
      if (val > 80) return ' proc-danger';
      if (val > 50) return ' proc-warn';
      return '';
    }

    function getSorted() {
      var filtered = processes;
      if (filterText) {
        filtered = processes.filter(function(p) {
          return p.cmd.toLowerCase().indexOf(filterText) !== -1 ||
                 p.user.toLowerCase().indexOf(filterText) !== -1 ||
                 p.pid.indexOf(filterText) !== -1;
        });
      }
      return filtered.slice().sort(function(a, b) {
        var va, vb;
        switch (sortCol) {
          case 0: va = a.user; vb = b.user; break;
          case 1: va = parseInt(a.pid); vb = parseInt(b.pid); break;
          case 2: va = a.cpu; vb = b.cpu; break;
          case 3: va = a.mem; vb = b.mem; break;
          case 4: va = a.cmd; vb = b.cmd; break;
          default: return 0;
        }
        if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        return sortAsc ? va - vb : vb - va;
      });
    }

    function renderTable() {
      var sorted = getSorted();
      tbody.innerHTML = '';

      var ths = headerRow.children;
      for (var h = 0; h < ths.length; h++) {
        var arrow = ths[h].querySelector('.proc-sort-arrow');
        if (arrow) arrow.textContent = (sortCol === h) ? (sortAsc ? ' \u25B2' : ' \u25BC') : '';
      }

      for (var i = 0; i < sorted.length; i++) {
        var p = sorted[i];
        var tr = document.createElement('tr');

        var tdUser = document.createElement('td');
        tdUser.className = 'proc-col-user';
        tdUser.textContent = p.user;
        tr.appendChild(tdUser);

        var tdPid = document.createElement('td');
        tdPid.className = 'proc-col-pid';
        tdPid.textContent = p.pid;
        tr.appendChild(tdPid);

        var tdCpu = document.createElement('td');
        tdCpu.className = 'proc-col-cpu' + colorClass(p.cpu);
        tdCpu.textContent = p.cpu.toFixed(1);
        tr.appendChild(tdCpu);

        var tdMem = document.createElement('td');
        tdMem.className = 'proc-col-mem' + colorClass(p.mem);
        tdMem.textContent = p.mem.toFixed(1);
        tr.appendChild(tdMem);

        var tdCmd = document.createElement('td');
        tdCmd.className = 'proc-col-cmd';
        tdCmd.textContent = p.cmd;
        tdCmd.title = p.cmd;
        tr.appendChild(tdCmd);

        var tdAct = document.createElement('td');
        tdAct.className = 'proc-col-act';
        var killBtn = document.createElement('button');
        killBtn.className = 'proc-kill-btn';
        killBtn.textContent = 'Kill';
        killBtn.title = 'SIGTERM \u00B7 Shift+Click for SIGKILL';
        (function(pid) {
          killBtn.addEventListener('click', function(e) {
            var sig = e.shiftKey ? '-9' : '-15';
            api.shell.execute('kill', [sig, pid]).then(function() {
              api.toast({ title: 'Process Killed', message: 'PID ' + pid + ' terminated', type: 'success' });
              refresh();
            }).catch(function(err) {
              api.toast({ title: 'Kill Failed', message: String(err), type: 'error' });
            });
          });
        })(p.pid);
        tdAct.appendChild(killBtn);
        tr.appendChild(tdAct);

        tbody.appendChild(tr);
      }
    }

    function refresh() {
      Promise.all([
        api.shell.execute('bash', ['-c', 'ps aux --sort=-%mem | head -100']),
        api.shell.execute('bash', ['-c', "grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {printf \"%.0f\", usage}'"]),
        api.shell.execute('bash', ['-c', "free | grep Mem | awk '{printf \"%.0f\", $3/$2*100}'"])
      ]).then(function(results) {
        processes = parseProcesses(results[0]);
        var cpu = results[1].trim();
        var ram = results[2].trim();
        countVal.textContent = String(processes.length);
        cpuVal.textContent = (cpu || '\u2013') + '%';
        ramVal.textContent = (ram || '\u2013') + '%';
        renderTable();
      }).catch(function(err) {
        console.error('[ProcessManager] refresh error:', err);
      });
    }

    $$anchor.before(style);
    $$anchor.before(root);

    refresh();
    refreshTimer = setInterval(function() {
      if (!root.isConnected) { clearInterval(refreshTimer); return; }
      refresh();
    }, 3000);
  }

  vanta.registerExtension('process-manager', {
    commands: { 'list': { component: ProcessManagerView } }
  });
})(window.__vanta_host);
