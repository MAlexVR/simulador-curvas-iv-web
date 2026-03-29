// DDM Newton-Raphson — Modelo de doble diodo
// Ref: Olayiwola et al. 2024 (Sustainability 16, 432), Eq.4
// I = Iph - I01*[exp((V+IRs)/(Ns*n1*Vt))-1] - I02*[exp((V+IRs)/(Ns*n2*Vt))-1] - (V+IRs)/Rsh

import { PVModelInput, PVCurveOutput } from "./types";

export function ddmNR(input: PVModelInput): PVCurveOutput {
  const { iph, i0, rs: R_s, rsh: R_sh, ns: N_s, vt: Vt_op, voc: V_oc, vocPoints: numPoints } = input;
  // Parámetros del diodo 2 — defaults: n2=2.0, I02=I0*0.1 (recombination dominated)
  const n2 = input.n2 ?? 2.0;
  const i02 = input.i02 ?? i0 * 0.1;
  const Vt2 = Vt_op * (n2 / (input.n || 1)); // Vt para el diodo 2

  const calculateCurrent = (V: number): number => {
    let I = iph - i0 * (Math.exp(V / (N_s * Vt_op)) - 1) - i02 * (Math.exp(V / (N_s * Vt2)) - 1);
    for (let iter = 0; iter < 150; iter++) {
      const Vd = V + I * R_s;
      const exp1 = Math.exp(Vd / (N_s * Vt_op));
      const exp2 = Math.exp(Vd / (N_s * Vt2));
      if (!isFinite(exp1) || !isFinite(exp2)) break;

      // f(I) = Iph - I01*(exp1-1) - I02*(exp2-1) - Vd/Rsh - I
      const f = iph - i0 * (exp1 - 1) - i02 * (exp2 - 1) - Vd / R_sh - I;

      // f'(I) = -I01*Rs/(Ns*Vt1)*exp1 - I02*Rs/(Ns*Vt2)*exp2 - Rs/Rsh - 1
      const df = -i0 * (R_s / (N_s * Vt_op)) * exp1
               - i02 * (R_s / (N_s * Vt2)) * exp2
               - R_s / R_sh - 1;

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
