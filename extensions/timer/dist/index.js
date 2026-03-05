(function(vanta) {
  function TimerView($$anchor, $$props) {
    var api = $$props.api;

    var totalSeconds = 0;
    var remainingSeconds = 0;
    var isRunning = false;
    var intervalId = null;

    var style = document.createElement('style');
    style.textContent = [
      '.tm-root { padding: 16px; color: var(--text-primary, var(--vanta-text, #f5f5f5)); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; flex-direction: column; align-items: center; gap: 20px; }',
      '.tm-presets { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }',
      '.tm-preset { padding: 8px 16px; background: var(--surface, var(--vanta-surface, #0a0a0a)); border: 1px solid var(--border, var(--vanta-border, rgba(255,255,255,0.08))); border-radius: 8px; color: var(--text-primary, var(--vanta-text, #f5f5f5)); font-size: 13px; cursor: pointer; transition: all 0.15s; }',
      '.tm-preset:hover { border-color: var(--accent, var(--vanta-accent, #7b35f0)); background: rgba(123, 53, 240, 0.08); }',
      '.tm-preset.active { border-color: var(--accent, var(--vanta-accent, #7b35f0)); background: rgba(123, 53, 240, 0.15); }',
      '.tm-custom { display: flex; align-items: center; gap: 8px; }',
      '.tm-input { width: 80px; padding: 8px 12px; background: var(--surface, var(--vanta-surface, #0a0a0a)); border: 1px solid var(--border, var(--vanta-border, rgba(255,255,255,0.08))); border-radius: 8px; color: var(--text-primary, var(--vanta-text, #f5f5f5)); font-size: 14px; text-align: center; outline: none; }',
      '.tm-input:focus { border-color: var(--accent, var(--vanta-accent, #7b35f0)); }',
      '.tm-input::placeholder { color: var(--text-secondary, var(--vanta-text-dim, #555)); }',
      '.tm-hint { color: var(--text-secondary, var(--vanta-text-dim, #888)); font-size: 12px; }',
      '.tm-display-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; max-width: 320px; }',
      '.tm-countdown { font-size: 64px; font-weight: 200; font-variant-numeric: tabular-nums; letter-spacing: 2px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--text-primary, var(--vanta-text, #f5f5f5)); line-height: 1; }',
      '.tm-countdown.urgent { color: #f44; }',
      '.tm-progress-track { width: 100%; height: 6px; background: var(--surface, var(--vanta-surface, rgba(255,255,255,0.06))); border-radius: 3px; overflow: hidden; }',
      '.tm-progress-bar { height: 100%; background: var(--accent, var(--vanta-accent, #7b35f0)); border-radius: 3px; transition: width 0.3s linear; width: 0%; }',
      '.tm-progress-bar.urgent { background: #f44; }',
      '.tm-label { font-size: 12px; color: var(--text-secondary, var(--vanta-text-dim, #888)); text-transform: uppercase; letter-spacing: 0.5px; }',
      '.tm-controls { display: flex; gap: 8px; }',
      '.tm-btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }',
      '.tm-btn-primary { background: var(--accent, var(--vanta-accent, #7b35f0)); color: #fff; }',
      '.tm-btn-primary:hover { opacity: 0.85; }',
      '.tm-btn-secondary { background: var(--surface, var(--vanta-surface, #0a0a0a)); border: 1px solid var(--border, var(--vanta-border, rgba(255,255,255,0.08))); color: var(--text-primary, var(--vanta-text, #f5f5f5)); }',
      '.tm-btn-secondary:hover { border-color: var(--accent, var(--vanta-accent, #7b35f0)); }',
      '.tm-btn:disabled { opacity: 0.4; cursor: not-allowed; }',
    ].join('\n');

    var root = document.createElement('div');
    root.className = 'tm-root';

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    }

    var presetsWrap = el('div', 'tm-presets');
    var presets = [
      { label: '5 min', value: 5 },
      { label: '10 min', value: 10 },
      { label: '15 min', value: 15 },
      { label: '25 min', value: 25 },
      { label: '30 min', value: 30 },
    ];
    var presetBtns = [];
    presets.forEach(function(p) {
      var btn = el('button', 'tm-preset', p.label);
      btn.dataset.minutes = p.value;
      presetBtns.push(btn);
      presetsWrap.appendChild(btn);
    });
    root.appendChild(presetsWrap);

    var customRow = el('div', 'tm-custom');
    var customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.className = 'tm-input';
    customInput.placeholder = '0';
    customInput.min = '1';
    customInput.max = '999';
    customRow.appendChild(customInput);
    customRow.appendChild(el('span', 'tm-hint', 'minutes'));
    root.appendChild(customRow);

    var displayWrap = el('div', 'tm-display-wrap');

    var countdownLabel = el('div', 'tm-label', 'remaining');
    displayWrap.appendChild(countdownLabel);

    var countdownEl = el('div', 'tm-countdown', '00:00');
    displayWrap.appendChild(countdownEl);

    var progressTrack = el('div', 'tm-progress-track');
    var progressBar = el('div', 'tm-progress-bar');
    progressTrack.appendChild(progressBar);
    displayWrap.appendChild(progressTrack);

    root.appendChild(displayWrap);

    var controlsWrap = el('div', 'tm-controls');
    var startBtn = el('button', 'tm-btn tm-btn-primary', 'Start');
    var pauseBtn = el('button', 'tm-btn tm-btn-secondary', 'Pause');
    var resetBtn = el('button', 'tm-btn tm-btn-secondary', 'Reset');
    pauseBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    controlsWrap.appendChild(startBtn);
    controlsWrap.appendChild(pauseBtn);
    controlsWrap.appendChild(resetBtn);
    root.appendChild(controlsWrap);

    $$anchor.before(style);
    $$anchor.before(root);

    function formatTime(secs) {
      var m = Math.floor(secs / 60);
      var s = secs % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function getSelectedMinutes() {
      var customVal = parseInt(customInput.value, 10);
      if (customVal > 0) return customVal;
      var active = presetsWrap.querySelector('.active');
      if (active) return parseInt(active.dataset.minutes, 10);
      return 0;
    }

    function updateDisplay() {
      countdownEl.textContent = formatTime(remainingSeconds);

      var elapsed = totalSeconds - remainingSeconds;
      var pct = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;
      progressBar.style.width = pct + '%';

      var isUrgent = remainingSeconds > 0 && remainingSeconds <= 10;
      countdownEl.className = 'tm-countdown' + (isUrgent ? ' urgent' : '');
      progressBar.className = 'tm-progress-bar' + (isUrgent ? ' urgent' : '');
    }

    function stopInterval() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function tick() {
      if (!root.isConnected) { stopInterval(); return; }
      if (remainingSeconds <= 0) {
        stopInterval();
        isRunning = false;
        updateControls();
        api.toast({ title: 'Timer Complete', message: 'Your ' + formatTime(totalSeconds) + ' timer has finished!', type: 'success' });
        return;
      }
      remainingSeconds--;
      updateDisplay();
    }

    function updateControls() {
      if (isRunning) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = '';
        pauseBtn.textContent = 'Pause';
        resetBtn.style.display = '';
        presetsWrap.style.opacity = '0.4';
        presetsWrap.style.pointerEvents = 'none';
        customInput.disabled = true;
      } else if (remainingSeconds > 0 && remainingSeconds < totalSeconds) {
        startBtn.style.display = '';
        startBtn.textContent = 'Resume';
        pauseBtn.style.display = 'none';
        resetBtn.style.display = '';
        presetsWrap.style.opacity = '0.4';
        presetsWrap.style.pointerEvents = 'none';
        customInput.disabled = true;
      } else {
        startBtn.style.display = '';
        startBtn.textContent = 'Start';
        pauseBtn.style.display = 'none';
        resetBtn.style.display = remainingSeconds > 0 ? '' : 'none';
        presetsWrap.style.opacity = '1';
        presetsWrap.style.pointerEvents = '';
        customInput.disabled = false;
      }
      startBtn.disabled = getSelectedMinutes() <= 0 && totalSeconds <= 0;
    }

    function startTimer() {
      if (!isRunning && remainingSeconds <= 0) {
        var mins = getSelectedMinutes();
        if (mins <= 0) return;
        totalSeconds = mins * 60;
        remainingSeconds = totalSeconds;
      }
      isRunning = true;
      updateDisplay();
      updateControls();
      stopInterval();
      intervalId = setInterval(tick, 1000);
    }

    function pauseTimer() {
      isRunning = false;
      stopInterval();
      updateControls();
    }

    function resetTimer() {
      isRunning = false;
      stopInterval();
      totalSeconds = 0;
      remainingSeconds = 0;
      updateDisplay();
      updateControls();
    }

    presetBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        presetBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        customInput.value = '';
        totalSeconds = 0;
        remainingSeconds = 0;
        updateDisplay();
        updateControls();
      });
    });

    customInput.addEventListener('input', function() {
      presetBtns.forEach(function(b) { b.classList.remove('active'); });
      totalSeconds = 0;
      remainingSeconds = 0;
      updateDisplay();
      updateControls();
    });

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    updateDisplay();
    updateControls();
  }

  vanta.registerExtension('timer', {
    commands: {
      'start': {
        component: TimerView
      }
    }
  });
})(window.__vanta_host);
