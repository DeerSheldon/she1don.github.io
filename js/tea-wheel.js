// ================================================================
//  TEA WHEEL — spinning wheel afternoon tea picker
// ================================================================
(function () {
  var STORAGE_KEY = 'tea_wheel_items';
  var DEFAULT_ITEMS = ['瑞幸','古茗','沪上阿姨','茶百道','茶理宜世','霸王茶姬','喜茶','奈雪','一点点','库迪','找点其他好喝的'];

  var canvas = document.getElementById('teaWheelCanvas');
  var spinBtn = document.getElementById('teaSpinBtn');
  var resultEl = document.getElementById('teaResult');
  var addInput = document.getElementById('teaAddInput');
  var addBtn = document.getElementById('teaAddBtn');
  var itemsList = document.getElementById('teaItemsList');
  var editToggleBtn = document.getElementById('teaEditToggleBtn');
  var editSection = document.getElementById('teaEditSection');
  if (!canvas || !spinBtn) return;

  var ctx = canvas.getContext('2d');
  var items = [];
  var currentAngle = 0;
  var spinning = false;
  var animFrame = null;

  // Colors for segments
  var COLORS = [
    '#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF8C42',
    '#9B59B6','#1ABC9C','#E74C3C','#3498DB','#F39C12',
    '#E91E63','#00BCD4','#FF5722','#8BC34A','#673AB7',
    '#FF9800','#03A9F4','#CDDC39','#795548','#607D8B'
  ];

  function loadItems() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved) {
      try { var arr = JSON.parse(saved); if (arr.length > 0) items = arr; else items = DEFAULT_ITEMS.slice(); }
      catch (e) { items = DEFAULT_ITEMS.slice(); }
    } else {
      items = DEFAULT_ITEMS.slice();
    }
  }

  function saveItems() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
  }

  function drawWheel(angle) {
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var r = Math.min(cx, cy) - 4;
    var segAngle = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, w, h);

    // Draw segments
    for (var i = 0; i < items.length; i++) {
      var startAngle = angle + i * segAngle;
      var endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text along the segment
      ctx.save();
      ctx.translate(cx, cy);
      var midAngle = startAngle + segAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "PingFang SC","Microsoft YaHei",Roboto,sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;
      var textX = r - 12;
      // If text would be upside-down, flip it
      var normMid = midAngle % (2 * Math.PI);
      if (normMid < 0) normMid += 2 * Math.PI;
      if (normMid > Math.PI / 2 && normMid < 3 * Math.PI / 2) {
        ctx.rotate(Math.PI);
        textX = -(r - 12);
        ctx.textAlign = 'left';
      }
      ctx.fillText(items[i], textX, 4);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function getResult(angle) {
    var segAngle = (2 * Math.PI) / items.length;
    // Pointer is at top of wheel = -PI/2 in canvas coordinates
    // Find which segment the pointer hits in the rotated wheel:
    // wheel-local angle at pointer = screen pointer angle - wheel rotation
    var local = (-Math.PI / 2 - angle) % (2 * Math.PI);
    if (local < 0) local += 2 * Math.PI;
    var idx = Math.floor(local / segAngle) % items.length;
    return items[idx];
  }

  function spin() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = '...';

    var velocity = 15 + Math.random() * 20; // random initial speed
    var friction = 0.985;
    var minVelocity = 0.05;

    function animate() {
      currentAngle += velocity;
      velocity *= friction;
      drawWheel(currentAngle);

      if (velocity > minVelocity) {
        animFrame = requestAnimationFrame(animate);
      } else {
        // Stopped
        spinning = false;
        spinBtn.disabled = false;
        var result = getResult(currentAngle);
        resultEl.textContent = result;
        animFrame = null;
      }
    }

    if (animFrame) cancelAnimationFrame(animFrame);
    animate();
  }

  function renderItemsList() {
    if (!itemsList) return;
    itemsList.innerHTML = '';
    items.forEach(function (item, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + (i + 1) + '. ' + item + '</span>' +
        '<button class="tea-item-delete" data-idx="' + i + '" title="删除">✕</button>';
      itemsList.appendChild(li);
    });

    // Delete handlers
    itemsList.querySelectorAll('.tea-item-delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-idx'));
        if (items.length <= 2) return; // minimum 2 items
        items.splice(idx, 1);
        saveItems();
        drawWheel(currentAngle);
        renderItemsList();
      });
    });
  }

  function addItem() {
    var val = addInput.value.trim();
    if (!val || items.length >= 20) return;
    items.push(val);
    addInput.value = '';
    saveItems();
    drawWheel(currentAngle);
    renderItemsList();
  }

  // Event bindings
  spinBtn.addEventListener('click', spin);
  if (addBtn) addBtn.addEventListener('click', addItem);
  if (addInput) {
    addInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addItem();
    });
  }
  // Edit toggle
  if (editToggleBtn && editSection) {
    editToggleBtn.addEventListener('click', function () {
      var isOpen = editSection.style.display !== 'none';
      editSection.style.display = isOpen ? 'none' : '';
      editToggleBtn.textContent = isOpen ? '不符合你的需求？那你自己改吧' : '改好了，转起来！';
      var card = document.getElementById('teaWheelCard');
      if (card) { card.classList.toggle('editing', !isOpen); }
    });
  }

  // Init
  loadItems();
  drawWheel(currentAngle);
  renderItemsList();
})();
