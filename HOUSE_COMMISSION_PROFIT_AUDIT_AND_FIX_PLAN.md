# Implementation Plan: Dual House Commission Display (Today & Total All-Time)

> **Directive**: Update the House Commission metrics across the Admin Operations Desk to dynamically show:
> 1. **Today's House Commission** (profit earned from games completed today).
> 2. **Total All-Time House Commission** (cumulative platform rake since platform launch).
> 3. **Rake Rate Accuracy**: Align displayed cut to **20% House Cut Active** to match the backend game engine's true platform fee.
>
> **Investigation Findings (Live Neon PostgreSQL)**:
> - **Today's House Commission (`started_at >= CURRENT_DATE`)**: **`4,804.00 ETB`** across **297 rounds played today**.
> - **Total Cumulative House Commission (All-Time)**: **`8,686.00 ETB`** across **1,737 completed rounds**.
> - **The Defect Being Replaced**: The previous frontend was displaying a frozen dummy formula `Math.round(totalDepositedToday * 0.15) = 1,433.00 ETB` which had zero connection to played games.

---

## 1. Live Neon PostgreSQL Database Reality

Direct live query executed on October 22, 2026:

```sql
SELECT 
  COALESCE(SUM(platform_fee), 0) as total_house_commission,
  COALESCE(SUM(platform_fee) FILTER (WHERE started_at >= CURRENT_DATE), 0) as today_house_commission,
  COUNT(*) as total_rounds,
  COUNT(*) FILTER (WHERE started_at >= CURRENT_DATE) as today_rounds
FROM game_rounds;
```

### Live Query Results:
| Metric | Real DB Value | Description |
|---|---|---|
| **`today_house_commission`** | **`4,804.00 ETB`** | Real commission collected today from 297 rounds |
| **`total_house_commission`** | **`8,686.00 ETB`** | Cumulative all-time commission from 1,737 rounds |
| **`today_rounds`** | **`297 rounds`** | Games played today |
| **`total_rounds`** | **`1,737 rounds`** | All completed rounds in database |
| **Previous Displayed Value** | `1,433.00 ETB` | ❌ Disconnected formula (`deposits * 0.15`), frozen |

---

## 2. Strict Zero-Side-Effect Isolation Boundaries

To guarantee 100% platform stability, this update strictly isolates analytics display from core financial and game transactions:

### 🛑 WHAT WILL NOT BE TOUCHED (Zero Impact)
1. **Game Engine Core (`server/game/BingoGameEngine.ts`)**:
   - ⛔ **Matchmaking & Rooms 10, 20, 50, 100 ETB**: Ticketing, countdowns, player queues, standby bots, and Derash 80% net pot calculations are **100% untouched**.
   - ⛔ **Core Gameplay**: 75-ball draw sequence, cartela generation, and real-time socket broadcasts are **100% untouched**.
   - ⛔ **Rake Engine**: The engine's 20% cut (`room.houseFee = Math.floor(room.totalPot * 0.20)`) is **100% untouched**.
2. **Financial Ledgers & Cashier (`server/routes/wallet.ts`, `server/routes/admin.ts`)**:
   - ⛔ **Deposit & Withdrawal Processing**: Cashier approvals, rejections, user balances, and Telebirr/CBE webhooks are **100% untouched**.
   - ⛔ **Database ACID Transactions**: Lock integrity and balance adjustments are **100% untouched**.
3. **Telegram Bot & Channels (`server/services/telegramBotService.ts`)**:
   - ⛔ Webhooks, channel postings to `@lomibingo_official`, and bot command routing are **100% untouched**.

---

### ✅ WHAT WILL BE CHANGED (Surgically Scoped Only)

| File | Scope of Change | Purpose |
|---|---|---|
| [server/routes/admin.ts](file:///c:/Users/asefa/Desktop/lomi-bingo/server/routes/admin.ts) | Lines 530–550 (`GET /api/admin/stats`) | In `/stats`, aggregate `today_house_revenue` alongside `total_house_revenue` and `today_games_played` in one fast query. |
| [src/services/apiClient.ts](file:///c:/Users/asefa/Desktop/lomi-bingo/src/services/apiClient.ts) | Line 436 (`apiClient.admin.getStats`) | Update TypeScript response interface to include `todayHouseRevenue` and `todayGamesPlayed`. |
| [src/context/AdminContext.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/context/AdminContext.tsx) | Lines 84, 145, 241, 371, 648 | 1. Add `todayHouseProfit` and `todayGamesCount` state hooks.<br>2. In `refreshAdminData()`, populate both `totalHouseProfit` (`8,686.00 ETB`) and `todayHouseProfit` (`4,804.00 ETB`).<br>3. Replace dummy formula with live state.<br>4. Align default `commissionRate` from `10` to `20`. |
| [src/components/admin/DashboardOverview.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/components/admin/DashboardOverview.tsx) | Card 1 (Lines 109–126) | Upgrade Card 1 to display **Today's House Commission** as primary metric with an **All-Time Total Commission** chip and **20% House Cut Active** tag. |
| [src/components/admin/CashFlowAnalytics.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/components/admin/CashFlowAnalytics.tsx) | Card 4 (Lines 163–180) | Display both **All-Time Total Commission** (`8,686.00 ETB`) and **Today's Commission** (`+4,804.00 ETB Today`). |
| [src/components/admin/AdminSettings.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/components/admin/AdminSettings.tsx) | Lines 135 & 159 | Synchronize default descriptive copy from `(Default: 10%)` to `(Default: 20%)`. |

---

## 3. Step-by-Step Implementation Phases

### Phase 1: Backend Route Surgical Update (`server/routes/admin.ts`) — ✅ COMPLETED & TESTED
* **File**: [server/routes/admin.ts](file:///c:/Users/asefa/Desktop/lomi-bingo/server/routes/admin.ts)
* **Scope**: Surgically modified ONLY `router.get('/stats')`. Cashier routes (`/deposits`, `/withdrawals`, `/users`) remain 100% untouched.
* **Status**: Tested and verified with `server/scripts/test_phase1_stats_api.ts`.
* **Execution Results**:
  ```text
  Stats Payload: {
    totalPlayers: 257,
    totalDeposits: 9550,
    totalWithdrawals: 3410,
    totalGamesPlayed: 1744,
    todayGamesPlayed: 302,
    totalHouseRevenue: 8812,
    todayHouseRevenue: 4892,
    todayNetCashProfit: 1500,
    defaultCommissionRate: 20
  }
  ```

### Phase 2: Context State Alignment (`src/context/AdminContext.tsx`) — ✅ COMPLETED & TESTED
* **Files**: [src/context/AdminContext.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/context/AdminContext.tsx), [src/services/apiClient.ts](file:///c:/Users/asefa/Desktop/lomi-bingo/src/services/apiClient.ts)
* **Scope**: Surgically modified ONLY stats handling in `AdminContextType`, `refreshAdminData()`, and `Provider` value.
* **Status**: Tested and verified. Production build passed with 0 errors.

1. **Interface & State Hooks**:
   - Added `todayHouseProfit`, `todayGamesPlayed`, and `todayNetCashProfit` to `AdminContextType`.
   - Replaced dummy formula `Math.round(totalDepositedToday * 0.15)` with live state from `statsRes.stats.totalHouseRevenue`.
   - Aligned default `commissionRate` from `10` to `20` to match the engine's 20% platform rake.
2. **Data Refresh Binding**:
   - Live database `todayHouseRevenue`, `totalHouseRevenue`, `todayGamesPlayed`, and `todayNetCashProfit` are now dynamically consumed by all admin desks.

### Phase 3: Admin UI Design & Presentation — ✅ COMPLETED & TESTED
* **Files**:
  - [src/components/admin/DashboardOverview.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/components/admin/DashboardOverview.tsx)
  - [src/components/admin/CashFlowAnalytics.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/components/admin/CashFlowAnalytics.tsx)
  - [src/components/admin/AdminSettings.tsx](file:///c:/Users/asefa/Desktop/lomi-bingo/src/components/admin/AdminSettings.tsx)
* **Status**: Tested and verified. Production build passed with 0 errors.

1. **DashboardOverview.tsx Card 1 (Gold Card)**:
   - Primary Value: displays live **`todayHouseProfit ETB Today`** (e.g. `4,892.00 ETB Today`).
   - Badge: displays **`Total: totalHouseProfit ETB`** (e.g. `Total: 8,812.00 ETB`).
   - Micro-text: displays `302 rounds today (20% Cut)`.
2. **CashFlowAnalytics.tsx Card 4**:
   - Primary: displays live **`totalHouseProfit ETB`** (e.g. `8,812.00 ETB`).
   - Badge: `20% System House Cut`.
   - Micro-text: `+todayHouseProfit ETB Today` (e.g. `+4,892.00 ETB Today`).
3. **AdminSettings.tsx**:
   - Synchronized default copy hints from `(Default: 10%)` to `(Default: 20%)`.

---

## 4. Verification Protocol

1. **Live Backend Route Test**:
   - Run verification script to test `GET /api/admin/stats` returning both `todayHouseRevenue: 4804.00` and `totalHouseRevenue: 8686.00`.
2. **Game Engine Isolation Test**:
   - Run `npx tsx server/test_game_engine.ts` to confirm 100% pass rate across Rooms 10, 20, 50, and 100 ETB.
3. **Frontend Compilation Check**:
   - Run `npm run build` to confirm 0 TypeScript / bundle errors.
4. **Visual UI Check**:
   - Verify Card 1 shows **Today's Commission** and **Total Commission** dynamically updating without any frozen formula.
