import { ModuleParams, SimulationResults, ChartDataPoint } from "@/types/module";

const Q = 1.602e-19;  // Carga del electrón (C)
const K = 1.381e-23;  // Constante de Boltzmann (J/K)
const E_G = 1.1;      // Energía de banda prohibida del silicio (eV)
const G_STC = 1000;   // Irradiancia en condiciones estándar (W/m²)
const T_STC_C = 25;   // Temperatura en condiciones estándar (°C)

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
    isc: I_sc, voc: V_oc, gop: G_op, top: T_op_C,
    alphaI: alpha_i_percent, acelda: A_celda,
    ns: N_s, np: N_p, n, rs: R_s, rsh: R_sh,
    pmax: P_max_fabricante
  } = params;
  
  const alpha_i = alpha_i_percent / 100;
  const T_op = T_op_C + 273.15;
  const T_stc = T_STC_C + 273.15;
  const V_t = K * T_op / Q;
  
  const I_rs = I_sc / (Math.exp(Q * V_oc / (N_s * n * K * T_stc)) - 1);
  const I_0 = I_rs * Math.pow(T_op / T_stc, 3) * 
              Math.exp(E_G * Q / (n * K) * (1 / T_stc - 1 / T_op));
  const I_ph = (G_op / G_STC) * (I_sc + alpha_i * I_sc * (T_op_C - T_STC_C));
  
  const A_total = A_celda * N_s * N_p;
  const A_celda_cm2 = A_celda * 10000;
  const I_sc_mA = I_sc * 1000;
  const A_total_cm2 = A_celda_cm2 * N_s * N_p;
  const J_sc = I_sc_mA / A_total_cm2;
  
  const calculateCurrent = (V: number): number => {
    const term1 = (I_ph - I_0 + (V + I_ph * R_s) / R_sh) / (1 + R_s / R_sh);
    const term2 = (V + term1 * R_s) / (N_s * n * V_t);
    return term1 - I_0 * (Math.exp(term2) - 1);
  };
  
  const numPoints = 200;
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
  const FF = (V_mpp * I_mpp) / (V_oc * I_sc);
  const efficiency = (P_max_calc / (G_op * A_total)) * 100;
  const errorPercent = Math.abs((P_max_calc - P_max_fabricante) / P_max_fabricante) * 100;
  
  return {
    voltage, current, power,
    vmpp: V_mpp, impp: I_mpp, pmaxCalc: P_max_calc,
    fillFactor: FF, efficiency, errorPercent,
    iph: I_ph, i0: I_0, jsc: J_sc, atotal: A_total,
    gstc: G_STC, tstcC: T_STC_C, eg: E_G, q: Q, k: K
  };
}

export function toChartData(results: SimulationResults): ChartDataPoint[] {
  return results.voltage.map((v, i) => ({
    voltage: Number(v.toFixed(4)),
    current: Number(results.current[i].toFixed(4)),
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
