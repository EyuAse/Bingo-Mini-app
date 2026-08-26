/**
 * App Controller
 * Main application logic, tab switching, UI interactions
 */
(function() {
  'use strict';

  // ===== Tab Switcher (Quick / Event) =====
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ===== Balance Toggle (Eye Icon) =====
  const toggleBalance = document.getElementById('toggle-balance');
  const balanceText = document.querySelector('.balance-text');
  let balanceVisible = false;

  if (toggleBalance && balanceText) {
    toggleBalance.addEventListener('click', function() {
      balanceVisible = !balanceVisible;
      if (balanceVisible) {
        balanceText.textContent = '0.00 ETB';
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
      } else {
        balanceText.textContent = '•••• ETB';
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
      }
    });
  }

  // ===== Refresh Icon Spin =====
  const refreshIcon = document.getElementById('refresh-balance');
  if (refreshIcon) {
    refreshIcon.addEventListener('click', function() {
      this.style.transition = 'transform 0.5s ease';
      this.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        this.style.transition = 'none';
        this.style.transform = 'rotate(0deg)';
      }, 500);
    });
  }

  // ===== Ripple Effect on Buttons =====
  document.querySelectorAll('.deposit-btn, .action-btn, .promo-card').forEach(btn => {
    btn.addEventListener('click', function(e) {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });

  // ===== Game Room Buttons → Open Bingo Page =====
  document.querySelectorAll('.room-play-btn, .room-action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
        if (typeof window.openBingoGame === 'function') {
          window.openBingoGame();
        }
      }, 150);
    });
  });

  // ===== Header Menu Button → Return to Landing Screen =====
  const headerMenuBtn = document.getElementById('header-menu-btn');
  if (headerMenuBtn) {
    headerMenuBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof window.showPage === 'function') {
        window.showPage('page-landing');
      }
    });
  }

})();
