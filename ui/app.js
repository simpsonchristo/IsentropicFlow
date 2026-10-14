/* app.js — UI logic for IsentropicFlow calculator */
(function () {
  "use strict";

  var P = window.Physics;  // set by physics.js

  // ── Solver definitions ────────────────────────────────────────────────
  // Each solver: { compute(inputs) → rows[], chartVars[], chartFn(g,m) → {key:val} }

  var SOLVERS = {
    ifr: {
      title: "Isentropic Flow",
      chartVars: [
        { key: "tt0",  label: "T/T₀" },
        { key: "pp0",  label: "P/P₀" },
        { key: "rr0",  label: "ρ/ρ₀" },
        { key: "aa",   label: "A/A*" },
        { key: "nu",   label: "ν (PM°)" },
      ],
      compute: function (g, m) {
        if (m <= 0) return null;
        return [
          { sym: "M",    label: "Mach Number",              val: m },
          { sym: "γ",    label: "Ratio of Specific Heats",  val: g },
          { sym: "T/T₀", label: "Static/Stagnation Temp",   val: P.tt0(g, m) },
          { sym: "P/P₀", label: "Static/Stagnation Press",  val: P.pp0(g, m) },
          { sym: "ρ/ρ₀", label: "Static/Stagnation Density",val: P.rr0(g, m) },
          { sym: "A/A*", label: "Area Ratio",                val: P.aa(g, m) },
          { sym: "ν°",   label: "Prandtl-Meyer Angle",      val: m >= 1 ? P.nu(g, m) : NaN },
        ];
      },
      chartFn: function (g, m) {
        return {
          tt0: P.tt0(g, m),
          pp0: P.pp0(g, m),
          rr0: P.rr0(g, m),
          aa:  P.aa(g, m),
          nu:  m >= 1 ? P.nu(g, m) : null,
        };
      },
    },

    nsr: {
      title: "Normal Shock",
      chartVars: [
        { key: "m2",    label: "M₂" },
        { key: "p2p1",  label: "P₂/P₁" },
        { key: "r2r1",  label: "ρ₂/ρ₁" },
        { key: "t2t1",  label: "T₂/T₁" },
        { key: "p02p01",label: "P₀₂/P₀₁" },
      ],
      compute: function (g, m1) {
        if (m1 < 1) return null;
        return [
          { sym: "M₁",       label: "Upstream Mach",         val: m1 },
          { sym: "M₂",       label: "Downstream Mach",        val: P.nsM2(g, m1) },
          { sym: "P₂/P₁",    label: "Static Pressure Ratio",  val: P.nsP2P1(g, m1) },
          { sym: "ρ₂/ρ₁",    label: "Density Ratio",          val: P.nsRho2Rho1(g, m1) },
          { sym: "T₂/T₁",    label: "Temperature Ratio",      val: P.nsT2T1(g, m1) },
          { sym: "P₀₂/P₀₁",  label: "Stagnation Press Ratio", val: P.nsP02P01(g, m1) },
        ];
      },
      chartFn: function (g, m) {
        if (m < 1) return null;
        return {
          m2:     P.nsM2(g, m),
          p2p1:   P.nsP2P1(g, m),
          r2r1:   P.nsRho2Rho1(g, m),
          t2t1:   P.nsT2T1(g, m),
          p02p01: P.nsP02P01(g, m),
        };
      },
    },

    osr: {
      title: "Oblique Shock (weak)",
      chartVars: [
        { key: "beta",  label: "β (wave angle°)" },
        { key: "p2p1",  label: "P₂/P₁" },
        { key: "t2t1",  label: "T₂/T₁" },
      ],
      compute: function (g, m1, theta) {
        if (m1 < 1 || theta <= 0) return null;
        var beta = P.mdb(g, m1, theta);
        if (!isFinite(beta)) return null;
        return [
          { sym: "M₁",   label: "Upstream Mach",        val: m1 },
          { sym: "θ°",   label: "Deflection Angle",      val: theta },
          { sym: "β°",   label: "Wave Angle (weak)",     val: beta },
          { sym: "M₂",   label: "Downstream Mach",       val: P.obliqueM2(g, m1, beta) },
          { sym: "P₂/P₁",label: "Static Pressure Ratio", val: P.obliqueP2P1(g, m1, beta) },
          { sym: "T₂/T₁",label: "Temperature Ratio",     val: P.obliqueT2T1(g, m1, beta) },
        ];
      },
      // Chart: vary theta 1°→45° at fixed M1 and gamma
      chartFn: null,
    },

    fanno: {
      title: "Fanno Flow",
      chartVars: [
        { key: "tt",   label: "T/T*" },
        { key: "pp",   label: "P/P*" },
        { key: "p0p0", label: "P₀/P₀*" },
        { key: "uu",   label: "U/U*" },
        { key: "fld",  label: "4fL*/D" },
      ],
      compute: function (g, m) {
        if (m <= 0) return null;
        return [
          { sym: "M",      label: "Mach Number",     val: m },
          { sym: "T/T*",   label: "Temperature",     val: P.fannoTT(g, m) },
          { sym: "P/P*",   label: "Pressure",        val: P.fannoPP(g, m) },
          { sym: "P₀/P₀*", label: "Stag. Pressure",  val: P.fannoP0P0(g, m) },
          { sym: "U/U*",   label: "Velocity",        val: P.fannoUU(g, m) },
          { sym: "4fL*/D", label: "Friction Length",  val: P.fannoFLD(g, m) },
        ];
      },
      chartFn: function (g, m) {
        if (m <= 0) return null;
        return {
          tt:   P.fannoTT(g, m),
          pp:   P.fannoPP(g, m),
          p0p0: P.fannoP0P0(g, m),
          uu:   P.fannoUU(g, m),
          fld:  P.fannoFLD(g, m),
        };
      },
    },

    rayleigh: {
      title: "Rayleigh Flow",
      chartVars: [
        { key: "t0t0", label: "T₀/T₀*" },
        { key: "tt",   label: "T/T*" },
        { key: "pp",   label: "P/P*" },
        { key: "p0p0", label: "P₀/P₀*" },
        { key: "uu",   label: "U/U*" },
      ],
      compute: function (g, m) {
        if (m <= 0) return null;
        return [
          { sym: "M",       label: "Mach Number",    val: m },
          { sym: "T₀/T₀*",  label: "Stag. Temp",    val: P.rayleighT0T0(g, m) },
          { sym: "T/T*",    label: "Temperature",    val: P.rayleighTT(g, m) },
          { sym: "P/P*",    label: "Pressure",       val: P.rayleighPP(g, m) },
          { sym: "P₀/P₀*",  label: "Stag. Pressure", val: P.rayleighP0P0(g, m) },
          { sym: "U/U*",    label: "Velocity",       val: P.rayleighUU(g, m) },
        ];
      },
      chartFn: function (g, m) {
        if (m <= 0) return null;
        return {
          t0t0: P.rayleighT0T0(g, m),
          tt:   P.rayleighTT(g, m),
          pp:   P.rayleighPP(g, m),
          p0p0: P.rayleighP0P0(g, m),
          uu:   P.rayleighUU(g, m),
        };
      },
    },
  };

  // ── State ─────────────────────────────────────────────────────────────
  var activeTab = "ifr";
  var chart = null;
  var chartMeta = { xLabel: "", varLabel: "" };

  // ── Helpers ───────────────────────────────────────────────────────────

  function val(id) { return parseFloat(document.getElementById(id).value); }
  function el(id)  { return document.getElementById(id); }

  function setError(solver, msg) {
    var e = el(solver + "-error");
    if (e) e.textContent = msg || "";
  }

  function fmt(n) {
    if (n == null || !isFinite(n)) return "—";
    if (Math.abs(n) < 1e-4 && n !== 0) return n.toExponential(5);
    if (Math.abs(n) >= 1e5) return n.toExponential(5);
    return n.toPrecision(6).replace(/\.?0+$/, "");
  }

  function renderResults(solver, rows) {
    var container = el(solver + "-results");
    if (!rows) {
      container.innerHTML = "<span class='results-placeholder'>Invalid input for this solver.</span>";
      return;
    }
    var html = "<table class='results-table'>" +
      "<caption>" + SOLVERS[solver].title + "</caption>" +
      "<thead><tr><th>Symbol</th><th>Quantity</th><th>Value</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr><td>" + r.sym + "</td><td>" + r.label + "</td><td>" + fmt(r.val) + "</td></tr>";
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  }

  // ── Tab switching ──────────────────────────────────────────────────────

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".panel").forEach(function (p) {
        p.classList.remove("active");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      var tab = btn.dataset.tab;
      el("panel-" + tab).classList.add("active");
      activeTab = tab;
      populateChartVars(tab);
      updateChart();
    });
  });

  // ── Live calculation (recompute on every input change) ─────────────────

  var SOLVER_IDS = ["ifr", "nsr", "osr", "fanno", "rayleigh"];

  function calculate(solver) {
    setError(solver, "");
    var g = val(solver + "-gamma");
    var m = val(solver + "-mach");
    var rows = null;

    if (!isFinite(g) || g <= 1) {
      setError(solver, "γ must be > 1");
    } else if (solver === "osr") {
      var theta = val("osr-theta");
      if (!isFinite(m) || m < 1) setError(solver, "M₁ must be ≥ 1");
      else if (!isFinite(theta) || theta <= 0 || theta >= 90) setError(solver, "θ must be between 0° and 90°");
      else rows = SOLVERS[solver].compute(g, m, theta);
    } else if (!isFinite(m) || m <= 0) {
      setError(solver, "M must be > 0");
    } else if (solver === "nsr" && m < 1) {
      setError(solver, "Normal shock requires M₁ ≥ 1");
    } else {
      rows = SOLVERS[solver].compute(g, m);
    }
    renderResults(solver, rows);
  }

  SOLVER_IDS.forEach(function (solver) {
    var panel = el("panel-" + solver);
    panel.querySelectorAll("input[type=number]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        calculate(solver);
        updateChart();
      });
    });
  });

  // ── Chart ─────────────────────────────────────────────────────────────
  // Adapted from Scientific & Technical Plot Style Guide (Mack JM3 2014):
  // no gridlines, no fill, no legend, solid 1.5pt line, Okabe-Ito palette,
  // plot-box border, axis labels as "quantity (unit)".

  var LINE_COLOR = "#0072B2";  // Okabe-Ito dark blue: survives grayscale copy on white

  var EQUATIONS = {
    "ifr.tt0":   "T/T₀ = [1 + (γ−1)M²/2]⁻¹",
    "ifr.pp0":   "P/P₀ = (T/T₀)^[γ/(γ−1)]",
    "ifr.rr0":   "ρ/ρ₀ = (T/T₀)^[1/(γ−1)]",
    "ifr.aa":    "A/A* = (1/M)[(2/(γ+1))(1+(γ−1)M²/2)]^[(γ+1)/(2(γ−1))]",
    "ifr.nu":    "ν = √((γ+1)/(γ−1)) atan√((γ−1)(M²−1)/(γ+1)) − atan√(M²−1)",
    "nsr.m2":    "M₂ = √{[2+(γ−1)M₁²] / [2γM₁²−(γ−1)]}",
    "nsr.p2p1":  "P₂/P₁ = [2γM₁² − (γ−1)] / (γ+1)",
    "nsr.r2r1":  "ρ₂/ρ₁ = (γ+1)M₁² / [2+(γ−1)M₁²]",
    "nsr.t2t1":  "T₂/T₁ = (P₂/P₁)(ρ₁/ρ₂)",
    "nsr.p02p01":"P₀₂/P₀₁ = [(γ+1)M₁²/(2+(γ−1)M₁²)]^[γ/(γ−1)] [(γ+1)/(2γM₁²−(γ−1))]^[1/(γ−1)]",
    "osr.beta":  "tanθ = 2cotβ (M₁²sin²β−1) / [M₁²(γ+cos2β)+2]",
    "osr.p2p1":  "P₂/P₁ = [2γMₙ²−(γ−1)]/(γ+1),  Mₙ = M₁ sinβ",
    "osr.t2t1":  "T₂/T₁ = normal-shock T ratio at Mₙ = M₁ sinβ",
    "fanno.tt":  "T/T* = (γ+1) / [2+(γ−1)M²]",
    "fanno.pp":  "P/P* = (1/M) √{(γ+1) / [2+(γ−1)M²]}",
    "fanno.p0p0":"P₀/P₀* = (1/M)[(2/(γ+1))(1+(γ−1)M²/2)]^[(γ+1)/(2(γ−1))]",
    "fanno.uu":  "U/U* = M √{(γ+1) / [2+(γ−1)M²]}",
    "fanno.fld": "4fL*/D = (1−M²)/(γM²) + (γ+1)/(2γ) ln{(γ+1)M²/[2+(γ−1)M²]}",
    "rayleigh.t0t0":"T₀/T₀* = 2(γ+1)M²[1+(γ−1)M²/2] / (1+γM²)²",
    "rayleigh.tt":  "T/T* = (γ+1)²M² / (1+γM²)²",
    "rayleigh.pp":  "P/P* = (γ+1) / (1+γM²)",
    "rayleigh.p0p0":"P₀/P₀* = [(γ+1)/(1+γM²)][(2/(γ+1))(1+(γ−1)M²/2)]^[γ/(γ−1)]",
    "rayleigh.uu":  "U/U* = (γ+1)M² / (1+γM²)",
  };

  // Mack steps 5-8, 17: white plot area, black 1 pt box, major+minor ticks on all four edges
  var mackPlugin = {
    id: "mack",
    beforeDraw: function (ch) {
      var ctx = ch.ctx, ca = ch.chartArea;
      if (!ca) return;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ca.left, ca.top, ca.width, ca.height);
      ctx.restore();
    },
    afterDraw: function (ch) {
      var ctx = ch.ctx, ca = ch.chartArea;
      if (!ca) return;
      var MAJOR = 7, MINOR = 4, N_MINOR = 4;
      var L = ca.left, R = ca.left + ca.width, T = ca.top, B = ca.top + ca.height;

      function px(scale) {
        return scale.ticks.map(function (t) { return scale.getPixelForValue(t.value); });
      }
      function minors(arr) {
        var out = [];
        for (var i = 0; i < arr.length - 1; i++)
          for (var j = 1; j <= N_MINOR; j++)
            out.push(arr[i] + (arr[i + 1] - arr[i]) * j / (N_MINOR + 1));
        return out;
      }
      var xM = px(ch.scales.x), yM = px(ch.scales.y);

      ctx.save();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      function xt(arr, len) {
        arr.forEach(function (x) {
          if (x < L - 0.5 || x > R + 0.5) return;
          ctx.moveTo(x, B); ctx.lineTo(x, B - len);
          ctx.moveTo(x, T); ctx.lineTo(x, T + len);
        });
      }
      function yt(arr, len) {
        arr.forEach(function (y) {
          if (y < T - 0.5 || y > B + 0.5) return;
          ctx.moveTo(L, y); ctx.lineTo(L + len, y);
          ctx.moveTo(R, y); ctx.lineTo(R - len, y);
        });
      }
      xt(xM, MAJOR); xt(minors(xM), MINOR);
      yt(yM, MAJOR); yt(minors(yM), MINOR);
      ctx.stroke();
      ctx.strokeRect(L, T, ca.width, ca.height);

      var eq = EQUATIONS[activeTab + "." + el("chart-var").value];
      if (eq) {
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial, Helvetica, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(eq, R - 12, T + 12);
      }
      ctx.restore();
    },
  };

  function populateChartVars(tab) {
    var sel = el("chart-var");
    var solver = SOLVERS[tab];
    if (!solver) return;
    var vars = solver.chartVars;
    sel.innerHTML = "";
    vars.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v.key;
      opt.textContent = v.label;
      sel.appendChild(opt);
    });
  }

  function buildChartData(tab) {
    var solver = SOLVERS[tab];
    if (!solver.chartFn) return null;

    var mmin = parseFloat(el("chart-mmin").value) || 0.1;
    var mmax = parseFloat(el("chart-mmax").value) || 5.0;
    if (mmin >= mmax || mmin <= 0) return null;

    // For normal shock, clamp start to M=1
    if (tab === "nsr" && mmin < 1) mmin = 1.0;

    var g = val(tab + "-gamma");
    if (!isFinite(g) || g <= 1) g = 1.4;

    var steps = 200;
    var varKey = el("chart-var").value;
    var points = [];

    for (var i = 0; i <= steps; i++) {
      var m = mmin + (mmax - mmin) * i / steps;
      var result = solver.chartFn(g, m);
      var y = (result && result[varKey] != null && isFinite(result[varKey])) ? result[varKey] : null;
      points.push({ x: m, y: y });
    }

    var varLabel = (solver.chartVars.find(function (v) { return v.key === varKey; }) || {}).label || varKey;

    return { points: points, varLabel: varLabel };
  }

  // Mack step 11: set axis bounds by hand so data fills the plot box
  function niceBounds(vals) {
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (!isFinite(lo) || !isFinite(hi)) return {};
    if (hi === lo) { hi = lo + 1; }
    var span = hi - lo;
    var step = Math.pow(10, Math.floor(Math.log10(span)));
    var f = span / step;
    step *= f < 2 ? 0.2 : f < 5 ? 0.5 : 1;
    return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step };
  }

  function applyBounds(ch, cd) {
    var xs = [], ys = [];
    cd.points.forEach(function (p) { xs.push(p.x); if (p.y != null) ys.push(p.y); });
    var xb = niceBounds(xs);
    var yb = niceBounds(ys);
    ch.options.scales.x.min = xb.min; ch.options.scales.x.max = xb.max;
    ch.options.scales.y.min = yb.min; ch.options.scales.y.max = yb.max;
  }

  function updateChart() {
    var cd = buildChartData(activeTab);
    if (!cd) {
      if (chart) { chart.data.datasets[0].data = []; chart.update(); }
      return;
    }

    var ctx = el("flow-chart").getContext("2d");

    var xLabel = activeTab === "osr" ? "Deflection Angle θ (°)" : "Mach Number (M)";
    chartMeta.xLabel = xLabel;
    chartMeta.varLabel = cd.varLabel;

    if (chart) {
      chart.data.datasets[0].label = cd.varLabel;
      chart.data.datasets[0].data = cd.points;
      chart.options.scales.x.title.text = xLabel;
      chart.options.scales.y.title.text = cd.varLabel + " (–)";
      applyBounds(chart, cd);
      chart.update("none");
      return;
    }

    var TICK  = { color: "#000", font: { family: "Arial, Helvetica, sans-serif", size: 12 }, maxTicksLimit: 8 };
    var TITLE = { display: true, color: "#000", font: { family: "Arial, Helvetica, sans-serif", size: 13, weight: "normal" } };

    chart = new Chart(ctx, {
      type: "line",
      plugins: [mackPlugin],
      data: {
        datasets: [{
          label: cd.varLabel,
          data: cd.points,
          borderColor: LINE_COLOR,
          backgroundColor: "transparent",
          borderWidth: 1.5,       // Mack: ~1.5 pt
          pointRadius: 0,
          spanGaps: false,
          fill: false,            // no area fill (Mack: remove non-data ink)
          tension: 0,             // no smoothing (Mack: never use smoothed line)
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },  // label implied by y-axis title (Mack)
          tooltip: {
            backgroundColor: "#1c2128",
            borderColor: "#30363d",
            borderWidth: 1,
            titleColor: "#e6edf3",
            bodyColor: "#8b949e",
            titleFont: { family: "Arial, Helvetica, sans-serif" },
            bodyFont:  { family: "Arial, Helvetica, sans-serif" },
            callbacks: {
              title: function (items) {
                return chartMeta.xLabel + " = " + items[0].parsed.x.toFixed(3);
              },
              label: function (item) {
                return " " + chartMeta.varLabel + ": " + (item.parsed.y != null ? item.parsed.y.toPrecision(5) : "—");
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            title: Object.assign({}, TITLE, { text: xLabel }),
            ticks: Object.assign({}, TICK),
            grid: { display: false, drawTicks: false },
            border: { color: "#000", width: 1 },
          },
          y: {
            type: "linear",
            title: Object.assign({}, TITLE, { text: cd.varLabel + " (–)" }),
            ticks: Object.assign({}, TICK),
            grid: { display: false, drawTicks: false },
            border: { color: "#000", width: 1 },
          },
        },
      },
    });
    applyBounds(chart, cd);
    chart.update("none");
  }

  ["chart-mmin", "chart-mmax"].forEach(function (id) {
    el(id).addEventListener("input", updateChart);
  });
  el("chart-var").addEventListener("change", updateChart);

  // ── Oblique shock: chart β vs θ ───────────────────────────────────────
  // Override chartFn for osr after init (needs M1 from input)
  SOLVERS.osr.chartFn = function (g, theta) {
    var m1 = val("osr-mach");
    if (!isFinite(m1) || m1 < 1) return null;
    var beta = P.mdb(g, m1, theta);
    if (!isFinite(beta)) return null;
    return {
      beta:  beta,
      p2p1:  P.obliqueP2P1(g, m1, beta),
      t2t1:  P.obliqueT2T1(g, m1, beta),
    };
  };

  // Patch chart data build for osr to iterate over theta instead of M
  var _origBuild = buildChartData;
  buildChartData = function (tab) {
    if (tab !== "osr") return _origBuild(tab);

    var solver = SOLVERS.osr;
    var tmin = 1, tmax = 44;
    var steps = 200;
    var g = val("osr-gamma");
    if (!isFinite(g) || g <= 1) g = 1.4;
    var varKey = el("chart-var").value;
    var points = [];

    for (var i = 0; i <= steps; i++) {
      var theta = tmin + (tmax - tmin) * i / steps;
      var result = solver.chartFn(g, theta);
      points.push({ x: theta, y: result && result[varKey] != null && isFinite(result[varKey]) ? result[varKey] : null });
    }

    var varLabel = (solver.chartVars.find(function (v) { return v.key === varKey; }) || {}).label || varKey;

    // Re-label x axis for osr
    if (chart) {
      chart.options.scales.x.title.text = "Deflection Angle θ (°)";
    }

    return { points: points, varLabel: varLabel };
  };

  // ── Init ──────────────────────────────────────────────────────────────

  populateChartVars(activeTab);
  SOLVER_IDS.forEach(calculate);
  updateChart();

}());
