(function () {
  'use strict';

  // ============================================================
  //  CONFIG — Meting API
  // ============================================================
  var MUSIC_CONFIG = {
    server: 'netease',
    type: 'playlist',
    id: '18184602752'
  };
  var API_BASE = 'https://api.i-meto.com/meting/api';

  // ============================================================
  //  DOM REFS
  // ============================================================
  var bgVideo        = document.getElementById('bgVideo');
  var bgVideo2       = document.getElementById('bgVideo2');
  var videoFallback  = document.getElementById('videoFallback');
  var swipeHint      = document.getElementById('swipeHint');
  var mainWrapper    = document.getElementById('mainWrapper');
  var loadingOverlay = document.getElementById('loadingOverlay');
  var loadingText    = document.getElementById('loadingText');
  var loadingSpinner = document.getElementById('loadingSpinner');
  var audioEl        = document.getElementById('audioPlayer');
  var miniDisc       = document.getElementById('miniDisc');
  var miniCover      = document.getElementById('miniCover');
  var overlayTitle   = document.getElementById('overlayTitle');
  var overlayArtist  = document.getElementById('overlayArtist');
  var btnOverlayPlay = document.getElementById('btnOverlayPlay');
  var playlistUl     = document.getElementById('playlistUl');
  var playlistDrop   = document.getElementById('playlistDropdown');
  var plSongCount    = document.getElementById('plSongCount');
  var discWrapper    = document.getElementById('miniDiscWrapper');
  var musicLoadingEl = document.getElementById('musicLoadingMini');
  var musicErrorEl   = document.getElementById('musicErrorFloating');
  var musicPlayerEl  = document.getElementById('musicPlayerFloating');
  var volBtn         = document.getElementById('btnOverlayVol');
  var volSlider      = document.getElementById('overlayVolume');
  var instructionsOverlay   = document.getElementById('instructionsOverlay');
  var instructionsCloseBtn  = document.getElementById('instructionsClose');

  // ============================================================
  //  STATE
  // ============================================================
  var playlist      = [];
  var currentIndex  = 0;
  var isPlaying     = false;
  var isDragging    = false;
  var isPlaylistOpen = false;
  var transitioned  = false;
  var lastVolume    = 0.7;        // stored volume for mute toggle

  // Loading & swipe gate
  var videoLoaded   = false;
  var video2Loaded  = false;
  var audioLoaded   = false;       // audio track buffered & ready to play
  var playlistReady = false;
  var allReady      = false;       // video1 + audio + playlist loaded, 15s timer started
  var readyTime     = 0;           // Date.now() when playback started
  var SWIPE_DELAY   = 15000;       // 15 seconds forced viewing before swipe
  var countdownTimer = null;       // setTimeout id for delayed swipe unlock
  var instructionsVisible = false; // instructions panel is shown

  // Detect page reload — if user refreshes, skip straight to second page
  var isPageReload = false;
  try {
    isPageReload = (performance.getEntriesByType('navigation')[0] || {}).type === 'reload';
  } catch (e) {}

  // ============================================================
  //  UTILS
  // ============================================================
  function fmt(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function cur() { return playlist[currentIndex] || {}; }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
  }

  // ============================================================
  //  FETCH PLAYLIST
  // ============================================================
  function fetchPlaylist() {
    var url = API_BASE +
      '?server=' + encodeURIComponent(MUSIC_CONFIG.server) +
      '&type='   + encodeURIComponent(MUSIC_CONFIG.type) +
      '&id='     + encodeURIComponent(MUSIC_CONFIG.id);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      if (!Array.isArray(d) || d.length === 0) throw new Error('empty');
      return d;
    });
  }

  // ============================================================
  //  RENDER PLAYLIST
  // ============================================================
  function renderPlaylist() {
    playlistUl.innerHTML = '';
    playlist.forEach(function (s, i) {
      var li = document.createElement('li');
      if (i === currentIndex) li.classList.add('active');
      li.innerHTML =
        '<span class="pli-index">' + (i + 1) + '</span>' +
        '<span class="pli-title">' + esc(s.title) + '</span>' +
        '<span class="pli-artist">' + esc(s.author) + '</span>' +
        '<span class="pli-playing">♫</span>';
      li.addEventListener('click', (function (idx) { return function () { playTrack(idx); }; })(i));
      playlistUl.appendChild(li);
    });
    plSongCount.textContent = '(' + playlist.length + '首)';
  }

  function updateHighlight() {
    var items = playlistUl.querySelectorAll('li');
    items.forEach(function (li, i) { li.classList.toggle('active', i === currentIndex); });
  }

  // ============================================================
  //  PLAYBACK
  // ============================================================
  function playTrack(index) {
    if (index === currentIndex && isPlaying) { togglePlay(); return; }
    currentIndex = index;
    var s = cur();
    audioEl.src = s.url;
    overlayTitle.textContent = s.title || '未知歌曲';
    overlayArtist.textContent = s.author || '未知艺术家';
    if (s.pic) { miniCover.style.backgroundImage = 'url(' + s.pic + ')'; }
    else { miniCover.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; }
    updateHighlight();
    audioEl.play().then(function () { setPlaying(true); }).catch(function (e) { console.warn(e); setPlaying(false); });
  }

  function togglePlay() {
    if (!playlist.length) return;
    if (isPlaying) { audioEl.pause(); }
    else {
      if (!audioEl.src || audioEl.src === window.location.href) { playTrack(currentIndex); return; }
      audioEl.play().catch(function () {});
    }
  }

  function previousTrack() {
    if (!playlist.length) return;
    playTrack(currentIndex > 0 ? currentIndex - 1 : playlist.length - 1);
  }

  function nextTrack() {
    if (!playlist.length) return;
    playTrack(currentIndex < playlist.length - 1 ? currentIndex + 1 : 0);
  }

  function setPlaying(s) {
    isPlaying = s;
    if (s) {
      miniDisc.classList.add('playing');
      miniDisc.classList.remove('paused');
      btnOverlayPlay.textContent = '⏸';
      if (!transitioned && bgVideo && bgVideo.paused) { bgVideo.play().catch(function () {}); }
    } else {
      miniDisc.classList.add('paused');
      miniDisc.classList.remove('playing');
      btnOverlayPlay.textContent = '▶';
      if (bgVideo && !bgVideo.paused) { bgVideo.pause(); }
    }
  }

  // ============================================================
  //  PROGRESS (removed from UI, keep internal state only)
  // ============================================================
  function updateProgress() {
    // no-op: progress hidden from player overlay
  }

  function updateDuration() {
    // no-op: duration hidden from player overlay
  }

  function seekMini(pct) {
    if (!audioEl.duration) return;
    audioEl.currentTime = (pct / 100) * audioEl.duration;
  }

  // ============================================================
  //  PLAYLIST TOGGLE — click album disc
  // ============================================================
  function togglePlaylist() {
    isPlaylistOpen = !isPlaylistOpen;
    playlistDrop.classList.toggle('open', isPlaylistOpen);
  }

  function closePlaylist() {
    isPlaylistOpen = false;
    playlistDrop.classList.remove('open');
  }

  // ============================================================
  //  SWIPE / DRAG — blocked for first 15s of playback
  // ============================================================
  var swipeStartX = 0;
  var swipeCurX   = 0;
  var swiping     = false;
  var SWIPE_THRESHOLD = 0.25;

  function swipeAllowed() {
    return allReady && video2Loaded && (Date.now() - readyTime >= SWIPE_DELAY);
  }

  function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

  function onStart(e) {
    if (transitioned || !swipeAllowed()) return;
    swiping = true;
    swipeStartX = getX(e); swipeCurX = swipeStartX;
    if (bgVideo && !bgVideo.paused) { bgVideo.pause(); }
    bgVideo.style.transition = 'none';
    if (videoFallback) videoFallback.style.transition = 'none';
    mainWrapper.style.transition = 'none';
  }

  function onMove(e) {
    if (!swiping || transitioned) return;
    swipeCurX = getX(e);
    var dx = swipeCurX - swipeStartX;
    if (dx < 0) dx = 0;
    var progress = Math.min(dx / window.innerWidth, 1);
    bgVideo.style.opacity = 1 - progress;
    bgVideo.style.transform = 'translateX(' + (-35 * progress) + '%)';
    if (videoFallback) {
      videoFallback.style.opacity = 1 - progress;
      videoFallback.style.transform = 'translateX(' + (-35 * progress) + '%)';
    }
    mainWrapper.style.transform = 'translateX(' + ((1 - progress) * 100) + '%)';
    swipeHint.style.opacity = 1 - progress * 2;
    musicPlayerEl.style.opacity = progress;
    musicPlayerEl.style.pointerEvents = progress > 0.5 ? 'auto' : 'none';
  }

  function onEnd(e) {
    if (!swiping || transitioned) return;
    swiping = false;
    var dx = swipeCurX - swipeStartX;
    bgVideo.style.transition = '';
    if (videoFallback) videoFallback.style.transition = '';
    mainWrapper.style.transition = '';
    if (dx / window.innerWidth > SWIPE_THRESHOLD) { commitTransition(); }
    else { resetTransition(); }
  }

  function commitTransition() {
    transitioned = true;
    if (bgVideo && !bgVideo.paused) { bgVideo.pause(); }
    bgVideo.classList.add('exited');
    if (videoFallback) videoFallback.classList.add('exited');
    mainWrapper.classList.add('entered');
    swipeHint.classList.remove('show');
    swipeHint.classList.add('exited');
    mainWrapper.style.overflowY = 'auto';
    document.body.style.overflow = 'auto';
    musicPlayerEl.classList.add('visible');
    musicPlayerEl.style.opacity = '';
    musicPlayerEl.style.pointerEvents = '';
    // Start Punklorde background video
    if (bgVideo2) { bgVideo2.play().catch(function () {}); }
  }

  function resetTransition() {
    bgVideo.style.opacity = ''; bgVideo.style.transform = '';
    if (videoFallback) { videoFallback.style.opacity = ''; videoFallback.style.transform = ''; }
    mainWrapper.style.transform = '';
    if (swipeAllowed()) { swipeHint.classList.add('show'); }
    musicPlayerEl.classList.remove('visible');
    musicPlayerEl.style.opacity = '';
    musicPlayerEl.style.pointerEvents = '';
    if (bgVideo) { bgVideo.currentTime = 0; if (isPlaying) { bgVideo.play().catch(function () {}); } }
    if (bgVideo2) { bgVideo2.pause(); bgVideo2.currentTime = 0; }
  }

  // ============================================================
  //  EVENT BINDINGS
  // ============================================================
  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('touchend', onEnd);
  document.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', function (e) { if (swiping) onMove(e); });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('mouseleave', function () {
    if (swiping && !transitioned) {
      swiping = false;
      bgVideo.style.transition = '';
      if (videoFallback) videoFallback.style.transition = '';
      mainWrapper.style.transition = '';
      resetTransition();
    }
  });

  document.addEventListener('click', function (e) {
    if (transitioned || !swipeAllowed()) return;
    if (e.target.closest('#musicPlayerFloating') || e.target.closest('#playlistDropdown')) return;
    commitTransition();
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (!transitioned) {
      if (swipeAllowed() && (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault(); commitTransition();
      }
      return;
    }
    switch (e.code) {
      case 'Space': e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft': e.preventDefault(); previousTrack(); break;
      case 'ArrowRight': e.preventDefault(); nextTrack(); break;
      case 'Escape': if (instructionsVisible) { exitInstructionsMode(); } break;
    }
  });

  // Mini disc click → toggle playlist
  discWrapper.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePlaylist();
  });

  // Close playlist on outside click
  document.addEventListener('click', function (e) {
    if (isPlaylistOpen &&
        !e.target.closest('#playlistDropdown') &&
        !e.target.closest('#miniDiscWrapper')) {
      closePlaylist();
    }
  });

  // Instructions panel — close button (kept for compatibility)
  instructionsCloseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    exitInstructionsMode();
  });

  // Instructions panel — click backdrop to close
  instructionsOverlay.addEventListener('click', function (e) {
    if (e.target === instructionsOverlay) {
      exitInstructionsMode();
    }
  });

  // Progress bar removed from player overlay

  // Volume slider
  volSlider.addEventListener('input', function () {
    var v = parseInt(volSlider.value) / 100;
    audioEl.volume = v;
    volSlider.style.setProperty('--vp', volSlider.value + '%');
    updateVolIcon(v);
    if (v > 0) lastVolume = v;
  });

  // Volume mute toggle
  volBtn.addEventListener('click', function () {
    if (audioEl.volume > 0) {
      lastVolume = audioEl.volume;
      audioEl.volume = 0;
      volSlider.value = 0;
      volSlider.style.setProperty('--vp', '0%');
      volBtn.textContent = '🔇';
    } else {
      var restore = lastVolume > 0 ? lastVolume : 0.7;
      audioEl.volume = restore;
      volSlider.value = Math.round(restore * 100);
      volSlider.style.setProperty('--vp', (restore * 100) + '%');
      updateVolIcon(restore);
    }
  });

  function updateVolIcon(v) {
    if (v <= 0)      volBtn.textContent = '🔇';
    else if (v < 0.4) volBtn.textContent = '🔈';
    else if (v < 0.7) volBtn.textContent = '🔉';
    else              volBtn.textContent = '🔊';
  }

  // Audio events
  audioEl.addEventListener('timeupdate', updateProgress);
  audioEl.addEventListener('loadedmetadata', updateDuration);
  audioEl.addEventListener('ended', nextTrack);
  audioEl.addEventListener('play', function () {
    setPlaying(true);
    if (!transitioned && bgVideo && bgVideo.paused) { bgVideo.play().catch(function () {}); }
  });
  audioEl.addEventListener('pause', function () {
    setPlaying(false);
    if (bgVideo && !bgVideo.paused) { bgVideo.pause(); }
  });
  audioEl.addEventListener('error', function () {
    console.warn('音频加载出错');
    setTimeout(function () { if (!isPlaying && audioEl.error) nextTrack(); }, 2000);
  });

  // Video error fallback
  bgVideo.addEventListener('error', function () {
    console.warn('背景视频加载失败，显示渐变背景');
    bgVideo.style.display = 'none';
    videoFallback.style.zIndex = '0';
  });

  // ============================================================
  //  HELPERS — swipe hint & countdown
  // ============================================================
  function tryUnlockSwipe() {
    // Only unlock when video2 is loaded AND 15s have passed
    if (!allReady || !video2Loaded || (Date.now() - readyTime < SWIPE_DELAY)) return;
    if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }
    // Hide loading overlay + timeout hint
    var timeoutHint = document.getElementById('loadingTimeoutHint');
    if (timeoutHint) { timeoutHint.classList.remove('show'); }
    loadingOverlay.classList.add('fadeout');
    setTimeout(function () { loadingOverlay.style.display = 'none'; }, 600);
    // Show swipe hint
    swipeHint.classList.add('show');
  }

  function updateLoadingText(msg) {
    if (loadingText) loadingText.textContent = msg;
  }

  // ============================================================
  //  INIT — video1 + playlist trigger playback + 15s countdown
  // ============================================================
  function tryStartPlayback() {
    // ALL three must be ready: video buffered, playlist fetched, audio track buffered
    if (!videoLoaded || !playlistReady || !audioLoaded) return;
    if (allReady) return;

    // Double-check: the timeout may have set videoLoaded=true even though
    // the video hasn't actually buffered enough data. Only proceed when
    // the video is truly ready to play (HAVE_FUTURE_DATA or higher).
    if (bgVideo && bgVideo.readyState < 3) {
      console.warn('视频标记为已加载但实际未就绪 (readyState=' + bgVideo.readyState + ')，等待 canplaythrough...');
      return;
    }

    allReady = true;
    readyTime = Date.now();

    // Show player with full controls
    musicLoadingEl.style.display = 'none';
    musicPlayerEl.style.display = 'flex';

    // Start music + first page video together (simultaneously)
    audioEl.volume = 0.7;
    volSlider.value = 70;
    volSlider.style.setProperty('--vp', '70%');
    updateVolIcon(0.7);

    // Play video and audio at the same time for sync
    // Both are guaranteed to be buffered (canplaythrough) before we reach here
    var videoPromise = bgVideo && bgVideo.paused
      ? bgVideo.play().catch(function (e) { console.warn('视频自动播放失败:', e); })
      : Promise.resolve();

    var audioPromise = audioEl.play().then(function () {
      setPlaying(true);
    }).catch(function () {
      setPlaying(false);
      audioEl.pause();
    });

    // Log if either fails to start
    Promise.all([videoPromise, audioPromise]).catch(function () {});

    // Update loading text based on current video2 status
    if (video2Loaded) {
      updateLoadingText('加载完毕...');
    }

    // Arm 15-second countdown — when it fires, check if swipe can unlock
    countdownTimer = setTimeout(function () {
      countdownTimer = null;
      tryUnlockSwipe();
    }, SWIPE_DELAY);
  }

  // ============================================================
  //  INSTRUCTIONS PANEL — pull-down to reveal (floating overlay)
  // ============================================================
  function enterInstructionsMode() {
    if (instructionsVisible) return;
    instructionsVisible = true;
    mainWrapper.classList.add('instructions-mode');
    document.body.classList.add('instructions-mode');
    instructionsOverlay.classList.add('active');
  }

  function exitInstructionsMode() {
    if (!instructionsVisible) return;
    instructionsVisible = false;
    mainWrapper.classList.remove('instructions-mode');
    document.body.classList.remove('instructions-mode');
    instructionsOverlay.classList.remove('active');
  }

  // ============================================================
  //  VIDEO2 LOADER — retry infinitely on failure
  // ============================================================
  var video2RetryCount  = 0;
  var video2RetryTimer  = null;
  var VIDEO2_RETRY_BASE = 2000;   // initial delay in ms
  var VIDEO2_RETRY_MAX  = 10000;  // max delay in ms

  function onVideo2Ready() {
    if (video2Loaded) return;
    video2Loaded = true;
    video2RetryCount = 0;
    if (video2RetryTimer) { clearTimeout(video2RetryTimer); video2RetryTimer = null; }
    console.log('✅ 第二背景视频加载成功');

    // Update loading text if playback already started
    if (allReady) {
      updateLoadingText('加载完毕...');
      // If 15s have already passed, unlock immediately
      tryUnlockSwipe();
    }
  }

  function loadVideo2() {
    // Already cached by browser
    if (bgVideo2.readyState >= 3) {
      onVideo2Ready();
      return;
    }

    bgVideo2.addEventListener('canplaythrough', function () {
      onVideo2Ready();
    }, { once: true });

    bgVideo2.load();
  }

  function retryVideo2() {
    if (video2Loaded) return;
    video2RetryCount++;
    var delay = Math.min(VIDEO2_RETRY_BASE * video2RetryCount, VIDEO2_RETRY_MAX);
    console.warn(
      '⚠️ 第二背景视频加载失败 (第 ' + video2RetryCount + ' 次重试)，' +
      '错误码: ' + (bgVideo2.error ? bgVideo2.error.code : '未知') +
      '，错误信息: ' + (bgVideo2.error ? bgVideo2.error.message : '未知') +
      '，将在 ' + (delay / 1000).toFixed(1) + ' 秒后重试...'
    );
    video2RetryTimer = setTimeout(function () {
      video2RetryTimer = null;
      // Strip existing retry params to avoid accumulation
      var src = bgVideo2.src.replace(/[?&]retry=\d+/, '').replace(/[?&]t=\d+/, '');
      bgVideo2.src = '';
      bgVideo2.src = src + (src.indexOf('?') === -1 ? '?' : '&') + 'retry=' + video2RetryCount + '&t=' + Date.now();
      bgVideo2.load();
    }, delay);
  }

  function init() {
    // ============================================================
    //  RELOAD FAST-PATH — skip first page, go straight to second
    // ============================================================
    if (isPageReload) {
      // Set all state as ready
      videoLoaded = true;
      video2Loaded = true;
      audioLoaded = true;
      playlistReady = true;
      allReady = true;
      transitioned = true;

      // Hide first-page elements
      musicPlayerEl.style.display = 'none';
      loadingOverlay.style.display = 'none';
      loadingOverlay.classList.add('fadeout');
      if (bgVideo) { bgVideo.style.display = 'none'; bgVideo.classList.add('exited'); }
      if (videoFallback) { videoFallback.style.display = 'none'; videoFallback.classList.add('exited'); }
      swipeHint.style.display = 'none';
      musicLoadingEl.style.display = 'none';

      // Show second page immediately
      mainWrapper.classList.add('entered');
      mainWrapper.style.overflowY = 'auto';
      document.body.style.overflow = 'auto';
      musicPlayerEl.classList.add('visible');
      musicPlayerEl.style.opacity = '';
      musicPlayerEl.style.pointerEvents = '';

      // Set video sources — only need second page video
      bgVideo2.src = 'Punklorde (Honkai Star Rail)-Desktop Resolution.mp4';
      bgVideo2.play().catch(function () {});

      // Ensure second background video loops
      bgVideo2.addEventListener('ended', function () {
        bgVideo2.currentTime = 0;
        bgVideo2.play().catch(function () {});
      });

      // Fetch playlist + play music
      fetchPlaylist().then(function (data) {
        playlist = data;
        currentIndex = 0;
        renderPlaylist();
        var first = playlist[0];
        overlayTitle.textContent = first.title || '未知歌曲';
        overlayArtist.textContent = first.author || '未知艺术家';
        if (first.pic) { miniCover.style.backgroundImage = 'url(' + first.pic + ')'; }
        audioEl.src = first.url;
        audioEl.volume = 0.7;
        volSlider.value = 70;
        volSlider.style.setProperty('--vp', '70%');
        updateVolIcon(0.7);
        musicPlayerEl.style.display = 'flex';
        audioEl.play().then(function () { setPlaying(true); }).catch(function () {});
        console.log('✅ 刷新后直接进入第二页，歌单：' + playlist.length + ' 首');
      }).catch(function (err) {
        console.error('❌ 歌单失败:', err);
        musicErrorEl.style.display = 'block';
        musicPlayerEl.style.display = 'flex';
      });

      return; // skip normal init
    }

    // ============================================================
    //  NORMAL FIRST-TIME INIT
    // ============================================================
    musicPlayerEl.style.display = 'none';
    loadingOverlay.style.display = 'block';

    // Set video sources — local files
    bgVideo.src = 'mv.mp4';
    bgVideo2.src = 'Punklorde (Honkai Star Rail)-Desktop Resolution.mp4';

    // 1) Wait for first page video (mv.mp4) to load
    //    videoLoaded is ONLY set by canplaythrough — timeout never lies about it.
    //    This guarantees tryStartPlayback() only fires when the video has real data,
    //    keeping video and audio in perfect sync.
    if (bgVideo.readyState >= 3) {
      videoLoaded = true;
      tryStartPlayback();
    } else {
      bgVideo.addEventListener('canplaythrough', function () {
        // Always react to real load, even if timeout already fired
        videoLoaded = true;
        tryStartPlayback();
      }, { once: true });

      // Timeout does NOT set videoLoaded — just updates loading text
      // so the user knows what's happening
      setTimeout(function () {
        if (!videoLoaded) {
          console.warn('第一页背景视频加载较慢，请耐心等待...');
          updateLoadingText('视频加载中，请耐心等待...');
        }
      }, 8000);

      // Hard safety net: if video truly never loads after 30s,
      // force-proceed without it (show fallback gradient)
      setTimeout(function () {
        if (!videoLoaded) {
          console.warn('第一页背景视频加载超时 (30s)，强制继续');
          videoLoaded = true;
          if (bgVideo) { bgVideo.style.display = 'none'; }
          if (videoFallback) { videoFallback.style.zIndex = '0'; }
          tryStartPlayback();
        }
      }, 30000);
    }

    // 1.5) Preload second video (Punklorde) — blocks swipe until ready
    loadVideo2();

    // Handle video2 load error — retry infinitely with console logging
    bgVideo2.addEventListener('error', function () {
      if (video2Loaded) return;
      if (video2RetryTimer) { clearTimeout(video2RetryTimer); video2RetryTimer = null; }
      retryVideo2();
    });

    // Ensure second background video loops continuously
    bgVideo2.addEventListener('ended', function () {
      bgVideo2.currentTime = 0;
      bgVideo2.play().catch(function () {});
    });

    // 2) Fetch playlist
    fetchPlaylist().then(function (data) {
      playlist = data;
      currentIndex = 0;
      playlistReady = true;

      renderPlaylist();
      var first = playlist[0];
      overlayTitle.textContent = first.title || '未知歌曲';
      overlayArtist.textContent = first.author || '未知艺术家';
      if (first.pic) { miniCover.style.backgroundImage = 'url(' + first.pic + ')'; }
      audioEl.src = first.url;
      audioEl.load();

      // Wait for audio track to be fully buffered before allowing playback
      // This ensures video (mv.mp4) and audio start in perfect sync
      if (audioEl.readyState >= 3) {
        // Already buffered enough — ready immediately
        if (!audioLoaded) { audioLoaded = true; tryStartPlayback(); }
      } else {
        audioEl.addEventListener('canplaythrough', function () {
          if (!audioLoaded) { audioLoaded = true; tryStartPlayback(); }
        }, { once: true });
        // Fallback: if audio takes too long, proceed anyway after 10s
        setTimeout(function () {
          if (!audioLoaded) {
            console.warn('音频缓冲超时，继续');
            audioLoaded = true;
            tryStartPlayback();
          }
        }, 10000);
      }

      tryStartPlayback();
      console.log('✅ 歌单加载完成：' + playlist.length + ' 首');
    }).catch(function (err) {
      console.error('❌ 歌单失败:', err);
      musicLoadingEl.style.display = 'none';
      loadingOverlay.classList.add('fadeout');
      setTimeout(function () { loadingOverlay.style.display = 'none'; }, 600);
      musicErrorEl.style.display = 'block';
    });

    // Show timeout hint after 20s if still loading
    var timeoutHint = document.getElementById('loadingTimeoutHint');
    setTimeout(function () {
      if ((!allReady || !video2Loaded) && timeoutHint) {
        timeoutHint.classList.add('show');
      }
    }, 20000);
  }

  // ============================================================
  //  GLOBAL EXPORTS
  // ============================================================
  window.togglePlay    = togglePlay;
  window.nextTrack     = nextTrack;
  window.previousTrack = previousTrack;

  // ============================================================
  //  START
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
