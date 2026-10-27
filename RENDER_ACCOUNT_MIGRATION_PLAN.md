# Render Account Migration & Bandwidth Optimization Plan

## Overview & Current Status

* **Bandwidth Usage**: **4.94 GB / 5.00 GB (98.8% full - Near Suspension)**
* **Bandwidth Breakdown**:
  * **HTTP Responses**: `4.51 GB` (91.3% - Static assets, JS/CSS bundles, audio files served directly by Node)
  * **WebSocket Responses**: `326 MB` (6.6% - Live game rooms & ticks)
  * **Service-Initiated**: `122 MB` (2.5% - Outbound Telegram/DB calls)
* **Target Account**: `asey5562@gmail.com`
* **GitHub Repository**: `https://github.com/EyuAse/Bingo-Mini-app` (Public)

---

## 1. Can Render Connect to Your Public Repository?

> [!IMPORTANT]
> **YES! 100% Supported without any GitHub permission restrictions.**  
> Because `https://github.com/EyuAse/Bingo-Mini-app` is a **public** repository, Render allows **any** account to deploy it immediately. You can either:
> 1. Select **"Public Git repository"** on Render and paste `https://github.com/EyuAse/Bingo-Mini-app.git`.
> 2. Or log into Render using your GitHub account (`EyuAse`) or link GitHub to enable automatic deploys on every `git push`.

---

## 2. Step-by-Step Re-Hosting Plan

```mermaid
flowchart TD
    A["Log into Render (asey5562@gmail.com)"] --> B["Create New Web Service via Public Git"]
    B --> C["Paste Repo: https://github.com/EyuAse/Bingo-Mini-app.git"]
    C --> D["Set Build & Start Commands"]
    D --> E["Copy Environment Variables (DB, Telegram, Secrets)"]
    E --> F["Deploy Service & Obtain New URL"]
    F --> G["Update Webhook & Telegram Bot Settings"]
    G --> H["Update BotFather Menu Button URL"]
    H --> I["Suspend / Delete Old Render Service"]
```

---

### Step 1: Sign Up / Log In with New Account

1. Go to **[https://dashboard.render.com](https://dashboard.render.com)**.
2. Sign up or log in using your new email: **`asey5562@gmail.com`**.
3. Complete email verification if prompted.

---

### Step 2: Create the Web Service

1. On your Render dashboard, click the blue **`New +`** button at the top right.
2. Select **`Web Service`**.
3. Under the Git provider section, select **`Existing image or Git repository`** (or **`Public Git repository`**).
4. In the repository URL input, paste:
   ```text
   https://github.com/EyuAse/Bingo-Mini-app.git
   ```
5. Click **Connect**.

---

### Step 3: Configure Web Service Parameters

Fill in the service details:

| Setting | Value to Enter | Explanation |
|---|---|---|
| **Name** | `lomi-bingo` *(or any unique name, e.g. `bingo-app-live`)* | Determines your new domain: `https://<name>.onrender.com` |
| **Region** | **Ohio (US East)** | Closest to your Neon DB host (`us-east-2.aws.neon.tech`) for lowest latency |
| **Branch** | `main` | Production release branch |
| **Root Directory** | *(leave empty / blank)* | Default root directory |
| **Runtime** | `Node` | Node.js runtime |
| **Build Command** | `npm install && npm run build` | Builds Vite client bundle into `dist/` |
| **Start Command** | `npm start` | Starts Node Express + Socket.IO server via `tsx` |
| **Instance Type** | **Free ($0/month)** | Provides 512 MB RAM + **fresh 5 GB bandwidth** |

---

### Step 4: Add Environment Variables

In the **Environment Variables** section on the same page (or under **Environment** tab after creation), add the following keys and values:

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=*
DATABASE_URL=postgresql://neondb_owner:npg_c9b4XgIujwhY@ep-billowing-math-b4rewozh-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=lomi_bingo_super_secret_production_key_2026_et
ADMIN_PIN=1234
TELEGRAM_BOT_TOKEN=8970837393:AAFZ2vX1Ij67mua6TFU5U8jBVQNcjsGELHE
TELEGRAM_CHANNEL_ID=@BRILV
TELEGRAM_WEBAPP_URL=https://<your-new-service-name>.onrender.com
VITE_BACKEND_URL=https://<your-new-service-name>.onrender.com
```

> [!NOTE]
> Replace `<your-new-service-name>.onrender.com` with the actual subdomain Render gives you once the service is named (e.g. `https://lomi-bingo.onrender.com`).

Click **Create Web Service**.

---

### Step 5: Verify Deployment & Health Check

1. Render will clone the repository, run `npm install`, compile `vite build`, and run `npm start`.
2. Once the deploy log says **`==> Your service is live at https://...`**, test the endpoints in your browser:
   * **API Health Check**:  
     `https://<your-new-service-name>.onrender.com/api/health`  
     *Expected Output*: `{"status":"healthy", "database":{"connected":true}}`
   * **Game App**:  
     `https://<your-new-service-name>.onrender.com`  
     *Expected Output*: Lomi Bingo game loads smoothly.

---

### Step 6: Update Telegram Bot & Database URL (Critical)

Now that the backend has a new URL, update the Telegram bot webhook and database config so `@LomiBingobot` routes users to the new instance:

#### Option A: Via Local CLI Script (Fastest)
1. In your local repository, edit [sync_webapp_url.ts](file:///c:/Users/asefa/Desktop/lomi-bingo/server/scripts/sync_webapp_url.ts#L7):
   ```ts
   const newUrl = 'https://<your-new-service-name>.onrender.com';
   ```
2. Run:
   ```bash
   npx tsx server/scripts/sync_webapp_url.ts
   ```
3. Re-register the webhook with Telegram by calling:
   ```bash
   curl -X POST "https://<your-new-service-name>.onrender.com/api/telegram-webhook"
   ```
   Or visit the Admin Desk at `https://<your-new-service-name>.onrender.com/admin` -> **Telegram Bot Settings** -> click **"Save & Register Webhook"**.

#### Option B: Update BotFather Menu Button
1. Open Telegram and message **`@BotFather`**.
2. Send command: `/mybots`.
3. Choose your bot: **`@LomiBingobot`**.
4. Click **Bot Settings** $\rightarrow$ **Menu Button** $\rightarrow$ **Configure Menu Button**.
5. Paste your new URL: `https://<your-new-service-name>.onrender.com`.

---

### Step 7: Suspend the Old Render Service

To avoid duplicate webhook delivery, split database queries, or extra traffic:
1. Log in to your old Render account.
2. Open the old service (`bingo-mini-app-30pe`).
3. Click **Settings** $\rightarrow$ Scroll to the bottom $\rightarrow$ Click **Suspend Service** (or **Delete Service**).

---

## 3. Why You Hit 4.94 GB Bandwidth & How to Prevent It

| Metric | Consumed | Cause |
|---|---|---|
| **HTTP Responses** | **4.51 GB (91%)** | Serving uncompressed Vite JS bundles, CSS, and audio files repeatedly on every Mini App load |
| **WebSocket** | **326 MB (6.6%)** | Very efficient socket room events and number calls |
| **Service-Initiated**| **122 MB (2.5%)** | Outbound Telegram API and Neon queries |

### 3 Permanent Fixes to Avoid Hitting 5 GB on the New Account:

1. **Install `compression` in Express (Saves ~70% of HTTP responses)**:
   * Currently, Express sends JS and CSS uncompressed. Adding gzip/brotli middleware immediately shrinks a 1.2 MB bundle transfer down to ~350 KB.
   ```bash
   npm install compression @types/compression
   ```
   In `server/server.ts`:
   ```ts
   import compression from 'compression';
   app.use(compression());
   ```

2. **Increase Static Asset Browser Caching**:
   * Set `Cache-Control: public, max-age=604800, immutable` for static audio, logos, and images so mobile Telegram webviews do not re-download audio files on every game open.

3. **Recommended Dual-Host Architecture (Optional Long-term)**:
   * Deploy the frontend on **Vercel** or **Cloudflare Pages** (100 GB to Unlimited Free Bandwidth for static files).
   * Keep **Render** exclusively for the Node.js Socket.IO backend.
   * This leaves your Render bandwidth usage at only ~350 MB/month!
