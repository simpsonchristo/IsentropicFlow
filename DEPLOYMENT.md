# Deployment Guide

## Architecture

The calculator is pure HTML + JavaScript — all physics runs in the browser.
The `ui/` folder is a set of static files served directly by the LiteSpeed
web server already running on your Namecheap host.

```
push to master
    → GitHub Actions: FTP sync ui/ → Namecheap /public_html/tools/isentropic/
    → live at simpsonaerospace.com/tools/isentropic/
    → WordPress page iframes or links to it
```

No new services, no AWS setup, no extra accounts. Everything stays on your
existing Namecheap hosting.

---

## Your Hosting Setup

| | Detail |
|---|---|
| Host | Namecheap cPanel shared hosting |
| Server | LiteSpeed |
| WordPress | 5.8.18 with Beaver Builder |
| Calculator path | `simpsonaerospace.com/tools/isentropic/` |
| Deploy method | GitHub Actions → FTP |

---

## One-time Setup

### Step 1 — Get your Namecheap FTP credentials

1. Log in to **Namecheap → cPanel** (usually at `simpsonaerospace.com/cpanel`)
2. Go to **FTP Accounts**
3. Either use the default cPanel FTP account, or create a dedicated one:
   - **Log In**: e.g. `deploy@simpsonaerospace.com`
   - **Directory**: `/public_html/tools/isentropic`  (restricts it to this folder only)
   - **Quota**: Unlimited
4. Note down: FTP hostname (usually `ftp.simpsonaerospace.com`), username, password

### Step 2 — Add FTP credentials to GitHub Secrets

Go to **GitHub → simpsonchristo/IsentropicFlow → Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `FTP_SERVER` | `ftp.simpsonaerospace.com` |
| `FTP_USERNAME` | Your FTP username (e.g. `deploy@simpsonaerospace.com`) |
| `FTP_PASSWORD` | Your FTP password |

### Step 3 — Create the target folder (optional)

Namecheap's FTP action will create the folder automatically on first deploy,
but you can also create it manually in cPanel → **File Manager**:
navigate to `public_html/` and create a folder named `tools`, then inside
it create `isentropic`.

### Step 4 — Push to master to trigger first deploy

```bash
git commit --allow-empty -m "trigger initial deploy"
git push origin master
```

Watch **GitHub → Actions** for the deploy run. It will FTP-sync the `ui/`
folder to `/public_html/tools/isentropic/` on your Namecheap server.

---

## Embedding on simpsonaerospace.com

Once deployed, the calculator lives at:
`https://simpsonaerospace.com/tools/isentropic/`

**Option A — Dedicated WordPress page (recommended)**
1. **Pages → Add New**, title: `Isentropic Flow Calculator`
2. Set the permalink to `/tools/isentropic-flow/`
3. In Gutenberg, add a **Custom HTML** block:
   ```html
   <iframe
     src="https://simpsonaerospace.com/tools/isentropic/"
     width="100%"
     height="820"
     frameborder="0"
     title="Isentropic Flow Calculator"
     loading="lazy">
   </iframe>
   ```
4. Publish

**Option B — Beaver Builder**
Drag an **HTML module** into a row and paste the same `<iframe>` snippet.

**Option C — Link directly (no iframe)**
Because the calculator is on the same domain, you can also just link to
`simpsonaerospace.com/tools/isentropic/` as a standalone page — no embedding
needed. This is the cleanest option if you want a full-page calculator
without a WordPress chrome wrapper.

---

## Sharing with charles-oneill.com

Share the URL `https://simpsonaerospace.com/tools/isentropic/` — it works
as a standalone page in any browser. The site owner can embed it with the
same `<iframe>` snippet above if they want it inside a post.

---

## How Deployments Work After Setup

Every push to `master` automatically:
1. GitHub Actions runs `.github/workflows/deploy.yml`
2. `SamKirkland/FTP-Deploy-Action` syncs only changed files in `ui/` to Namecheap
3. Unchanged files are skipped — deploys are fast

```
You edit ui/physics.js and push to master
    → only physics.js is uploaded (delta sync)
    → live within ~15 seconds
```

To gate deploys to explicit releases instead of every push, change
`on: push: branches: [master]` to `on: release: types: [published]`
in `.github/workflows/deploy.yml`.

---

## GitHub Secrets Reference

| Secret | Example value | Where to find it |
|---|---|---|
| `FTP_SERVER` | `ftp.simpsonaerospace.com` | Namecheap cPanel → FTP Accounts |
| `FTP_USERNAME` | `deploy@simpsonaerospace.com` | Namecheap cPanel → FTP Accounts |
| `FTP_PASSWORD` | (your FTP password) | Set when creating the FTP account |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| GitHub Actions FTP step fails with 530 | Wrong username or password | Re-check FTP_USERNAME includes the domain (`user@domain.com`), not just `user` |
| Files upload but page shows 403 | Folder permissions too restrictive | In cPanel File Manager, right-click folder → Permissions → set to 755 |
| Page shows directory listing instead of calculator | No `index.html` in the folder | Confirm `ui/index.html` exists and was uploaded |
| Changes not visible after deploy | LiteSpeed Cache serving stale version | In WP admin → LiteSpeed Cache → Purge All, or wait for cache TTL |
| `deploy.yml` runs but skips all files | FTP action `.ftp-deploy-sync-state.json` is stale | Delete `.ftp-deploy-sync-state.json` from the server path via cPanel File Manager and re-run |
