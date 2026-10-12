# Deployment Guide

## Your Hosting Setup

**simpsonaerospace.com** runs WordPress 5.8.18 on **Namecheap shared hosting**
(identified by LiteSpeed Cache plugin + SSL Manager plugin — standard Namecheap
cPanel stack).

**Critical constraint:** Namecheap shared hosting runs PHP only. It cannot start
or keep alive a Python process. The FastAPI backend must be deployed to a
separate Python-capable service and reached over HTTPS from the browser.

---

## Architecture in Production

```
Namecheap shared host                External Python host
(WordPress, PHP, cPanel)             (Render free tier)
┌────────────────────────┐           ┌──────────────────────────┐
│ simpsonaerospace.com   │           │ isentropic.onrender.com  │
│                        │           │                          │
│  WP page with          │           │  FastAPI app             │
│  <iframe               │ ◄─ fetch ─►  POST /api/calculate    │
│   src="https://        │           │  POST /api/table         │
│   isentropic.onrender  │           │  POST /api/plot          │
│   .com">               │           │                          │
└────────────────────────┘           └──────────────────────────┘
         ▲
         │ git push / GitHub Release
         │
┌────────┴───────────────┐
│   GitHub repo          │
│   simpsonchristo/      │
│   IsentropicFlow       │
│                        │
│  CI:  runs tests on    │
│       every PR + push  │
│  CD:  fires Render     │
│       deploy hook on   │
│       GitHub Release   │
└────────────────────────┘
```

---

## One-time Setup: Deploy to Render

### Step 1 — Create a Render account
Go to https://render.com and sign up (free tier is sufficient).

### Step 2 — Create a new Web Service
1. Click **New → Web Service**
2. Connect your GitHub account and select `simpsonchristo/IsentropicFlow`
3. Fill in:
   - **Name**: `isentropicflow` (becomes `isentropicflow.onrender.com`)
   - **Branch**: `master`
   - **Runtime**: `Python 3`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn api.app:app --host 0.0.0.0 --port $PORT`
4. Set environment variable:
   - `ALLOWED_ORIGINS` = `https://simpsonaerospace.com,https://charles-oneill.com`
5. Click **Create Web Service** — Render builds and deploys automatically.

### Step 3 — Get the Deploy Hook URL
1. In Render dashboard → your service → **Settings** → scroll to **Deploy Hook**
2. Copy the URL (looks like `https://api.render.com/deploy/srv-xxx?key=yyy`)

### Step 4 — Add Deploy Hook to GitHub Secrets
1. In GitHub → repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `RENDER_DEPLOY_HOOK_URL`
4. Value: paste the URL from Step 3
5. Click **Add secret**

That's it. The CI/CD pipeline is now live.

---

## Embedding the Calculator on simpsonaerospace.com

Once the Render app is running:

1. Log in to `simpsonaerospace.com/wp-admin/`
2. Go to **Pages → Add New**
3. Title the page: **Isentropic Flow Calculator**
4. In the Gutenberg editor, click **+** → search for **Custom HTML** block
5. Paste:
   ```html
   <iframe
     src="https://isentropicflow.onrender.com"
     width="100%"
     height="820"
     frameborder="0"
     title="Isentropic Flow Calculator"
     loading="lazy">
   </iframe>
   ```
6. Click **Publish**

The page is now live at `simpsonaerospace.com/isentropic-flow-calculator/`.

> **Beaver Builder note:** If you build the page in Beaver Builder instead of
> Gutenberg, drag in an **HTML module** and paste the same `<iframe>` snippet.

---

## Release Workflow — Shipping New Versions

Every push to `master` runs the test suite (CI). To ship a new version to
production:

1. Finish your changes and push to `master`
2. Verify CI passes (GitHub → Actions tab — green checkmark)
3. In GitHub → repo → **Releases → Create a new release**
4. Click **Choose a tag** → type a new version like `v1.1.0` → **Create new tag**
5. Write release notes → **Publish release**

The `deploy.yml` workflow fires automatically, pings the Render deploy hook, and
Render pulls the latest `master`, rebuilds, and goes live — usually within 2
minutes.

```
You push code
    → CI runs tests (pass/fail shown on GitHub)
    → You create a GitHub Release (tag v1.x.x)
    → deploy.yml fires the Render deploy hook
    → Render rebuilds and redeploys
    → Live at isentropicflow.onrender.com
    → Visitors on simpsonaerospace.com see the update via iframe
```

---

## Optional: Custom Subdomain

To serve the calculator at `tools.simpsonaerospace.com` instead of the Render
URL (cleaner, fully on-brand, no iframe border needed):

1. In Namecheap dashboard → **Domain List → simpsonaerospace.com → Manage →
   Advanced DNS**
2. Add a CNAME record:
   - Host: `tools`
   - Value: `isentropicflow.onrender.com`
   - TTL: Automatic
3. In Render → your service → **Settings → Custom Domains**
4. Add `tools.simpsonaerospace.com` — Render provisions a TLS certificate
   automatically
5. Update the iframe `src` to `https://tools.simpsonaerospace.com`
6. Update `ALLOWED_ORIGINS` on Render to include both the old and new origins
   during transition

---

## Environment Variables Reference

| Variable | Example value | Where set |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://simpsonaerospace.com,https://charles-oneill.com` | Render dashboard → Environment |
| `RENDER_DEPLOY_HOOK_URL` | `https://api.render.com/deploy/srv-xxx?key=yyy` | GitHub Secrets |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| iframe shows blank / "refused to connect" | CORS or mixed content | Confirm Render app is HTTPS; check `ALLOWED_ORIGINS` |
| Calculator loads but fetch fails | CORS header missing | Add `simpsonaerospace.com` to `ALLOWED_ORIGINS` on Render |
| GitHub Release doesn't trigger deploy | Secret not set | Check `RENDER_DEPLOY_HOOK_URL` in GitHub Secrets |
| Render build fails | Missing dependency | Verify `requirements.txt` lists all imports |
| Slow first load (30 s) | Render free tier cold start | Normal — free services spin down after 15 min of inactivity; upgrade to Starter tier ($7/mo) to eliminate cold starts |
