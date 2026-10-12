# IsentropicFlow — Architecture

## Project Overview

IsentropicFlow is a compressible aerodynamics calculator covering isentropic flow,
normal and oblique shock relations, Fanno flow, Rayleigh flow, and combustor analysis.

The project has two independent layers:

| Layer | Technology | Purpose |
|---|---|---|
| **Python models** | numpy, scipy | CLI tool, offline reference, validated textbook values |
| **Web calculator** | Vanilla HTML + JavaScript | Browser-hosted UI, zero dependencies, embeddable anywhere |

The web UI runs entirely in the browser — no backend server, no API calls, no
external services. All physics calculations are implemented directly in JavaScript,
the same approach used by established calculators such as the Virginia Tech AOE 3114
tool (`devenport.aoe.vt.edu`). This eliminates CORS, cold starts, server costs, and
deployment complexity.

---

## System Architecture

```
Visitor's browser
┌────────────────────────────────────────────────────────────┐
│                  ui/index.html                             │
│                                                            │
│  ┌─────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Input Panel │  │ Results Table │  │  Chart (JS)     │  │
│  │ M, γ, type  │  │ formatted     │  │  variable vs M  │  │
│  └──────┬──────┘  └───────────────┘  └─────────────────┘  │
│         │                                                  │
│         ▼  (no network call)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             ui/physics.js                            │  │
│  │  tt0(g,m)  pp0(g,m)  rr0(g,m)  aa(g,m)             │  │
│  │  m2(g,m)   tts(g,m)  pps(g,m)  nu(g,m)             │  │
│  │  oblique shock (θ-β-M cubic solve)                   │  │
│  │  Fanno / Rayleigh (closed-form + Newton-Raphson)     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         ▲
         │  served as static files by LiteSpeed (no PHP, no Python)
         │
┌────────┴──────────────────────────────────────────────────┐
│  Namecheap cPanel shared hosting                          │
│  /public_html/tools/isentropic/                           │
│  → simpsonaerospace.com/tools/isentropic/                 │
└───────────────────────────────────────────────────────────┘
         ▲
         │  git push to master → GitHub Actions → FTP sync
         │
┌────────┴───────────────┐
│  GitHub repo           │
│  simpsonchristo/       │
│  IsentropicFlow        │
└────────────────────────┘
```

---

## Module Breakdown

### `ui/physics.js` — Browser Calculation Engine (new)

Mirrors the Python models in JavaScript. All functions are pure: `(gamma, mach) → number`.
Where closed-form inversion is not possible (e.g. A/A* → M), Newton-Raphson iteration
converges to `|Δm| < 1e-6`.

| Function | Description |
|---|---|
| `tt0(g, m)` | T/T₀ |
| `pp0(g, m)` | P/P₀ |
| `rr0(g, m)` | ρ/ρ₀ |
| `aa(g, m)` | A/A* (isentropic) |
| `m2(g, m1)` | M₂ after normal shock |
| `tts(g, m)`, `pps(g, m)`, `rrs(g, m)` | Normal shock ratios |
| `nu(g, m)` | Prandtl-Meyer angle (degrees) |
| `mdb(g, m1, theta)` | Oblique shock wave angle β from turn angle θ (cubic solve) |
| Fanno: `fTT(g,m)`, `fPP(g,m)`, `fP0P0(g,m)`, `fUU(g,m)`, `fFLD(g,m)` | Fanno flow ratios |
| Rayleigh: `rTT(g,m)`, `rPP(g,m)`, `rT0T0(g,m)`, `rP0P0(g,m)`, `rUU(g,m)` | Rayleigh flow ratios |
| Inverse solvers: `machFromTT0(g, ratio)`, `machFromPP0(g, ratio)`, etc. | Newton-Raphson Mach lookup |

### `ui/index.html` — Calculator UI (new)
Single self-contained page. Tab-based solver selector, input forms, results table,
Chart.js line chart. No build step, no npm, no framework.

### `ui/styles.css` — Styling (new)
Responsive grid layout, aerospace dark theme. Works at phone width.

### `models/IsentropicFlow.py` — Python CLI (exists, partial)
Retained as a standalone tool for offline use, batch calculations, and as the
validated reference against which the JS implementation is cross-checked.
Not used by the web UI.

### `models/combustor.py`, `oblique_shock.py`, `fanno.py`, `rayleigh.py` — Python extensions (planned)
Python-only. Useful for CLI and for cross-checking JS output during development.

---

## Data Flow — Single Point Calculation (browser-only)

```
User enters M=2, γ=1.4, solver=IFR
    │
    ▼ (no network request)
physics.js: tt0(1.4, 2) → 0.5556
            pp0(1.4, 2) → 0.1278
            rr0(1.4, 2) → 0.2301
            aa(1.4, 2)  → 1.6875
    │
    ▼
app.js updates results table and chart — instant, no latency
```

---

## Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Web calculations | Vanilla JavaScript | Runs in browser, zero dependencies, no server needed |
| Web UI | Plain HTML + CSS | No build step, lives on same domain, no iframe required |
| Charts | Chart.js (bundled) | Small, pure JS line charts |
| Static hosting | Namecheap cPanel (existing) | LiteSpeed serves static files natively; no new services |
| URL | `simpsonaerospace.com/tools/isentropic/` | Same domain as WordPress site, no CNAME needed |
| CI/CD | GitHub Actions + FTP | `SamKirkland/FTP-Deploy-Action` syncs `ui/` on push to master |
| Python reference | numpy, scipy, matplotlib | CLI tool and JS cross-check |

---

## Hosting Environment

### simpsonaerospace.com
Confirmed from WordPress admin inspection:
- **WordPress**: 5.8.18 on Namecheap cPanel shared hosting (LiteSpeed server)
- **Page builder**: Beaver Builder
- **Implication**: PHP-only host, no Python possible. LiteSpeed serves static
  HTML/JS files natively — `ui/` deploys directly to Namecheap via FTP.

### Embedding on WordPress
The calculator is served from the same domain as the WordPress site, so it can
be linked directly as a standalone page at
`simpsonaerospace.com/tools/isentropic/` — no iframe required.

For embedding inside an existing WordPress page, use a Gutenberg Custom HTML
block or Beaver Builder HTML module with an iframe pointing to the same path:

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

No CORS configuration required — same origin throughout.

---

## Directory Structure (Target State)

```
IsentropicFlow/
├── ui/                         # Static web calculator (deployed to S3)
│   ├── index.html              # Single-page calculator UI
│   ├── styles.css              # Responsive aerospace theme
│   ├── app.js                  # UI logic, tab switching, chart rendering
│   └── physics.js              # All compressible flow math in JavaScript
├── models/                     # Python CLI / reference (not deployed to web)
│   ├── IsentropicFlow.py       # Core isentropic + normal shock
│   ├── oblique_shock.py        # Oblique shock (new)
│   ├── fanno.py                # Fanno flow (new)
│   ├── rayleigh.py             # Rayleigh flow (new)
│   └── combustor.py            # Combustor model (stub → complete)
├── tests/
│   ├── test_isentropic.py      # Python unit tests
│   └── test_physics_js.py      # Cross-checks JS output against Python
├── .github/
│   └── workflows/
│       ├── ci.yml              # Run Python tests on PRs
│       └── deploy.yml          # aws s3 sync on push to master
├── main.py                     # Python CLI entry point
└── requirements.txt            # Python deps (numpy, scipy, matplotlib, pytest)
```

---

## Validation & Testing Strategy

- **Python tests**: `pytest tests/` — validates formulas against James John "Gas Dynamics" tables
- **JS cross-check**: `test_physics_js.py` runs Node.js against `physics.js` and compares
  output to Python at matching inputs; ensures the JS and Python never diverge
- Tolerance: ±0.01% of textbook values

---

## Deployment Plan

See `DEPLOYMENT.md` for step-by-step instructions.

| Step | Action |
|---|---|
| 1 | Get FTP credentials from Namecheap cPanel → FTP Accounts |
| 2 | Add `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` to GitHub Secrets |
| 3 | Push to master → GitHub Actions FTP-syncs `ui/` to `/public_html/tools/isentropic/` |
| 4 | Link to or iframe `simpsonaerospace.com/tools/isentropic/` from a WordPress page |

### Site Comparison

| Factor | simpsonaerospace.com | charles-oneill.com/blog/ |
|---|---|---|
| Platform | WordPress on Namecheap | WordPress |
| Your access | Full admin | Depends on arrangement |
| Calculator hosted at | `tools.simpsonaerospace.com` (S3/CloudFront) | Same URL, shared |
| Embed method | Gutenberg Custom HTML / Beaver Builder HTML module | Same iframe if admin access; share URL otherwise |
| CORS needed | No — pure static iframe | No |
