# Implementation Plan: Render 5 GB Quota, Re-Hosting on New Account & GitHub Fix

> **Executive Status**:
> - **Render Quota Confirmed**: Your **Render Web Service** has consumed **4.8 / 5.0 GB** of monthly outbound bandwidth.
> - **Can you re-host on Render with a new email?** **YES, 100%!** A new Render account receives a fresh 5.0 GB/month quota immediately.
> - **Why GitHub repo was hidden**: Caused by GitHub App installation permissions. Solved below via the **10-second Direct URL method** or GitHub App configuration.
> - **Long-term Fix to Prevent 5 GB Depletion**: Host the frontend static assets (audio voice packs, JS bundles) on Vercel/Cloudflare (100 GB+ free bandwidth) while keeping the game WebSocket server on Render.

---

## 1. Direct Answer: Re-Hosting on Render with Another Email

### Can you re-host on Render with a new email?
**YES.** You can create a new Render account using a different email address. Render does not restrict you from deploying your code on a new account, and the new account starts with **0 GB used out of 5 GB**.

---

## 2. Why GitHub Repo Was Not Visible on Your New Render Account

When you sign into a new Render account and click "Connect GitHub", GitHub opens an authorization prompt. By default, GitHub's security settings often:
1. Limit access to "Only select repositories" (excluding your repo).
2. Or connect to an organization rather than your personal repository.

### How to Fix This (Two Options):

#### Option 1: The 10-Second Direct Git URL Bypass (NO GitHub Setup Required!)
You do **not** even need to connect the GitHub App:
1. In your new Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Scroll down past the GitHub list to **"Public Git Repository"** (or "Existing Git Repository").
3. Paste your repository URL directly:
   ```text
   https://github.com/tycons9/Bingo-Mini-app
   ```
4. Click **Continue**.
5. Render immediately clones your repository and opens the setup form—zero permissions hassle!

#### Option 2: Authorize Render in GitHub App Settings
If you want automatic deploys on every Git push:
1. Open GitHub: **[https://github.com/settings/installations](https://github.com/settings/installations)**
2. Find **Render** under Installed GitHub Apps $\rightarrow$ Click **Configure**.
3. Under **Repository access**:
   - Select **All repositories**, OR
   - Select **Only select repositories** $\rightarrow$ search for **`Bingo-Mini-app`** and check it.
4. Click **Save**.
5. Return to Render and refresh the page—`tycons9/Bingo-Mini-app` will now be visible with a "Connect" button.

## 3. Understanding Why Render Burned 4.8 GB Bandwidth

### Why did Render use 4.8 GB?
Render is currently serving both your **backend API** AND your **frontend static assets**:
1. **Audio Voice Packs (`/Audio`)**: Full MP3/WAV files for Amharic and English ball calls and sound effects.
2. **Frontend UI Bundles (`dist/`)**: React JavaScript files, CSS stylesheets, icons, and logo images.
3. Every time a player opens the game, Render downloads ~3–5 MB of audio and static files. With hundreds of game opens, Render's 5.0 GB free monthly bandwidth gets depleted quickly.

> [!TIP]
> **How to make Render's 5 GB last practically forever:**
> Deploy your frontend to **Vercel** or **Cloudflare Pages** (which give **100 GB+ of free bandwidth**). 
> The frontend assets will load from Vercel's CDN, and Render will **only** handle WebSocket messages (tiny JSON packets). On JSON alone, 5 GB will support hundreds of thousands of games!

---

## 4. Complete Step-by-Step Guide to Deploy on Your New Render Account

### Step 4.1: Connect the Repository
Choose whichever method is easiest:

* **Method 1 (Fastest — No GitHub App Needed)**:
  1. In your new Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
  2. Scroll down to **"Public Git Repository"** (or "Existing Git Repository").
  3. Paste your git URL:
     ```text
     https://github.com/tycons9/Bingo-Mini-app
     ```
  4. Click **Continue**.

* **Method 2 (Authorize GitHub App)**:
  1. Open [https://github.com/settings/installations](https://github.com/settings/installations).
  2. Click **Configure** next to **Render**.
  3. Under **Repository access**, check **"All repositories"** (or select `Bingo-Mini-app`) $\rightarrow$ Click **Save**.
  4. Refresh Render and click **Connect** next to `Bingo-Mini-app`.

---

### Step 4.2: Web Service Configuration Settings
Fill in the configuration fields on Render:

| Setting | Value |
|---|---|
| **Name** | `lomi-bingo` (or any name you prefer) |
| **Region** | Frankfurt (EU Central) or closest to your players |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Free` (or `Starter` if you want 24/7 always-on) |

---

### Step 4.3: Add Environment Variables
Click **Advanced** $\rightarrow$ **Add Environment Variable**, and copy these from your working configuration:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | *(Your Neon PostgreSQL connection string)* | Shared database keeps all existing users & balances |
| `PORT` | `5000` | Render port |
| `NODE_ENV` | `production` | Enables production optimizations |
| `CORS_ORIGIN` | `*` | Allows mobile WebApp connections |
| `JWT_SECRET` | *(Your JWT Secret)* | Keep same as old server so active player tokens remain valid |
| `TELEGRAM_BOT_TOKEN` | *(Your Telegram Bot Token)* | Connects the bot to the new server |
| `TELEGRAM_WEBAPP_URL` | `https://<your-new-render-name>.onrender.com` | Update to the URL Render gives your new service |

Click **Create Web Service**. Render will build and deploy your app in 2–3 minutes!

---

## 5. What to Update After the New Service is Live

Once Render gives you your new URL (e.g. `https://lomi-bingo-v2.onrender.com`):

1. **In Telegram BotFather**:
   - Message `@BotFather` on Telegram.
   - Run `/setmenubutton` $\rightarrow$ Select your bot $\rightarrow$ Send the new URL:
     `https://<your-new-render-name>.onrender.com`
   - Run `/mybots` $\rightarrow$ Select Bot $\rightarrow$ **Bot Settings** $\rightarrow$ **Menu Button** / **Web App URL** $\rightarrow$ Update to new URL.

2. **In New Render Dashboard**:
   - Make sure `TELEGRAM_WEBAPP_URL` environment variable matches your new Render URL.
   - Restart the service once so the bot registers the webhook/menu button automatically.

---

## 6. How to Avoid Hitting the 5 GB Limit Again (Hybrid Architecture)

Why Render burned 4.8 GB:
- Render was serving large voice audio files (`/Audio/*.mp3`), images, and React bundles.
- **The Permanent Fix**:
  - Keep the **Backend & WebSockets on Render** (handles JSON packets).
  - Deploy the **Frontend on Vercel** or **Cloudflare Pages** (100 GB+ free bandwidth).
  - Configure the frontend on Vercel to point to your new Render backend via `VITE_API_URL`.
  - This reduces Render's bandwidth consumption by **over 95%**, so your free 5 GB will last for months.

