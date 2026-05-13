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

## Phase 2 — REST API

### 2.1 Setup
- [ ] Create `api/` directory with `__init__.py`
- [ ] `pip install fastapi uvicorn[standard]`; add to `requirements.txt`
- [ ] Create `api/app.py` with FastAPI instance

### 2.2 Endpoints
- [ ] `GET /api/health` — liveness check
- [ ] `POST /api/calculate` — single-point calculation for any solver
- [ ] `POST /api/table` — multi-Mach tabular output
- [ ] `POST /api/plot` — returns base64-encoded PNG from matplotlib

### 2.3 API hardening
- [ ] Input validation via Pydantic models
- [ ] CORS middleware (allow `simpsonaerospace.com` + localhost)
- [ ] Error responses with meaningful messages (422 Unprocessable Entity)

---

## Phase 3 — Web UI

### 3.1 Layout & structure (ui/)
- [ ] `ui/index.html` — semantic HTML, tabs for each solver
- [ ] `ui/styles.css` — dark aerospace theme, responsive grid
- [ ] `ui/app.js` — fetch API calls, DOM updates

### 3.2 Solver panels
- [ ] Isentropic Flow (IFR) panel — inputs: M (or ratio), γ; outputs: T/T₀, P/P₀, ρ/ρ₀, A/A*
- [ ] Normal Shock (NSR) panel — inputs: M₁, γ; outputs: M₂, T₂/T₁, P₂/P₁, etc.
- [ ] Oblique Shock (OSR) panel — inputs: M₁, θ or β, γ; weak/strong toggle
- [ ] Fanno Flow panel — inputs: M, γ; outputs: all Fanno ratios + 4fL*/D
- [ ] Rayleigh Flow panel — inputs: M, γ; outputs: all Rayleigh ratios
- [ ] Combustor panel — inputs: inlet conditions + f, η; outputs: exit conditions

### 3.3 Visualization
- [ ] Line chart (Chart.js) — plot any variable vs. Mach range
- [ ] Variable selector dropdown (which quantity to plot)
- [ ] Chart.js local bundle (no CDN dependency)

### 3.4 UX polish
- [ ] Input validation feedback (invalid M < 0, γ ≤ 1)
- [ ] Copy-to-clipboard for results
- [ ] Loading spinner during API call
- [ ] Mobile-responsive layout

---

## Phase 4 — Testing & Deployment

### 4.1 Testing
- [ ] Move inline unit tests from `models/IsentropicFlow.py` to `tests/test_isentropic.py`
- [ ] Add `pytest` + `pytest-cov` to requirements
- [ ] Achieve >90% coverage on all physics modules
- [ ] Integration tests for API endpoints (pytest + httpx)

### 4.2 Packaging
- [ ] Finalize `requirements.txt`
- [ ] Add `Procfile`: `web: uvicorn api.app:app --host 0.0.0.0 --port $PORT`
- [ ] Add `.env.example` with `ALLOWED_ORIGINS=https://simpsonaerospace.com`

### 4.3 Deployment
- [ ] Create account / project on Render or Railway (free tier)
- [ ] Connect GitHub repo → auto-deploy on push to `master`
- [ ] Confirm CORS headers allow simpsonaerospace.com
- [ ] Embed `<iframe>` on simpsonaerospace.com tools page

---

## Session Log

| Date       | Branch                           | Work Done                                              |
|------------|----------------------------------|--------------------------------------------------------|
| 2025-02-25 | master                           | Initial commits: IsentropicFlow class, unit tests, normal shock functions |
| 2026-05-13 | claude/review-docs-plan-ui-U8kGB | Code review; created ARCHITECTURE.md, WORKLOG.md, updated README.md |

---

## Known Bugs / Issues

| ID | File                      | Description                                              | Priority |
|----|---------------------------|----------------------------------------------------------|----------|
| B1 | IsentropicFlow.py:59      | `np.atan` should be `np.arctan`; `3.14159...` should be `np.pi` | High |
| B2 | IsentropicFlow.py:43      | `tts()` formula looks incorrect — should be `(2γM²-(γ-1))/(γ+1) * (2+(γ-1)M²)/(γ+1)M²`; current form may only be valid at specific conditions | High |
| B3 | main.py                   | `isentropicFlow` function defined but never implemented  | Medium   |
| B4 | combustor.py              | Entire class commented out, file is essentially empty    | Medium   |
