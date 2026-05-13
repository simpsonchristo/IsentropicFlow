# IsentropicFlow

A compressible aerodynamics calculator for isentropic flow, normal/oblique shock relations,
Fanno flow, Rayleigh flow, and combustor analysis. Designed to be used as a Python library,
CLI tool, or web calculator embedded on [simpsonaerospace.com](https://simpsonaerospace.com).

---

## Current Capabilities

| Solver                 | Status       | Description                                    |
|------------------------|-------------|------------------------------------------------|
| Isentropic Flow (IFR)  | Partial     | T/T₀, P/P₀, ρ/ρ₀ — A/A* and inverse lookup TODO |
| Normal Shock (NSR)     | Complete    | M₂, T₂/T₁, P₂/P₁, ρ₂/ρ₁, A/A*               |
| Prandtl-Meyer (PM)     | Complete    | ν(M) expansion angle                          |
| Oblique Shock (OSR)    | Not started | θ-β-M relations, weak/strong selection        |
| Fanno Flow             | Not started | Friction-dominated duct flow                  |
| Rayleigh Flow          | Not started | Heat-addition duct flow                       |
| Combustor              | Not started | Inlet → combustion → nozzle                   |

---

## Quick Start

```bash
git clone https://github.com/simpsonchristo/isentropicflow.git
cd isentropicflow
pip install -r requirements.txt
python models/IsentropicFlow.py   # runs unit tests
```

---

## Usage (Python)

```python
from models.IsentropicFlow import IsentropicFlow

flow = IsentropicFlow(gamma=1.4)

# Isentropic relations at Mach 2
print(flow.tt0(2))   # T/T0 = 0.5556
print(flow.pp0(2))   # P/P0 = 0.1278
print(flow.rr0(2))   # rho/rho0 = 0.2301

# Normal shock at Mach 2
print(flow.m2(2))    # M2 = 0.5774
print(flow.pps(2))   # P2/P1 = 4.5

# Prandtl-Meyer angle at Mach 2
print(flow.nu(2))    # nu = 26.38 deg
```

---

## References

All implemented relations are validated against published gas dynamics tables:
- James E.A. John, *Gas Dynamics* (2nd ed.) -- primary reference
- John D. Anderson, *Modern Compressible Flow* -- secondary cross-check

---

## Project Roadmap

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design and
[WORKLOG.md](WORKLOG.md) for the detailed task backlog and session log.

**Planned phases:**
1. Complete backend physics (oblique shock, Fanno, Rayleigh, combustor)
2. REST API with FastAPI
3. Web UI (vanilla JS, Chart.js) embeddable on simpsonaerospace.com
4. Deployment to Render / Railway with CORS for simpsonaerospace.com

---

## License

MIT
