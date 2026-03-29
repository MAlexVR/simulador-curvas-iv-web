// Extracción Rs/Rsh — Modo Datasheet
// Ref: Rahmani et al. 2011 (CCCA), doi:10.1109/CCCA.2011.6125617
// Extracción iterativa de Rs y Rsh a partir de parámetros de hoja de datos del fabricante

export interface RahmaniInput {
  voc: number;   // Voltaje de circuito abierto (V)
  isc: number;   // Corriente de cortocircuito (A)
  vmp: number;   // Voltaje en el punto de máxima potencia (V)
  imp: number;   // Corriente en el punto de máxima potencia (A)
  ns: number;    // Número de celdas en serie
  n: number;     // Factor de idealidad del diodo
  tOpK: number;  // Temperatura de operación en Kelvin
}

export interface RahmaniOutput { rs: number; rsh: number; }

export function extractRahmani(input: RahmaniInput): RahmaniOutput {
  const { voc, isc, vmp, imp, ns, n, tOpK } = input;
  const Q = 1.602e-19;
  const K = 1.381e-23;
  const Vt = n * K * tOpK / Q; // Voltaje térmico del diodo

  // Paso 1: Estimación inicial de Rs (Rahmani 2011, method)
  // Usando la condición en el MPP: pendiente de la curva
  // Rs ≈ (Voc - Vmp) / Imp - (Ns*Vt / Imp) * ln((Isc - Vmp/Rsh_est) / Imp)
  // Iteramos con Rsh_est inicial

  let Rs = 0;
  let Rsh = (vmp) / (isc - imp - vmp / (voc / isc));

  // Newton-Raphson para extraer Rs y Rsh conjuntamente
  // Usando las condiciones en (Voc, 0) y (Vmp, Imp)
  for (let iter = 0; iter < 50; iter++) {
    const I0_est = isc / (Math.exp(voc / (ns * Vt)) - 1);
    const Iph_est = isc;

    // Condición en Vmp, Imp: f1 = Iph - I0*exp((Vmp+Imp*Rs)/(Ns*Vt)) - (Vmp+Imp*Rs)/Rsh - Imp = 0
    const Vd_mpp = vmp + imp * Rs;
    const f1 = Iph_est - I0_est * (Math.exp(Vd_mpp / (ns * Vt)) - 1) - Vd_mpp / Rsh - imp;

    // Actualizar Rsh
    if (Math.abs(f1) > 1e-6) {
      Rsh = Vd_mpp / (Iph_est - I0_est * (Math.exp(Vd_mpp / (ns * Vt)) - 1) - imp);
      if (Rsh <= 0) Rsh = 100; // guard
    }

    // Actualizar Rs usando derivada en Vmp
    // dI/dV|_mpp = -Imp/Vmp (aproximación lineal)
    const expMpp = Math.exp(Vd_mpp / (ns * Vt));
    const newRs = -(1 / (-imp / vmp) + 1 / Rsh + I0_est * expMpp / (ns * Vt))
                  / (I0_est * expMpp / (ns * Vt) * imp + imp / Rsh);

    // Guard: Rs must be >= 0 and < Voc/Isc
    const clampedRs = Math.max(0, Math.min(newRs, voc / isc * 0.3));

    if (Math.abs(clampedRs - Rs) < 1e-8) break;
    Rs = clampedRs;
  }

  // Ensure physical validity
  Rs = Math.max(0, Rs);
  Rsh = Math.max(1, Rsh);

  return { rs: Rs, rsh: Rsh };
}
