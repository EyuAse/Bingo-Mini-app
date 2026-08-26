/**
 * World Bingo - 75-Ball Interactive Game Engine with Betting & Live Players
 * Features:
 * - Real Betting & Card Purchase System (10, 20, 50, 100 ETB + card quantity selector)
 * - Wallet Balance deduction on ticket buy & live payout upon BINGO win
 * - Pre-Round Lobby Countdown (8s ticket buy-in phase)
 * - Live Competing Room Opponents Simulation with dynamic "N to go" / "1 TO GO! 🔥" status
 * - Standard 75-Ball 5x5 Card Generator (B:1-15, I:16-30, N:31-45, G:46-60, O:61-75)
 * - Automated Caller Engine with 3D sphere pop & Speech Synthesis Voice Announcement
 * - Auto-Mark Toggle & Lucky Pick Power-Up mechanics
 * - Web Audio Sound Synthesizer (Ball roll, Daub, Chime, Fanfare)
 * - Canvas Confetti Celebration
 */
(function() {
  'use strict';

  // ===== AUDIO SYNTHESIZER (No external audio files needed) =====
  const AudioEngine = {
    ctx: null,

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playPop() {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (e) {}
    },

    playDaub() {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.06); // E5
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      } catch (e) {}
    },

    playLuckyPick() {
      try {
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const t = this.ctx.currentTime + (i * 0.06);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        });
      } catch (e) {}
    },

    playWinFanfare() {
      try {
        this.init();
        if (!this.ctx) return;
        const chords = [
          { f: [523.25, 659.25, 783.99], t: 0 },       // C maj
          { f: [587.33, 739.99, 880.00], t: 0.18 },    // D maj
          { f: [659.25, 830.61, 987.77], t: 0.36 },    // E maj
          { f: [1046.50, 1318.51, 1567.98], t: 0.58 } // High C maj
        ];

        chords.forEach(chord => {
          chord.f.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const startTime = this.ctx.currentTime + chord.t;
            gain.gain.setValueAtTime(0.18, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.6);
          });
        });
      } catch (e) {}
    },

    speak(text) {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    }
  };

  // ===== BINGO GAME & BETTING CONTROLLER =====
  const BingoGame = {
    // Betting State
    betAmount: 20,           // Selected bet per card in ETB
    cardQuantity: 1,         // Number of cards (1 or 2)
    hasTicketForRound: false,// Whether user purchased a ticket for active round
    lobbyCountdown: 8,       // Seconds before next round begins
    lobbyInterval: null,

    // Game Core State
    cardData: [],            // Array of 25 cell objects
    drawPool: [],            // Remaining numbers in [1..75]
    calledNumbers: [],       // Numbers drawn in order
    currentCall: null,       // { col: 'N', num: 32 }
    autoMark: true,          // Auto daub toggle
    luckyPicks: 3,           // Power-up counter
    gameActive: false,       // Is caller loop actively running
    callerInterval: null,    // Timer ID
    callSpeed: 3500,         // Interval ms between calls
    playersCount: 173,       // Active players in room
    prizePool: 3287,         // Dynamic prize pool in ETB

    // Live Simulated Room Opponents
    opponents: [
      { name: 'Abebe_K', avatar: 'av-purple', initials: 'AK', cards: 2, marksNeeded: 4, status: '4 to go' },
      { name: 'Sara_B', avatar: 'av-green', initials: 'SB', cards: 1, marksNeeded: 5, status: '5 to go' },
      { name: 'Dawit_M', avatar: 'av-orange', initials: 'DM', cards: 3, marksNeeded: 3, status: '3 to go' },
      { name: 'Aster_T', avatar: 'av-blue', initials: 'AT', cards: 1, marksNeeded: 4, status: '4 to go' },
      { name: 'Chala_G', avatar: 'av-pink', initials: 'CG', cards: 2, marksNeeded: 5, status: '5 to go' }
    ],

    // Patterns definition (indices 0-24)
    patterns: {
      'Diagonal': [
        [0, 6, 12, 18, 24], // Main diagonal
        [4, 8, 12, 16, 20]  // Anti diagonal
      ]
    },
    activePatternKey: 'Diagonal',

    init() {
      this.bindDOM();
      this.setupFluctuatingPlayers();
      this.updatePrizePool();
      this.renderOpponentsDOM();
    },

    bindDOM() {
      // Cell Click Event
      const grid = document.getElementById('bingo-grid');
      if (grid) {
        grid.addEventListener('click', (e) => {
          const cell = e.target.closest('.bingo-cell');
          if (!cell) return;
          const idx = parseInt(cell.dataset.index);
          this.handleManualDaub(idx);
        });
      }

      // Bet Chip Selection
      const chips = document.querySelectorAll('.bet-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.betAmount = parseInt(chip.dataset.bet) || 20;
          this.updateBetDisplays();
        });
      });

      // Quantity Stepper
      const btnMinus = document.getElementById('qty-minus');
      const btnPlus = document.getElementById('qty-plus');
      const qtyVal = document.getElementById('qty-val');

      if (btnMinus && btnPlus && qtyVal) {
        btnMinus.addEventListener('click', () => {
          if (this.cardQuantity > 1) {
            this.cardQuantity--;
            qtyVal.textContent = this.cardQuantity;
            this.updateBetDisplays();
          }
        });

        btnPlus.addEventListener('click', () => {
          if (this.cardQuantity < 3) {
            this.cardQuantity++;
            qtyVal.textContent = this.cardQuantity;
            this.updateBetDisplays();
          }
        });
      }

      // Buy Ticket Button Click
      const buyBtn = document.getElementById('btn-buy-ticket');
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          this.handleBuyTicket();
        });
      }

      // Auto Mark Toggle
      const autoMarkBtn = document.getElementById('auto-mark-btn');
      if (autoMarkBtn) {
        if (this.autoMark) autoMarkBtn.classList.add('active');
        autoMarkBtn.addEventListener('click', () => {
          this.autoMark = !this.autoMark;
          autoMarkBtn.classList.toggle('active', this.autoMark);
          this.showToast(this.autoMark ? '⚡ Auto Mark Enabled' : 'Auto Mark Disabled');
          if (this.autoMark) {
            this.daubAllEligible();
          }
        });
      }

      // Lucky Pick Power-Up
      const luckyBtn = document.getElementById('lucky-pick-btn');
      if (luckyBtn) {
        luckyBtn.addEventListener('click', () => {
          this.useLuckyPick();
        });
      }

      // BINGO! Button Click
      const bingoBtn = document.getElementById('bingo-call-btn');
      if (bingoBtn) {
        bingoBtn.addEventListener('click', () => {
          this.claimBingo();
        });
      }

      // Back Button
      const backBtn = document.getElementById('bingo-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.stopRound();
          this.closeBingoScreen();
        });
      }

      // Copy Game ID
      const copyBtn = document.getElementById('copy-game-id');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText('WB-78562').catch(() => {});
          copyBtn.classList.remove('fa-copy');
          copyBtn.classList.add('fa-check');
          this.showToast('📋 Game ID Copied: #WB-78562');
          setTimeout(() => {
            copyBtn.classList.remove('fa-check');
            copyBtn.classList.add('fa-copy');
          }, 1500);
        });
      }

      // Win Modal Play Next Round
      const winCollectBtn = document.getElementById('win-collect-btn');
      if (winCollectBtn) {
        winCollectBtn.addEventListener('click', () => {
          const modal = document.getElementById('bingo-win-modal');
          if (modal) modal.classList.remove('active');
          Confetti.stop();
          this.startLobbyCountdown();
        });
      }

      // View All History
      const moreBtn = document.getElementById('view-all-called-btn');
      if (moreBtn) {
        moreBtn.addEventListener('click', () => {
          const count = this.calledNumbers.length;
          this.showToast(`Total Calls: ${count} / 75 numbers`);
        });
      }
    },

    // ===== BETTING & WALLET SYSTEM =====
    updateBetDisplays() {
      const total = this.betAmount * this.cardQuantity;
      const totalDisplay = document.getElementById('total-bet-display');
      if (totalDisplay) totalDisplay.textContent = `${total} ETB`;
      this.updatePrizePool();
    },

    updatePrizePool() {
      // Prize pool based on players & bet amount
      this.prizePool = Math.round(this.playersCount * this.betAmount * 0.95);

      const topPool = document.getElementById('bingo-prize-pool');
      const livePool = document.getElementById('live-pool-display');

      if (topPool) topPool.textContent = this.prizePool.toLocaleString();
      if (livePool) livePool.textContent = `${this.prizePool.toLocaleString()} ETB`;
    },

    handleBuyTicket() {
      const totalCost = this.betAmount * this.cardQuantity;
      let userBalance = parseFloat(localStorage.getItem('betika_user_balance') || '250.00');

      if (userBalance < totalCost) {
        this.showToast('❌ Insufficient balance! Please deposit to continue.');
        return;
      }

      // Deduct bet from wallet
      userBalance -= totalCost;
      localStorage.setItem('betika_user_balance', userBalance.toFixed(2));
      if (typeof window.addWalletBalance === 'function') {
        window.addWalletBalance(0); // Trigger balance display refresh
      }

      this.hasTicketForRound = true;
      AudioEngine.playLuckyPick();
      this.showToast(`🎟️ Ticket Purchased for ${totalCost} ETB!`);

      const buyBtn = document.getElementById('btn-buy-ticket');
      if (buyBtn) {
        buyBtn.classList.add('bought');
        buyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Ticket Ready &bull; ${totalCost} ETB</span>`;
      }
    },

    // ===== PRE-ROUND LOBBY COUNTDOWN =====
    startLobbyCountdown() {
      this.stopRound();
      this.hasTicketForRound = false;
      this.lobbyCountdown = 8;

      const buyBtn = document.getElementById('btn-buy-ticket');
      if (buyBtn) {
        buyBtn.classList.remove('bought');
        const total = this.betAmount * this.cardQuantity;
        buyBtn.innerHTML = `<i class="fa-solid fa-ticket"></i> <span>Buy Ticket &bull; <strong id="total-bet-display">${total} ETB</strong></span>`;
      }

      const timerEl = document.getElementById('lobby-timer');
      if (timerEl) timerEl.textContent = `00:0${this.lobbyCountdown}`;

      clearInterval(this.lobbyInterval);
      this.lobbyInterval = setInterval(() => {
        this.lobbyCountdown--;
        if (timerEl) timerEl.textContent = `00:0${Math.max(0, this.lobbyCountdown)}`;

        if (this.lobbyCountdown <= 0) {
          clearInterval(this.lobbyInterval);
          this.startNewRound();
        }
      }, 1000);
    },

    // ===== 75-BALL CARD GENERATOR =====
    generateCard() {
      const getUniqueRandoms = (min, max, count) => {
        const pool = [];
        for (let i = min; i <= max; i++) pool.push(i);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, count);
      };

      const bNums = getUniqueRandoms(1, 15, 5);
      const iNums = getUniqueRandoms(16, 30, 5);
      const nNums = getUniqueRandoms(31, 45, 4); // 4 + 1 FREE
      const gNums = getUniqueRandoms(46, 60, 5);
      const oNums = getUniqueRandoms(61, 75, 5);

      this.cardData = [];

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const idx = row * 5 + col;
          let val, colLetter, isFree = false;

          if (col === 0) {
            val = bNums[row];
            colLetter = 'B';
          } else if (col === 1) {
            val = iNums[row];
            colLetter = 'I';
          } else if (col === 2) {
            if (row === 2) {
              val = 'FREE';
              colLetter = 'N';
              isFree = true;
            } else {
              const nIdx = row > 2 ? row - 1 : row;
              val = nNums[nIdx];
              colLetter = 'N';
            }
          } else if (col === 3) {
            val = gNums[row];
            colLetter = 'G';
          } else {
            val = oNums[row];
            colLetter = 'O';
          }

          this.cardData.push({
            index: idx,
            row,
            col,
            colLetter,
            val,
            isFree,
            marked: isFree
          });
        }
      }

      this.renderCardDOM();
    },

    renderCardDOM() {
      const grid = document.getElementById('bingo-grid');
      if (!grid) return;

      grid.innerHTML = '';
      this.cardData.forEach(cell => {
        const div = document.createElement('div');
        div.className = `bingo-cell ${cell.marked ? 'marked' : 'unmarked'} ${cell.isFree ? 'free-cell' : ''}`;
        div.dataset.index = cell.index;
        div.dataset.col = cell.colLetter;
        div.dataset.val = cell.val;

        if (cell.isFree) {
          div.innerHTML = `<span class="free-star">★</span><span class="free-text">★FREE★</span>`;
        } else if (cell.marked) {
          div.innerHTML = `<div class="token-star">★</div><span class="cell-num">${cell.val}</span>`;
        } else {
          div.innerHTML = `<span class="cell-num">${cell.val}</span>`;
        }

        grid.appendChild(div);
      });
    },

    // ===== CALLER ENGINE =====
    startNewRound() {
      this.stopRound();
      clearInterval(this.lobbyInterval);

      // Auto buy ticket if user hasn't pressed manually
      if (!this.hasTicketForRound) {
        this.handleBuyTicket();
      }

      // Reset Opponents
      this.resetOpponents();

      // Reset Draw Pool (1..75 shuffled)
      this.drawPool = [];
      for (let i = 1; i <= 75; i++) this.drawPool.push(i);
      for (let i = this.drawPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.drawPool[i], this.drawPool[j]] = [this.drawPool[j], this.drawPool[i]];
      }

      this.calledNumbers = [];
      this.currentCall = null;
      this.gameActive = true;
      this.luckyPicks = 3;

      // Update Lucky pick badge
      const lpCount = document.getElementById('lucky-pick-count');
      if (lpCount) lpCount.textContent = this.luckyPicks;

      // Reset BINGO button glow
      const bingoBtn = document.getElementById('bingo-call-btn');
      if (bingoBtn) bingoBtn.classList.remove('can-win');

      // Generate Card
      this.generateCard();

      // Clear called list DOM
      const calledGrid = document.getElementById('called-numbers-grid');
      if (calledGrid) calledGrid.innerHTML = '';

      // Draw first ball immediately, then every 3.5s
      this.drawNextBall();
      this.callerInterval = setInterval(() => {
        if (this.gameActive) {
          this.drawNextBall();
        }
      }, this.callSpeed);
    },

    stopRound() {
      this.gameActive = false;
      if (this.callerInterval) {
        clearInterval(this.callerInterval);
        this.callerInterval = null;
      }
    },

    getLetterForNumber(num) {
      if (num <= 15) return 'B';
      if (num <= 30) return 'I';
      if (num <= 45) return 'N';
      if (num <= 60) return 'G';
      return 'O';
    },

    drawNextBall() {
      if (this.drawPool.length === 0) {
        this.stopRound();
        this.showToast('Game Over! All 75 numbers called.');
        return;
      }

      const num = this.drawPool.pop();
      const col = this.getLetterForNumber(num);
      this.currentCall = { num, col };
      this.calledNumbers.push(num);

      // 1. Update NEXT CALL Sphere UI with 3D Pop
      const sphere = document.getElementById('next-call-sphere');
      const numDisplay = document.getElementById('next-call-num');
      const labelDisplay = document.getElementById('next-call-label');

      if (numDisplay) numDisplay.textContent = num;
      if (labelDisplay) labelDisplay.textContent = `${col} ${num}`;

      if (sphere) {
        sphere.classList.add('pop-anim');
        setTimeout(() => sphere.classList.remove('pop-anim'), 300);
      }

      AudioEngine.playPop();
      AudioEngine.speak(`${col} ${num}`);

      // 2. Prepend to CALLED NUMBERS Grid
      this.renderCalledNumbersDOM();

      // 3. Auto Mark if enabled
      if (this.autoMark) {
        setTimeout(() => {
          this.daubNumber(num, true);
        }, 400);
      }

      // 4. Update Opponents Progress
      this.updateOpponentsProgress();

      // 5. Evaluate Win Progress
      this.checkPatternProgress();
    },

    renderCalledNumbersDOM() {
      const grid = document.getElementById('called-numbers-grid');
      if (!grid) return;

      const recentCalls = this.calledNumbers.slice(-9).reverse();
      grid.innerHTML = '';

      recentCalls.forEach((num, idx) => {
        const col = this.getLetterForNumber(num);
        const div = document.createElement('div');
        div.className = `called-num col-${col.toLowerCase()} ${idx === 0 ? 'active-called' : ''}`;
        div.innerHTML = `<span class="cn-letter">${col}</span><span class="cn-number">${num}</span>`;
        grid.appendChild(div);
      });
    },

    // ===== LIVE COMPETING OPPONENTS SIMULATION =====
    resetOpponents() {
      this.opponents = [
        { name: 'Abebe_K', avatar: 'av-purple', initials: 'AK', cards: 2, marksNeeded: 4, status: '4 to go' },
        { name: 'Sara_B', avatar: 'av-green', initials: 'SB', cards: 1, marksNeeded: 5, status: '5 to go' },
        { name: 'Dawit_M', avatar: 'av-orange', initials: 'DM', cards: 3, marksNeeded: 4, status: '4 to go' },
        { name: 'Aster_T', avatar: 'av-blue', initials: 'AT', cards: 1, marksNeeded: 5, status: '5 to go' },
        { name: 'Chala_G', avatar: 'av-pink', initials: 'CG', cards: 2, marksNeeded: 4, status: '4 to go' }
      ];
      this.renderOpponentsDOM();
    },

    updateOpponentsProgress() {
      // Randomly advance an opponent
      if (Math.random() < 0.45) {
        const opp = this.opponents[Math.floor(Math.random() * this.opponents.length)];
        if (opp.marksNeeded > 1) {
          opp.marksNeeded--;
          if (opp.marksNeeded === 1) {
            opp.status = '1 TO GO! 🔥';
          } else if (opp.marksNeeded === 2) {
            opp.status = '2 to go';
          } else {
            opp.status = `${opp.marksNeeded} to go`;
          }
          this.renderOpponentsDOM();
        }
      }
    },

    renderOpponentsDOM() {
      const feed = document.getElementById('live-players-feed');
      if (!feed) return;

      feed.innerHTML = '';
      this.opponents.forEach(opp => {
        const isHot = opp.marksNeeded === 1;
        const isClose = opp.marksNeeded === 2;
        const card = document.createElement('div');
        card.className = `opponent-card ${isHot ? 'one-to-go' : ''}`;

        card.innerHTML = `
          <div class="opponent-left">
            <div class="opponent-avatar ${opp.avatar}">${opp.initials}</div>
            <div class="opponent-info">
              <span class="opponent-name">${opp.name}</span>
              <span class="opponent-cards-count">${opp.cards} card${opp.cards > 1 ? 's' : ''}</span>
            </div>
          </div>
          <span class="opponent-status ${isHot ? 'status-hot' : isClose ? 'status-close' : ''}">
            ${opp.status}
          </span>
        `;
        feed.appendChild(card);
      });
    },

    // ===== DAUBING MECHANICS =====
    handleManualDaub(idx) {
      const cell = this.cardData[idx];
      if (!cell || cell.isFree) return;

      if (cell.marked) {
        cell.marked = false;
        this.updateCellDOM(idx, false);
      } else {
        if (this.calledNumbers.includes(cell.val)) {
          cell.marked = true;
          this.updateCellDOM(idx, true);
          AudioEngine.playDaub();
          this.checkPatternProgress();
        } else {
          this.showToast(`⚠️ ${cell.colLetter}-${cell.val} has not been called yet!`);
        }
      }
    },

    daubNumber(num, isAuto = false) {
      const match = this.cardData.find(c => c.val === num);
      if (match && !match.marked) {
        match.marked = true;
        this.updateCellDOM(match.index, true);
        if (isAuto) AudioEngine.playDaub();
        this.checkPatternProgress();
      }
    },

    daubAllEligible() {
      this.cardData.forEach(c => {
        if (!c.marked && !c.isFree && this.calledNumbers.includes(c.val)) {
          c.marked = true;
          this.updateCellDOM(c.index, true);
        }
      });
      this.checkPatternProgress();
    },

    updateCellDOM(idx, isMarked) {
      const cellEl = document.querySelector(`.bingo-cell[data-index="${idx}"]`);
      if (!cellEl) return;

      const cell = this.cardData[idx];
      if (isMarked) {
        cellEl.classList.remove('unmarked');
        cellEl.classList.add('marked');
        cellEl.innerHTML = `<div class="token-star">★</div><span class="cell-num">${cell.val}</span>`;
        cellEl.style.transform = 'scale(1.2)';
        setTimeout(() => { cellEl.style.transform = ''; }, 200);
      } else {
        cellEl.classList.remove('marked');
        cellEl.classList.add('unmarked');
        cellEl.innerHTML = `<span class="cell-num">${cell.val}</span>`;
      }
    },

    // ===== LUCKY PICK POWER-UP =====
    useLuckyPick() {
      if (this.luckyPicks <= 0) {
        this.showToast('❌ No Lucky Picks remaining this round!');
        return;
      }

      const uncalledCells = this.cardData.filter(c => !c.marked && !c.isFree);
      if (uncalledCells.length === 0) {
        this.showToast('🎉 All numbers already marked!');
        return;
      }

      this.luckyPicks--;
      const lpCount = document.getElementById('lucky-pick-count');
      if (lpCount) lpCount.textContent = this.luckyPicks;

      const targetCell = uncalledCells[Math.floor(Math.random() * uncalledCells.length)];
      
      if (!this.calledNumbers.includes(targetCell.val)) {
        this.calledNumbers.push(targetCell.val);
        const poolIdx = this.drawPool.indexOf(targetCell.val);
        if (poolIdx > -1) this.drawPool.splice(poolIdx, 1);
      }

      targetCell.marked = true;
      this.updateCellDOM(targetCell.index, true);
      AudioEngine.playLuckyPick();
      this.showToast(`🪄 Lucky Pick marked ${targetCell.colLetter} ${targetCell.val}!`);
      this.checkPatternProgress();
    },

    // ===== PATTERN VALIDATION & WIN CLAIM =====
    checkPatternProgress() {
      const activeLines = this.patterns[this.activePatternKey] || this.patterns['Diagonal'];
      let maxMarked = 0;
      let winningLine = null;

      activeLines.forEach(line => {
        const markedCount = line.filter(idx => this.cardData[idx]?.marked).length;
        if (markedCount > maxMarked) {
          maxMarked = markedCount;
        }
        if (markedCount === line.length) {
          winningLine = line;
        }
      });

      const bingoBtn = document.getElementById('bingo-call-btn');
      if (winningLine) {
        if (bingoBtn) bingoBtn.classList.add('can-win');
      } else if (maxMarked === activeLines[0].length - 1) {
        if (bingoBtn) bingoBtn.classList.add('can-win');
      } else {
        if (bingoBtn) bingoBtn.classList.remove('can-win');
      }

      return winningLine;
    },

    claimBingo() {
      const winningLine = this.checkPatternProgress();

      if (winningLine) {
        // WIN CONFIRMED!
        this.stopRound();
        AudioEngine.playWinFanfare();

        // Highlight winning cells
        winningLine.forEach(idx => {
          const el = document.querySelector(`.bingo-cell[data-index="${idx}"]`);
          if (el) el.classList.add('winning-cell');
        });

        // Launch Confetti
        Confetti.start();

        // Show Modal
        const modal = document.getElementById('bingo-win-modal');
        const prizeDisplay = document.getElementById('modal-prize-amount');
        if (prizeDisplay) prizeDisplay.textContent = `+${this.prizePool.toLocaleString()} ETB`;
        if (modal) modal.classList.add('active');

        // Increment wallet balance in app
        if (typeof window.addWalletBalance === 'function') {
          window.addWalletBalance(this.prizePool);
        }

      } else {
        // Bogus call
        AudioEngine.playPop();
        const btn = document.getElementById('bingo-call-btn');
        if (btn) {
          btn.style.animation = 'shake 0.4s ease';
          setTimeout(() => btn.style.animation = '', 400);
        }
        this.showToast('⚠️ Pattern not complete yet! Keep daubing!');
      }
    },

    showToast(msg) {
      const toast = document.getElementById('bingo-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('active');
      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
      }, 2500);
    },

    setupFluctuatingPlayers() {
      setInterval(() => {
        const delta = Math.floor(Math.random() * 5) - 2;
        this.playersCount = Math.max(160, Math.min(220, this.playersCount + delta));
        const pCount = document.getElementById('bingo-players-count');
        const headerCount = document.getElementById('live-players-header-count');
        if (pCount) pCount.textContent = this.playersCount;
        if (headerCount) headerCount.textContent = this.playersCount;
        this.updatePrizePool();
      }, 7000);
    },

    closeBingoScreen() {
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
    }
  };

  // ===== CANVAS CONFETTI ENGINE =====
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    start() {
      this.canvas = document.getElementById('bingo-confetti-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      this.particles = [];
      const colors = ['#f59e0b', '#ec4899', '#a855f7', '#3b82f6', '#10b981', '#ffffff', '#fbbf24'];

      for (let i = 0; i < 75; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height * 0.3 - 50,
          w: Math.random() * 10 + 6,
          h: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 + 3,
          rot: Math.random() * 360,
          vrot: Math.random() * 8 - 4
        });
      }

      this.loop();
    },

    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        if (p.y > this.canvas.height) {
          p.y = -20;
          p.x = Math.random() * this.canvas.width;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rot * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      });

      this.animId = requestAnimationFrame(() => this.loop());
    },

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // ===== GLOBAL LAUNCHER =====
  window.openBingoGame = function(roomType = '75-ball') {
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

    // Enter Pre-round Lobby Countdown
    BingoGame.startLobbyCountdown();
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BingoGame.init());
  } else {
    BingoGame.init();
  }

})();
