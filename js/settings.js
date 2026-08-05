// ================================================================
//  SETTINGS PANEL — theme color, brightness, blur, wallpaper
// ================================================================
(function () {
  var STORAGE_KEY = 'birthday_settings';
  var DEFAULTS = { themeColor: '#E8B5B5', brightness: 5, blur: 3, wallpaper: 'punklorde' };
  var STATIC_WALLPAPERS = [
    { id: 'static-0', name: '安逸舒适', src: 'img/wallpaper/static/image-.png' },
    { id: 'static-1', name: 'test', src: 'img/wallpaper/static/test.png' },
    { id: 'static-2', name: '夏日祭', src: 'img/wallpaper/static/夏日祭.jpg' },
    { id: 'static-3', name: '贺图', src: 'img/wallpaper/static/贺图.jpg' },
    { id: 'static-4', name: '星宝', src: 'img/wallpaper/static/星宝.png' },
    { id: 'static-5', name: '蕾缪乐', src: 'img/wallpaper/static/蕾缪乐.png' }
  ];
  var DYNAMIC_WALLPAPERS = [
    { id: 'punklorde', name: 'Punklorde', src: 'Punklorde (Honkai Star Rail)-Desktop Resolution.mp4' },
    { id: 'dynamic-1', name: '爱上雷神', src: 'img/wallpaper/dynamic/爱上雷神.mp4' }
  ];
  function findAllWallpapers() { return STATIC_WALLPAPERS.concat(DYNAMIC_WALLPAPERS); }
  function findWallpaper(id) { var all = findAllWallpapers(); for (var i = 0; i < all.length; i++) { if (all[i].id === id) return all[i]; } return null; }

  var settings = {}, currentWpTab = 'static';
  var gearBtn = document.getElementById('settingsGearBtn');
  var overlay = document.getElementById('settingsOverlay');
  if (!gearBtn || !overlay) return;

  var root = document.documentElement;
  var bgVideo2 = document.getElementById('bgVideo2');
  var bgVideo2Overlay = document.getElementById('bgVideo2Overlay');

  function loadSettings() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved) { try { settings = JSON.parse(saved); } catch (e) { settings = {}; } }
    if (!settings.themeColor) settings.themeColor = DEFAULTS.themeColor;
    if (settings.brightness == null) settings.brightness = DEFAULTS.brightness;
    if (settings.blur == null) settings.blur = DEFAULTS.blur;
    if (!settings.wallpaper) settings.wallpaper = DEFAULTS.wallpaper;
  }
  function saveSettings() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {} }

  function applySettings() {
    root.style.setProperty('--theme-accent', settings.themeColor);
    root.style.setProperty('--bg-brightness', (settings.brightness / 100));
    root.style.setProperty('--glass-blur', settings.blur + 'px');
    var wp = findWallpaper(settings.wallpaper);
    if (wp) {
      var isStatic = wp.id.indexOf('static-') === 0;
      if (isStatic) {
        if (bgVideo2) { bgVideo2.style.display = 'none'; bgVideo2.pause(); }
        if (bgVideo2Overlay) {
          // Use gradient overlay ON TOP of image so brightness dimming works
          bgVideo2Overlay.style.background = '';
          bgVideo2Overlay.style.backgroundImage = 'linear-gradient(rgba(0,0,0,var(--bg-brightness)),rgba(0,0,0,var(--bg-brightness))), url(' + wp.src + ')';
          bgVideo2Overlay.style.backgroundSize = 'cover, cover';
          bgVideo2Overlay.style.backgroundPosition = 'center, center';
        }
      } else {
        if (bgVideo2Overlay) { bgVideo2Overlay.style.backgroundImage = ''; bgVideo2Overlay.style.background = ''; bgVideo2Overlay.style.backgroundSize = ''; bgVideo2Overlay.style.backgroundPosition = ''; }
        if (bgVideo2) { bgVideo2.style.display = ''; bgVideo2.src = wp.src || ''; bgVideo2.play().catch(function () {}); }
      }
    }
  }

  function renderWallpaperGrid(tab) {
    var grid = document.getElementById('wallpaperGrid');
    if (!grid) return;
    if (!tab) tab = currentWpTab; else currentWpTab = tab;
    var subtabs = document.querySelectorAll('.wallpaper-subtab');
    subtabs.forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-wptab') === tab); });
    var list = tab === 'static' ? STATIC_WALLPAPERS : DYNAMIC_WALLPAPERS;
    var isStatic = tab === 'static';
    grid.innerHTML = '';
    list.forEach(function (wp) {
      var item = document.createElement('div');
      item.className = 'wallpaper-item' + (wp.id === settings.wallpaper ? ' selected' : '');
      item.setAttribute('data-id', wp.id);
      if (isStatic) { var img = document.createElement('img'); img.className = 'wallpaper-preview'; img.src = wp.src; img.alt = wp.name; img.loading = 'lazy'; item.appendChild(img); }
      else { var prev = document.createElement('div'); prev.className = 'wallpaper-preview'; prev.style.cssText = 'background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:1.5rem'; prev.textContent = '🎬'; item.appendChild(prev); }
      var label = document.createElement('div'); label.className = 'wallpaper-label'; label.textContent = wp.name; item.appendChild(label);
      item.addEventListener('click', function () {
        var id = this.getAttribute('data-id'); settings.wallpaper = id;
        var items = grid.querySelectorAll('.wallpaper-item'); items.forEach(function (el) { el.classList.remove('selected'); });
        this.classList.add('selected'); applySettings(); saveSettings();
      });
      grid.appendChild(item);
    });
  }

  function openSettings() {
    overlay.classList.add('active'); document.body.style.overflow = 'hidden';
    document.getElementById('themeColorInput').value = settings.themeColor;
    var bs = document.getElementById('brightnessSlider'); bs.value = settings.brightness; bs.style.setProperty('--range-pct', settings.brightness + '%');
    var bls = document.getElementById('blurSlider'); bls.value = settings.blur; bls.style.setProperty('--range-pct', (settings.blur / 15 * 100) + '%');
    document.getElementById('brightnessVal').textContent = settings.brightness + '%';
    document.getElementById('blurVal').textContent = settings.blur + 'px';
    renderWallpaperGrid(currentWpTab);
  }
  function closeSettings() { overlay.classList.remove('active'); document.body.style.overflow = ''; }

  document.getElementById('themeColorInput').addEventListener('input', function () { root.style.setProperty('--theme-accent', this.value); });
  document.getElementById('brightnessSlider').addEventListener('input', function () {
    root.style.setProperty('--bg-brightness', (this.value / 100)); this.style.setProperty('--range-pct', this.value + '%');
    document.getElementById('brightnessVal').textContent = this.value + '%';
  });
  document.getElementById('blurSlider').addEventListener('input', function () {
    root.style.setProperty('--glass-blur', this.value + 'px'); this.style.setProperty('--range-pct', (this.value / 15 * 100) + '%');
    document.getElementById('blurVal').textContent = this.value + 'px';
  });
  document.getElementById('settingsApply').addEventListener('click', function () {
    settings.themeColor = document.getElementById('themeColorInput').value;
    settings.brightness = parseInt(document.getElementById('brightnessSlider').value);
    settings.blur = parseFloat(document.getElementById('blurSlider').value);
    saveSettings(); closeSettings();
  });
  document.getElementById('settingsReset').addEventListener('click', function () {
    settings.themeColor = DEFAULTS.themeColor; settings.brightness = DEFAULTS.brightness; settings.blur = DEFAULTS.blur; settings.wallpaper = DEFAULTS.wallpaper;
    saveSettings(); applySettings();
    document.getElementById('themeColorInput').value = settings.themeColor;
    var bs = document.getElementById('brightnessSlider'); bs.value = settings.brightness; bs.style.setProperty('--range-pct', settings.brightness + '%');
    var bls = document.getElementById('blurSlider'); bls.value = settings.blur; bls.style.setProperty('--range-pct', (settings.blur / 15 * 100) + '%');
    document.getElementById('brightnessVal').textContent = settings.brightness + '%';
    document.getElementById('blurVal').textContent = settings.blur + 'px';
    renderWallpaperGrid('dynamic');
  });

  document.querySelectorAll('.settings-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = this.getAttribute('data-tab');
      document.querySelectorAll('.settings-tab').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('panelStyle').style.display = tab === 'style' ? '' : 'none';
      document.getElementById('panelWallpaper').style.display = tab === 'wallpaper' ? '' : 'none';
      document.getElementById('panelInstructions').style.display = tab === 'instructions' ? '' : 'none';
      if (tab === 'wallpaper') renderWallpaperGrid(currentWpTab);
    });
  });
  document.querySelectorAll('.wallpaper-subtab').forEach(function (btn) {
    btn.addEventListener('click', function () { renderWallpaperGrid(this.getAttribute('data-wptab')); });
  });

  gearBtn.addEventListener('click', openSettings);
  document.getElementById('settingsClose').addEventListener('click', closeSettings);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSettings(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('active')) closeSettings(); });

  loadSettings(); applySettings();
})();
