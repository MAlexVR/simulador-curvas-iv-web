// Parámetros de entrada del módulo fotovoltaico
export interface ModuleParams {
  marca: string;
  referencia: string;
  isc: number;      // Corriente de cortocircuito (A)
  voc: number;      // Voltaje de circuito abierto (V)
  gop: number;      // Irradiancia de operación (W/m²)
  top: number;      // Temperatura de operación (°C)
  alphaI: number;   // Coeficiente de temperatura Isc (%/°C)
  acelda: number;   // Área de la celda (m²)
  ns: number;       // Número de celdas en serie
  np: number;       // Número de celdas en paralelo
  n: number;        // Factor de idealidad
  rs: number;       // Resistencia serie (Ω)
  rsh: number;      // Resistencia shunt (Ω)
  pmax: number;     // Potencia máxima del fabricante (W)
  // Multi-model fields (opcionales para backward compatibility)
  vmp?: number;      // Voltaje MPP del fabricante (V) — para modo Datasheet
  imp?: number;      // Corriente MPP del fabricante (A) — para modo Datasheet
  tnoct?: number;    // Temperatura NOCT (°C) — para modo NOCT
  n2?: number;       // Factor de idealidad diodo 2 (DDM/TDM)
  i02?: number;      // Corriente saturación diodo 2 (DDM/TDM, A)
  n3?: number;       // Factor de idealidad diodo 3 (TDM)
  i03?: number;      // Corriente saturación diodo 3 (TDM, A)
  operationMode?: import("@/lib/models/types").OperationMode;  // 'datasheet' | 'manual'
  model?: import("@/lib/models/types").SimulationModel;        // modelo activo
  i0Factor?: number;  // multiplicador de I₀ para simular defectos de recombinación (default 1)
}

// Resultados de la simulación
export interface SimulationResults {
  voltage: number[];
  current: number[];
  power: number[];
  vmpp: number;
  impp: number;
  pmaxCalc: number;
  fillFactor: number;
  efficiency: number;
  errorPercent: number;
  iph: number;
  i0: number;
  jsc: number;
  atotal: number;
  gstc: number;
  tstcC: number;
  eg: number;
  q: number;
  k: number;
}

// Datos para gráficas
export interface ChartDataPoint {
  voltage: number;
  current: number;
  power: number;
}

// Módulo predefinido (formato JSON)
export interface PresetModule {
  Marca: string;
  Referencia: string;
  Isc: string;
  Voc: string;
  Gop: string;
  Top: string;
  Alpha_i: string;
  Acelda: string;
  Ns: string;
  Np: string;
  n: string;
  Rs: string;
  Rsh: string;
  Pmax: string;
  Vmp?: string;
  Imp?: string;
  Tnoct?: string;
}

export function presetToParams(preset: PresetModule): ModuleParams {
  return {
    marca: preset.Marca,
    referencia: preset.Referencia,
    isc: parseFloat(preset.Isc),
    voc: parseFloat(preset.Voc),
    gop: parseFloat(preset.Gop),
    top: parseFloat(preset.Top),
    alphaI: parseFloat(preset.Alpha_i),
    acelda: parseFloat(preset.Acelda),
    ns: parseInt(preset.Ns, 10),
    np: parseInt(preset.Np, 10),
    n: parseFloat(preset.n),
    rs: parseFloat(preset.Rs),
    rsh: parseFloat(preset.Rsh),
    pmax: parseFloat(preset.Pmax),
    vmp: preset.Vmp ? parseFloat(preset.Vmp) : undefined,
    imp: preset.Imp ? parseFloat(preset.Imp) : undefined,
    tnoct: preset.Tnoct ? parseFloat(preset.Tnoct) : undefined,
  };
}
