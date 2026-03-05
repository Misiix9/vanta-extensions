(function (vanta) {
  var STYLE_ID = 'vanta-ext-task-manager-css';
  var STORAGE_KEY = 'tm-tasks';

  var PRIORITY_COLORS = { high: '#ef4444', medium: '#f97316', low: '#22c55e' };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var now = new Date();
    var str = months[d.getMonth()] + ' ' + d.getDate();
    if (d.getFullYear() !== now.getFullYear()) str += ', ' + d.getFullYear();
    return str;
  }

  function isOverdue(iso) {
    if (!iso) return false;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(iso + 'T00:00:00') < today;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.tm-root{display:flex;flex-direction:column;gap:14px;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--text-primary,#ebebeb);box-sizing:border-box}',
      '.tm-root *{box-sizing:border-box}',

      '.tm-form{display:flex;gap:8px;flex-wrap:wrap}',
      '.tm-input{flex:1;min-width:120px;padding:9px 12px;background:var(--surface,#111);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:8px;color:var(--text-primary,#ebebeb);font-size:13px;outline:none;transition:border-color 120ms}',
      '.tm-input::placeholder{color:var(--text-secondary,#666)}',
      '.tm-input:focus{border-color:var(--accent,#7b35f0)}',
      '.tm-select{padding:9px 10px;background:var(--surface,#111);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:8px;color:var(--text-primary,#ebebeb);font-size:13px;outline:none;cursor:pointer;transition:border-color 120ms;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:26px}',
      '.tm-select:focus{border-color:var(--accent,#7b35f0)}',
      '.tm-date{padding:9px 10px;background:var(--surface,#111);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:8px;color:var(--text-primary,#ebebeb);font-size:13px;outline:none;cursor:pointer;transition:border-color 120ms}',
      '.tm-date:focus{border-color:var(--accent,#7b35f0)}',
      '.tm-date::-webkit-calendar-picker-indicator{filter:invert(0.6)}',
      '.tm-add-btn{padding:9px 18px;background:var(--accent,#7b35f0);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all 120ms;flex-shrink:0}',
      '.tm-add-btn:hover{filter:brightness(1.15);box-shadow:0 0 12px rgba(123,53,240,0.35)}',
      '.tm-add-btn:active{transform:scale(0.97)}',

      '.tm-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '.tm-filters{display:flex;gap:4px}',
      '.tm-filter-btn{padding:5px 12px;font-size:12px;font-weight:600;background:transparent;border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:6px;color:var(--text-secondary,#888);cursor:pointer;transition:all 120ms}',
      '.tm-filter-btn:hover{border-color:var(--accent,#7b35f0);color:var(--text-primary,#ebebeb)}',
      '.tm-filter-btn.active{background:var(--accent,#7b35f0);border-color:var(--accent,#7b35f0);color:#fff}',
      '.tm-count{margin-left:auto;font-size:12px;color:var(--text-secondary,#888)}',

      '.tm-list{display:flex;flex-direction:column;gap:4px}',
      '.tm-task{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface,#111);border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:8px;transition:all 120ms}',
      '.tm-task:hover{border-color:var(--border,rgba(255,255,255,0.16))}',
      '.tm-task.completed{opacity:0.5}',
      '.tm-checkbox{width:18px;height:18px;border-radius:50%;border:2px solid var(--border,rgba(255,255,255,0.2));background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 120ms;padding:0;color:transparent;font-size:11px;line-height:1}',
      '.tm-checkbox:hover{border-color:var(--accent,#7b35f0)}',
      '.tm-checkbox.checked{background:var(--accent,#7b35f0);border-color:var(--accent,#7b35f0);color:#fff}',
      '.tm-task-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}',
      '.tm-task-title{font-size:13px;font-weight:500;color:var(--text-primary,#ebebeb);word-break:break-word}',
      '.tm-task.completed .tm-task-title{text-decoration:line-through;color:var(--text-secondary,#888)}',
      '.tm-task-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.tm-priority-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;padding:2px 7px;border-radius:4px;line-height:1.4}',
      '.tm-due{font-size:11px;color:var(--text-secondary,#888)}',
      '.tm-due.overdue{color:#ef4444}',
      '.tm-delete-btn{width:24px;height:24px;border-radius:6px;border:none;background:transparent;color:var(--text-secondary,#666);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 120ms;padding:0}',
      '.tm-delete-btn:hover{background:rgba(239,68,68,0.15);color:#ef4444}',

      '.tm-empty{padding:32px 16px;text-align:center;color:var(--text-secondary,#888);font-size:13px;font-style:italic}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'value') e.value = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    return e;
  }

  function TaskManagerView($$anchor, $$props) {
    var props = typeof $$props === 'function' ? $$props() : $$props;
    var api = props && props.api;
    if (!api || !$$anchor) return;
    var container = $$anchor.parentNode;

    injectStyles();

    var tasks = [];
    var filter = 'all';

    var root = el('div', 'tm-root');

    // ── Add-task form ──
    var form = el('div', 'tm-form');
    var titleInput = el('input', 'tm-input', { type: 'text', placeholder: 'New task…' });
    var prioSelect = el('select', 'tm-select');
    ['medium', 'low', 'high'].forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      prioSelect.appendChild(opt);
    });
    var dateInput = el('input', 'tm-date', { type: 'date' });
    var addBtn = el('button', 'tm-add-btn');
    addBtn.textContent = 'Add';

    form.appendChild(titleInput);
    form.appendChild(prioSelect);
    form.appendChild(dateInput);
    form.appendChild(addBtn);
    root.appendChild(form);

    // ── Filter bar ──
    var bar = el('div', 'tm-bar');
    var filtersWrap = el('div', 'tm-filters');
    var filterBtns = {};
    ['all', 'active', 'completed'].forEach(function (f) {
      var btn = el('button', 'tm-filter-btn');
      btn.textContent = f.charAt(0).toUpperCase() + f.slice(1);
      btn.addEventListener('click', function () {
        filter = f;
        renderFilters();
        renderList();
      });
      filterBtns[f] = btn;
      filtersWrap.appendChild(btn);
    });
    var countEl = el('span', 'tm-count');
    bar.appendChild(filtersWrap);
    bar.appendChild(countEl);
    root.appendChild(bar);

    // ── Task list ──
    var listEl = el('div', 'tm-list');
    var emptyEl = el('div', 'tm-empty');
    emptyEl.textContent = 'No tasks here yet';
    root.appendChild(listEl);
    root.appendChild(emptyEl);

    // ── Helpers ──
    function save() {
      api.storage.set(STORAGE_KEY, JSON.stringify(tasks));
    }

    function filtered() {
      if (filter === 'active') return tasks.filter(function (t) { return !t.completed; });
      if (filter === 'completed') return tasks.filter(function (t) { return t.completed; });
      return tasks;
    }

    function renderFilters() {
      Object.keys(filterBtns).forEach(function (k) {
        filterBtns[k].className = 'tm-filter-btn' + (k === filter ? ' active' : '');
      });
      var remaining = tasks.filter(function (t) { return !t.completed; }).length;
      countEl.textContent = remaining + ' task' + (remaining !== 1 ? 's' : '') + ' remaining';
    }

    function renderList() {
      listEl.innerHTML = '';
      var items = filtered();
      emptyEl.style.display = items.length === 0 ? '' : 'none';

      items.forEach(function (task) {
        var row = el('div', 'tm-task' + (task.completed ? ' completed' : ''));

        var cb = el('button', 'tm-checkbox' + (task.completed ? ' checked' : ''));
        cb.textContent = task.completed ? '✓' : '';
        cb.addEventListener('click', function () {
          task.completed = !task.completed;
          save();
          renderFilters();
          renderList();
        });

        var body = el('div', 'tm-task-body');
        var title = el('span', 'tm-task-title');
        title.textContent = task.title;
        body.appendChild(title);

        var meta = el('div', 'tm-task-meta');
        var badge = el('span', 'tm-priority-badge');
        badge.textContent = task.priority;
        var pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
        badge.style.color = pColor;
        badge.style.backgroundColor = hexToRgba(pColor, 0.14);
        meta.appendChild(badge);

        if (task.dueDate) {
          var due = el('span', 'tm-due' + (isOverdue(task.dueDate) && !task.completed ? ' overdue' : ''));
          due.textContent = (isOverdue(task.dueDate) && !task.completed ? 'Overdue · ' : '') + formatDate(task.dueDate);
          meta.appendChild(due);
        }
        body.appendChild(meta);

        var del = el('button', 'tm-delete-btn');
        del.textContent = '×';
        del.title = 'Delete task';
        del.addEventListener('click', function () {
          tasks = tasks.filter(function (t) { return t.id !== task.id; });
          save();
          renderFilters();
          renderList();
          api.toast({ title: 'Deleted', message: task.title, type: 'info' });
        });

        row.appendChild(cb);
        row.appendChild(body);
        row.appendChild(del);
        listEl.appendChild(row);
      });
    }

    function hexToRgba(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    function addTask() {
      var title = titleInput.value.trim();
      if (!title) {
        api.toast({ title: 'Title required', message: 'Enter a task title', type: 'error' });
        titleInput.focus();
        return;
      }
      tasks.unshift({
        id: uid(),
        title: title,
        priority: prioSelect.value,
        dueDate: dateInput.value || null,
        completed: false,
        createdAt: Date.now()
      });
      titleInput.value = '';
      dateInput.value = '';
      prioSelect.value = 'medium';
      save();
      renderFilters();
      renderList();
      titleInput.focus();
      api.toast({ title: 'Task added', message: title, type: 'success' });
    }

    // ── Events ──
    addBtn.addEventListener('click', addTask);
    titleInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addTask(); }
    });

    // ── Init ──
    renderFilters();
    renderList();

    api.storage.get(STORAGE_KEY).then(function (stored) {
      if (stored) {
        try {
          tasks = JSON.parse(stored);
          renderFilters();
          renderList();
        } catch (_) { /* ignore corrupt data */ }
      }
    });

    container.appendChild(root);
  }

  vanta.registerExtension('task-manager', {
    commands: {
      'list': {
        component: TaskManagerView
      }
    }
  });
})(window.__vanta_host);
