# IsentropicFlow — Work Log

---

## Status Legend
- [x] Complete
- [~] Partial / in progress
- [ ] Not started

---

## Phase 0 — What Exists (as of 2025-02-25)

| File                          | Status | Notes                                               |
|-------------------------------|--------|-----------------------------------------------------|
| `models/IsentropicFlow.py`    | [~]    | Core math done; `ifr()`, `aa()`, `__call__()` TODO  |
| `combustor.py`                | [ ]    | Commented-out class skeleton only                   |
| `main.py`                     | [ ]    | Incomplete function stub, no implementation         |
| `requirements.txt`            | [ ]    | Empty                                               |
| `README.md`                   | [ ]    | Empty                                               |

### Implemented and validated (models/IsentropicFlow.py)
- [x] `IsentropicFlow.__init__` — γ validation and storage
- [x] `tt0(m)` — T/T₀
- [x] `pp0(m)` — P/P₀
- [x] `rr0(m)` — ρ/ρ₀
- [x] `tts(m)` — normal shock T₂/T₁
- [x] `pps(m)` — normal shock P₂/P₁
- [x] `rrs(m)` — normal shock ρ₂/ρ₁
- [x] `aas(m)` — normal shock A/A*
- [x] `m2(m1)` — downstream Mach after normal shock
- [x] `nu(m)` — Prandtl-Meyer function
- [x] Unit test suite (James John "Gas Dynamics" tables)

---

## Phase 1 — Complete Backend Core

### 1.1 IsentropicFlow.py extensions
- [ ] Add `aa(m)` — Area-Mach ratio A/A* (isentropic)
- [ ] Implement `ifr(val, item)` — inverse solver: given any ratio, return Mach
- [ ] Implement `__call__()` dispatcher
- [ ] Fix `nu()` — replace `3.14159265359` with `np.pi`; use `np.arctan` not `np.atan`
- [ ] Add unit tests for `aa()` and `ifr()`

### 1.2 Oblique Shock (models/oblique_shock.py) — new file
- [ ] `wave_angle(m1, theta)` — β from M₁ and deflection angle (Newton-Raphson or bisection)
- [ ] `deflection_angle(m1, beta)` — θ from θ-β-M relation
- [ ] `m2_oblique(m1, beta)` — downstream Mach
- [ ] `p2p1(m1, beta)`, `t2t1(m1, beta)`, `rho2rho1(m1, beta)` — ratio across oblique shock
- [ ] `p02_p01(m1, beta)` — stagnation pressure ratio
- [ ] Weak vs. strong shock selection
- [ ] Unit tests against James John Appendix C / Anderson Table A.4

### 1.3 Fanno Flow (models/fanno.py) — new file
- [ ] `tt_star(m)` — T/T*
- [ ] `pp_star(m)` — P/P*
- [ ] `p0p0_star(m)` — P₀/P₀*
- [ ] `uu_star(m)` — U/U*
- [ ] `fld_star(m)` — 4fL*/D
- [ ] `entropy(m)` — (s*-s)/R
- [ ] Unit tests against James John Appendix E

### 1.4 Rayleigh Flow (models/rayleigh.py) — new file
- [ ] `tt0_star(m)` — T₀/T₀*
- [ ] `tt_star(m)` — T/T*
- [ ] `pp_star(m)` — P/P*
- [ ] `p0p0_star(m)` — P₀/P₀*
- [ ] `uu_star(m)` — U/U*
- [ ] `entropy(m)` — (s*-s)/R
- [ ] Unit tests against James John Appendix F

### 1.5 Combustor model (models/combustor.py) — rewrite stub
- [ ] Define `Combustor` class with: `inlet_mach`, `inlet_T`, `inlet_P`, `fuel_air_ratio f`, `eta_c`
- [ ] `stagnation_conditions()` — T₀, P₀ at inlet
- [ ] `heat_addition()` — Q = f * η_c * LHV; ΔT₀ from Rayleigh or energy balance
- [ ] `outlet_conditions()` — exit Mach, T, P after combustion
- [ ] Unit test against worked example from a scramjet/ramjet reference

### 1.6 main.py — CLI entry point
- [ ] Argument parser: `--solver`, `--mach`, `--gamma`, `--range`
- [ ] Tabular output to terminal
- [ ] Optional `--plot` flag generates matplotlib figure

---

## Phase 2 — JavaScript Physics Engine

> **Architecture change (2026-10-12):** No backend server needed. All calculations
> run in the browser in JavaScript — same approach as VT AOE 3114 calculator.
> FastAPI / REST API phase is removed. Python models remain as CLI/reference only.

### 2.1 ui/physics.js — core math
- [x] `tt0(g,m)`, `pp0(g,m)`, `rr0(g,m)` — isentropic ratios
- [x] `aa(g,m)` — area-Mach ratio A/A*
- [x] `nsM2`, `nsP2P1`, `nsRho2Rho1`, `nsT2T1`, `nsP02P01` — normal shock (correct formulas)
- [x] `nu(g,m)` — Prandtl-Meyer angle (Math.atan, Math.PI)
- [x] `mdb(g,m1,theta)` — oblique shock wave angle β (Newton-Raphson on θ-β-M)
- [x] Fanno flow: `fannoTT`, `fannoPP`, `fannoP0P0`, `fannoUU`, `fannoFLD`
- [x] Rayleigh flow: `rayleighTT`, `rayleighPP`, `rayleighT0T0`, `rayleighP0P0`, `rayleighUU`
- [x] Inverse solvers: closed-form for isentropic, bisection for A/A* and Fanno/Rayleigh; all self-tests pass ±0.01%

### 2.2 Cross-validation
- [ ] Write `tests/test_physics_js.py` — runs Node.js on `physics.js`, compares
  output to Python models at identical inputs; tolerance ±0.01%

---

## Phase 3 — Web UI

### 3.1 Layout & structure (ui/)
- [ ] `ui/index.html` — semantic HTML, tab-based solver selector, no external deps
- [ ] `ui/styles.css` — dark aerospace theme, responsive grid, phone-width safe
- [ ] `ui/app.js` — tab switching, reads inputs, calls physics.js, renders table + chart

### 3.2 Solver panels
- [ ] Isentropic Flow (IFR) — inputs: M (or any ratio), γ; outputs: T/T₀, P/P₀, ρ/ρ₀, A/A*
- [ ] Normal Shock (NSR) — inputs: M₁, γ; outputs: M₂ + all ratios
- [ ] Oblique Shock (OSR) — inputs: M₁, θ or β, γ; weak/strong toggle
- [ ] Fanno Flow — inputs: M, γ; outputs: all Fanno ratios + 4fL*/D
- [ ] Rayleigh Flow — inputs: M, γ; outputs: all Rayleigh ratios

### 3.3 Visualization
- [ ] Chart.js line chart — any variable vs. Mach range
- [ ] Variable selector dropdown
- [ ] Chart.js bundled locally (no CDN)

### 3.4 UX polish
- [ ] Input validation (M ≤ 0 or γ ≤ 1 shows inline error, no alert())
- [ ] Copy-to-clipboard for results table
- [ ] Mobile-responsive layout

---

## Phase 4 — Testing & Deployment

### 4.1 Testing
- [ ] Move inline Python unit tests to `tests/test_isentropic.py`
- [ ] `pytest` + `pytest-cov` in requirements; target >90% Python coverage
- [ ] `tests/test_physics_js.py` cross-checks JS against Python

### 4.2 Namecheap FTP Setup (one-time, see DEPLOYMENT.md for full steps)
- [ ] Get FTP credentials from Namecheap cPanel → FTP Accounts
- [ ] Add 3 GitHub Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`

### 4.3 Deployment

Every push to `master` → GitHub Actions syncs `ui/` to S3 and invalidates CloudFront.

**simpsonaerospace.com**
- [ ] Create WordPress page `/tools/isentropic-flow-calculator/`
- [ ] Add Gutenberg Custom HTML block with `<iframe src="https://tools.simpsonaerospace.com" ...>`
  (or Beaver Builder HTML module with the same snippet)

**charles-oneill.com/blog/**
- [ ] Confirm access level with site owner
- [ ] If admin: same iframe embed
- [ ] Otherwise: share `https://tools.simpsonaerospace.com` for owner to embed

---

## Session Log

| Date       | Branch                           | Work Done                                              |
|------------|----------------------------------|--------------------------------------------------------|
| 2025-02-25 | master                           | Initial commits: IsentropicFlow class, unit tests, normal shock functions |
| 2026-05-13 | claude/review-docs-plan-ui-U8kGB | Code review; created ARCHITECTURE.md, WORKLOG.md, updated README.md and requirements.txt; merged PR #5 to master |
| 2026-05-13 | claude/review-docs-plan-ui-U8kGB | Deployment analysis: both simpsonaerospace.com and charles-oneill.com/blog/ are WordPress; FastAPI backend must be hosted externally (Render); frontend delivered via iframe; full CORS and integration details added to ARCHITECTURE.md and Phase 4.3 of WORKLOG.md |
| 2026-10-12 | claude/review-docs-plan-ui-U8kGB | Hosting confirmed from WP admin page: Namecheap cPanel shared hosting (LiteSpeed server, Beaver Builder, WP 5.8.18). Researched VT AOE 3114 calculator — confirmed pure client-side JS, no backend. Architecture revised: no FastAPI/backend needed; all math in JavaScript; static files to AWS S3 + CloudFront. Rewrote ARCHITECTURE.md, DEPLOYMENT.md, deploy.yml (aws s3 sync on push to master), WORKLOG phases 2-4; removed Render/FastAPI references |
| 2026-10-12 | claude/review-docs-plan-ui-U8kGB | Simplified deployment: S3/CloudFront replaced with direct FTP to Namecheap (existing host). Updated deploy.yml (SamKirkland/FTP-Deploy-Action), DEPLOYMENT.md (3-secret setup, cPanel FTP steps, LiteSpeed cache note), ARCHITECTURE.md (hosting diagram, tech stack, embed section) |
| 2026-10-12 | claude/review-docs-plan-ui-U8kGB | Built ui/physics.js: all compressible flow math in JS (isentropic, normal shock, oblique shock, Prandtl-Meyer, Fanno, Rayleigh, inverse solvers); all self-tests pass against James John tables |

---

## Alternative Deployment Option (Future Exploration)

Namecheap cPanel also supports Python app deployment (Setup Python App in cPanel → select
Python version → point to a WSGI entry point). This would allow running a FastAPI/Flask
backend on the same host that serves simpsonaerospace.com, eliminating the need for FTP
sync and enabling server-side features in the future (e.g. batch export, saved sessions).
Identified during Phase 3 planning but not pursued — the pure-JS static approach is
simpler and avoids PHP/Python hosting constraints. Revisit if the FTP workflow hits issues
or a backend is needed.

---

## Known Bugs / Issues

| ID | File                      | Description                                              | Priority |
|----|---------------------------|----------------------------------------------------------|----------|
| B1 | IsentropicFlow.py:59      | `np.atan` should be `np.arctan`; `3.14159...` should be `np.pi` | High |
| B2 | IsentropicFlow.py:43      | `tts()` formula looks incorrect — should be `(2γM²-(γ-1))/(γ+1) * (2+(γ-1)M²)/(γ+1)M²`; current form may only be valid at specific conditions | High |
| B3 | main.py                   | `isentropicFlow` function defined but never implemented  | Medium   |
| B4 | combustor.py              | Entire class commented out, file is essentially empty    | Medium   |
