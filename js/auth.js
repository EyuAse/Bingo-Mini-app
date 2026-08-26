/**
 * Authentication & Landing Page Controller
 * Manages transitions between Landing Screen, Login Screen, Sign Up Screen, and Main Games Dashboard
 */
(function() {
  'use strict';

  // Navigation helpers
  function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const bottomNav = document.getElementById('bottom-nav');
    const topHeader = document.querySelector('.app-container > .top-header');
    const balanceBar = document.querySelector('.balance-bar');

    if (pageId === 'page-landing' || pageId === 'page-login' || pageId === 'page-signup' || pageId === 'page-bingo') {
      if (bottomNav) bottomNav.style.display = 'none';
      if (topHeader && pageId !== 'page-bingo') topHeader.style.display = 'none';
      if (balanceBar) balanceBar.style.display = 'none';
    } else {
      if (bottomNav) bottomNav.style.display = '';
      if (topHeader) topHeader.style.display = '';
      if (balanceBar) balanceBar.style.display = '';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 1. Join Now buttons -> Navigate to Sign Up
  const joinBtns = document.querySelectorAll('#landing-join-btn, #nav-join-btn, #goto-signup-btn');
  joinBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('page-signup');
    });
  });

  // 2. Login buttons -> Navigate to Login
  const loginBtns = document.querySelectorAll('#nav-login-btn, #goto-login-btn');
  loginBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('page-login');
    });
  });

  // 3. Back buttons
  const loginBackBtn = document.getElementById('login-back-btn');
  if (loginBackBtn) {
    loginBackBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('page-landing');
    });
  }

  const signupBackBtn = document.getElementById('signup-back-btn');
  if (signupBackBtn) {
    signupBackBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('page-landing');
    });
  }

  // 4. Form submissions -> Enter main dashboard
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showPage('page-games');
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showPage('page-games');
    });
  }

  const socialBtns = document.querySelectorAll('.social-btn');
  socialBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('page-games');
    });
  });

  // 5. Password visibility toggles
  function setupPwdToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (toggle && input) {
      toggle.addEventListener('click', function() {
        if (input.type === 'password') {
          input.type = 'text';
          toggle.classList.remove('fa-eye');
          toggle.classList.add('fa-eye-slash');
          toggle.style.color = '#ec4899';
        } else {
          input.type = 'password';
          toggle.classList.remove('fa-eye-slash');
          toggle.classList.add('fa-eye');
          toggle.style.color = '';
        }
      });
    }
  }

  setupPwdToggle('pwd-toggle', 'login-password');
  setupPwdToggle('signup-pwd-toggle', 'signup-password');

  // 6. Checkbox toggles
  const rememberRow = document.getElementById('remember-row');
  const rememberCheckbox = document.getElementById('remember-checkbox');
  if (rememberRow && rememberCheckbox) {
    rememberRow.addEventListener('click', function() {
      rememberCheckbox.classList.toggle('unchecked');
    });
  }

  const termsRow = document.getElementById('signup-terms-row');
  const termsCheckbox = document.getElementById('terms-checkbox');
  if (termsRow && termsCheckbox) {
    termsRow.addEventListener('click', function(e) {
      if (e.target.tagName !== 'A') {
        termsCheckbox.classList.toggle('unchecked');
      }
    });
  }

  // 7. Country Code Dropdown Picker
  const countryPicker = document.getElementById('country-code-picker');
  const countryDropdown = document.getElementById('country-dropdown');
  const selectedFlag = document.getElementById('selected-flag');
  const selectedDialCode = document.getElementById('selected-dial-code');
  const phoneInput = document.getElementById('signup-phone');

  if (countryPicker && countryDropdown) {
    countryPicker.addEventListener('click', function(e) {
      e.stopPropagation();
      countryDropdown.classList.toggle('active');
    });

    const options = countryDropdown.querySelectorAll('.country-option');
    options.forEach(opt => {
      opt.addEventListener('click', function(e) {
        e.stopPropagation();
        const flag = this.dataset.flag;
        const code = this.dataset.code;

        if (selectedFlag) selectedFlag.textContent = flag;
        if (selectedDialCode) selectedDialCode.textContent = code;
        if (phoneInput) {
          if (code === '+44') phoneInput.placeholder = '7123 456789';
          else if (code === '+251') phoneInput.placeholder = '911 234567';
          else if (code === '+254') phoneInput.placeholder = '712 345678';
          else if (code === '+234') phoneInput.placeholder = '801 234 5678';
          else phoneInput.placeholder = '555 123-4567';
          phoneInput.focus();
        }

        countryDropdown.classList.remove('active');
      });
    });

    document.addEventListener('click', function(e) {
      if (!countryPicker.contains(e.target)) {
        countryDropdown.classList.remove('active');
      }
    });
  }

  // 8. Close button in top header -> can go back to landing page
  const closeBtn = document.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      showPage('page-landing');
    });
  }

  // Initialize: if on initial load and landing is active, ensure headers/navs are hidden
  document.addEventListener('DOMContentLoaded', function() {
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'page-landing') {
      showPage('page-landing');
    }
  });

  // Expose globally
  window.showPage = showPage;

})();
