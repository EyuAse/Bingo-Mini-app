/**
 * Navigation Controller
 * Handles bottom nav tab switching and page routing
 */
(function() {
  'use strict';

  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  function switchPage(targetPage) {
    // Update pages
    pages.forEach(page => {
      page.classList.remove('active');
    });

    const target = document.getElementById('page-' + targetPage);
    if (target) {
      target.classList.add('active');
    }

    const bottomNav = document.getElementById('bottom-nav');
    const topHeader = document.querySelector('.app-container > .top-header');
    const balanceBar = document.querySelector('.balance-bar');

    if (targetPage === 'landing' || targetPage === 'login' || targetPage === 'bingo') {
      if (bottomNav) bottomNav.style.display = 'none';
      if (topHeader && targetPage !== 'bingo') topHeader.style.display = 'none';
      if (balanceBar) balanceBar.style.display = 'none';
    } else {
      if (bottomNav) bottomNav.style.display = '';
      if (topHeader) topHeader.style.display = '';
      if (balanceBar) balanceBar.style.display = '';
    }

    // Update nav items
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === targetPage) {
        item.classList.add('active');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Attach click handlers
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const page = this.dataset.page;
      if (page) {
        switchPage(page);
      }
    });
  });

  // Export for external use
  window.switchPage = switchPage;
})();
