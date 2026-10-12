# Deployment Guide

## Architecture Decision: Why No Backend Server

All compressible flow calculations are closed-form formulas or simple Newton-Raphson
iterations. These run instantly in JavaScript — no Python server is needed. This matches
the approach used by the Virginia Tech AOE 3114 calculator and eliminates:

- Backend hosting costs and management
- CORS configuration
- Cold start latency
- Server-side failures

The web calculator is a **static HTML + JavaScript page** deployed to **AWS S3**,
served via **CloudFront**, and embedded in WordPress via a single `<iframe>`.

---

## Your Hosting Setup

| Site | Platform | Host |
|---|---|---|
| simpsonaerospace.com | WordPress 5.8.18 | Namecheap cPanel, LiteSpeed server |
| Calculator | Static HTML/JS | AWS S3 + CloudFront (your existing account) |

---

## One-time AWS Setup

### Step 1 — Create an S3 bucket

1. Go to **AWS Console → S3 → Create bucket**
2. Name it (e.g. `isentropicflow-calculator`) — name must be globally unique
3. **Uncheck** "Block all public access"
4. After creation → **Properties tab → Static website hosting → Enable**
   - Index document: `index.html`
   - Error document: `index.html`
5. **Permissions tab → Bucket policy** — paste this (replace `YOUR-BUCKET-NAME`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
     }]
   }
   ```

### Step 2 — Create a CloudFront distribution

1. Go to **AWS Console → CloudFront → Create distribution**
2. **Origin domain**: select your S3 bucket's website endpoint
   (use the website endpoint URL, not the REST endpoint)
3. **Viewer protocol policy**: Redirect HTTP to HTTPS
4. **Default root object**: `index.html`
5. Click **Create distribution** — takes ~5 minutes to deploy
6. Copy the **Distribution domain name** (e.g. `d1abc123xyz.cloudfront.net`)

### Step 3 — Set up custom domain (tools.simpsonaerospace.com)

In **Namecheap → Domain List → simpsonaerospace.com → Manage → Advanced DNS**:

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | `tools` | `d1abc123xyz.cloudfront.net` | Automatic |

Then in CloudFront → your distribution → **Edit**:
- Add `tools.simpsonaerospace.com` under **Alternate domain names (CNAMEs)**
- Request a free ACM certificate (AWS Certificate Manager) for `tools.simpsonaerospace.com`

### Step 4 — Create an IAM user for GitHub Actions

1. Go to **AWS Console → IAM → Users → Create user**
2. Name: `github-actions-isentropicflow`
3. **Permissions → Attach policies directly** — create a custom inline policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::YOUR-BUCKET-NAME",
           "arn:aws:s3:::YOUR-BUCKET-NAME/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": "cloudfront:CreateInvalidation",
         "Resource": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
       }
     ]
   }
   ```
4. After creating the user → **Security credentials → Create access key** (CLI use case)
5. Save the **Access Key ID** and **Secret Access Key** — shown only once

### Step 5 — Add secrets to GitHub

Go to **GitHub → simpsonchristo/IsentropicFlow → Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | The access key ID from Step 4 |
| `AWS_SECRET_ACCESS_KEY` | The secret access key from Step 4 |
| `AWS_REGION` | Your AWS region (e.g. `us-east-1`) |
| `S3_BUCKET_NAME` | Your bucket name (e.g. `isentropicflow-calculator`) |
| `CLOUDFRONT_DISTRIBUTION_ID` | From CloudFront dashboard (e.g. `E1ABC123XYZ`) |

---

## How Deployments Work After Setup

Every push to `master` automatically:
1. GitHub Actions runs `.github/workflows/deploy.yml`
2. Syncs the `ui/` folder to your S3 bucket (`--delete` removes old files)
3. Invalidates the CloudFront cache so visitors see changes within seconds

```
You push code to master
    → GitHub Actions: aws s3 sync ui/ s3://bucket/ --delete
    → GitHub Actions: aws cloudfront create-invalidation --paths "/*"
    → Live at tools.simpsonaerospace.com within ~30 seconds
```

No releases needed — every push to master is a deploy. If you want to gate
deploys to explicit releases instead, change `on: push: branches: [master]`
to `on: release: types: [published]` in `.github/workflows/deploy.yml`.

---

## Embedding on simpsonaerospace.com

Once `tools.simpsonaerospace.com` is live:

1. Log in to `simpsonaerospace.com/wp-admin/`
2. **Pages → Add New**
3. Title: **Isentropic Flow Calculator**
4. In Gutenberg, click **+** → **Custom HTML**
5. Paste:
   ```html
   <iframe
     src="https://tools.simpsonaerospace.com"
     width="100%"
     height="820"
     frameborder="0"
     title="Isentropic Flow Calculator"
     loading="lazy">
   </iframe>
   ```
6. **Publish**

If building in **Beaver Builder**: drag an **HTML module** into the row,
paste the same `<iframe>` snippet, and save.

---

## Sharing with charles-oneill.com

The calculator URL (`https://tools.simpsonaerospace.com`) works anywhere.
For charles-oneill.com, paste the same iframe snippet into a post or page.
If the site owner doesn't allow raw HTML blocks for non-admins, share the
direct URL — it works as a standalone page in any browser.

---

## Cost Estimate (AWS)

| Service | Estimated cost |
|---|---|
| S3 storage (< 1 MB of HTML/JS/CSS) | < $0.01 / month |
| S3 requests | < $0.01 / month at typical traffic |
| CloudFront (first 1 TB transfer free) | $0 / month under free tier |
| ACM certificate | Free |
| **Total** | **~$0 / month** |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| iframe shows blank page | S3 bucket not public or static hosting not enabled | Re-check bucket policy and static website hosting settings |
| Calculator loads but shows stale content | CloudFront cache not invalidated | Check GitHub Actions ran; manually invalidate from CloudFront console |
| `tools.simpsonaerospace.com` shows SSL error | ACM cert not issued or CNAME not propagated | Wait up to 48 h for DNS; verify CNAME in Namecheap |
| GitHub Actions fails at `aws s3 sync` | Wrong secret name or IAM permissions too narrow | Verify all 5 secrets are set; check IAM policy includes `s3:ListBucket` |
| S3 website endpoint returns 403 | Bucket policy missing or incorrect | Re-paste the bucket policy from Step 1 |
