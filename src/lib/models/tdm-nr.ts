// TDM Newton-Raphson — Modelo de triple diodo
// Ref: Bennagi et al. 2025 (Appl. Sci. 15, 7403), Eq.5
//      Olayiwola et al. 2024 (Sustainability 16, 432), Eq.5
// I = Iph - I01*[exp((V+IRs)/(Ns*n1*Vt))-1] - I02*[...] - I03*[...] - (V+IRs)/Rsh

import { PVModelInput, PVCurveOutput } from "./types";

export function tdmNR(input: PVModelInput): PVCurveOutput {
  const { iph, i0, rs: R_s, rsh: R_sh, ns: N_s, vt: Vt_op, voc: V_oc, vocPoints: numPoints } = input;
  const n2 = input.n2 ?? 2.0;
  const i02 = input.i02 ?? i0 * 0.1;
  const n3 = input.n3 ?? 1.5;
  const i03 = input.i03 ?? i0 * 0.01;
  const n1_val = input.n || 1;
  const Vt2 = Vt_op * (n2 / n1_val);
  const Vt3 = Vt_op * (n3 / n1_val);

  const calculateCurrent = (V: number): number => {
    let I = iph - i0 * (Math.exp(V / (N_s * Vt_op)) - 1)
                - i02 * (Math.exp(V / (N_s * Vt2)) - 1)
                - i03 * (Math.exp(V / (N_s * Vt3)) - 1);

    for (let iter = 0; iter < 200; iter++) {
      const Vd = V + I * R_s;
      const exp1 = Math.exp(Vd / (N_s * Vt_op));
      const exp2 = Math.exp(Vd / (N_s * Vt2));
      const exp3 = Math.exp(Vd / (N_s * Vt3));
      if (!isFinite(exp1) || !isFinite(exp2) || !isFinite(exp3)) break;

      const f = iph - i0*(exp1-1) - i02*(exp2-1) - i03*(exp3-1) - Vd/R_sh - I;
      const df = -i0*(R_s/(N_s*Vt_op))*exp1
               - i02*(R_s/(N_s*Vt2))*exp2
               - i03*(R_s/(N_s*Vt3))*exp3
               - R_s/R_sh - 1;

      if (Math.abs(df) < 1e-30) break;
      const delta = f / df;
      I -= delta;
      if (Math.abs(delta) < 1e-10) break;
    }
    if (!isFinite(I) || isNaN(I)) I = iph;
    return I;
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

  return { voltage, current, power, vmpp: voltage[maxPIdx], impp: current[maxPIdx], pmpp: power[maxPIdx] };
}
