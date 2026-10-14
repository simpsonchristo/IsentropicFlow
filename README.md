# IsentropicFlow

A compressible aerodynamics calculator from [Simpson Aerospace](https://simpsonaerospace.com):
isentropic flow, normal and oblique shocks, Prandtl-Meyer expansion, Fanno flow and Rayleigh flow.

**Use it online: <https://simpsonaerospace.com/tools/isentropic/>**

Results and the plot update live as you type. All math runs in your browser (pure client-side
JavaScript, no server), and the Python models are kept as a reference implementation and
command-line library.

---

## Features

- Five solver tabs: Isentropic, Normal Shock, Oblique Shock (weak), Fanno, Rayleigh
- Live recalculation on every input change (no Calculate button)
- Plot any ratio against Mach number (or θ for oblique shocks), with the governing equation
  drawn on the chart
- Plots follow the Mack (JM3 2014) journal-figure recipe: white plot area, black box, major and
  minor ticks on all four edges, no gridlines, grayscale-safe
- The physics engine (`ui/physics.js`) includes inverse solvers (closed form or bisection) for Mach
  from a given ratio; the UI does not expose them yet
- Single-column layout on narrow screens; Chart.js is bundled locally, so there are no external
  dependencies

## Solver status

| Solver                 | Web UI (`ui/`) | Python (`models/`)                    |
|------------------------|----------------|---------------------------------------|
| Isentropic flow        | Done           | T/T₀, P/P₀, ρ/ρ₀, A/A* done           |
| Normal shock           | Done           | M₂, T₂/T₁, P₂/P₁, ρ₂/ρ₁ done          |
| Prandtl-Meyer          | Done           | ν(M) done                             |
| Oblique shock          | Done (weak)    | Not started                           |
| Fanno flow             | Done           | Not started                           |
| Rayleigh flow          | Done           | Not started                           |
| Combustor              | Not started    | Not started                           |
| Standard atmosphere    | Planned        | Planned ([see issues][issues])        |

Conical shock relations and the other open enhancements are tracked in the
[issues][issues].

---

## Run it locally

The web calculator is static files, so there is nothing to build:

```bash
git clone https://github.com/simpsonchristo/IsentropicFlow.git
cd IsentropicFlow
python3 -m http.server --directory ui 8000   # then open http://localhost:8000
```

Opening `ui/index.html` directly in a browser also works.

### Tests

```bash
# JS physics self-tests (James John table values, ±0.01%); exits 1 on any failure
node -e "process.exit(require('./ui/physics.js')._selfTest() ? 0 : 1)"

# Python inline unit tests; exits 1 on any failure
pip install -r requirements.txt
python models/IsentropicFlow.py
```

CI runs both on every pull request and every push to `master`.

---

## Usage (Python)

```python
from models.IsentropicFlow import IsentropicFlow

flow = IsentropicFlow(gamma=1.4)

# Isentropic relations at Mach 2
print(flow.tt0(2))   # T/T0     = 0.5556
print(flow.pp0(2))   # P/P0     = 0.1278
print(flow.rr0(2))   # rho/rho0 = 0.2301
print(flow.aas(2))   # A/A*     = 1.6875

# Normal shock at Mach 2
print(flow.m2(2))    # M2    = 0.5774
print(flow.pps(2))   # P2/P1 = 4.5
print(flow.rrs(2))   # rho2/rho1 = 2.6667
print(flow.tts(2))   # T2/T1 = 1.6875

# Prandtl-Meyer angle at Mach 2
print(flow.nu(2))    # nu = 26.38 deg
```

---

## Repository layout

```
ui/                 Web calculator (index.html, app.js, physics.js, styles.css, chart.umd.js)
models/             Python reference models
.github/workflows/  CI (Python tests) and FTP deploy to the website
ARCHITECTURE.md     System design
DEPLOYMENT.md       Hosting and FTP deploy setup
WORKLOG.md          Task backlog, known bugs and session log
```

## Deployment

A push to `master` triggers GitHub Actions, which FTP-syncs `ui/` to
`simpsonaerospace.com/tools/isentropic/`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the one-time
FTP and secrets setup.

## Contributing

Enhancement requests live in the [issues][issues]. Work on a branch and open a pull request into
`master`; CI runs on every pull request.

## References

All implemented relations are validated against published gas dynamics tables:
- James E.A. John, *Gas Dynamics* (2nd ed.), primary reference
- John D. Anderson, *Modern Compressible Flow*, secondary cross-check

Plot style: Mack, *JM3* 2014 editorial plot recipe (see WORKLOG).

## Acknowledgements

Written with Dr. Charles O'Neill: <https://charles-oneill.com/blog/>. He wrote the original
unit-test harness and normal-shock tests, reviewed the live calculator, suggested live updating
of results and plots, and has offered to add the standard atmosphere ([#11][atm]).

## License

MIT

[issues]: https://github.com/simpsonchristo/IsentropicFlow/issues
[atm]: https://github.com/simpsonchristo/IsentropicFlow/issues/11
