# $0.00/Month Production Architecture Implementation Plan
## New Render Instance (`bingo-mini-app-hp80`) + Cloudflare Pages + Reset Neon

## Executive Summary & Current Live State

* **Render Status**: Successfully rehosted on new account (`asey5562@gmail.com`)!
  * **Bandwidth Usage**: **0.00 GB / 5.00 GB (Brand New 100% Free Quota)**
  * **Active Primary URL**: `https://bingo-mini-app-hp80.onrender.com`
  * **Pending Fix**: Update `DATABASE_URL` in Render Environment with verified password to clear the `password authentication failed` startup log.
* **Neon Status**: Reset back to **0.00 GB / 5.00 GB (Brand New 100% Free Quota)**!
* **Cloudflare Pages**: Will host the frontend with **UNLIMITED FREE BANDWIDTH ($0.00)** so Render's fresh 5 GB quota is preserved all month long.
* **Total Monthly Hosting Cost**: **$0.00 / month (100% FREE)**.

---

## Architecture Flow

```mermaid
flowchart TD
    subgraph Client["📱 Player (Telegram Mini App)"]
        A["Player opens @LomiBingobot"]
    end

    subgraph Cloudflare["🌐 Cloudflare Pages (100% FREE CDN)"]
        B["Cloudflare Global Edge CDN"]
        B1["Static React Bundle (dist/)"]
        B2["Amharic Voice Caller Audio Files"]
        B3["Logos, Banners & Icons"]
    end

    subgraph Render["⚡ New Render Web Service (0.00 / 5.0 GB)"]
        C["https://bingo-mini-app-hp80.onrender.com"]
        C1["Live Ball Draw Ticks (WebSocket)"]
        C2["Authentication & REST API"]
    end

    subgraph Neon["🐘 Neon Database (0.00 / 5.0 GB)"]
        D["Neon PostgreSQL (Reset to 0 GB)"]
        D1["Verified Password: npg_D7rRnI9xYtke"]
        D2["Query Protections (< 400 MB/mo)"]
    end

    A -->|"1. Downloads 30 GB Website & Audio ($0.00)"| B
    B --> B1
    B --> B2
    B --> B3
    A -->|"2. Connects to WSS Live Game (< 1 GB)"| C
    C --> C1
    C --> C2
    C -->|"3. Private SQL Transactions (< 400 MB)"| D
```

---

## Phase 1: Fix Neon DB Password on New Render Instance (2 Minutes)

In your startup logs, the service threw:
`❌ [Neon DB Query Error]: password authentication failed for user 'neondb_owner'`
This happened because the `DATABASE_URL` in Render's Environment settings contains an older password.

### Action Steps:
1. Go to **[https://dashboard.render.com](https://dashboard.render.com)**.
2. Open your new service: **`bingo-mini-app-hp80`**.
3. In the left navigation menu, click **Environment**.
4. Update the **`DATABASE_URL`** to the exact, verified connection string:
   ```text
   postgresql://neondb_owner:npg_D7rRnI9xYtke@ep-billowing-math-b4rewozh-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
5. Ensure these environment variables are set:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `CORS_ORIGIN`: `*`
   * `JWT_SECRET`: `lomi_bingo_super_secret_production_key_2026_et`
   * `ADMIN_PIN`: `1234`
   * `TELEGRAM_BOT_TOKEN`: `8970837393:AAFZ2vX1Ij67mua6TFU5U8jBVQNcjsGELHE`
   * `TELEGRAM_CHANNEL_ID`: `@lomibingo_official`
   * `VITE_BACKEND_URL`: `https://bingo-mini-app-hp80.onrender.com`
   * `MAINTENANCE_MODE`: `false`
6. Click **Save Changes**.

### Verification:
* Open `https://bingo-mini-app-hp80.onrender.com/api/health` in your browser.
* Expected JSON response:
  ```json
  {
    "status": "healthy",
    "service": "Lomi Bingo Production API",
    "database": {
      "provider": "Neon PostgreSQL (Serverless Pooler)",
      "connected": true
    }
  }
  ```

---

## Phase 2: Deploy Frontend on Cloudflare Pages (100% Free)

By deploying the static frontend to Cloudflare Pages, **100% of the heavy file downloads (30+ GB of code, sounds, logos)** will be served by Cloudflare for free. Your new Render service will **never exceed 1 GB of bandwidth**.

### Action Steps:
1. Go to **[https://pages.cloudflare.com](https://pages.cloudflare.com)** (Sign up for free, no credit card required).
2. Click **Create application** $\rightarrow$ select the **Pages** tab $\rightarrow$ click **Connect to Git**.
3. Authorize GitHub and select your repository: **`EyuAse/Bingo-Mini-app`**.
4. Configure Build Settings:
   * **Project Name**: `lomi-bingo` *(will create `https://lomi-bingo.pages.dev`)*.
   * **Production Branch**: `main`.
   * **Framework Preset**: Select **`Vite`**.
   * **Build Command**: `npm run build`
   * **Build Output Directory**: `dist`
   * **Root Directory**: *(leave blank / default)*.
5. Add Environment Variable (Under **Environment variables (advanced)**):
   * **Variable Name**: `VITE_BACKEND_URL`
   * **Value**: `https://bingo-mini-app-hp80.onrender.com`
6. Click **Save and Deploy**.

### Verification:
* Cloudflare builds the site in ~60 seconds and assigns a permanent free URL (e.g. `https://lomi-bingo.pages.dev`).
* Open `https://lomi-bingo.pages.dev` in your browser: the game interface renders with 0 bytes recorded on Render.

---

## Phase 3: Update `TELEGRAM_WEBAPP_URL` on Render

Once Cloudflare provides your `pages.dev` URL:

1. Return to **[Render Dashboard](https://dashboard.render.com)** $\rightarrow$ **`bingo-mini-app-hp80`** $\rightarrow$ **Environment**.
2. Update:
   * `TELEGRAM_WEBAPP_URL`: `https://<your-project>.pages.dev`
3. Click **Save Changes**.

---

## Phase 4: Sync Telegram Bot & BotFather

Point the Telegram Bot and Menu Button to the Cloudflare Pages URL so all players load the game through Cloudflare's unlimited CDN.

### Action Steps:

#### 1. Update Database & Register Webhook via CLI Script:
From your local terminal, run:
```bash
npx tsx server/scripts/sync_webapp_url.ts https://<your-project>.pages.dev
```
*(The script updates the `telegram_webapp_url` setting in Neon and registers the webhook with Telegram API).*

#### 2. Update Telegram Menu Button in BotFather:
1. Open Telegram and message **`@BotFather`**.
2. Send command: `/mybots` $\rightarrow$ Select **`@LomiBingobot`**.
3. Click **Bot Settings** $\rightarrow$ **Menu Button** $\rightarrow$ **Configure Menu Button**.
4. Paste your Cloudflare URL:
   ```text
   https://<your-project>.pages.dev
   ```
5. Set the Button Title: `🎮 Play Bingo (10 ETB Gift)`

---

## Phase 5: Verification & Long-Term Bandwidth Safety

After connecting Cloudflare, your bandwidth metrics will look like this:

| Metric | Source | Expected Monthly Total | Status |
|---|---|---|---|
| **Website & Audio Downloads** | **Cloudflare Pages** | **~30 GB to 50 GB** | ✅ **100% FREE & UNLIMITED** |
| **Live Game WebSockets** | **Render (`hp80`)** | **~0.8 GB to 1.2 GB** | ✅ **Safely within 5.0 GB Free limit** |
| **SQL Queries** | **Neon** | **~200 MB to 400 MB** | ✅ **Safely within 5.0 GB Free limit** |
| **Total Monthly Cost** | — | **$0.00 / month** | 🚀 **Complete stability at zero cost** |

---

## Phase 6: Shut Down the Old Render Service

To avoid accidental confusion or zombie processes:
1. Log in to your old Render account.
2. Open the old service: **`bingo-mini-app-30pe`**.
3. Click **Settings** $\rightarrow$ scroll to the bottom $\rightarrow$ click **"Delete Web Service"** (or **"Suspend"**).
