const VALID = ['0814','0225','0123'];

// -------- achievement easter eggs --------
const ACHIEVEMENTS = {
  '0226': {
    badge: '达成成就',
    badgeCls: 'unlocked',
    title: '🏆 奶茶的代价',
    desc: '「那天你只是正常下班。有人请你喝了杯奶茶，还说顺路回家。<br>结果顺路顺了五个月，还顺出一个网站。」'
  },
  '0510': {
    badge: '达成成就',
    badgeCls: 'unlocked',
    title: '🏆 凌晨未响应',
    desc: '「系统提示：表白事件已记录，对方正在加载中... 」'
  },
  '0219': {
    badge: '达成成就',
    badgeCls: 'unlocked',
    title: '🏆 零号存档',
    desc: '「 故事从这里开始。<br>起因：随手发布了一个临时委托 <br>结果：意外解锁了一段长期剧情 」'
  },
  '0910': {
    badge: '成就已发现',
    badgeCls: 'discovered',
    title: '🏆 回礼协议（待解锁）',
    desc: '「某程序员的出厂日期。系统已自动加入日程表。<br>提示：该用户似乎很期待你的礼物。」'
  }
};

const input    = document.getElementById('birthday');
const btn      = document.getElementById('submit');
const modal    = document.getElementById('achieveModal');
const mBadge   = document.getElementById('achieveBadge');
const mTitle   = document.getElementById('achieveTitle');
const mDesc    = document.getElementById('achieveDesc');
const mClose   = document.getElementById('achieveClose');

function showAchievement(code) {
  const a = ACHIEVEMENTS[code];
  mBadge.textContent = a.badge;
  mBadge.className   = 'modal-badge ' + a.badgeCls;
  mTitle.innerHTML   = a.title;
  mDesc.innerHTML    = a.desc;
  modal.classList.add('show');
}

mClose.addEventListener('click', function () {
  modal.classList.remove('show');
});
modal.addEventListener('click', function (e) {
  if (e.target === modal) modal.classList.remove('show');
});

function check() {
  const val = input.value.trim();

  // achievement easter eggs take priority
  if (ACHIEVEMENTS[val]) {
    showAchievement(val);
    return;
  }

  if (VALID.includes(val)) {
    window.location.href = 'main.html';
  } else {
    alert('对不起，您没有被邀请噢:/');
  }
}

btn.addEventListener('click', check);
input.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') check();
});
