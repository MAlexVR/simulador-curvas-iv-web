import { ModuleParams, SimulationResults, ChartDataPoint } from "@/types/module";
import { SimulationModel, PVModelInput, MultiConditionResults, MULTI_G_CONDITIONS, MULTI_T_CONDITIONS, MULTI_COLORS } from "@/lib/models/types";
import { sdmNR } from "@/lib/models/sdm-nr";
import { sdmLambert } from "@/lib/models/sdm-lambert";
import { ddmNR } from "@/lib/models/ddm-nr";
import { tdmNR } from "@/lib/models/tdm-nr";

const Q = 1.602e-19;  // Carga del electrón (C)
const K = 1.381e-23;  // Constante de Boltzmann (J/K)
const E_G = 1.12;     // Energía de banda prohibida del silicio (eV) — Abbassi 2017, Si cristalino
const G_STC = 1000;   // Irradiancia en condiciones estándar (W/m²)
const T_STC_C = 25;   // Temperatura en condiciones estándar (°C)

// Helper: compute shared electrical params (Iph, I0) at given G, T
function computeBaseParams(params: ModuleParams, G_op: number, T_op_C: number) {
  const { isc: I_sc, voc: V_oc, alphaI: alpha_i_percent, ns: N_s, n } = params;
  const alpha_i = alpha_i_percent / 100;
  const T_op = T_op_C + 273.15;
  const T_stc = T_STC_C + 273.15;
  const Vt_stc = (n * K * T_stc) / Q;     // Voltaje térmico del diodo en STC (V)
  const Vt_op = (n * K * T_op) / Q;        // Voltaje térmico del diodo en operación (V)

  // Corriente de saturación inversa en STC (I_rs o I0_ref)
  // Referencia: Abbassi 2017, Eq.13
  const I_rs = I_sc / (Math.exp(V_oc / (N_s * Vt_stc)) - 1);

  // Corriente de saturación en condiciones de operación
  // Referencia: Abbassi 2017, Eq.24
  const Vt_ref_cell = K * T_stc / Q;  // Voltaje térmico por celda (sin n)
  const I_0 = I_rs * Math.pow(T_op / T_stc, 3) *
              Math.exp((E_G / (n * Vt_ref_cell)) * (1 - T_stc / T_op));

  // Corriente fotogenerada en condiciones de operación
  // Referencia: Abbassi 2017, Eq.25
  const I_ph = (G_op / G_STC) * (I_sc + alpha_i * I_sc * (T_op_C - T_STC_C));

  // Multiplicador de I₀ para simulación de defectos de recombinación
  const I_0_final = I_0 * (params.i0Factor ?? 1);

  return { I_ph, I_0: I_0_final, Vt_op, T_op };
}

// Dispatch to the correct model
function dispatchModel(input: PVModelInput, model: SimulationModel) {
  switch (model) {
    case 'SDM_LAMBERT': return sdmLambert(input);
    case 'DDM_NR':      return ddmNR(input);
    case 'TDM_NR':      return tdmNR(input);
    case 'SDM_NR':
    default:            return sdmNR(input);
  }
}

export function runSimulation(params: ModuleParams, model: SimulationModel = 'SDM_NR'): SimulationResults {
  if (!params.referencia) {
    throw new Error("Ingrese la referencia del módulo.");
  }

  if (params.isc <= 0 || params.voc <= 0) {
    throw new Error("Isc y Voc deben ser positivos.");
  }

  if (params.ns <= 0 || params.np <= 0) {
    throw new Error("El número de celdas debe ser mayor que cero.");
  }

  if (params.rs < 0) throw new Error("Rs debe ser >= 0");
  if (params.rsh <= 0) throw new Error("Rsh debe ser > 0");
  if (params.n <= 0) throw new Error("n debe ser > 0");
  if (params.acelda <= 0) throw new Error("Área de celda debe ser > 0");
  if (params.gop <= 0) throw new Error("La irradiancia (Gop) debe ser mayor a 0");

  const { I_ph, I_0, Vt_op } = computeBaseParams(params, params.gop, params.top);

  const modelInput: PVModelInput = {
    isc: params.isc, voc: params.voc,
    iph: I_ph, i0: I_0,
    rs: params.rs, rsh: params.rsh,
    n: params.n, n2: params.n2, i02: params.i02, n3: params.n3, i03: params.i03,
    ns: params.ns, vt: Vt_op,
    vocPoints: 200,
  };

  const curve = dispatchModel(modelInput, model);

  const { vmpp: V_mpp, impp: I_mpp, pmpp: P_max_calc, voltage, current, power } = curve;
  const V_oc = params.voc;
  const I_sc = params.isc;
  const FF = (V_mpp * I_mpp) / (V_oc * I_sc);

  // Área total del módulo
  const A_total = params.acelda * params.ns * params.np;

  // Eficiencia = Pmax / (G * A_total) * 100
  const efficiency = (P_max_calc / (params.gop * A_total)) * 100;

  // Error porcentual vs fabricante
  const errorPercent = Math.abs((P_max_calc - params.pmax) / params.pmax) * 100;

  // Densidad de corriente Jsc (mA/cm²)
  const A_celda_cm2 = params.acelda * 10000;
  const A_total_cm2 = A_celda_cm2 * params.ns * params.np;
  const J_sc = (I_sc * 1000) / A_total_cm2;

  return {
    voltage, current, power,
    vmpp: V_mpp, impp: I_mpp, pmaxCalc: P_max_calc,
    fillFactor: FF, efficiency, errorPercent,
    iph: I_ph, i0: I_0, jsc: J_sc, atotal: A_total,
    gstc: G_STC, tstcC: T_STC_C, eg: E_G, q: Q, k: K
  };
}

// Estima el Voc real a condiciones de operación (para dimensionar el sweep de voltaje)
// Usa la aproximación analítica del circuito equivalente: V_oc ≈ Ns*Vt*ln(Iph/I0 + 1)
function estimateActualVoc(I_ph: number, I_0: number, N_s: number, Vt: number, nominalVoc?: number): number {
  if (I_0 <= 0 || I_ph <= 0) {
    const fallback = nominalVoc != null ? nominalVoc * 1.1 : 0;
    console.warn(`estimateActualVoc: parámetros inválidos (I_ph=${I_ph}, I_0=${I_0}), usando fallback=${fallback}`);
    return fallback;
  }
  return N_s * Vt * Math.log(I_ph / I_0 + 1);
}

// Multi-condition runner: 5 curvas Multi-G o 4 curvas Multi-T
export function runMultiCondition(
  params: ModuleParams,
  model: SimulationModel,
  mode: 'multi-g' | 'multi-t'
): MultiConditionResults {
  const conditions = mode === 'multi-g'
    ? [...MULTI_G_CONDITIONS]
    : [...MULTI_T_CONDITIONS];

  // Primera pasada: calcular parámetros base de cada condición
  const baseParamsList = conditions.map((cond) => {
    const G = mode === 'multi-g' ? cond : params.gop;
    const T = mode === 'multi-t' ? cond : params.top;
    return computeBaseParams(params, G, T);
  });

  // Calcular el Voc real de cada condición y usar el máximo como límite del sweep
  // Esto evita que curvas a baja temperatura (Voc real > Voc STC) queden cortadas
  const actualVocs = baseParamsList.map(({ I_ph, I_0, Vt_op }) =>
    estimateActualVoc(I_ph, I_0, params.ns, Vt_op, params.voc)
  );
  const sweepVoc = Math.max(...actualVocs, params.voc) * 1.02; // 2% de margen

  const curves = conditions.map((_, idx) => {
    const { I_ph, I_0, Vt_op } = baseParamsList[idx];

    const modelInput: PVModelInput = {
      isc: params.isc, voc: sweepVoc,
      iph: I_ph, i0: I_0,
      rs: params.rs, rsh: params.rsh,
      n: params.n, n2: params.n2, i02: params.i02, n3: params.n3, i03: params.i03,
      ns: params.ns, vt: Vt_op,
      vocPoints: 200,
    };

    return dispatchModel(modelInput, model);
  });

  const labels = mode === 'multi-g'
    ? conditions.map(g => `${g} W/m²`)
    : conditions.map(t => `${t} °C`);

  return {
    mode,
    conditions,
    curves,
    labels,
    colors: [...MULTI_COLORS].slice(0, conditions.length),
    model,
  };
}

export function toChartData(results: SimulationResults): ChartDataPoint[] {
  return results.voltage.map((v, i) => ({
    voltage: Number(v.toFixed(4)),
    current: Number(results.current[i].toFixed(6)),
    power: Number(results.power[i].toFixed(4))
  }));
}

export function exportToCSV(results: SimulationResults, params: ModuleParams): string {
  const headers = ["Voltaje (V)", "Corriente (A)", "Potencia (W)"];
  const rows = results.voltage.map((v, i) =>
    [v.toFixed(6), results.current[i].toFixed(6), results.power[i].toFixed(6)]
  );

  const info = [
    `# Módulo: ${params.marca} - ${params.referencia}`,
    `# Vmpp: ${results.vmpp.toFixed(4)} V | Impp: ${results.impp.toFixed(4)} A`,
    `# Pmax: ${results.pmaxCalc.toFixed(4)} W | FF: ${results.fillFactor.toFixed(4)}`,
    ""
  ];

  return [...info, headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
