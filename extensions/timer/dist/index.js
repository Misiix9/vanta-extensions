(function(vanta) {
  function TimerView($$anchor, $$props) {
    var api = $$props.api;
    var totalSeconds = 0;
    var remainingSeconds = 0;
    var state = 'idle';
    var intervalId = null;

    var style = document.createElement('style');
    style.textContent = [
      '.timer-root { display:flex; flex-direction:column; align-items:center; height:100%; padding:24px 16px; gap:20px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--vanta-text,#e8e8e8); box-sizing:border-box; justify-content:center; }',
      '.timer-presets { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }',
      '.timer-preset-btn { background:var(--vanta-surface,#111); color:var(--vanta-text,#e8e8e8); border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer; font-family:inherit; transition:border-color 0.15s,background 0.15s; }',
      '.timer-preset-btn:hover { border-color:var(--vanta-accent,#7b35f0); }',
      '.timer-preset-btn.timer-active { background:var(--vanta-accent,#7b35f0); color:#fff; border-color:var(--vanta-accent,#7b35f0); }',
      '.timer-custom { display:flex; gap:6px; align-items:center; }',
      '.timer-custom-input { width:64px; padding:6px 10px; background:rgba(255,255,255,0.06); color:var(--vanta-text,#e8e8e8); border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); border-radius:6px; font-size:12px; text-align:center; outline:none; font-family:inherit; font-variant-numeric:tabular-nums; }',
      '.timer-custom-input:focus { border-color:var(--vanta-accent,#7b35f0); }',
      '.timer-custom-input::placeholder { color:var(--vanta-text-dim,#888); }',
      '.timer-custom-label { font-size:11px; color:var(--vanta-text-dim,#888); }',
      '.timer-custom-set { background:var(--vanta-accent,#7b35f0); color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; cursor:pointer; font-family:inherit; }',
      '.timer-custom-set:hover { opacity:0.85; }',
      '.timer-display { font-size:48px; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:2px; line-height:1; color:var(--vanta-text,#e8e8e8); transition:color 0.3s; }',
      '.timer-display.timer-warn { color:#f04040; }',
      '.timer-progress-wrap { width:100%; max-width:280px; height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; }',
      '.timer-progress-bar { height:100%; background:var(--vanta-accent,#7b35f0); border-radius:3px; transition:width 0.3s linear, background 0.3s; width:0%; }',
      '.timer-progress-bar.timer-bar-warn { background:#f04040; }',
      '.timer-controls { display:flex; gap:8px; }',
      '.timer-btn { padding:8px 20px; border-radius:6px; font-size:12px; cursor:pointer; font-family:inherit; border:none; transition:opacity 0.15s; }',
      '.timer-btn:hover { opacity:0.85; }',
      '.timer-btn:disabled { opacity:0.4; cursor:default; }',
      '.timer-btn-primary { background:var(--vanta-accent,#7b35f0); color:#fff; }',
      '.timer-btn-secondary { background:var(--vanta-surface,#111); color:var(--vanta-text,#e8e8e8); border:1px solid var(--vanta-border,rgba(255,255,255,0.08)); }',
      '.timer-status { font-size:11px; color:var(--vanta-text-dim,#888); text-transform:uppercase; letter-spacing:0.5px; }'
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'timer-root';

    var presetsRow = document.createElement('div');
    presetsRow.className = 'timer-presets';
    var presets = [5, 10, 15, 25, 30];
    var presetBtns = [];

    presets.forEach(function(mins) {
      var btn = document.createElement('button');
      btn.className = 'timer-preset-btn';
      btn.textContent = mins + 'm';
      btn.addEventListener('click', function() { setTimer(mins * 60); });
      presetsRow.appendChild(btn);
      presetBtns.push({ mins: mins, el: btn });
    });

    var customRow = document.createElement('div');
    customRow.className = 'timer-custom';
    var customInput = document.createElement('input');
    customInput.className = 'timer-custom-input';
    customInput.type = 'number';
    customInput.min = '1';
    customInput.max = '999';
    customInput.placeholder = 'min';
    var customLabel = document.createElement('span');
    customLabel.className = 'timer-custom-label';
    customLabel.textContent = 'minutes';
    var customSet = document.createElement('button');
    customSet.className = 'timer-custom-set';
    customSet.textContent = 'Set';
    customSet.addEventListener('click', function() {
      var val = parseInt(customInput.value);
      if (val > 0) setTimer(val * 60);
    });
    customInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var val = parseInt(customInput.value);
        if (val > 0) setTimer(val * 60);
      }
    });
    customRow.appendChild(customInput);
    customRow.appendChild(customLabel);
    customRow.appendChild(customSet);

    var display = document.createElement('div');
    display.className = 'timer-display';
    display.textContent = '00:00';

    var progressWrap = document.createElement('div');
    progressWrap.className = 'timer-progress-wrap';
    var progressBar = document.createElement('div');
    progressBar.className = 'timer-progress-bar';
    progressWrap.appendChild(progressBar);

    var controls = document.createElement('div');
    controls.className = 'timer-controls';
    var startBtn = document.createElement('button');
    startBtn.className = 'timer-btn timer-btn-primary';
    startBtn.textContent = 'Start';
    startBtn.disabled = true;
    var resetBtn = document.createElement('button');
    resetBtn.className = 'timer-btn timer-btn-secondary';
    resetBtn.textContent = 'Reset';
    resetBtn.disabled = true;

    startBtn.addEventListener('click', function() {
      if (state === 'idle' || state === 'finished') {
        startCountdown();
      } else if (state === 'running') {
        pauseCountdown();
      } else if (state === 'paused') {
        resumeCountdown();
      }
    });

    resetBtn.addEventListener('click', function() {
      resetCountdown();
    });

    controls.appendChild(startBtn);
    controls.appendChild(resetBtn);

    var statusEl = document.createElement('div');
    statusEl.className = 'timer-status';
    statusEl.textContent = 'Select a duration';

    root.appendChild(presetsRow);
    root.appendChild(customRow);
    root.appendChild(display);
    root.appendChild(progressWrap);
    root.appendChild(controls);
    root.appendChild(statusEl);

    function formatTime(secs) {
      var m = Math.floor(secs / 60);
      var s = secs % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateDisplay() {
      display.textContent = formatTime(remainingSeconds);

      var isWarn = state === 'running' && remainingSeconds <= 10 && remainingSeconds > 0;
      display.className = 'timer-display' + (isWarn ? ' timer-warn' : '');

      var pct = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
      progressBar.style.width = pct + '%';
      progressBar.className = 'timer-progress-bar' + (isWarn ? ' timer-bar-warn' : '');
    }

    function updateButtons() {
      presetBtns.forEach(function(pb) {
        pb.el.className = 'timer-preset-btn' + ((totalSeconds === pb.mins * 60 && state !== 'idle') ? ' timer-active' : '');
      });

      if (state === 'idle') {
        startBtn.textContent = 'Start';
        startBtn.disabled = totalSeconds === 0;
        resetBtn.disabled = true;
        statusEl.textContent = totalSeconds > 0 ? 'Ready' : 'Select a duration';
      } else if (state === 'running') {
        startBtn.textContent = 'Pause';
        startBtn.disabled = false;
        resetBtn.disabled = false;
        statusEl.textContent = 'Running';
      } else if (state === 'paused') {
        startBtn.textContent = 'Resume';
        startBtn.disabled = false;
        resetBtn.disabled = false;
        statusEl.textContent = 'Paused';
      } else if (state === 'finished') {
        startBtn.textContent = 'Start';
        startBtn.disabled = false;
        resetBtn.disabled = false;
        statusEl.textContent = 'Finished!';
      }
    }

    function setTimer(secs) {
      if (intervalId) clearInterval(intervalId);
      totalSeconds = secs;
      remainingSeconds = secs;
      state = 'idle';
      customInput.value = '';
      updateDisplay();
      updateButtons();
    }

    function tick() {
      if (!root.isConnected) { clearInterval(intervalId); intervalId = null; return; }
      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        state = 'finished';
        remainingSeconds = 0;
        updateDisplay();
        updateButtons();
        api.toast({ title: 'Timer Complete', message: formatTime(totalSeconds) + ' timer finished', type: 'success' });
        return;
      }
      remainingSeconds--;
      updateDisplay();
    }

    function startCountdown() {
      if (state === 'finished') {
        remainingSeconds = totalSeconds;
      }
      state = 'running';
      updateDisplay();
      updateButtons();
      intervalId = setInterval(tick, 1000);
    }

    function pauseCountdown() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      state = 'paused';
      updateButtons();
    }

    function resumeCountdown() {
      state = 'running';
      updateButtons();
      intervalId = setInterval(tick, 1000);
    }

    function resetCountdown() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      remainingSeconds = totalSeconds;
      state = 'idle';
      updateDisplay();
      updateButtons();
    }

    $$anchor.before(style);
    $$anchor.before(root);
  }

  vanta.registerExtension('timer', {
    commands: { 'start': { component: TimerView } }
  });
})(window.__vanta_host);
