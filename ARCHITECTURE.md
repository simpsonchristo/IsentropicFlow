# IsentropicFlow — Architecture

## Project Overview

IsentropicFlow is a compressible aerodynamics calculator covering isentropic flow,
normal and oblique shock relations, Fanno flow, Rayleigh flow, and combustor analysis.
The end state is a Python computation engine exposed through a REST API with a
browser-based calculator UI embeddable on simpsonaerospace.com.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Web UI)                         │
│   simpsonaerospace.com or standalone hosted page                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Input Panel │  │  Results     │  │  Plot / Chart Panel  │  │
│  │  (Mach, γ,   │  │  Table       │  │  (matplotlib/        │  │
│  │   solver     │  │              │  │   Chart.js)          │  │
│  │   select)    │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│         └────────── fetch/XHR ───────────────────────────────┐  │
└─────────────────────────────────────────────────────────────────┘
                                                               │
                                    ┌──────────────────────────▼──┐
                                    │        REST API             │
                                    │   Flask or FastAPI          │
                                    │                             │
                                    │  POST /api/calculate        │
                                    │  GET  /api/plot             │
                                    │  GET  /api/table            │
                                    └──────────────┬──────────────┘
                                                   │
                                    ┌──────────────▼──────────────┐
                                    │      Computation Layer      │
                                    │                             │
                                    │  models/IsentropicFlow.py   │
                                    │  models/combustor.py        │
                                    │  models/oblique_shock.py    │
                                    │  models/fanno.py            │
                                    │  models/rayleigh.py         │
                                    └─────────────────────────────┘
```

---

## Module Breakdown

### `models/IsentropicFlow.py` — Core Engine (exists, partial)
Handles all isentropic and normal-shock relations for a given γ.

| Method       | Status      | Description                                      |
|-------------|-------------|--------------------------------------------------|
| `__init__`  | Complete    | Validates γ, stores solver type                  |
| `tt0(m)`    | Complete    | Temperature ratio T/T₀                           |
| `pp0(m)`    | Complete    | Pressure ratio P/P₀                              |
| `rr0(m)`    | Complete    | Density ratio ρ/ρ₀                               |
| `tts(m)`    | Complete    | Normal shock temperature ratio T₂/T₁             |
| `pps(m)`    | Complete    | Normal shock pressure ratio P₂/P₁                |
| `rrs(m)`    | Complete    | Normal shock density ratio ρ₂/ρ₁                 |
| `aas(m)`    | Complete    | Normal shock area ratio A/A*                     |
| `nu(m)`     | Complete    | Prandtl-Meyer function ν(M) (degrees)            |
| `m2(m1)`    | Complete    | Mach after normal shock M₂                       |
| `aa(m)`     | **Missing** | Area-Mach ratio A/A* (isentropic)               |
| `ifr(val, item)` | **TODO** | Inverse lookup: given ratio → find Mach         |
| `__call__`  | **TODO**    | Unified dispatcher across all solver types       |

**Missing solver modules to add:**

### `models/oblique_shock.py` — Oblique Shock Relations (new)
- `wave_angle(m1, theta)` — solve β from M₁ and deflection angle θ
- `deflection_angle(m1, beta)` — θ from M₁ and β
- `m2_oblique(m1, beta)` — downstream Mach
- `p2p1(m1, beta)`, `t2t1(m1, beta)`, `rho2rho1(m1, beta)`
- Strong vs. weak shock selection

### `models/fanno.py` — Fanno Flow (new)
Adiabatic flow with friction in a constant-area duct.
- `tt_star(m)` — T/T*
- `pp_star(m)` — P/P*
- `p0p0_star(m)` — P₀/P₀*
- `uu_star(m)` — U/U* (= ρ*/ρ)
- `fld_star(m)` — 4fL*/D
- `entropy(m)` — (s*-s)/R

### `models/rayleigh.py` — Rayleigh Flow (new)
Frictionless flow with heat addition in a constant-area duct.
- `tt0_star(m)` — T₀/T₀*
- `tt_star(m)` — T/T*
- `pp_star(m)` — P/P*
- `p0p0_star(m)` — P₀/P₀*
- `uu_star(m)` — U/U*
- `entropy(m)` — (s*-s)/R

### `models/combustor.py` — Combustor/Vehicle (exists, stub)
Integrates the physics modules into a simple gas turbine / scramjet combustor model.
```
inlet conditions → isentropic compression → combustor (Rayleigh) → nozzle expansion
```
Planned inputs: inlet Mach, inlet T, inlet P, fuel-air ratio f, combustion efficiency η_c.

### `api/app.py` — REST API (new)
Framework: **FastAPI** (preferred — automatic OpenAPI docs, async, lightweight)

| Endpoint           | Method | Payload                              | Response              |
|--------------------|--------|--------------------------------------|-----------------------|
| `/api/calculate`   | POST   | `{solver, mach, gamma, ...params}`   | JSON result object    |
| `/api/table`       | POST   | `{solver, mach_range, gamma}`        | JSON array of rows    |
| `/api/plot`        | POST   | `{solver, mach_range, gamma}`        | Base64 PNG or SVG     |
| `/api/health`      | GET    | —                                    | `{"status":"ok"}`     |

### `ui/` — Web Interface (new)
Self-contained static HTML/CSS/JS — no build step required, easily embeddable.

```
ui/
├── index.html          # Single-page app entry point
├── styles.css          # Responsive layout, aerospace dark theme
├── app.js              # Fetch calls, DOM updates, chart rendering
└── chart.min.js        # Chart.js (local copy, no CDN dependency)
```

**UI Panels:**
1. **Solver Selector** — tabs: IFR | NSR | OSR | Fanno | Rayleigh | Combustor
2. **Parameter Inputs** — Mach number / range, γ, solver-specific fields
3. **Results Table** — formatted output, copyable values
4. **Plot Panel** — renders curve for selected variable vs. Mach range
5. **About / Reference** — equation reference, textbook citations

---

## Data Flow — Single Point Calculation

```
User enters M=2, γ=1.4, solver=IFR
    │
    ▼
app.js: fetch POST /api/calculate {solver:"ifr", mach:2, gamma:1.4}
    │
    ▼
FastAPI route → IsentropicFlow(gamma=1.4)
    │           → tt0(2), pp0(2), rr0(2), aa(2)
    ▼
JSON response: {T_T0: 0.5556, P_P0: 0.1278, rho_rho0: 0.2301, A_Astar: 1.6875}
    │
    ▼
app.js populates results table and triggers chart update
```

---

## Technology Stack

| Layer         | Choice       | Rationale                                              |
|---------------|-------------|--------------------------------------------------------|
| Physics       | Python 3.11+ | Existing code, numpy/scipy available                   |
| Web framework | FastAPI      | Lightweight, async, auto-docs, easy Vercel/Railway deploy |
| Frontend      | Vanilla JS   | Zero build step, easy iframe embed, no framework lock-in |
| Charts        | Chart.js     | Small bundle, good line chart support, pure JS         |
| Styling       | Plain CSS    | Matches aerospace-professional aesthetic, no framework needed |
| Hosting       | Vercel / Railway / Render (free tier) | One-command deploy from git |

---

## Embedding the Calculator

The UI is designed to be embedded as an `<iframe>` on any WordPress page via a
Gutenberg **Custom HTML** block:

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

Alternatively, the `ui/` directory can be served from a subdomain
(e.g. `tools.simpsonaerospace.com`) with a reverse-proxy pointing at the
Render/Railway app, making the tool fully on-brand with no iframe border.

---

## Directory Structure (Target State)

```
IsentropicFlow/
├── models/
│   ├── IsentropicFlow.py       # Core isentropic + normal shock (extend)
│   ├── oblique_shock.py        # Oblique shock relations (new)
│   ├── fanno.py                # Fanno flow (new)
│   ├── rayleigh.py             # Rayleigh flow (new)
│   └── combustor.py            # Combustor/vehicle model (stub → complete)
├── api/
│   ├── __init__.py
│   └── app.py                  # FastAPI application
├── ui/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/
│   ├── test_isentropic.py
│   ├── test_oblique.py
│   ├── test_fanno.py
│   └── test_rayleigh.py
├── main.py                     # CLI entry point
├── requirements.txt
└── README.md
```

---

## Validation & Testing Strategy

All physics implementations are validated against published gas dynamics tables:
- **James John, "Gas Dynamics"** — primary reference (already used in existing tests)
- **Anderson, "Modern Compressible Flow"** — secondary cross-check
- Unit tests live in `tests/` and use `pytest`
- Tolerance: ±0.1% of textbook values

---

## Deployment Plan

### Backend (shared by all embedding sites)

The FastAPI app cannot run inside a WordPress server (PHP-only). It must be
hosted on a separate Python-capable service and called by the browser via CORS.

| Step | Action |
|------|--------|
| 1 | `uvicorn api.app:app --reload` — local dev |
| 2 | Push to GitHub; connect repo to **Render** free web service |
| 3 | Set env var `ALLOWED_ORIGINS` to comma-separated list of allowed origins |
| 4 | Add `Procfile`: `web: uvicorn api.app:app --host 0.0.0.0 --port $PORT` |

### Target Embedding Sites — Comparison

Both target sites run **WordPress**. WordPress is PHP-based and cannot host
Python processes directly, so the embedding approach is identical for both;
the differences are access level and integration depth.

| Factor | simpsonaerospace.com | charles-oneill.com/blog/ |
|--------|----------------------|--------------------------|
| Platform | WordPress | WordPress |
| Your access level | Full admin | Depends on arrangement with site owner |
| Backend hosting | External — Render / Railway | Same external service |
| Frontend delivery | iframe or subdomain | iframe (if owner allows raw HTML in posts) |
| Custom domain for tool | Yes — `tools.simpsonaerospace.com` | Unlikely without owner's DNS access |
| CORS origin to allow | `https://simpsonaerospace.com` | `https://charles-oneill.com` |
| On-brand integration depth | Full control (subdomain, custom CSS) | Limited to iframe unless owner cooperates |

#### simpsonaerospace.com (your site — full control)

Recommended integration path:
1. Create a WordPress page at `/tools/isentropic-flow/`
2. Add a **Gutenberg → Custom HTML** block with the `<iframe>` snippet above
3. Optionally: point `tools.simpsonaerospace.com` via CNAME to the Render app
   for a seamless no-border experience

#### charles-oneill.com/blog/ (external site)

- If you have **admin** access: identical process to simpsonaerospace.com
- If you have **editor/author** access only: WordPress blocks raw `<iframe>` tags
  for non-admins by default; the site owner must either whitelist the tag or paste
  the block themselves
- Minimum viable path: share the hosted URL — owner pastes a single iframe block

### CORS Configuration

```python
# api/app.py
import os
from fastapi.middleware.cors import CORSMiddleware

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_methods=["GET", "POST"], allow_headers=["*"])
```

Set on Render:
```
ALLOWED_ORIGINS=https://simpsonaerospace.com,https://charles-oneill.com
```
