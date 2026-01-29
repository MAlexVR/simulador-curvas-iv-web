import {
  ModuleParams,
  SimulationResults,
  ChartDataPoint,
  ModelType,
} from "@/types/module";

// Constantes físicas
const Q = 1.602176634e-19; // Carga elemental (C)
const K = 1.380649e-23; // Constante de Boltzmann (J/K)
const E_G = 1.12; // Energía de banda prohibida del Silicio (eV)
const G_STC = 1000; // Irradiancia en condiciones estándar (W/m²)
const T_STC_C = 25; // Temperatura en condiciones estándar (°C)

/**
 * Aproximación analítica de Barry et al. (2000) para W_0(x)
 * Error relativo < 0.2%
 * Referencia: Barry, D. A., et al. (2000). Mathematics and Computers in Simulation.
 */
function lambertWBarry(x: number): number {
  if (x >= 0) {
    // Para x >= 0 usar interpolación entre W^1 y W^2
    const xSafe = Math.max(x, 1e-300);

    // Primera aproximación W^1
    const denom1 = Math.max(Math.log(1 + 2 * xSafe), 1e-300);
    const W1 = Math.log((2 * xSafe) / denom1);

    // Segunda aproximación W^2
    const inner = Math.max(Math.log(1 + (12 / 5) * xSafe), 1e-300);
    const denom2 = Math.max(Math.log(((12 / 5) * xSafe) / inner), 1e-300);
    const W2 = Math.log(((6 / 5) * xSafe) / denom2);

    // Interpolación lineal con ε óptimo
    const epsilon = 0.4586887;
    return (1 + epsilon) * W2 - epsilon * W1;
  } else if (x >= -1 / Math.E) {
    // Para -1/e <= x < 0 usar rama W_0^-
    const eta = Math.max(2 + 2 * Math.E * x, 0);
    const sqrtEta = Math.sqrt(eta);

    // Coeficientes de Barry para W_0^-
    const N2 = 3 * Math.SQRT2 + 6;
    const N1 = (1 - 1 / Math.SQRT2) * (N2 + Math.SQRT2);

    return -1 + sqrtEta / (1 + (N1 * sqrtEta) / (N2 + sqrtEta));
  }

  return 0;
}

/**
 * Modelo de 1 Diodo (SDM) - Resolución Newton-Raphson
 * Ecuación implícita: I = Iph - Io[exp((V+IRs)/(nNsVt))-1] - (V+IRs)/Rsh
 * Referencia: Abbassi, A., et al. (2017). IEEE Xplore.
 */
function modeloSingleDiode(
  V: number[],
  I_ph: number,
  I_o: number,
  n: number,
  Ns: number,
  Rs: number,
  Rsh: number,
  T: number,
): number[] {
  const Vt = (K * T) / Q;
  const a = n * Ns * Vt;
  const I: number[] = [];

  for (const v of V) {
    let I_guess = Math.max(0, I_ph - v / Rsh);

    for (let iter = 0; iter < 100; iter++) {
      const expTerm = Math.exp((v + I_guess * Rs) / a);
      const f = I_ph - I_o * (expTerm - 1) - (v + I_guess * Rs) / Rsh - I_guess;
      const df = -((I_o * Rs) / a) * expTerm - Rs / Rsh - 1;

      if (Math.abs(df) < 1e-15) break;

      const I_new = I_guess - f / df;

      if (Math.abs(I_new - I_guess) < 1e-9) {
        I_guess = I_new;
        break;
      }
      I_guess = I_new;
    }

    I.push(Math.max(0, I_guess));
  }

  return I;
}

/**
 * Modelo de 2 Diodos (DDM) - Simplificación Ishaque et al.
 * A1=1 (recombinación ideal), A2=2 (recombinación no ideal)
 * Referencia: Olayiwola, T. N., et al. (2024). Sustainability.
 */
function modeloDoubleDiode(
  V: number[],
  I_ph: number,
  I_o: number,
  A1: number,
  A2: number,
  Rs: number,
  Rsh: number,
  Ns: number,
  T: number,
): number[] {
  const Vt = (K * T) / Q;
  const I: number[] = [];

  for (const v of V) {
    let I_guess = Math.max(0, Math.min(I_ph - v / Rsh, I_ph));

    for (let iter = 0; iter < 100; iter++) {
      const vd = v + I_guess * Rs;
      const exp1 = Math.exp(vd / (A1 * Ns * Vt));
      const exp2 = Math.exp(vd / (A2 * Ns * Vt));

      // f = Iph - Io*(exp1 + exp2 - 2) - vd/Rsh - I
      const f = I_ph - I_o * (exp1 + exp2 - 2) - vd / Rsh - I_guess;
      const df =
        -((I_o * Rs) / (A1 * Ns * Vt)) * exp1 -
        ((I_o * Rs) / (A2 * Ns * Vt)) * exp2 -
        Rs / Rsh -
        1;

      if (Math.abs(df) < 1e-15) break;

      const I_new = I_guess - f / df;

      if (Math.abs(I_new - I_guess) < 1e-9) {
        I_guess = I_new;
        break;
      }
      I_guess = I_new;
    }

    I.push(Math.max(0, I_guess));
  }

  return I;
}

/**
 * Modelo de 3 Diodos (TDM) - Barry et al. approach
 * A1=1, A2=1.2, A3=2.5 (Según Olayiwola et al. 2024)
 * Referencia: Olayiwola, T. N., et al. (2024). Sustainability.
 */
function modeloTripleDiode(
  V: number[],
  I_ph: number,
  I_o: number,
  A1: number,
  A2: number,
  A3: number,
  Rs: number,
  Rsh: number,
  Ns: number,
  T: number,
): number[] {
  const Vt = (K * T) / Q;
  const I: number[] = [];

  for (const v of V) {
    let I_guess = Math.max(0, Math.min(I_ph - v / Rsh, I_ph));

    for (let iter = 0; iter < 100; iter++) {
      const vd = v + I_guess * Rs;
      const exp1 = Math.exp(vd / (A1 * Ns * Vt));
      const exp2 = Math.exp(vd / (A2 * Ns * Vt));
      const exp3 = Math.exp(vd / (A3 * Ns * Vt));

      // f = Iph - Io*(exp1 + exp2 + exp3 - 3) - vd/Rsh - I
      const f = I_ph - I_o * (exp1 + exp2 + exp3 - 3) - vd / Rsh - I_guess;
      // df = -(Io*Rs/(Ns*Vt))*(exp1/A1 + exp2/A2 + exp3/A3) - Rs/Rsh - 1
      const df =
        -((I_o * Rs) / (Ns * Vt)) * (exp1 / A1 + exp2 / A2 + exp3 / A3) -
        Rs / Rsh -
        1;

      if (Math.abs(df) < 1e-15) break;

      const I_new = I_guess - f / df;

      if (Math.abs(I_new - I_guess) < 1e-9) {
        I_guess = I_new;
        break;
      }
      I_guess = I_new;
    }

    I.push(Math.max(0, I_guess));
  }

  return I;
}

/**
 * Solución explícita usando Función W de Lambert
 * Aproximación Barry Analytical Expansion (Barry et al., 2000)
 * NOTA: Si Rs es muy pequeña (< 0.01 Ω), se usa SDM iterativo para estabilidad numérica
 * Referencia: Barry, D. A., et al. (2000). Mathematics and Computers in Simulation.
 */
function modeloLambertW(
  V: number[],
  I_ph: number,
  I_o: number,
  n: number,
  Ns: number,
  Rs: number,
  Rsh: number,
  T: number,
): number[] {
  // Si Rs es muy pequeña, usar método iterativo SDM para evitar inestabilidad numérica
  if (Rs < 0.01) {
    console.warn("Rs muy pequeña, usando método iterativo para estabilidad");
    return modeloSingleDiode(V, I_ph, I_o, n, Ns, Rs, Rsh, T);
  }

  const Vt = (K * T) / Q;
  const a = n * Ns * Vt;

  return V.map((v) => {
    // Argumentos de la función W según código Python:
    // X = (Rs*Rsh*Io)/(a*(Rs+Rsh)) * exp((Rsh*(Rs*(Iph+Io) + V))/(a*(Rs+Rsh)))
    const Rsh_eff = Rsh / (Rs + Rsh); // ~1 si Rs << Rsh
    const coef = ((Rs * I_o) / a) * Rsh_eff;
    const exp_arg = ((Rs * (I_ph + I_o) + v) / a) * Rsh_eff;

    // Limitar exponente para evitar overflow
    if (exp_arg > 700) {
      // Voltaje muy alto (cerca de Voc), corriente ~0
      return 0;
    }

    const arg = coef * Math.exp(exp_arg);

    // Calcular W (Barry approximation)
    let W: number;
    if (arg < 1e-10) {
      W = arg; // Aproximación lineal para valores pequeños
    } else {
      W = lambertWBarry(arg);
    }

    // Corriente: I = (Rsh*(Iph+Io) - V)/(Rs+Rsh) - (a/Rs)*W
    const I_calc = (Rsh * (I_ph + I_o) - v) / (Rs + Rsh) - (a / Rs) * W;

    return Math.max(0, I_calc);
  });
}

/**
 * Cálculo de parámetros a condiciones de operación
 * Referencia: Abbassi, A., et al. (2017). IEEE Xplore.
 */
function calcularParametrosTermicos(
  Isc_ref: number,
  Voc_ref: number,
  Rs_ref: number,
  Rsh_ref: number,
  n: number,
  Ns: number,
  G_op: number,
  T_op_c: number,
  alpha: number,
  beta: number,
): { I_ph: number; Io_op: number; Rs_op: number; Rsh_op: number } {
  const T_op = T_op_c + 273.15;
  const T_stc = T_STC_C + 273.15;

  const Vt_stc = (K * T_stc) / Q;

  // Corriente de saturación en STC
  const Io_ref = Isc_ref / (Math.exp(Voc_ref / (n * Ns * Vt_stc)) - 1);

  // Corriente foto-generada en STC
  const Iph_ref =
    Isc_ref * (1 + Rs_ref / Rsh_ref) +
    Io_ref * (Math.exp((Rs_ref * Isc_ref) / (n * Ns * Vt_stc)) - 1);

  // Ajuste a condiciones de operación (Abbassi et al., 2017)
  const I_ph =
    (G_op / G_STC) * (Iph_ref + alpha * Isc_ref * (T_op_c - T_STC_C));

  // Corriente de saturación con dependencia térmica
  const Io_op =
    Io_ref *
    Math.pow(T_op / T_stc, 3) *
    Math.exp(((E_G * Q) / (n * K)) * (1 / T_stc - 1 / T_op));

  // Resistencias
  const Rsh_op = Rsh_ref * (G_STC / G_op);
  const Rs_op = Rs_ref;

  return { I_ph, Io_op, Rs_op, Rsh_op };
}

export const MODEL_NAMES: Record<ModelType, string> = {
  sdm: "Modelo de 1 Diodo (SDM)",
  ddm: "Modelo de 2 Diodos (DDM)",
  tdm: "Modelo de 3 Diodos (TDM)",
  lambert: "Lambert W - Expansión analítica de Barry",
};

export function runSimulation(params: ModuleParams): SimulationResults {
  if (!params.referencia) {
    throw new Error("Ingrese la referencia del módulo.");
  }

  if (params.isc <= 0 || params.voc <= 0) {
    throw new Error("Isc y Voc deben ser positivos.");
  }

  if (params.ns <= 0 || params.np <= 0) {
    throw new Error("El número de celdas debe ser mayor que cero.");
  }

  const {
    isc: Isc_ref,
    voc: Voc_ref,
    vm: Vm_ref,
    im: Im_ref,
    gop: G_op,
    top: T_op_C,
    alphaI: alpha_percent,
    betaV: beta,
    acelda: A_celda,
    ns: Ns,
    np: Np,
    n,
    rs: Rs_ref,
    rsh: Rsh_ref,
    pmax: P_max_fabricante,
    modelo,
  } = params;

  const alpha = alpha_percent / 100;

  // Calcular parámetros térmicos
  const { I_ph, Io_op, Rs_op, Rsh_op } = calcularParametrosTermicos(
    Isc_ref,
    Voc_ref,
    Rs_ref,
    Rsh_ref,
    n,
    Ns,
    G_op,
    T_op_C,
    alpha,
    beta,
  );

  // Vector de voltajes (0 a Voc operativo estimado)
  const Voc_op = Voc_ref + beta * (T_op_C - T_STC_C);
  const numPoints = 200;
  const voltage: number[] = [];

  for (let i = 0; i <= numPoints; i++) {
    voltage.push((Voc_op * 1.05 * i) / numPoints);
  }

  // Temperatura de operación en Kelvin
  const T_op = T_op_C + 273.15;

  // Selección de modelo
  let current: number[];
  let modelName: string;

  switch (modelo) {
    case "sdm":
      current = modeloSingleDiode(
        voltage,
        I_ph,
        Io_op,
        n,
        Ns,
        Rs_op,
        Rsh_op,
        T_op,
      );
      modelName = MODEL_NAMES.sdm;
      break;
    case "ddm":
      const A1 = 1.0,
        A2 = 2.0;
      current = modeloDoubleDiode(
        voltage,
        I_ph,
        Io_op,
        A1,
        A2,
        Rs_op,
        Rsh_op,
        Ns,
        T_op,
      );
      modelName = MODEL_NAMES.ddm;
      break;
    case "tdm":
      const A1_t = 1.0,
        A2_t = 1.2,
        A3_t = 2.5;
      current = modeloTripleDiode(
        voltage,
        I_ph,
        Io_op,
        A1_t,
        A2_t,
        A3_t,
        Rs_op,
        Rsh_op,
        Ns,
        T_op,
      );
      modelName = MODEL_NAMES.tdm;
      break;
    case "lambert":
    default:
      current = modeloLambertW(
        voltage,
        I_ph,
        Io_op,
        n,
        Ns,
        Rs_op,
        Rsh_op,
        T_op,
      );
      modelName = MODEL_NAMES.lambert;
      break;
  }

  // Calcular potencia
  const power = voltage.map((v, i) => v * current[i]);

  // Encontrar MPP
  let maxPowerIndex = 0;
  let maxPower = 0;

  for (let i = 0; i < power.length; i++) {
    if (power[i] > maxPower) {
      maxPower = power[i];
      maxPowerIndex = i;
    }
  }

  const V_mpp = voltage[maxPowerIndex];
  const I_mpp = current[maxPowerIndex];
  const P_max_calc = maxPower;

  // Factores de calidad
  const FF = (V_mpp * I_mpp) / (Voc_ref * Isc_ref);
  const A_total = A_celda * Ns * Np;
  const efficiency = (P_max_calc / (G_op * A_total)) * 100;

  // Densidad de corriente
  const A_celda_cm2 = A_celda * 10000;
  const A_total_cm2 = A_celda_cm2 * Ns * Np;
  const J_sc = (Isc_ref * 1000) / A_total_cm2;

  // Error respecto a Pmax del fabricante
  const Pmax_fab = P_max_fabricante > 0 ? P_max_fabricante : Vm_ref * Im_ref;
  const errorPercent = Math.abs((P_max_calc - Pmax_fab) / Pmax_fab) * 100;

  return {
    voltage,
    current,
    power,
    vmpp: V_mpp,
    impp: I_mpp,
    pmaxCalc: P_max_calc,
    fillFactor: FF,
    efficiency,
    errorPercent,
    iph: I_ph,
    i0: Io_op,
    jsc: J_sc,
    atotal: A_total,
    gstc: G_STC,
    tstcC: T_STC_C,
    eg: E_G,
    q: Q,
    k: K,
    modelName,
    modelo,
  };
}

export function toChartData(results: SimulationResults): ChartDataPoint[] {
  return results.voltage.map((v, i) => ({
    voltage: Number(v.toFixed(4)),
    current: Number(results.current[i].toFixed(4)),
    power: Number(results.power[i].toFixed(4)),
  }));
}

export function exportToCSV(
  results: SimulationResults,
  params: ModuleParams,
): string {
  const headers = ["Voltaje (V)", "Corriente (A)", "Potencia (W)"];
  const rows = results.voltage.map((v, i) => [
    v.toFixed(6),
    results.current[i].toFixed(6),
    results.power[i].toFixed(6),
  ]);

  const info = [
    `# Módulo: ${params.marca} - ${params.referencia}`,
    `# Modelo: ${results.modelName}`,
    `# Vmpp: ${results.vmpp.toFixed(4)} V | Impp: ${results.impp.toFixed(4)} A`,
    `# Pmax: ${results.pmaxCalc.toFixed(4)} W | FF: ${results.fillFactor.toFixed(4)}`,
    "",
  ];

  return [...info, headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );
}
