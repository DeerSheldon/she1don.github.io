// ================================================================
//  CLOCK
// ================================================================
(function () {
  var greetingEl = document.getElementById('clockGreeting');
  function fmtTime(d) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, ' : ');
  }
  function fmtDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var w = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()];
    return y + ' 年 ' + m + ' 月 ' + day + ' 日 ' + w;
  }
  function fmtGreeting(d) {
    var h = d.getHours();
    if (h < 6) return '🌙 夜深了，晚安';
    if (h < 9) return '🌅 早上好';
    if (h < 12) return '☀️ 上午好';
    if (h < 14) return '🌞 中午好';
    if (h < 18) return '🌤️ 下午好';
    if (h < 21) return '🌆 傍晚好';
    return '🌃 晚上好';
  }
  function tick() {
    var n = new Date();
    document.getElementById('clockTime').textContent = fmtTime(n);
    document.getElementById('clockDate').textContent = fmtDate(n);
    if (greetingEl) greetingEl.textContent = fmtGreeting(n);
  }
  window._clockTick = tick;
  tick();
  window._clockInterval = setInterval(tick, 1000);
})();

// ================================================================
//  TURNTABLE HOVER COUNTER — after 5 shape changes, reveal meeting time
//  (depends on clock.js for window._clockTick / window._clockInterval)
// ================================================================
(function () {
  var svgFrame = document.querySelector('.svg-frame');
  var clockTimeEl = document.getElementById('clockTime');
  var clockDateEl = document.getElementById('clockDate');
  var clockGreetingEl = document.getElementById('clockGreeting');
  var hoverCount = 0;
  var triggered = false;
  var MEETING = new Date(2026, 1, 19, 21, 6, 0);
  var revertTimer = null;
  if (!svgFrame || !clockTimeEl) return;

  function updateMeetingDisplay() {
    var now = new Date();
    var diff = now - MEETING;
    if (diff < 0) { clockTimeEl.textContent = '相遇的时刻还未到来...'; return; }
    var totalMinutes = Math.floor(diff / 60000);
    var totalHours = Math.floor(totalMinutes / 60);
    var days = Math.floor(totalHours / 24);
    var hours = totalHours % 24;
    var minutes = totalMinutes % 60;
    clockTimeEl.textContent = '距离我和你的相遇已经' + days + '天' + hours + '小时' + minutes + '分了';
    clockDateEl.textContent = '谢谢你找到我';
    if (clockGreetingEl) clockGreetingEl.textContent = '';
  }

  function revertToClock() {
    if (window._clockTick) { window._clockTick(); window._clockInterval = setInterval(window._clockTick, 1000); }
    hoverCount = 0; triggered = false;
  }

  svgFrame.addEventListener('mouseenter', function () {
    if (triggered) {
      // Hovering again during the 2s window resets the timer
      if (revertTimer) clearTimeout(revertTimer);
      revertTimer = setTimeout(revertToClock, 2000);
      return;
    }
    hoverCount++;
    if (hoverCount >= 5) {
      triggered = true;
      if (window._clockInterval) { clearInterval(window._clockInterval); window._clockInterval = null; }
      updateMeetingDisplay();
      // Auto-revert to clock after 2 seconds
      revertTimer = setTimeout(revertToClock, 4000);
    }
  });
})();
