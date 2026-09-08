# Deployment Guide — Room Expense Manager

This guide covers deploying the monorepo to:

- **Frontend** → Vercel
- **Backend** → Railway
- **Database** → MySQL on Railway

```
GitHub
  ├── frontend/  →  Vercel
  └── backend/   →  Railway Node.js
                       │
                       ▼
                  Railway MySQL
```

---

## Prerequisites

- GitHub account
- Railway account — https://railway.app
- Vercel account — https://vercel.com
- Project pushed to a GitHub repository

---

## Step 1 — Push to GitHub

If you have not already pushed this project to GitHub:

```bash
git init
git add .
git commit -m "chore: prepare for deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Make sure `.env` files are **not** committed. The `.gitignore` files are already configured to exclude them.

---

## Step 2 — Create MySQL Database on Railway

1. Go to https://railway.app and log in.
2. Click **New Project**.
3. Select **Deploy a template** → choose **MySQL**, or click **Add a Service** → **Database** → **MySQL**.
4. Wait for Railway to provision the database (takes ~30 seconds).
5. Click on the MySQL service, then open the **Variables** tab.
6. Note down the following connection variables (Railway provides them automatically):

| Variable | Description |
|---|---|
| `MYSQL_HOST` | Database host |
| `MYSQL_PORT` | Database port (usually `3306`) |
| `MYSQL_USER` | Database username |
| `MYSQL_PASSWORD` | Database password |
| `MYSQL_DATABASE` | Database name |

You will map these into your backend service in Step 4.

7. Open the **Query** tab (or connect via a MySQL client) and run `backend/schema.sql` to create all tables:
   - Copy the contents of `backend/schema.sql`
   - Paste and execute it in Railway's Query tab

---

## Step 3 — Deploy Backend on Railway

1. In the same Railway project, click **New Service** → **GitHub Repo**.
2. Authorise Railway to access your GitHub account if prompted.
3. Select your repository.
4. Railway will detect it as a Node.js project.
5. In the service settings, configure the following:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

6. Do **not** deploy yet — set environment variables first (Step 4).

---

## Step 4 — Set Backend Environment Variables on Railway

In your backend Railway service, open the **Variables** tab and add the following:

| Variable Name | Where to get the value |
|---|---|
| `DB_HOST` | From the Railway MySQL service → Variables → `MYSQL_HOST` |
| `DB_PORT` | From the Railway MySQL service → Variables → `MYSQL_PORT` |
| `DB_USER` | From the Railway MySQL service → Variables → `MYSQL_USER` |
| `DB_PASSWORD` | From the Railway MySQL service → Variables → `MYSQL_PASSWORD` |
| `DB_NAME` | From the Railway MySQL service → Variables → `MYSQL_DATABASE` |
| `JWT_SECRET` | Generate a strong random string (see tip below) |
| `FRONTEND_URL` | Your Vercel frontend URL — set this **after** Step 5 |

**Tip — generating a strong JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run that locally and paste the output as the value for `JWT_SECRET`.

> **Important:** Do not use a short or guessable string for `JWT_SECRET`. It signs every authentication token in the app.

Railway also supports **reference variables** — you can link `DB_HOST` directly to `${{MySQL.MYSQL_HOST}}` instead of copy-pasting, which keeps them in sync automatically.

Once all variables except `FRONTEND_URL` are set, Railway will trigger a deploy. The backend startup will print:

```
Server is running on port <PORT>
```

If `JWT_SECRET` is missing the server will refuse to start and print:

```
FATAL: JWT_SECRET environment variable is not set. Exiting.
```

After deploy, copy the Railway-assigned public URL for your backend service (e.g. `https://backend-production-xxxx.up.railway.app`). You will need it in Step 6.

---

## Step 5 — Deploy Frontend on Vercel

1. Go to https://vercel.com and log in.
2. Click **Add New** → **Project**.
3. Click **Import Git Repository** and select your repository.
4. On the configuration screen, set:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite (auto-detected) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Do **not** deploy yet — add the environment variable first (Step 6).

---

## Step 6 — Set Frontend Environment Variable on Vercel

In the Vercel project settings → **Environment Variables**, add:

| Variable Name | Value |
|---|---|
| `VITE_API_URL` | `https://YOUR-RAILWAY-BACKEND-URL/api` |

Replace `YOUR-RAILWAY-BACKEND-URL` with the actual Railway public URL from Step 4.

Example:
```
VITE_API_URL=https://backend-production-xxxx.up.railway.app/api
```

Then click **Deploy**.

---

## Step 7 — Configure CORS (Connect Frontend ↔ Backend)

After Vercel deploys, copy your Vercel frontend URL (e.g. `https://your-app.vercel.app`).

Go back to Railway → your backend service → **Variables** and set:

```
FRONTEND_URL=https://your-app.vercel.app
```

Railway will automatically redeploy the backend with this value. The backend CORS policy will now accept requests from your Vercel domain.

> If `FRONTEND_URL` is not set, the backend falls back to allowing `localhost:5173` and `localhost:3000` only (local development). Production requests from Vercel will be blocked until this variable is set.

---

## Step 8 — Run Database Schema

If you have not already done this, run `backend/schema.sql` against your Railway MySQL database.

**Option A — Railway Query tab:**
1. Open the MySQL service on Railway.
2. Click the **Query** tab.
3. Paste the full contents of `backend/schema.sql` and execute.

**Option B — MySQL client (TablePlus, DBeaver, mysql CLI):**
1. Get connection details from Railway MySQL → **Connect** tab.
2. Connect and run:

```bash
mysql -h HOST -P PORT -u USER -p DATABASE < backend/schema.sql
```

---

## Step 9 — Verify Deployment

Once both services are live, verify end-to-end:

1. **Backend health check:**
   ```
   GET https://YOUR-RAILWAY-BACKEND-URL/api/health
   ```
   Expected response:
   ```json
   { "status": "ok", "message": "Room Expense Manager API is running" }
   ```

2. **Frontend:** Open your Vercel URL in a browser. The app should load and be able to create/join rooms and log in.

---

## Local Development (after deployment)

Local development continues to work without any changes. The fallback in `api.js` points to `http://localhost:5000/api` when `VITE_API_URL` is not set.

To run locally:

**Backend:**
```bash
cd backend
cp .env.example .env
# Fill in your local MySQL credentials in .env
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api in .env
npm install
npm run dev
```

---

## Environment Variable Reference

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Assigned by Railway automatically |
| `DB_HOST` | Yes | Railway MySQL host |
| `DB_PORT` | Yes | Railway MySQL port |
| `DB_USER` | Yes | Railway MySQL username |
| `DB_PASSWORD` | Yes | Railway MySQL password |
| `DB_NAME` | Yes | Railway MySQL database name |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `FRONTEND_URL` | Yes | Vercel frontend URL for CORS |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full Railway backend API URL (ending in `/api`) |

---

## Railway Service Settings Summary

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

## Vercel Project Settings Summary

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

---

## Troubleshooting

**Backend fails to start on Railway:**
- Check that `JWT_SECRET` is set — if missing, the server exits with a FATAL error.
- Check that all `DB_*` variables match the Railway MySQL service values exactly.

**Frontend shows network errors / API calls fail:**
- Confirm `VITE_API_URL` ends in `/api` (e.g. `https://....railway.app/api`).
- Confirm `FRONTEND_URL` on Railway matches your exact Vercel URL (no trailing slash).
- Check browser DevTools → Network tab for the actual request URL and response.

**CORS errors in browser:**
- Ensure `FRONTEND_URL` on Railway is set to your Vercel URL.
- After updating `FRONTEND_URL`, Railway will redeploy automatically — wait for the deploy to complete.

**Database tables missing:**
- Run `backend/schema.sql` on the Railway MySQL instance (Step 8).
