// ================================================================
//  FORTUNE BOX — standalone slot-machine, daily draw, collapse
// ================================================================
(function () {
  var fortunes = [
    { title: "经典摸鱼", good: "带薪发呆", bad: "秒回工作消息", item: "工位小摆件", stars: 4 },
    { title: "低能耗模式", good: "已读不回", bad: "参加临时会议", item: "降噪耳机", stars: 3 },
    { title: "二次元补给", good: "补番 / 打游戏", bad: "被剧透", item: "追番列表", stars: 5 },
    { title: "干饭优先", good: "准时下班吃饭", bad: "吃公司食堂", item: "一杯奶茶", stars: 4 },
    { title: "工位摆烂", good: "假装在忙", bad: "主动揽活", item: "镜子", stars: 3 },
    { title: "有效社交", good: "和猫说话", bad: "和人类寒暄", item: "社交能量条", stars: 2 },
    { title: "游戏人生", good: "打一局喜欢的游戏", bad: "匹配到奇怪队友", item: "手柄 / 键盘", stars: 5 },
    { title: "深度发呆", good: "发呆十分钟", bad: "思考人生意义", item: "窗户", stars: 3 },
    { title: "周末预演", good: "计划怎么躺", bad: "打开工作群", item: "床", stars: 5 },
    { title: "音乐疗愈", good: "单曲循环", bad: "听长语音", item: "喜欢的歌单", stars: 4 },
    { title: "轻度叛逆", good: "对不合理需求说稍等", bad: "秒回好的收到", item: "表情包", stars: 4 },
    { title: "朋克养生", good: "多喝热水", bad: "熬夜", item: "润喉糖", stars: 3 },
    { title: "盲盒玄学", good: "抽一个盲盒", bad: "看余额", item: "还没拆的那只", stars: 5 },
    { title: "极简主义", good: "什么都不做", bad: "做多余的事", item: "空气", stars: 6 },
    { title: "隐藏款！！！", good: "给在意的人发个表情包", bad: "想太多", item: "一段轻松的对话", stars: 5 }
  ];
  var STORAGE_KEY = 'fortune_daily_v2';
  var box = document.getElementById('fortuneBox');
  var slotText = document.getElementById('fortuneSlotText');
  var resultCard = document.getElementById('fortuneResultCard');
  var drawBtn = document.getElementById('fortuneDrawBtn');
  var toggleBtn = document.getElementById('fortuneBoxToggle');
  if (!box || !slotText || !resultCard || !drawBtn) return;
  var isSpinning = false;

  function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function renderResult(f) {
    document.getElementById('fortuneResGood').textContent = f.good;
    document.getElementById('fortuneResBad').textContent = f.bad;
    document.getElementById('fortuneResItem').textContent = f.item;
    var starsEl = document.getElementById('fortuneResStars');
    if (f.stars === 6) { starsEl.textContent = '∞'; starsEl.classList.add('infinity'); }
    else { starsEl.textContent = '★'.repeat(f.stars) + '☆'.repeat(5 - f.stars); starsEl.classList.remove('infinity'); }
  }
  function finalize(f) {
    slotText.classList.remove('spinning'); slotText.classList.add('result');
    slotText.textContent = f.title; renderResult(f);
    setTimeout(function () {
      resultCard.classList.add('show');
      if (f.title === '隐藏款') box.classList.add('hidden-flash'); else box.classList.remove('hidden-flash');
      isSpinning = false; drawBtn.disabled = false; drawBtn.textContent = '再抽一张';
    }, 150);
  }
  function slowDown(step, remaining, finalResult) {
    if (remaining <= 0) { finalize(finalResult); return; }
    var delay = 120 + (3 - remaining) * 180;
    setTimeout(function () { slotText.textContent = fortunes[Math.floor(Math.random() * fortunes.length)].title; slowDown(step, remaining - 1, finalResult); }, delay);
  }
  function spin(finalResult) {
    var totalSpins = 18, count = 0;
    slotText.classList.add('spinning'); slotText.classList.remove('result');
    var spinTimer = setInterval(function () {
      slotText.textContent = fortunes[Math.floor(Math.random() * fortunes.length)].title;
      count++;
      if (count >= totalSpins - 3) { clearInterval(spinTimer); slowDown(count, totalSpins - count, finalResult); }
    }, 70);
  }
  function draw() {
    if (isSpinning) return;
    isSpinning = true; drawBtn.disabled = true; resultCard.classList.remove('show'); box.classList.remove('hidden-flash');
    var f = fortunes[Math.floor(Math.random() * fortunes.length)];
    var data = { date: getToday(), index: fortunes.indexOf(f) };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    spin(f);
  }

  // Fortune toggle — always expands
  var fortuneToggle = document.getElementById('fortuneToggle');
  var fortuneToggleWrap = document.getElementById('fortuneToggleWrap');
  if (fortuneToggle) {
    fortuneToggle.addEventListener('change', function () {
      fortuneToggle.checked = false;
      box.classList.remove('fortune-hidden');
      if (fortuneToggleWrap) fortuneToggleWrap.classList.add('toggle-hidden');
    });
  }
  // Collapse button hides fortune
  var collapseBtn = document.getElementById('fortuneCollapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      box.classList.add('fortune-hidden');
      if (fortuneToggleWrap) fortuneToggleWrap.classList.remove('toggle-hidden');
    });
  }
  if (fortuneToggleWrap) fortuneToggleWrap.classList.add('toggle-hidden');

  // ▲ button — collapse content
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (e) { e.stopPropagation(); box.classList.toggle('collapsed'); });
  }
  drawBtn.addEventListener('click', function (e) { e.stopPropagation(); if (isSpinning) return; draw(); });

  // Restore if drawn today
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved) {
    try {
      var data = JSON.parse(saved);
      if (data.date === getToday() && data.index != null && fortunes[data.index]) {
        var f = fortunes[data.index];
        slotText.textContent = f.title; slotText.classList.add('result');
        renderResult(f); resultCard.classList.add('show'); drawBtn.textContent = '再抽一张';
        if (f.title === '隐藏款') box.classList.add('hidden-flash');
      }
    } catch (e) {}
  }
})();
