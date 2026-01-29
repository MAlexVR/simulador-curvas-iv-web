"use client";

import { useState, useCallback, useRef } from "react";
import {
  ModuleParams,
  SimulationResults,
  presetToParams,
} from "@/types/module";
import { defaultModule } from "@/lib/presets";
import { runSimulation } from "@/lib/simulation";
import { Header } from "@/components/organisms/Header";
import { ParameterForm } from "@/components/organisms/ParameterForm";
import { IVChart, IVChartHandle } from "@/components/organisms/IVChart";
import { ResultsPanel } from "@/components/organisms/ResultsPanel";
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
  BookOpen,
} from "lucide-react";

export function SimulatorTemplate() {
  const [params, setParams] = useState<ModuleParams>(
    presetToParams(defaultModule),
  );
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("params");

  const aboutRef = useRef<HTMLElement>(null);
  const chartRef = useRef<IVChartHandle>(null);

  const handleSimulate = useCallback(() => {
    setIsSimulating(true);
    setError(null);

    setTimeout(() => {
      try {
        const simulationResults = runSimulation(params);
        setResults(simulationResults);
        setActiveTab("chart");
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
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAboutClick={scrollToAbout} />

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
              <ResultsPanel results={results} params={params} />
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

              <div className="flex justify-center pt-4">
                <img
                  src="/logo-centro-formacion.svg"
                  alt="Centro de Electricidad, Electrónica y Telecomunicaciones - SENA"
                  className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
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
                <ResultsPanel results={results} params={params} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm">
            <div>
              <div className="mb-4">
                <img
                  src="/logo-grupo-investigacion.svg"
                  alt="Grupo de Investigación"
                  className="h-14 w-auto object-contain"
                />
              </div>
              <h3 className="font-semibold mb-2 text-sena-green">
                ¿Qué es este simulador?
              </h3>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                Esta herramienta permite simular el comportamiento eléctrico de
                paneles solares fotovoltaicos. Genera las curvas características{" "}
                <strong className="text-foreground">I-V</strong> (Corriente vs
                Voltaje) y <strong className="text-foreground">P-V</strong>{" "}
                (Potencia vs Voltaje) utilizando modelos de circuito equivalente
                con uno, dos o tres diodos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">
                Modelos disponibles
              </h3>
              <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                <li>
                  • <strong>SDM:</strong> Modelo de un diodo (Newton-Raphson)
                </li>
                <li>
                  • <strong>DDM:</strong> Modelo de dos diodos (A1=1, A2=2)
                </li>
                <li>
                  • <strong>TDM:</strong> Modelo de tres diodos (Olayiwola)
                </li>
                <li>
                  • <strong>Lambert W:</strong> Solución analítica de Barry
                </li>
                <li>• Corrección por temperatura e irradiancia</li>
                <li>• Exportación a CSV, Excel y PDF</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sena-green flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Referencias (APA 7)
              </h3>
              <div className="text-[10px] md:text-xs text-muted-foreground space-y-2">
                <p>
                  Olayiwola, T. N., Hyun, S. H., & Choi, S. J. (2024).
                  Photovoltaic modeling: A comprehensive analysis of the I–V
                  characteristic curve. <em>Sustainability, 16</em>(1), 432.
                </p>
                <p>
                  Abbassi, A., Dami, M. A., & Jemli, M. (2017). Parameters
                  identification of photovoltaic modules based on numerical
                  approach. <em>IEEE Xplore</em>.
                </p>
                <p>
                  Barry, D. A., et al. (2000). Analytical approximations for
                  real values of the Lambert W-function.{" "}
                  <em>Mathematics and Computers in Simulation, 53</em>(1-2),
                  95-103.
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">Créditos</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                <strong className="text-foreground">Autor:</strong> Mauricio
                Alexander Vargas Rodríguez
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                <strong className="text-foreground">Institución:</strong> Centro
                de Electricidad, Electrónica y Telecomunicaciones (CEET)
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Servicio Nacional de Aprendizaje - SENA
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                <strong className="text-foreground">Laboratorio:</strong> LEPS -
                Laboratorio de Ensayos para Paneles Solares
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-3">
                Versión Web 2.3 - Next.js 15 - 2026
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
          Ejecuta la simulación para ver los resultados
        </p>
      </CardContent>
    </Card>
  );
}
