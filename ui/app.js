/* app.js — UI logic for IsentropicFlow calculator */
(function () {
  "use strict";

  var P = window.Physics;  // set by physics.js

  // ── Solver definitions ────────────────────────────────────────────────
  // Each solver: { compute(inputs) → rows[], chartVars[], chartFn(g,m) → {key:val} }

  var SOLVERS = {
    ifr: {
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
      "<caption>" + SOLVERS[solver].compute.name || solver.toUpperCase() + "</caption>" +
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

  // ── Calculate buttons ──────────────────────────────────────────────────

  document.querySelectorAll(".calc-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var solver = btn.dataset.solver;
      setError(solver, "");
      var g = val(solver + "-gamma");
      var m = val(solver + "-mach");

      if (!isFinite(g) || g <= 1) { setError(solver, "γ must be > 1"); return; }

      if (solver === "osr") {
        var theta = val("osr-theta");
        if (!isFinite(m) || m < 1) { setError(solver, "M₁ must be ≥ 1"); return; }
        if (!isFinite(theta) || theta <= 0 || theta >= 90) { setError(solver, "θ must be between 0° and 90°"); return; }
        renderResults(solver, SOLVERS[solver].compute(g, m, theta));
      } else {
        if (!isFinite(m) || m <= 0) { setError(solver, "M must be > 0"); return; }
        if ((solver === "nsr") && m < 1) { setError(solver, "Normal shock requires M₁ ≥ 1"); return; }
        renderResults(solver, SOLVERS[solver].compute(g, m));
      }
      updateChart();
    });
  });

  // ── Enter key submits ──────────────────────────────────────────────────

  document.querySelectorAll("input[type=number]").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var panel = inp.closest(".panel");
        if (panel) {
          var btn = panel.querySelector(".calc-btn");
          if (btn) btn.click();
        }
      }
    });
  });

  // ── Chart ──────────────────────────────────────────────────────────────

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
    var dm = (mmax - mmin) / steps;
    var labels = [];
    var seriesData = {};
    var varKey = el("chart-var").value;

    for (var i = 0; i <= steps; i++) {
      var m = mmin + i * dm;
      labels.push(m.toFixed(3));
      var result = solver.chartFn(g, m);
      if (result && result[varKey] != null && isFinite(result[varKey])) {
        seriesData[i] = result[varKey];
      } else {
        seriesData[i] = null;
      }
    }

    var data = [];
    for (var j = 0; j <= steps; j++) data.push(seriesData[j]);

    var varLabel = (solver.chartVars.find(function (v) { return v.key === varKey; }) || {}).label || varKey;

    return { labels: labels, data: data, varLabel: varLabel };
  }

  function updateChart() {
    var cd = buildChartData(activeTab);
    if (!cd) {
      if (chart) { chart.data.labels = []; chart.data.datasets[0].data = []; chart.update(); }
      return;
    }

    var ctx = el("flow-chart").getContext("2d");

    if (chart) {
      chart.data.labels = cd.labels;
      chart.data.datasets[0].data = cd.data;
      chart.data.datasets[0].label = cd.varLabel;
      chart.update("none");
      return;
    }

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: cd.labels,
        datasets: [{
          label: cd.varLabel,
          data: cd.data,
          borderColor: "#388bfd",
          backgroundColor: "rgba(56,139,253,.08)",
          borderWidth: 2,
          pointRadius: 0,
          spanGaps: false,
          fill: true,
          tension: 0.1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#8b949e", font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: "#1c2128",
            borderColor: "#30363d",
            borderWidth: 1,
            titleColor: "#e6edf3",
            bodyColor: "#8b949e",
            callbacks: {
              label: function (ctx) {
                return " " + ctx.dataset.label + ": " + (ctx.parsed.y != null ? ctx.parsed.y.toPrecision(5) : "—");
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Mach Number", color: "#8b949e", font: { size: 11 } },
            ticks: { color: "#8b949e", font: { size: 10 }, maxTicksLimit: 10 },
            grid: { color: "#21262d" },
          },
          y: {
            title: { display: true, text: cd.varLabel, color: "#8b949e", font: { size: 11 } },
            ticks: { color: "#8b949e", font: { size: 10 } },
            grid: { color: "#21262d" },
          },
        },
      },
    });
  }

  el("chart-update-btn").addEventListener("click", function () {
    if (chart) { chart.destroy(); chart = null; }
    updateChart();
  });

  el("chart-var").addEventListener("change", function () {
    if (chart) { chart.destroy(); chart = null; }
    updateChart();
  });

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
    var labels = [], data = [];

    for (var i = 0; i <= steps; i++) {
      var theta = tmin + (tmax - tmin) * i / steps;
      labels.push(theta.toFixed(2));
      var result = solver.chartFn(g, theta);
      data.push(result && result[varKey] != null && isFinite(result[varKey]) ? result[varKey] : null);
    }

    var varLabel = (solver.chartVars.find(function (v) { return v.key === varKey; }) || {}).label || varKey;

    // Re-label x axis for osr
    if (chart) {
      chart.options.scales.x.title.text = "Deflection Angle θ (°)";
    }

    return { labels: labels, data: data, varLabel: varLabel };
  };

  // ── Init ──────────────────────────────────────────────────────────────

  populateChartVars(activeTab);
  updateChart();

}());
