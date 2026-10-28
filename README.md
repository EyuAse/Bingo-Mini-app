# 🍋 Lomi Bingo (Betika Bingo Mini-App)

> Pixel-perfect, high-performance real-time Telegram Mini-App Bingo Casino platform.

---

## 📖 AI Assistant & Developer Handover Guide

If you are continuing work on this project on another computer or with a new AI assistant, please refer to the master handover guide:

👉 **[AGENTS.md](AGENTS.md)** — Complete architectural documentation, multi-room isolation rules, Ethiopian bot schedule, bingo math specifications, and setup instructions.

---

## 🚀 Quick Setup on a New PC

```bash
# 1. Clone repository
git clone https://github.com/EyuAse/Bingo-Mini-app.git
cd Bingo-Mini-app

# 2. Add backup mirror remote
git remote add tycons-origin https://github.com/tycons9/Bingo-Mini-app.git

# 3. Install dependencies
npm install

# 4. Copy .env with DATABASE_URL, TELEGRAM_BOT_TOKEN, etc.

# 5. Run test suites
npx tsc --noEmit
npx tsx server/scripts/test_night_zero_bot_waiting.ts
npx tsx server/scripts/test_room10_hourly_schedule.ts

# 6. Start development server
npm run dev
```

---

## 🏛️ Repository Architecture & Remotes

- **Production Primary**: [`https://github.com/EyuAse/Bingo-Mini-app`](https://github.com/EyuAse/Bingo-Mini-app) (`origin`) — Deployed to Render.
- **Backup Mirror**: [`https://github.com/tycons9/Bingo-Mini-app`](https://github.com/tycons9/Bingo-Mini-app) (`tycons-origin`).
