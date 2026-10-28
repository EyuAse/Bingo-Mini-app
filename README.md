# 🍋 Lomi Bingo (Betika Bingo Mini-App)

> Pixel-perfect, high-performance real-time Telegram Mini-App Bingo Casino platform.

---

## 📖 AI Assistant & Developer Handover Guide

If you are continuing work on this project on another computer or with a new AI assistant, please refer to the master handover guide:

👉 **[AGENTS.md](AGENTS.md)** — Complete architectural documentation, Cloudflare edge offloading, multi-room isolation rules, Ethiopian bot schedule, bingo math specifications, and setup instructions.

---

## 🌐 Hybrid Architecture Overview ($0.00/Month Zero-Cost Scaling)

1. **Cloudflare Edge CDN**: Serves 100% of the static frontend React bundle and **75 Amharic voice caller audio files** with unlimited unmetered bandwidth at **$0.00/month**.
2. **Render Node.js Backend**: Dedicated strictly to lightweight live WebSockets (`ws`) and REST APIs (< 1.2 GB/mo, safely inside the free 5 GB limit).
3. **Neon Serverless PostgreSQL**: Secure, pooled database transactions (< 400 MB/mo).

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

- **Production Primary**: [`https://github.com/EyuAse/Bingo-Mini-app`](https://github.com/EyuAse/Bingo-Mini-app) (`origin`) — Deployed to Render & Cloudflare.
- **Backup Mirror**: [`https://github.com/tycons9/Bingo-Mini-app`](https://github.com/tycons9/Bingo-Mini-app) (`tycons-origin`).
