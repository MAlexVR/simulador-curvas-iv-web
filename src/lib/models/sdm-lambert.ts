// SDM Lambert W — Solución analítica del modelo de un solo diodo
// Ref: Barry et al. 2000 (Math. Comput. Simul. 53, 95-103) — Eq.10-12 (W0+ approximation)
// Erratum: Barry et al. 2002 (Math. Comput. Simul. 59, 543)

import { PVModelInput, PVCurveOutput } from "./types";

// Lambert W0 (rama principal) via método Halley
// Barry 2000, Eq.10 — aproximación numérica con convergencia cuadrática
function lambertW0(x: number): number {
  if (x < -1 / Math.E) throw new Error(`Lambert W: argumento fuera de dominio: x=${x}`);
  if (x === 0) return 0;

  // Estimación inicial (Barry 2000, Eq.11-12)
  let w: number;
  if (x < 0.5) {
    w = x * (1 - x * (1 - 1.5 * x)); // serie Taylor para x pequeño
  } else {
    const lx = Math.log(x);
    const llx = Math.log(lx);
    w = lx - llx + llx / lx; // Corless 1996 para x grande
  }

  // Iteración de Halley — Barry 2000 método
  for (let i = 0; i < 50; i++) {
    const ew = Math.exp(w);
    const wew = w * ew;
    const r = wew - x;
    const denom = ew * (w + 1) - ((w + 2) * r) / (2 * (w + 1));
    if (Math.abs(denom) < 1e-30) break;
    const delta = r / denom;
    w -= delta;
    if (Math.abs(delta) < 1e-12 * Math.abs(w)) break;
  }

  if (!isFinite(w) || isNaN(w)) {
    throw new Error(`Lambert W no convergió para x=${x}`);
  }
  return w;
}

export function sdmLambert(input: PVModelInput): PVCurveOutput {
  const { iph, i0, rs: R_s, rsh: R_sh, ns: N_s, vt: Vt_op, voc: V_oc, vocPoints: numPoints } = input;

  // Factor común (1 + Rs/Rsh)
  const Rs_Rsh = R_s / R_sh;
  const denom = 1 + Rs_Rsh;

  const calculateCurrent = (V: number): number => {
    try {
      // Argumento del Lambert W
      // Ref: Jain & Kapoor 2004, Eq.9; Song et al. 2021
      const arg_inner = (R_s * (iph + i0) + V) / (N_s * Vt_op * denom);
      const arg = (i0 * R_s / (N_s * Vt_op * denom)) * Math.exp(arg_inner);

      if (arg < -1 / Math.E) return Math.max(0, iph); // dominio inválido → fallback

      const W = lambertW0(arg);
      const I = (iph + i0 - V / R_sh) / denom - (N_s * Vt_op / R_s) * W;

      return isFinite(I) ? I : Math.max(0, iph - V / R_sh);
    } catch (err) {
      console.warn(`sdmLambert: lambertW0 falló en V=${V} (${err instanceof Error ? err.message : err}), usando fallback analítico`);
      return Math.max(0, iph - V / R_sh); // fallback analítico si W falla
    }
  };

  const voltage: number[] = [];
  const current: number[] = [];
  const power: number[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const V = (V_oc * i) / numPoints;
    const I = Math.max(0, calculateCurrent(V));
    voltage.push(V);
    current.push(I);
    power.push(V * I);
  }

  let maxPIdx = 0;
  for (let i = 1; i < power.length; i++) {
    if (power[i] > power[maxPIdx]) maxPIdx = i;
  }

  return {
    voltage, current, power,
    vmpp: voltage[maxPIdx],
    impp: current[maxPIdx],
    pmpp: power[maxPIdx],
  };
}
