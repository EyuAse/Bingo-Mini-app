/**
 * Bingo Game Controller
 * Handles cell marking, navigation, chat, and game interactions
 */
(function() {
  'use strict';

  // ===== Cell Click (Mark/Unmark) =====
  const bingoGrid = document.getElementById('bingo-grid');
  if (bingoGrid) {
    bingoGrid.addEventListener('click', function(e) {
      const cell = e.target.closest('.bingo-cell');
      if (!cell || cell.classList.contains('free-cell')) return;

      if (cell.classList.contains('unmarked')) {
        cell.classList.remove('unmarked');
        cell.classList.add('marked');
        // Brief pop animation
        cell.style.transform = 'scale(1.15)';
        setTimeout(() => { cell.style.transform = ''; }, 150);
      } else if (cell.classList.contains('marked')) {
        cell.classList.remove('marked');
        cell.classList.add('unmarked');
      }
    });
  }

  // ===== Back Button =====
  const backBtn = document.getElementById('bingo-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      // Hide bingo page, show games page
      const bingoPage = document.getElementById('page-bingo');
      const gamesPage = document.getElementById('page-games');
      const bottomNav = document.getElementById('bottom-nav');
      const topHeader = document.querySelector('.app-container > .top-header');
      const balanceBar = document.querySelector('.balance-bar');

      if (bingoPage) bingoPage.classList.remove('active');
      if (gamesPage) gamesPage.classList.add('active');
      if (bottomNav) bottomNav.style.display = '';
      if (topHeader) topHeader.style.display = '';
      if (balanceBar) balanceBar.style.display = '';

      window.scrollTo({ top: 0 });
    });
  }

  // ===== BINGO! Button Animation =====
  const bingoCallBtn = document.getElementById('bingo-call-btn');
  if (bingoCallBtn) {
    bingoCallBtn.addEventListener('click', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.6)';
      setTimeout(() => {
        this.style.transform = '';
        this.style.boxShadow = '';
      }, 300);
    });
  }

  // ===== Copy Game ID =====
  const copyBtn = document.getElementById('copy-game-id');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText('WB-78562').catch(() => {});
      this.classList.remove('fa-copy');
      this.classList.add('fa-check');
      setTimeout(() => {
        this.classList.remove('fa-check');
        this.classList.add('fa-copy');
      }, 1500);
    });
  }

  // ===== Bingo Game Countdown =====
  const bingoMin = document.getElementById('bingo-min');
  const bingoSec = document.getElementById('bingo-sec');
  const bingoProgress = document.getElementById('bingo-progress');

  if (bingoMin && bingoSec) {
    let totalSec = parseInt(bingoMin.textContent) * 60 + parseInt(bingoSec.textContent);
    const initialSec = totalSec;

    function updateBingoTimer() {
      if (totalSec <= 0) {
        bingoMin.textContent = '00';
        bingoSec.textContent = '00';
        if (bingoProgress) bingoProgress.style.width = '0%';
        return;
      }

      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      bingoMin.textContent = m.toString().padStart(2, '0');
      bingoSec.textContent = s.toString().padStart(2, '0');

      if (bingoProgress) {
        bingoProgress.style.width = ((totalSec / initialSec) * 100) + '%';
      }

      totalSec--;
    }

    updateBingoTimer();
    setInterval(updateBingoTimer, 1000);
  }

  // ===== Navigate to Bingo Page (from game room buttons) =====
  window.openBingoGame = function() {
    const pages = document.querySelectorAll('.page');
    const bingoPage = document.getElementById('page-bingo');
    const bottomNav = document.getElementById('bottom-nav');
    const topHeader = document.querySelector('.app-container > .top-header');
    const balanceBar = document.querySelector('.balance-bar');

    pages.forEach(p => p.classList.remove('active'));
    if (bingoPage) bingoPage.classList.add('active');
    if (bottomNav) bottomNav.style.display = 'none';
    if (topHeader) topHeader.style.display = 'none';
    if (balanceBar) balanceBar.style.display = 'none';

    window.scrollTo({ top: 0 });
  };

})();
