"use client";

import { useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import {
  HelpCircle,
  FileText,
  MousePointerClick,
  Settings,
  Download,
  FlaskConical,
  Activity,
} from "lucide-react";

interface UserManualModalProps {
  triggerClassName?: string;
  children?: React.ReactNode;
}

const DEFAULT_TRIGGER_CLASS =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors";

export function UserManualModal({
  triggerClassName,
  children,
}: UserManualModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={triggerClassName ?? DEFAULT_TRIGGER_CLASS}
        onClick={() => setOpen(true)}
      >
        {children || (
          <>
            <HelpCircle className="h-4 w-4 text-sena-green" />
            <span className="hidden md:inline">Manual de Usuario</span>
            <span className="md:hidden">Ayuda</span>
          </>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="max-w-3xl"
        title={
          <>
            <HelpCircle className="h-5 w-5 text-sena-green" />
            Manual de Usuario — Simulador PV v2.3
          </>
        }
        footer={
          <span className="text-[10px] text-gray-400">Versión 2.3 · SENA CEET — LEPS</span>
        }
      >
        <div className="space-y-6 text-sm text-gray-700">

          {/* 1. Parámetros */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-sena-blue flex items-center gap-2">
              <Settings className="h-4 w-4 text-sena-green" /> 1. Configuración de Parámetros
            </h3>
            <p className="text-gray-500 ml-6">
              El panel izquierdo agrupa los parámetros en cuatro pestañas:
            </p>
            <ul className="list-disc ml-10 space-y-1 text-gray-500">
              <li><strong>Eléctrico:</strong> Isc, Voc, Vmp, Imp, Pmax del fabricante.</li>
              <li><strong>Ambiente:</strong> Irradiancia (Gop) y Temperatura (Top). Botones <strong>STC</strong> (1000 W/m², 25°C) y <strong>NOCT</strong> (800 W/m², Tnoct).</li>
              <li><strong>Físico:</strong> Área de celda, celdas en serie (Ns) y paralelo (Np).</li>
              <li><strong>Modelo:</strong> Modelo matemático, modo de operación (Manual / Datasheet), factor n, Rs, Rsh y parámetros DDM/TDM.</li>
            </ul>
          </section>

          {/* 2. Modelos */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-sena-blue flex items-center gap-2">
              <Activity className="h-4 w-4 text-sena-green" /> 2. Modelos Matemáticos
            </h3>
            <div className="ml-6 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">Modelo</th>
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">Método</th>
                    <th className="text-left py-1 font-medium text-gray-500">Referencia</th>
                  </tr>
                </thead>
                <tbody className="text-gray-500">
                  <tr className="border-b border-gray-100"><td className="py-1 pr-3 font-medium">SDM-NR</td><td className="py-1 pr-3">Newton-Raphson (1 diodo)</td><td className="py-1">Abbassi 2017</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-1 pr-3 font-medium">SDM-Lambert</td><td className="py-1 pr-3">Lambert W analítico</td><td className="py-1">Barry 2000/2002</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-1 pr-3 font-medium">DDM</td><td className="py-1 pr-3">Doble diodo NR</td><td className="py-1">Olayiwola 2024</td></tr>
                  <tr><td className="py-1 pr-3 font-medium">TDM</td><td className="py-1 pr-3">Triple diodo NR</td><td className="py-1">Bennagi 2025</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 ml-6 text-xs">
              <strong>Modo Datasheet:</strong> extrae Rs y Rsh automáticamente a partir de Vmp e Imp (método Rahmani 2011).
              <strong> Modo Manual:</strong> permite ingresar Rs/Rsh directamente.
            </p>
          </section>

          {/* 3. Modos de simulación */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-sena-blue flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-sena-green" /> 3. Modos de Simulación
            </h3>
            <div className="ml-6 space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Individual</h4>
                <p className="text-xs text-gray-500">
                  Simula las curvas I-V y P-V a las condiciones G/T configuradas.
                  Los resultados incluyen Pmax, Fill Factor, Eficiencia y MPP.
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Multi-G (Multi-Irradiancia)</h4>
                <p className="text-xs text-gray-500">
                  Genera 5 curvas a distintas irradiancias: 1000, 800, 600, 400 y 200 W/m².
                  Permite estudiar el efecto del sombreado parcial y variación de insolación.
                  El eje de voltaje se ajusta automáticamente al rango real de cada condición.
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Multi-T (Multi-Temperatura)</h4>
                <p className="text-xs text-gray-500">
                  Genera 4 curvas a distintas temperaturas: 5, 25, 45 y 65°C.
                  A menor temperatura el Voc real es más alto (más voltaje disponible).
                  El sweep de voltaje se extiende hasta el Voc real de la condición más fría.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Simulación de defectos */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-sena-blue flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-sena-green" /> 4. Simulación de Defectos Físicos
            </h3>
            <p className="text-gray-500 ml-6">
              En la pestaña <strong>Modelo</strong>, sección "Simulación de Defectos", puede aplicar
              degradaciones físicas reales sobre el panel:
            </p>
            <div className="ml-6 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">Defecto</th>
                    <th className="text-left py-1 pr-3 font-medium text-gray-500">Parámetro</th>
                    <th className="text-left py-1 font-medium text-gray-500">Efecto en curva</th>
                  </tr>
                </thead>
                <tbody className="text-gray-500">
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-3">Corrosión / Mal contacto</td>
                    <td className="py-1 pr-3">Rs ↑ (×2 / ×5 / ×10)</td>
                    <td className="py-1">Aplana la curva cerca de Voc. FF cae.</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-3">Micro-cracks / Bordes</td>
                    <td className="py-1 pr-3">Rsh ↓ (×0.5 / ×0.2 / ×0.05)</td>
                    <td className="py-1">Pendiente en Isc cae. Corriente de fuga.</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-3">Degradación (Aging)</td>
                    <td className="py-1 pr-3">n + 0.1 / +0.3 / +0.5</td>
                    <td className="py-1">Rodilla más suave. Pérdida de Pmax.</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-3">Recombinación</td>
                    <td className="py-1 pr-3">I₀ ×10 / ×100 / ×1000</td>
                    <td className="py-1">Reduce Voc logarítmicamente.</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3">LID (primeras 100-200h)</td>
                    <td className="py-1 pr-3">Isc ↓ 1-3% + n ↑</td>
                    <td className="py-1">Degradación irreversible leve inicial.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 ml-6 text-xs mt-1">
              Use <strong>"Aplicar defecto"</strong> para modificar los parámetros y simular.
              Use <strong>"Quitar"</strong> para restaurar los valores originales.
            </p>
          </section>

          {/* 5. Análisis de resultados */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-sena-blue flex items-center gap-2">
              <FileText className="h-4 w-4 text-sena-green" /> 5. Análisis de Resultados
            </h3>
            <div className="ml-6 grid gap-3 md:grid-cols-2">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Gráfica Interactiva</h4>
                <p className="text-xs text-gray-500">
                  Pase el cursor para ver valores puntuales (V, I, P).
                  Los puntos clave (MPP, Isc, Voc) están resaltados.
                  Botón "Ocultar/Mostrar" para las líneas de referencia.
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Panel de Resultados</h4>
                <p className="text-xs text-gray-500">
                  Pmax, Fill Factor, Eficiencia y error vs fabricante.
                  Vmpp, Impp y parámetros calculados (Iph, I₀, Jsc).
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Gráficas Multi-condición</h4>
                <p className="text-xs text-gray-500">
                  En modo Multi-G y Multi-T se muestran los paneles I-V y P-V
                  en paralelo. Se puede exportar como PNG con el botón de la cabecera.
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-1 text-gray-700">Indicador de Defecto</h4>
                <p className="text-xs text-gray-500">
                  Cuando hay un defecto activo aparece la insignia roja "Activo"
                  en el tab Modelo. Compare la curva normal vs con defecto
                  aplicando y quitando el defecto entre simulaciones.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Exportar */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-sena-blue flex items-center gap-2">
              <Download className="h-4 w-4 text-sena-green" /> 6. Exportar Informe y Datos
            </h3>
            <ul className="list-disc ml-10 space-y-1 text-gray-500">
              <li><strong>PDF:</strong> Informe técnico completo con gráficas (simulación individual).</li>
              <li><strong>CSV / Excel:</strong> Puntos (V, I, P) para MATLAB, Python o Excel.</li>
              <li><strong>PNG:</strong> Imagen de alta resolución de la gráfica activa. En modo Multi-condición, el botón PNG captura ambas curvas (I-V y P-V) en una sola imagen.</li>
            </ul>
          </section>

          <div className="bg-sena-yellow/10 border border-sena-yellow/30 p-4 rounded-lg">
            <p className="text-xs text-center text-gray-500">
              <strong>Nota:</strong> Para obtener mejores resultados, use datos de la hoja de especificaciones
              del fabricante en condiciones STC. Para módulos bifaciales o CPV, los modelos
              de un solo diodo pueden requerir ajuste de parámetros.
            </p>
          </div>

        </div>
      </Modal>
    </>
  );
}
