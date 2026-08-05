// ================================================================
//  TYPEWRITER
// ================================================================
(function () {
  var el = document.getElementById('typewriter');
  var phrases = ['这个网站不会过期，你的生日也不会，但饮料的冰会化，趁凉喝。🧋','今日无重要通知。除了：记得偶尔起来走走👣','系统提示：今日有彩蛋掉落 🥚'];
  var idx = 0, ch = 0, deleting = false;
  var tsp = 120, dsp = 60, pe = 2000, ps = 600;
  function tick() {
    var t = phrases[idx];
    if (!deleting) {
      ch++; el.textContent = t.slice(0, ch);
      if (ch === t.length) { deleting = true; setTimeout(tick, pe); return; }
      setTimeout(tick, tsp);
    } else {
      ch--; el.textContent = t.slice(0, ch);
      if (ch === 0) { deleting = false; idx = (idx + 1) % phrases.length; setTimeout(tick, ps); return; }
      setTimeout(tick, dsp);
    }
  }
  setTimeout(tick, 600);
})();
