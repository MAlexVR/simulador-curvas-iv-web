"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ModuleParams,
  SimulationResults,
  presetToParams,
} from "@/types/module";
import { defaultModule } from "@/lib/presets";
import { runSimulation } from "@/lib/simulation";
import { captureChartWithProgress } from "@/lib/pdf-generator";
import { Header } from "@/components/organisms/Header";
import { ParameterForm } from "@/components/organisms/ParameterForm";
import { IVChart, IVChartHandle } from "@/components/organisms/IVChart";
import { ResultsPanel } from "@/components/organisms/ResultsPanel";
import { ChartCaptureModal } from "@/components/molecules/ChartCaptureModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Sun,
  Zap,
  AlertCircle,
  Settings2,
  LineChart,
  Activity,
  Loader2,
} from "lucide-react";

export function SimulatorTemplate() {
  const [params, setParams] = useState<ModuleParams>(
    presetToParams(defaultModule),
  );
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("params");

  // Estado para captura de grafica
  const [chartImageCache, setChartImageCache] = useState<string | undefined>(
    undefined,
  );
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [captureMessage, setCaptureMessage] = useState("");
  const [captureComplete, setCaptureComplete] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  const aboutRef = useRef<HTMLElement>(null);
  const chartRef = useRef<IVChartHandle>(null);

  // Funcion para obtener el elemento del chart
  const getChartElement = useCallback(() => {
    return chartRef.current?.getChartElement() ?? null;
  }, []);

  // Capturar la grafica cuando hay resultados y se muestra la grafica
  useEffect(() => {
    if (results && !chartImageCache && activeTab === "chart") {
      // Iniciar captura automatica despues de un breve delay
      const startCapture = async () => {
        // Esperar a que el chart se renderice (tiempo extra para moviles)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setShowCaptureModal(true);
        setCaptureComplete(false);
        setCaptureError(false);
        setCaptureProgress(0);
        setCaptureMessage("Preparando captura...");

        const image = await captureChartWithProgress(
          getChartElement,
          (progress, message) => {
            setCaptureProgress(progress);
            setCaptureMessage(message);
          },
          8,
        );

        if (image) {
          setChartImageCache(image);
          setCaptureComplete(true);
          setCaptureMessage("Grafica capturada exitosamente");

          // Cerrar modal despues de mostrar exito
          setTimeout(() => {
            setShowCaptureModal(false);
          }, 1500);
        } else {
          setCaptureError(true);
          setCaptureMessage("No se pudo capturar la grafica");

          // Cerrar modal despues de mostrar error
          setTimeout(() => {
            setShowCaptureModal(false);
          }, 2000);
        }
      };

      startCapture();
    }
  }, [results, chartImageCache, activeTab, getChartElement]);

  const handleSimulate = useCallback(() => {
    setIsSimulating(true);
    setError(null);
    setChartImageCache(undefined); // Limpiar cache

    setTimeout(() => {
      try {
        const simulationResults = runSimulation(params);
        setResults(simulationResults);
        setActiveTab("chart"); // Cambiar a tab de grafica para capturar
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error en la simulacion");
        setResults(null);
      } finally {
        setIsSimulating(false);
      }
    }, 100);
  }, [params]);

  const handleReset = () => {
    setParams(presetToParams(defaultModule));
    setResults(null);
    setError(null);
    setActiveTab("params");
    setChartImageCache(undefined);
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAboutClick={scrollToAbout} />

      {/* Modal de captura de grafica */}
      <ChartCaptureModal
        isVisible={showCaptureModal}
        progress={captureProgress}
        message={captureMessage}
        isComplete={captureComplete}
        isError={captureError}
      />

      {/* Mobile Layout: Tabs */}
      <main className="flex-1 container px-3 py-3 md:hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="params" className="text-xs">
              <Settings2 className="w-3.5 h-3.5 mr-1" />
              Parametros
            </TabsTrigger>
            <TabsTrigger value="chart" className="text-xs" disabled={!results}>
              <LineChart className="w-3.5 h-3.5 mr-1" />
              Grafica
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-xs"
              disabled={!results}
            >
              <Activity className="w-3.5 h-3.5 mr-1" />
              Resultados
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          <TabsContent value="params" className="mt-0 space-y-3 flex-1">
            <ParameterForm
              params={params}
              onChange={setParams}
              onReset={handleReset}
            />

            <div className="sticky bottom-3 pt-2">
              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                size="lg"
                className="w-full shadow-xl bg-sena-green hover:bg-sena-green-dark text-white"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Ejecutar Simulacion
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="mt-0">
            {results ? (
              <div className="h-[calc(100vh-160px)]">
                <IVChart ref={chartRef} results={results} params={params} />
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            {results ? (
              <ResultsPanel
                results={results}
                params={params}
                getChartElement={getChartElement}
                chartImageCache={chartImageCache}
              />
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Desktop Layout: 3 columns */}
      <main className="hidden md:block flex-1 container py-4 lg:py-6">
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">
                Error en la simulacion
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Columna izquierda: Parametros */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              <ParameterForm
                params={params}
                onChange={setParams}
                onReset={handleReset}
              />

              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                size="lg"
                className="w-full bg-sena-green hover:bg-sena-green-dark text-white"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Ejecutar Simulacion
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground space-y-0.5 pt-2">
                <p>Centro de Electricidad, Electronica</p>
                <p>y Telecomunicaciones - SENA</p>
              </div>
            </div>
          </aside>

          {/* Columna central: Grafica */}
          <section className="col-span-12 lg:col-span-6">
            <div className="h-[600px]">
              {results ? (
                <IVChart ref={chartRef} results={results} params={params} />
              ) : (
                <Card className="glass h-full flex items-center justify-center">
                  <CardContent className="text-center p-8">
                    <div className="relative mb-6 mx-auto w-fit">
                      <div className="absolute inset-0 bg-sena-green/20 rounded-full blur-2xl animate-pulse-slow" />
                      <Sun className="relative w-20 h-20 text-sena-green/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                      Listo para simular
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Configure los parametros del modulo y presione
                      <span className="text-sena-green font-medium">
                        {" "}
                        "Ejecutar Simulacion"{" "}
                      </span>
                      para generar las curvas.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Columna derecha: Resultados */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-20">
              {results ? (
                <ResultsPanel
                  results={results}
                  params={params}
                  getChartElement={getChartElement}
                  chartImageCache={chartImageCache}
                />
              ) : (
                <Card className="glass">
                  <CardContent className="py-12 text-center">
                    <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Los resultados apareceran aqui despues de la simulacion.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Footer - Acerca de */}
      <footer
        ref={aboutRef}
        className="border-t bg-muted/30 mt-auto scroll-mt-4"
      >
        <div className="container px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">
                Que es este simulador?
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                Esta herramienta permite simular el comportamiento electrico de
                paneles solares fotovoltaicos. Genera las curvas caracteristicas{" "}
                <strong className="text-foreground">I-V</strong> (Corriente vs
                Voltaje) y <strong className="text-foreground">P-V</strong>{" "}
                (Potencia vs Voltaje) utilizando el metodo matematico Barry
                Analytical Expansion basado en el modelo de un solo diodo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">
                Caracteristicas
              </h3>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                <li>- Modelo de un diodo con resistencias Rs y Rsh</li>
                <li>- Correccion por temperatura de operacion</li>
                <li>- Correccion por nivel de irradiancia solar</li>
                <li>- Calculo del punto de maxima potencia (MPP)</li>
                <li>- Exportacion a CSV, Excel y PDF</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">Creditos</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                <strong className="text-foreground">Autor:</strong> Mauricio
                Alexander Vargas Rodriguez
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                <strong className="text-foreground">Institucion:</strong> Centro
                de Electricidad, Electronica y Telecomunicaciones (CEET)
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Servicio Nacional de Aprendizaje - SENA
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-3">
                Version Web 2.1 - Next.js 15 - 2026
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="glass flex items-center justify-center h-[300px]">
      <CardContent className="text-center p-6">
        <Sun className="w-12 h-12 text-sena-green/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Ejecuta la simulacion para ver los resultados
        </p>
      </CardContent>
    </Card>
  );
}
