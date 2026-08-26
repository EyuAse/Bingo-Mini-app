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

  // ===== Balance State & Dynamic Wallet Manager =====
  let currentBalance = parseFloat(localStorage.getItem('betika_user_balance') || '250.00');
  const toggleBalance = document.getElementById('toggle-balance');
  const balanceText = document.querySelector('.balance-text');
  let balanceVisible = false;

  function updateBalanceDisplay() {
    if (balanceText) {
      if (balanceVisible) {
        balanceText.textContent = `${currentBalance.toFixed(2)} ETB`;
      } else {
        balanceText.textContent = '•••• ETB';
      }
    }
  }

  if (toggleBalance && balanceText) {
    toggleBalance.addEventListener('click', function() {
      balanceVisible = !balanceVisible;
      if (balanceVisible) {
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
      } else {
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
      }
      updateBalanceDisplay();
    });
  }

  window.addWalletBalance = function(amount) {
    currentBalance += parseFloat(amount || 0);
    localStorage.setItem('betika_user_balance', currentBalance.toFixed(2));
    updateBalanceDisplay();
  };

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
