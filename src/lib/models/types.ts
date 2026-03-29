// Tipos del sistema multi-modelo fotovoltaico
// Ref: Abbassi 2017 (SDM), Olayiwola 2024 (DDM/TDM), Barry 2000 (Lambert W), Rahmani 2011 (Datasheet)

export type SimulationModel = 'SDM_NR' | 'SDM_LAMBERT' | 'DDM_NR' | 'TDM_NR';
export type OperationMode = 'datasheet' | 'manual';
export type ChartMode = 'individual' | 'multi-g' | 'multi-t';
export type ConditionMode = 'STC' | 'NOCT' | 'custom';

// Input unificado para todos los modelos matemáticos
export interface PVModelInput {
  isc: number;     // Corriente de cortocircuito en STC (A)
  voc: number;     // Voltaje de circuito abierto en STC (V)
  iph: number;     // Corriente fotogenerada (A)
  i0: number;      // Corriente de saturación (A)
  rs: number;      // Resistencia serie (Ω)
  rsh: number;     // Resistencia shunt (Ω)
  n: number;       // Factor de idealidad diodo 1
  n2?: number;     // Factor de idealidad diodo 2 (DDM/TDM)
  i02?: number;    // Corriente saturación diodo 2 (DDM/TDM, A)
  n3?: number;     // Factor de idealidad diodo 3 (TDM)
  i03?: number;    // Corriente saturación diodo 3 (TDM, A)
  ns: number;      // Celdas en serie
  vt: number;      // Voltaje térmico de operación: n*k*T/q (V)
  vocPoints: number; // Número de puntos en la curva
}

// Output unificado para todos los modelos
export interface PVCurveOutput {
  voltage: number[];
  current: number[];
  power: number[];
  vmpp: number;
  impp: number;
  pmpp: number;
}

// Resultados de simulación multi-condición (Multi-G o Multi-T)
export interface MultiConditionResults {
  mode: 'multi-g' | 'multi-t';
  conditions: number[];         // Valores de G (W/m²) o T (°C)
  curves: PVCurveOutput[];      // Una curva por condición
  labels: string[];             // Etiquetas para leyenda
  colors: string[];             // Colores para cada curva
  model: SimulationModel;
}

// Condiciones Multi-G (Olayiwola 2024, Table 1)
export const MULTI_G_CONDITIONS = [1000, 800, 600, 400, 200] as const;

// Condiciones Multi-T estándar
export const MULTI_T_CONDITIONS = [5, 25, 45, 65] as const;

// Paleta de colores para curvas multi-condición
export const MULTI_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'] as const;
