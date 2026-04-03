// ─── Condiciones de Imagen EL (IEC TS 60904-13 §6) ───────────────────────────

export interface ImagingConditions {
  // §6(g): Equipo de imagen
  tipoSensor: 'CCD' | 'CMOS';
  modeloCamara: string;
  tipoDetector: string;
  resolucionAncho: number;
  resolucionAlto: number;
  eficienciaCuantica: string;
  modeloLente: string;
  tipoLente: string;
  distanciaFocal: string;
  fNumber: string;
  // §6(h): Correcciones
  correccionPixelesDefectuosos: boolean;
  sustraccionFondo: boolean;
  filtrosAplicados: string;
  // §6(i): Muestreo
  procedimientoMuestreo: string;
  // §6(k): Captura
  /** @deprecated Usar `exposures.tExpIsc` / `exposures.tExpBaja` */
  tiempoExposicion: string;
  distanciaTrabajo: string;
  ganancia: string;
  fNumberOperativo: string;
  exposures?: {
    tExpIsc?: number;
    tExpBaja?: number;
  };
  // §6(n): Inyección
  corrienteInyeccion: string;
  toleranciaCorriente: string;
  tensionBornes: string;
  temperaturaModulo: string;
  anguloCamara: string;
  fuenteDC: string;
  serialFuenteDC: string;
  // §6(l): Sala
  nivelIluminacionSala: string;
  desviacionesMetodo: string;
  comentarios: string;
}

// ─── Equipo de Medición ───────────────────────────────────────────────────────

export interface MeasurementEquipment {
  descripcion: string;
  modelo: string;
  serial: string;
  trazabilidad: string;
  fechaCalibracion: string;
}

// ─── Referencias Normativas ───────────────────────────────────────────────────

export interface NormativeReference {
  id: string;
  code: string;
  title: string;
}

// ─── Editor Visual de Matriz ──────────────────────────────────────────────────

export type MarkerShape =
  | 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'cross'
  | 'hexagon' | 'pentagon' | 'ring';

// ─── Defectos Personalizados ──────────────────────────────────────────────────

export interface CustomDefectEntry {
  codigo: 'D10' | 'D11';
  nombre: string;
  descripcion: string;
}
