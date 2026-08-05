// ================================================================
//  CLEAR-SCREEN TOGGLE — hide/show cards with floating switch
// ================================================================
(function () {
  var toggle     = document.getElementById('clearScreenToggle');
  var card       = document.querySelector('.card');
  var timeCard   = document.querySelector('.time-card');
  var fortuneBox = document.getElementById('fortuneBox');
  var toggleWrap = document.getElementById('clearScreenToggleWrap');

  if (!toggle || !card || !timeCard) return;

  function updateWrapStyle(isClear) {
    if (isClear) {
      toggleWrap.style.background = 'rgba(80, 80, 80, 0.65)';
      toggleWrap.style.color = '#ddd';
      toggleWrap.querySelector('.toggle-label').style.color = '#ccc';
    } else {
      toggleWrap.style.background = '';
      toggleWrap.style.color = '';
      toggleWrap.querySelector('.toggle-label').style.color = '';
    }
  }

  toggle.addEventListener('change', function () {
    var isClear = toggle.checked;
    card.classList.toggle('clear-screen-hidden', isClear);
    timeCard.classList.toggle('clear-screen-hidden', isClear);
    if (fortuneBox) fortuneBox.classList.toggle('clear-screen-hidden', isClear);
    var teaWheel = document.getElementById('teaWheelCard');
    if (teaWheel) teaWheel.classList.toggle('clear-screen-hidden', isClear);
    var socialBtns = document.querySelector('.social-btns-row');
    if (socialBtns) socialBtns.classList.toggle('clear-screen-hidden', isClear);
    updateWrapStyle(isClear);
    if (isClear) {
      var dd = document.getElementById('playlistDropdown');
      if (dd && dd.classList.contains('open')) dd.classList.remove('open');
    }
  });
})();
