/**
 * Timer Controller
 * Handles game room countdowns and daily leaderboard timer
 */
(function() {
  'use strict';

  // ===== Game Room Countdown Pills =====
  function initRoomTimers() {
    const countdownPills = document.querySelectorAll('.countdown-pill[data-seconds]');

    countdownPills.forEach(pill => {
      let seconds = parseInt(pill.dataset.seconds, 10);
      const timerNum = pill.querySelector('.timer-num');

      function updatePill() {
        let text = '0:00';
        if (seconds > 0) {
          const min = Math.floor(seconds / 60);
          const sec = seconds % 60;
          text = min + ':' + sec.toString().padStart(2, '0');
          seconds--;
        }

        if (timerNum) {
          timerNum.textContent = text;
        } else {
          pill.textContent = text;
        }
      }

      updatePill();
      setInterval(updatePill, 1000);
    });
  }

  // ===== Daily Leaderboard Timer =====
  function initDailyTimer() {
    const hoursEl = document.getElementById('timer-hours');
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');

    if (!hoursEl || !minutesEl || !secondsEl) return;

    let totalSeconds =
      parseInt(hoursEl.textContent, 10) * 3600 +
      parseInt(minutesEl.textContent, 10) * 60 +
      parseInt(secondsEl.textContent, 10);

    function updateTimer() {
      if (totalSeconds <= 0) {
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }

      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      hoursEl.textContent = h.toString().padStart(2, '0');
      minutesEl.textContent = m.toString().padStart(2, '0');
      secondsEl.textContent = s.toString().padStart(2, '0');

      totalSeconds--;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // Initialize all timers
  document.addEventListener('DOMContentLoaded', function() {
    initRoomTimers();
    initDailyTimer();
  });
})();
