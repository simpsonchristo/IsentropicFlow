// IsentropicFlow physics engine — pure JS, no dependencies
// All functions: (gamma, mach) -> number
// Self-tests run at bottom; check console for PASS/FAIL

(function (root) {
  "use strict";

  var P = {};

  // ── helpers ──────────────────────────────────────────────────────────────

  function sq(x) { return x * x; }

  // Newton-Raphson: find m such that f(m)=target, starting at m0
  function newtonRaphson(f, df, target, m0, tol) {
    tol = tol || 1e-9;
    var m = m0;
    for (var i = 0; i < 200; i++) {
      var fm = f(m) - target;
      if (Math.abs(fm) < tol) break;
      var dfm = df(m);
      if (Math.abs(dfm) < 1e-15) break;
      m -= fm / dfm;
      if (m <= 0) m = tol;
    }
    return m;
  }

  // Bisection: find m in [lo,hi] such that f(m)=target
  function bisect(f, target, lo, hi, tol) {
    tol = tol || 1e-9;
    for (var i = 0; i < 100; i++) {
      var mid = 0.5 * (lo + hi);
      if (hi - lo < tol) return mid;
      if ((f(mid) - target) * (f(lo) - target) <= 0) hi = mid;
      else lo = mid;
    }
    return 0.5 * (lo + hi);
  }

  // ── isentropic flow ───────────────────────────────────────────────────────

  // T/T₀
  P.tt0 = function (g, m) {
    return 1 / (1 + (g - 1) / 2 * sq(m));
  };

  // P/P₀
  P.pp0 = function (g, m) {
    return Math.pow(P.tt0(g, m), g / (g - 1));
  };

  // ρ/ρ₀
  P.rr0 = function (g, m) {
    return Math.pow(P.tt0(g, m), 1 / (g - 1));
  };

  // A/A* (isentropic)
  P.aa = function (g, m) {
    var e = (g + 1) / (2 * (g - 1));
    return (1 / m) * Math.pow((2 / (g + 1)) * (1 + (g - 1) / 2 * sq(m)), e);
  };

  // ── inverse isentropic (closed-form where possible) ───────────────────────

  // M from T/T₀
  P.machFromTT0 = function (g, r) {
    return Math.sqrt((2 / (g - 1)) * (1 / r - 1));
  };

  // M from P/P₀
  P.machFromPP0 = function (g, r) {
    return Math.sqrt((2 / (g - 1)) * (Math.pow(r, -(g - 1) / g) - 1));
  };

  // M from ρ/ρ₀
  P.machFromRR0 = function (g, r) {
    return Math.sqrt((2 / (g - 1)) * (Math.pow(r, -(g - 1)) - 1));
  };

  // M from A/A* — bisection (two solutions; supersonic=true selects M>1)
  P.machFromAA = function (g, r, supersonic) {
    if (r < 1) return NaN;
    if (r === 1) return 1;
    var f = function (m) { return P.aa(g, m); };
    if (supersonic) return bisect(f, r, 1.0001, 50);
    return bisect(f, r, 1e-6, 0.9999);
  };

  // ── normal shock ─────────────────────────────────────────────────────────

  // M₂ downstream
  P.nsM2 = function (g, m1) {
    return Math.sqrt((1 + (g - 1) / 2 * sq(m1)) / (g * sq(m1) - (g - 1) / 2));
  };

  // P₂/P₁
  P.nsP2P1 = function (g, m1) {
    return (2 * g * sq(m1) - (g - 1)) / (g + 1);
  };

  // ρ₂/ρ₁
  P.nsRho2Rho1 = function (g, m1) {
    return (g + 1) * sq(m1) / (2 + (g - 1) * sq(m1));
  };

  // T₂/T₁
  P.nsT2T1 = function (g, m1) {
    return P.nsP2P1(g, m1) / P.nsRho2Rho1(g, m1);
  };

  // P₀₂/P₀₁  =  (p₂/p₁) · (p₁/P₀₁) / (p₂/P₀₂)
  P.nsP02P01 = function (g, m1) {
    var m2 = P.nsM2(g, m1);
    return P.nsP2P1(g, m1) * P.pp0(g, m1) / P.pp0(g, m2);
  };

  // ── Prandtl-Meyer ─────────────────────────────────────────────────────────

  // ν(M) in degrees
  P.nu = function (g, m) {
    if (m < 1) return NaN;
    var r = (g - 1) / (g + 1);
    var t = Math.sqrt(sq(m) - 1);
    return (Math.sqrt((g + 1) / (g - 1)) * Math.atan(Math.sqrt(r) * t) - Math.atan(t)) * 180 / Math.PI;
  };

  // ── oblique shock ────────────────────────────────────────────────────────

  // Wave angle β (degrees) from M₁ and deflection angle θ (degrees), weak solution
  // Uses Newton-Raphson on the θ-β-M relation
  P.mdb = function (g, m1, theta_deg) {
    var theta = theta_deg * Math.PI / 180;

    // θ-β-M: tan(θ) = 2*cot(β)*(M²sin²β-1)/(M²(γ+cos2β)+2)
    function thetaFromBeta(beta_rad) {
      var s = Math.sin(beta_rad);
      var c = Math.cos(beta_rad);
      var mn2 = sq(m1 * s);
      return Math.atan2(2 * c / s * (mn2 - 1), sq(m1) * (g + Math.cos(2 * beta_rad)) + 2);
    }

    function dthetaFromBeta(beta_rad) {
      var h = 1e-7;
      return (thetaFromBeta(beta_rad + h) - thetaFromBeta(beta_rad - h)) / (2 * h);
    }

    // Weak shock starting point: slightly above Mach angle
    var mu = Math.asin(1 / m1);
    var beta0 = mu + 0.1;

    var beta = beta0;
    for (var i = 0; i < 300; i++) {
      var f = thetaFromBeta(beta) - theta;
      var df = dthetaFromBeta(beta);
      if (Math.abs(f) < 1e-10) break;
      if (Math.abs(df) < 1e-15) break;
      var step = f / df;
      beta -= step;
      // Clamp to physical range [mu, π/2]
      if (beta <= mu) beta = mu + 1e-6;
      if (beta >= Math.PI / 2) beta = Math.PI / 2 - 1e-6;
    }
    return beta * 180 / Math.PI;
  };

  // M₂ after oblique shock given β (degrees)
  P.obliqueM2 = function (g, m1, beta_deg) {
    var beta = beta_deg * Math.PI / 180;
    var mn1 = m1 * Math.sin(beta);
    var mn2 = P.nsM2(g, mn1);
    var theta_rad = (P.obliqueTheta(g, m1, beta_deg)) * Math.PI / 180;
    return mn2 / Math.sin(beta - theta_rad);
  };

  // Deflection angle θ (degrees) from M₁ and β (degrees)
  P.obliqueTheta = function (g, m1, beta_deg) {
    var beta = beta_deg * Math.PI / 180;
    var s = Math.sin(beta);
    var c = Math.cos(beta);
    var mn2 = sq(m1 * s);
    return Math.atan2(2 * c / s * (mn2 - 1), sq(m1) * (g + Math.cos(2 * beta)) + 2) * 180 / Math.PI;
  };

  // P₂/P₁ across oblique shock given β (degrees)
  P.obliqueP2P1 = function (g, m1, beta_deg) {
    var mn1 = m1 * Math.sin(beta_deg * Math.PI / 180);
    return P.nsP2P1(g, mn1);
  };

  // T₂/T₁ across oblique shock given β (degrees)
  P.obliqueT2T1 = function (g, m1, beta_deg) {
    var mn1 = m1 * Math.sin(beta_deg * Math.PI / 180);
    return P.nsT2T1(g, mn1);
  };

  // ── Fanno flow ────────────────────────────────────────────────────────────

  // T/T*
  P.fannoTT = function (g, m) {
    return (g + 1) / (2 + (g - 1) * sq(m));
  };

  // P/P*
  P.fannoPP = function (g, m) {
    return (1 / m) * Math.sqrt(P.fannoTT(g, m));
  };

  // P₀/P₀*
  P.fannoP0P0 = function (g, m) {
    return P.aa(g, m);  // numerically identical to A/A*
  };

  // U/U* = ρ*/ρ
  P.fannoUU = function (g, m) {
    return m * Math.sqrt(P.fannoTT(g, m));
  };

  // 4fL*/D
  P.fannoFLD = function (g, m) {
    return (1 - sq(m)) / (g * sq(m)) + (g + 1) / (2 * g) * Math.log((g + 1) * sq(m) / (2 + (g - 1) * sq(m)));
  };

  // ── Rayleigh flow ─────────────────────────────────────────────────────────

  // T₀/T₀*
  P.rayleighT0T0 = function (g, m) {
    return 2 * (g + 1) * sq(m) / sq(1 + g * sq(m)) * (1 + (g - 1) / 2 * sq(m));
  };

  // T/T*
  P.rayleighTT = function (g, m) {
    return sq(m) * sq((g + 1) / (1 + g * sq(m)));
  };

  // P/P*
  P.rayleighPP = function (g, m) {
    return (g + 1) / (1 + g * sq(m));
  };

  // P₀/P₀*
  P.rayleighP0P0 = function (g, m) {
    return P.rayleighPP(g, m) * Math.pow((2 / (g + 1)) * (1 + (g - 1) / 2 * sq(m)), g / (g - 1));
  };

  // U/U* = ρ*/ρ
  P.rayleighUU = function (g, m) {
    return (g + 1) * sq(m) / (1 + g * sq(m));
  };

  // ── Newton-Raphson inverse solvers ────────────────────────────────────────

  // Generic inverse for any monotone function f over [lo,hi]
  P.machFromFannoFLD = function (g, fld, supersonic) {
    var f = function (m) { return P.fannoFLD(g, m); };
    if (supersonic) return bisect(f, fld, 1.0001, 50);
    return bisect(f, fld, 1e-6, 0.9999);
  };

  P.machFromFannoPP = function (g, r) {
    // P/P* decreasing, subsonic: M<1
    return bisect(function (m) { return P.fannoPP(g, m); }, r, 1e-6, 50);
  };

  P.machFromRayleighT0T0 = function (g, r, supersonic) {
    if (supersonic) return bisect(function (m) { return P.rayleighT0T0(g, m); }, r, 1.0001, 50);
    return bisect(function (m) { return P.rayleighT0T0(g, m); }, r, 1e-6, 0.9999);
  };

  // ── self-test ─────────────────────────────────────────────────────────────
  // Validates against James John "Gas Dynamics" Appendix tables, γ=1.4

  P._selfTest = function () {
    var g = 1.4;
    var TOL = 0.0001; // 0.01%
    var pass = true;

    function check(name, got, want) {
      var err = Math.abs(got - want) / Math.abs(want);
      if (err > TOL) {
        console.warn("FAIL " + name + ": got " + got.toFixed(6) + " want " + want.toFixed(6) + " err=" + (err * 100).toFixed(4) + "%");
        pass = false;
      }
    }

    // Isentropic, M=2 (James John Table A.1)
    check("tt0(1.4,2)",   P.tt0(g,2),   0.55556);
    check("pp0(1.4,2)",   P.pp0(g,2),   0.12780);
    check("rr0(1.4,2)",   P.rr0(g,2),   0.23005);
    check("aa(1.4,2)",    P.aa(g,2),    1.6875);

    // Isentropic, M=3
    check("tt0(1.4,3)",   P.tt0(g,3),   0.35714);
    check("pp0(1.4,3)",   P.pp0(g,3),   0.027224);
    check("aa(1.4,3)",    P.aa(g,3),    4.2346);

    // Inverse isentropic
    check("machFromTT0(0.55556)", P.machFromTT0(g, 0.55556), 2.0);
    check("machFromPP0(0.12780)", P.machFromPP0(g, 0.12780), 2.0);
    // subsonic M=0.5 → A/A*≈1.3398 (James John Table A.1)
    check("machFromAA sub(1.3398)", P.machFromAA(g, 1.3398, false), 0.5);
    check("machFromAA sup(1.6875)", P.machFromAA(g, 1.6875, true),  2.0);

    // Normal shock, M=2 (James John Table A.2)
    check("nsM2(1.4,2)",        P.nsM2(g,2),        0.57735);
    check("nsP2P1(1.4,2)",      P.nsP2P1(g,2),      4.5);
    check("nsRho2Rho1(1.4,2)",  P.nsRho2Rho1(g,2),  2.6667);
    check("nsT2T1(1.4,2)",      P.nsT2T1(g,2),      1.6875);
    check("nsP02P01(1.4,2)",    P.nsP02P01(g,2),    0.72087);

    // Prandtl-Meyer, M=2 (James John Table A.5)
    check("nu(1.4,2)", P.nu(g,2), 26.3798);

    // Fanno, M=0.5 (James John Table A.3)
    check("fannoTT(1.4,0.5)",   P.fannoTT(g,0.5),   1.14286);
    check("fannoPP(1.4,0.5)",   P.fannoPP(g,0.5),   2.13809);
    check("fannoFLD(1.4,0.5)",  P.fannoFLD(g,0.5),  1.06906);

    // Rayleigh, M=0.5 (James John Table A.4)
    check("rayleighT0T0(1.4,0.5)", P.rayleighT0T0(g,0.5), 0.69136);
    check("rayleighTT(1.4,0.5)",   P.rayleighTT(g,0.5),   0.79012);
    check("rayleighPP(1.4,0.5)",   P.rayleighPP(g,0.5),   1.77778);

    // Rayleigh, M=2
    check("rayleighT0T0(1.4,2)", P.rayleighT0T0(g,2), 0.79339);
    check("rayleighTT(1.4,2)",   P.rayleighTT(g,2),   0.52893);
    check("rayleighPP(1.4,2)",   P.rayleighPP(g,2),   0.36364);

    if (pass) console.log("physics.js: all self-tests PASSED");
    return pass;
  };

  // ── export ────────────────────────────────────────────────────────────────

  if (typeof module !== "undefined" && module.exports) {
    module.exports = P;  // Node.js (for test_physics_js.py)
  } else {
    root.Physics = P;    // browser global
  }

  // Run self-test automatically (non-fatal)
  try { P._selfTest(); } catch(e) { console.error("physics.js self-test threw:", e); }

}(typeof window !== "undefined" ? window : global));
