import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  FileText,
  MousePointerClick,
  Settings,
  Download,
} from "lucide-react";

export function UserManualModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4 text-sena-green" />
          <span className="hidden md:inline">Manual de Usuario</span>
          <span className="md:hidden">Ayuda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-sena-green" />
            Manual de Usuario - Simulador PV
          </DialogTitle>
          <DialogDescription>
            Guía rápida para operar la herramienta de simulación de curvas I-V y
            P-V.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm text-foreground/90 mt-4">
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-leps-navy flex items-center gap-2">
              <Settings className="h-4 w-4" /> 1. Configuración de Parámetros
            </h3>
            <p className="text-muted-foreground ml-6">
              En el panel izquierdo encontrará los parámetros técnicos del
              módulo fotovoltaico. Puede ingresarlos manualmente o usar un
              módulo predefinido:
            </p>
            <ul className="list-disc ml-10 space-y-1 text-muted-foreground">
              <li>
                <strong>Marca/Referencia:</strong> Identificación del panel.
              </li>
              <li>
                <strong>Pestaña Eléctrico:</strong> Datos de hoja de datos (STC)
                como Isc, Voc, Vm, Im y Pmax.
              </li>
              <li>
                <strong>Pestaña Ambiente:</strong> Irradiancia (Gop) y
                Temperatura (Top) simulada.
              </li>
              <li>
                <strong>Pestaña Físico:</strong> Número de celdas y área.
              </li>
              <li>
                <strong>Pestaña Modelo:</strong> Parámetros internos como R
                serie, R paralelo y factor de idealidad.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-leps-navy flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" /> 2. Ejecutar Simulación
            </h3>
            <p className="text-muted-foreground ml-6">
              Seleccione el <strong>Modelo Matemático</strong> deseado en el
              selector superior (ej. SDM, DDM, Barry Analytical). Luego presione
              el botón verde <strong>"Ejecutar Simulación"</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-leps-navy flex items-center gap-2">
              <FileText className="h-4 w-4" /> 3. Análisis de Resultados
            </h3>
            <div className="ml-6 grid gap-4 md:grid-cols-2">
              <div className="bg-muted/30 p-3 rounded-md">
                <h4 className="font-medium mb-1">Gráfica Interactiva</h4>
                <p className="text-xs text-muted-foreground">
                  Visualice las curvas resultantes. Pase el cursor para ver
                  valores puntuales. Los puntos clave (MPP, Isc, Voc) están
                  resaltados.
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-md">
                <h4 className="font-medium mb-1">Panel de Resultados</h4>
                <p className="text-xs text-muted-foreground">
                  A la derecha verá los valores calculados: Potencia Máxima
                  (Pmax), Factor de Llenado (FF), Eficiencia y el error
                  porcentual respecto al fabricante.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-leps-navy flex items-center gap-2">
              <Download className="h-4 w-4" /> 4. Exportar Informe
            </h3>
            <p className="text-muted-foreground ml-6">
              Use los botones en el panel de resultados para decargar los datos:
            </p>
            <ul className="list-disc ml-10 space-y-1 text-muted-foreground">
              <li>
                <strong>PDF:</strong> Genera un informe técnico completo con
                gráficas vectoriales listas para imprimir.
              </li>
              <li>
                <strong>CSV:</strong> Descarga los puntos (V, I, P) para
                análisis en Excel o MATLAB.
              </li>
            </ul>
          </section>

          <div className="bg-sena-yellow/10 border border-sena-yellow/30 p-4 rounded-lg mt-4">
            <p className="text-xs text-center text-muted-foreground">
              <strong>Nota:</strong> Este simulador utiliza modelos matemáticos
              complejos. Para módulos bifaciales o tecnologías especiales, los
              resultados pueden variar.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
