// SDM Newton-Raphson — Modelo de un solo diodo
// Ref: Abbassi et al. 2017 (IEEE STA), Seddahou et al. 2011 (UPEC)
// Ecuación implícita: I = Iph - I0*[exp((V+I*Rs)/(Ns*n*Vt)) - 1] - (V+I*Rs)/Rsh
// Newton-Raphson: Abbassi 2017 Fig.4 flowchart

import { PVModelInput, PVCurveOutput } from "./types";

export function sdmNR(input: PVModelInput): PVCurveOutput {
  const { iph, i0, rs: R_s, rsh: R_sh, ns: N_s, vt: Vt_op, voc: V_oc, vocPoints: numPoints } = input;

  const calculateCurrent = (V: number): number => {
    let I = iph - i0 * (Math.exp(V / (N_s * Vt_op)) - 1);
    for (let iter = 0; iter < 100; iter++) {
      const Vd = V + I * R_s;
      const expTerm = Math.exp(Vd / (N_s * Vt_op));
      if (!isFinite(expTerm)) break;
      const f = iph - i0 * (expTerm - 1) - Vd / R_sh - I;
      const df = -i0 * (R_s / (N_s * Vt_op)) * expTerm - R_s / R_sh - 1;
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

  return {
    voltage, current, power,
    vmpp: voltage[maxPIdx],
    impp: current[maxPIdx],
    pmpp: power[maxPIdx],
  };
}
