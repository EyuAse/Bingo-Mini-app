# Implementation Plan: Night Zero-Bot "Waiting for Players" Guard (01:00 AM – 06:00 AM)

## 📌 User Insight & Confirmation

> **User Observation**:
> *"Yesterday after 7:00 ሌሊት (01:00 AM) up to 12:00 ንጋት (06:00 AM), there are 0 bots, but the bingo keeps playing empty rounds. It shouldn't play until real users bet (at least 2 real players), otherwise it must say 'Waiting for players'. Am I correct?"*

### 🎯 Verdict: You are 100% CORRECT!
Under standard casino and bingo gaming rules:
1. When bots are sleeping (0 bots), the game **must NEVER play empty phantom rounds** by itself.
2. If there are 0 or 1 real human players, Room 10 **must display "Waiting for players"** and keep the 45-second countdown paused.
3. Because there are no bots to play against, a game can only start if **at least 2 real players bet** (`distinctRealPlayers >= 2`), exactly like Rooms 20, 50, and 100.
4. Once 2 or more real human players bet, the 45-second countdown unlocks and they play a fair, real human P2P bingo game!

---

## 🔍 Root Cause Analysis (Why Empty Rounds Were Playing)

In [`BingoGameEngine.ts`](file:///c:/Users/asefa/Desktop/lomi-bingo/server/game/BingoGameEngine.ts):
1. **Lobby Timer Loop (`startMasterLobbyTimer`)**:
   `isRoom10Autonomous` was defined as:
   ```ts
   // Previously: Only checked livingClock and mode !== 'disabled'
   const isRoom10Autonomous = Boolean(
     room10 &&
     this.botConfig.livingClock &&
     this.botConfig.mode !== 'disabled' &&
     !isEcoSleeping
   );
   ```
   It did **NOT** check if the scheduled bots count was 0! So even though `getRoom10HourlyBounds()` set bots to 0, the engine still thought Room 10 was autonomous and ticked down 45... 44... 0.

2. **Round Start Gatekeeper (`startMasterRound`)**:
   ```ts
   // Previously: Considered Room 10 eligible to play even with 0 bots and 0 humans!
   const isEligibleForActivePlay = isRoom10
     ? (distinctRealPlayers >= 1 || (this.botConfig.livingClock && this.botConfig.mode !== 'disabled'))
     : distinctRealPlayers >= 2;
   ```
   Because `livingClock` was true, it started active 75-ball drawing for an empty room!

---

## 🛡️ The Solution: "Zero-Bot P2P Fallback"

When scheduled bots = 0 (between 01:00 AM and 06:00 AM EAT / ከ ሌሊቱ 7:00 እስከ ንጋቱ 12:00):
1. **Autonomy Disables Automatically**:
   `isRoom10Autonomous` evaluates to `false` when `room10.dynamicBotTarget === 0`.
2. **Waiting for Players Activated**:
   `room.waitingForPlayers` requires `distinctRealPlayers >= 2`.
   If 0 or 1 human player is in the lobby:
   - `waitingForPlayers = true`
   - `lobbyCountdown` is paused at **45 seconds**.
   - UI shows: **"ተጫዋቾችን በመጠበቅ ላይ... / Waiting for players..."**
3. **P2P Play Enabled**:
   If 2 or more real human players buy tickets at 03:00 AM, the countdown starts, and they play human vs human!
4. **Daytime Resumption (06:00 AM / 12:00 ንጋት)**:
   As soon as 06:00 AM arrives, scheduled bots rise to 10–15, autonomy automatically reactivates, and continuous gameplay resumes!

---

## 🕒 Behavior Comparison Table

| Time Window | Bot Range | 0 Real Players | 1 Real Player | 2+ Real Players |
| :--- | :---: | :---: | :---: | :---: |
| **01:00 AM – 06:00 AM** (ከ ሌሊቱ 7:00 – ንጋቱ 12:00) | **0 bots** (Sleep) | ⏸️ **Waiting for players** (Paused at 45s, 0 empty rounds) | ⏸️ **Waiting for players** (Needs 1 more real opponent) | ▶️ **Active Round Plays!** (Human vs Human P2P) |
| **06:00 AM – 01:00 AM** (Daytime & Evening Peak) | **10 – 50 bots** | ▶️ **Autonomous Round** (Bots seed lobby) | ▶️ **Active Round** (Player plays vs bots) | ▶️ **Active Round** (Players & bots in pot) |

---

## 🔒 Non-Interference & Isolation Guarantee
- **Rooms 20, 50, 100**: 100% UNTOUCHED (already require $\ge 2$ players).
- **Game Engine & Ball Calling**: 100% UNTOUCHED (15–25 finish, 13 patterns).
- **UI & Frontend**: 100% UNTOUCHED (the UI already supports `waitingForPlayers`).
- **Wallets & Ledgers**: 100% UNTOUCHED.

---

## 📋 Phase-by-Phase Execution Plan

### 🔹 Phase 1: Update Room 10 Autonomy & Eligibility Conditions (`BingoGameEngine.ts`) [COMPLETED ✅]
- In `BingoGameEngine.ts`:
  - Updated `isRoom10Autonomous` in `startMasterLobbyTimer()` to check `hasBots = (room10.dynamicBotTarget ?? 0) > 0`.
  - Updated `room.waitingForPlayers` in `startMasterLobbyTimer()`, `handleJoinRoom()`, and `handleLeaveRoom()`.
  - Updated `isEligibleForActivePlay` in `startMasterRound()`.
- Verified compilation with `npx tsc --noEmit` (0 errors).

### 🔹 Phase 2: Create Automated Night Mode Verification Script (`test_night_zero_bot_waiting.ts`) [COMPLETED ✅]
- Simulated 03:00 AM (0 bots):
  - Verified with 0 real players: `waitingForPlayers === true`, timer stays at 45s, 0 empty rounds.
  - Verified with 1 real player: `waitingForPlayers === true`, lone player waits for opponent.
  - Verified with 2 real players: `waitingForPlayers === false`, countdown unlocks, P2P match plays!
- Simulated 08:00 PM (40–50 bots):
  - Verified autonomy works normally with bots as expected during daytime/peak.
- Simulated Rooms 20, 50, 100:
  - Verified strictly 0 bots and isolated from changes.
- All 6 tests passed with 100% success rate.

### 🔹 Phase 3: Subsystem Regression Checks [COMPLETED ✅]
- Ran `test_room10_hourly_schedule.ts`: All 24 hours verified, Markovian drift stable <= 5 bots, max 50 hard cap.
- Ran `test_phase3_dynamic_probability.ts`: Statistical win convergence (33.3%, 10%, 5%), dynamically scaled anti-churn thresholds, and disabled 0-bot mode (100% real player win odds) passed.
- Ran `test_house_commission_audit.ts`: Pot volume, payout balance, and house fees verified.
- Ran `npx tsc --noEmit`: 0 TypeScript compiler errors.
- Verified Rooms 20, 50, 100 remain strictly 0 bots and isolated from all changes.

### 🔹 Phase 4: Production Build & Push to GitHub [COMPLETED ✅]
- Ran `npm run build` (`vite build`): compiled successfully with 0 errors.
- Verified all git remotes (`origin`, `new-origin`, `tycons-origin`).
- Committed and pushed production release to GitHub.



