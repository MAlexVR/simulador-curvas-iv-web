// Simulación de defectos físicos en módulos fotovoltaicos
//
// Referencias académicas:
//   Köntges et al. (2014) — "Review of Failures of Photovoltaic Modules", IEA PVPS Task 13
//   Ndiaye et al. (2013) — "Defects Classification of Crystalline-Silicon Modules", Solar Energy
//   Jordan & Kurtz (2013) — "Photovoltaic Degradation Rates: An Analytical Review", Prog. Photovolt.
//   Chegaar et al. (2013) — "Effect of illumination on the solar cell parameters", Solar Energy Materials
//   Green (1982) — "Solar Cells: Operating Principles, Technology and System Applications"
//   Sze & Ng (2007) — "Physics of Semiconductor Devices", 3rd ed.
//   Hahnloser et al. (2006) — "Light-induced degradation in c-Si", Prog. Photovoltaics

export type DefectType = 'corrosion' | 'microcracks' | 'aging' | 'recombination' | 'lid';
export type DefectSeverity = 'leve' | 'moderado' | 'severo';

export interface DefectLevel {
  label: string;
  description: string;
  factor: number;
}

export interface PVDefect {
  id: DefectType;
  name: string;
  parameter: string;        // Parámetro afectado (display)
  paramKey: string;         // Clave en ModuleParams
  operation: 'multiply' | 'add' | 'i0Factor';
  curveEffect: string;      // Descripción del efecto visible en la curva
  reference: string;        // Cita bibliográfica
  levels: Record<DefectSeverity, DefectLevel>;
}

export const DEFECTS: PVDefect[] = [
  {
    id: 'corrosion',
    name: 'Corrosión / Mal Contacto',
    parameter: 'Rs',
    paramKey: 'rs',
    operation: 'multiply',
    curveEffect: 'La pendiente de la curva cerca de Voc se aplana. El Fill Factor cae drásticamente. La potencia máxima se reduce sin afectar Isc.',
    reference: 'Chegaar et al. (2013) Solar Energy Mater.; Jordan & Kurtz (2013) Prog. Photovolt.',
    levels: {
      leve:     { label: 'Leve',     description: 'Rs × 2  — contacto oxidado leve',     factor: 2   },
      moderado: { label: 'Moderado', description: 'Rs × 5  — corrosión apreciable',       factor: 5   },
      severo:   { label: 'Severo',   description: 'Rs × 10 — mal contacto severo',        factor: 10  },
    },
  },
  {
    id: 'microcracks',
    name: 'Micro-cracks / Bordes Dañados',
    parameter: 'Rsh',
    paramKey: 'rsh',
    operation: 'multiply',
    curveEffect: 'La pendiente cerca de Isc cae. La corriente "se fuga" antes de salir del panel. Pérdida de corriente a bajo voltaje.',
    reference: 'Köntges et al. (2014) IEA PVPS Task 13; Ndiaye et al. (2013) Solar Energy',
    levels: {
      leve:     { label: 'Leve',     description: 'Rsh × 0.5  — grietas menores',        factor: 0.5  },
      moderado: { label: 'Moderado', description: 'Rsh × 0.2  — daño significativo',     factor: 0.2  },
      severo:   { label: 'Severo',   description: 'Rsh × 0.05 — cortocircuito parcial',  factor: 0.05 },
    },
  },
  {
    id: 'aging',
    name: 'Degradación del Silicio (Aging)',
    parameter: 'n',
    paramKey: 'n',
    operation: 'add',
    curveEffect: 'La "rodilla" de la curva se vuelve más suave (menos cuadrada). Pérdida de potencia general. Indica mecanismos mixtos de transporte.',
    reference: 'Ndiaye et al. (2013) Solar Energy; Jordan & Kurtz (2013) Prog. Photovolt.',
    levels: {
      leve:     { label: 'Leve',     description: 'n + 0.10 — envejecimiento inicial',   factor: 0.10 },
      moderado: { label: 'Moderado', description: 'n + 0.30 — degradación intermedia',   factor: 0.30 },
      severo:   { label: 'Severo',   description: 'n + 0.50 — degradación avanzada',     factor: 0.50 },
    },
  },
  {
    id: 'recombination',
    name: 'Recombinación (Impurezas)',
    parameter: 'I₀',
    paramKey: 'i0Factor',
    operation: 'i0Factor',
    curveEffect: 'Reduce Voc. La corriente de saturación aumenta por trampas e impurezas en la red cristalina. Voc ≈ nkT/q × ln(factor) de caída.',
    reference: 'Green (1982) Solar Cells; Sze & Ng (2007) Physics of Semiconductor Devices',
    levels: {
      leve:     { label: 'Leve',     description: 'I₀ × 10   — impurezas menores',       factor: 10   },
      moderado: { label: 'Moderado', description: 'I₀ × 100  — recombinación moderada',  factor: 100  },
      severo:   { label: 'Severo',   description: 'I₀ × 1000 — defectos profundos',      factor: 1000 },
    },
  },
  {
    id: 'lid',
    name: 'LID — Degradación Inducida por Luz',
    parameter: 'Isc + n',
    paramKey: 'isc',
    operation: 'multiply',
    curveEffect: 'Primeras 100-200h de operación. Isc cae 1-3% y n aumenta levemente. Efecto del boro-oxígeno en Si tipo-p. Pérdida irreversible leve.',
    reference: 'Hahnloser et al. (2006) Prog. Photovoltaics; Jordan & Kurtz (2013)',
    levels: {
      leve:     { label: 'Leve',     description: 'Isc × 0.99, n + 0.05 — primeras horas',  factor: 0.99  },
      moderado: { label: 'Moderado', description: 'Isc × 0.98, n + 0.08 — 100h operación',  factor: 0.98  },
      severo:   { label: 'Severo',   description: 'Isc × 0.97, n + 0.10 — LID completo',    factor: 0.97  },
    },
  },
];
