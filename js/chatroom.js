const input = document.getElementById('chatMessage');
const sendBtn = document.getElementById('sendBtn');
const container = document.getElementById('chatroomMessages');

function getTimeStr() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `&lt;${h}:${m}&gt;`;
}

function addMessage(sender, content, cls) {
  const div = document.createElement('div');
  div.className = 'message-item';
  div.innerHTML =
    '<div class="message-header">' +
      '<span class="sender ' + cls + '">' + sender + '</span>' +
      '<span class="time">' + getTimeStr() + '</span>' +
    '</div>' +
    '<div class="message-content">' + content.replace(/\n/g, '<br>') + '</div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addImageMessage(sender, imgSrc, cls) {
  const div = document.createElement('div');
  div.className = 'message-item';
  div.innerHTML =
    '<div class="message-header">' +
      '<span class="sender ' + cls + '">' + sender + '</span>' +
      '<span class="time">' + getTimeStr() + '</span>' +
    '</div>' +
    '<div class="message-content">' +
      '<img src="' + imgSrc + '" alt="图片" style="width: 300px; height: 300px; margin-top: 5px; object-fit: contain; border: 1px solid #ccc; display: block;">' +
    '</div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ===== Sheldon 的生日留言段落 =====
const messages = [
  '哈喽',
  '当你打开这个网页的时候应该是你的生日吧。',
  '本来想学狐狸老师给你画幅画的，但是画的真的好丑。',
  '还有想过你喜欢画画嘛，要不送你画笔啊，送你tourbox啥的。',
  '但是我毕竟是外行，也不知道你缺什么，\n可能花了大价钱送了一个你用不上的工具，那样的话也太糟糕了',
  '所以作为一个程序员，\n我决定用最高成本的方式：\n写代码。',
  '这里面有你喜欢的歌，\n也有一些好玩的彩蛋和内容，\n还有一些我想对你说的话。',
  '做这个网站的时候，\n我一直在想：\n"她点开的时候会不会觉得我很无聊？"\n"算了，不管了，她应该会喜欢的吧。"',
  '认识你这几个月，\n每天和你聊天、也跟你出去玩，\n好像已经成了我生活里最期待的部分之一。',
  '谢谢你愿意让我待在你的生活里。',
  '希望它能在你工位上累的时候，\n让你偷偷摸鱼听首歌，心情好一点。',
  '愿你新的一岁，\nbug 少一点，快乐多一点，\n继续自由，继续特别。',
  '生日快乐。'
];

const STORAGE_KEY = 'chatroom_birthday_visited';
const replayBtn = document.getElementById('replayBtn');
let cascadeTimer = null;   // 用于取消逐段播放的定时器

// ===== 逐段播放 =====
let index = 0;
function showNext() {
  if (index >= messages.length) {
    // 文字消息播完，1.5s 后发送图片
    cascadeTimer = setTimeout(function() {
      addImageMessage('Sheldon', '黍黍送花.jpg', 'red');
      replayBtn.style.display = '';
    }, 1500);
    return;
  }
  addMessage('Sheldon', messages[index], 'red');
  index++;
  if (index < messages.length) {
    cascadeTimer = setTimeout(showNext, 1500);
  } else {
    // 最后一条文字也播完了，继续播图片
    cascadeTimer = setTimeout(showNext, 1500);
  }
}

// ===== 一次性显示全部消息 =====
function showAllAtOnce() {
  for (var i = 0; i < messages.length; i++) {
    addMessage('Sheldon', messages[i], 'red');
  }
  addImageMessage('Sheldon', '黍黍送花.jpg', 'red');
  replayBtn.style.display = '';
}

// ===== 停止逐段播放并清空消息区 =====
function resetAndReplay() {
  // 停止正在进行的定时器
  if (cascadeTimer) {
    clearTimeout(cascadeTimer);
    cascadeTimer = null;
  }
  // 清空消息区
  container.innerHTML = '';
  // 隐藏按钮
  replayBtn.style.display = 'none';
  // 重置索引并开始逐段播放
  index = 0;
  setTimeout(showNext, 500);
}

replayBtn.addEventListener('click', resetAndReplay);

// ===== 页面加载：根据 localStorage 决定播放方式 =====
var hasVisited = localStorage.getItem(STORAGE_KEY);

if (hasVisited) {
  // 来过的：一次性显示全部
  showAllAtOnce();
} else {
  // 第一次：逐段播放
  setTimeout(showNext, 1000);
}

// 标记已访问（在播放开始后立即标记，确保刷新后不再逐段播放）
localStorage.setItem(STORAGE_KEY, '1');

// ===== 用户发送消息（蓝色），自动触发 Sheldon 回复 =====
function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;
  addMessage('Deaf', msg, 'blue');
  input.value = '';

  // 推送通知到微信（静默，不影响用户体验）
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: msg,
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    })
  }).catch(function() {});

  // Sheldon 自动回复
  setTimeout(function() {
    addMessage('==&gt;&gt; 本程序员sheldonの网站 自动回复 &lt;&lt;==', '没有啦，后面我没做了', 'red');
  }, 1500);
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendMessage();
});

// 滚轮事件确保在消息区滚动
container.addEventListener('wheel', function(e) {
  var atTop = container.scrollTop === 0;
  var atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
  if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) return;
  e.preventDefault();
  container.scrollTop += e.deltaY;
}, { passive: false });
