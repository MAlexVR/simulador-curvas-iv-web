"use client";

import { useState, useCallback, useRef } from "react";
import { ModuleParams, SimulationResults, presetToParams } from "@/types/module";
import { defaultModule } from "@/lib/presets";
import { runSimulation, runMultiCondition } from "@/lib/simulation";
import { MultiConditionResults, ChartMode } from "@/lib/models/types";
import { Header } from "@/components/organisms/Header";
import { ParameterForm } from "@/components/organisms/ParameterForm";
import { IVChart, IVChartHandle } from "@/components/organisms/IVChart";
import { ResultsPanel } from "@/components/organisms/ResultsPanel";
import { MultiConditionChart } from "@/components/organisms/MultiConditionChart";
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
  LoaderCircle,
  BookOpen
} from "lucide-react";
import { ReferencesModal } from "@/components/organisms/ReferencesModal";

export function SimulatorTemplate() {
  const [params, setParams] = useState<ModuleParams>(presetToParams(defaultModule));
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [multiGResults, setMultiGResults] = useState<MultiConditionResults | null>(null);
  const [multiTResults, setMultiTResults] = useState<MultiConditionResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("params");
  const [showReferences, setShowReferences] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('individual');
  const aboutRef = useRef<HTMLElement>(null);
  const chartRef = useRef<IVChartHandle>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // El selector de modo solo cambia qué se VISUALIZA — siempre se computan los tres
  const activeMultiResults = chartMode === 'multi-g' ? multiGResults : chartMode === 'multi-t' ? multiTResults : null;
  const hasResults = results !== null;

  const handleSimulate = useCallback(() => {
    setIsSimulating(true);
    setError(null);

    setTimeout(() => {
      try {
        const model = params.model ?? 'SDM_NR';
        // Siempre calcular los tres modos en una sola pasada
        const individual = runSimulation(params, model);
        const multiG = runMultiCondition(params, model, 'multi-g');
        const multiT = runMultiCondition(params, model, 'multi-t');
        setResults(individual);
        setMultiGResults(multiG);
        setMultiTResults(multiT);
        setActiveTab("chart");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error en la simulación");
        setResults(null);
        setMultiGResults(null);
        setMultiTResults(null);
      } finally {
        setIsSimulating(false);
      }
    }, 100);
  }, [params]);

  const handleReset = () => {
    setParams(presetToParams(defaultModule));
    setResults(null);
    setMultiGResults(null);
    setMultiTResults(null);
    setError(null);
    setActiveTab("params");
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get chart element for PDF export
  const getChartRef = () => {
    return {
      current: chartRef.current?.getChartElement() ?? null
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onAboutClick={scrollToAbout} />

      {/* Mobile Layout: Tabs */}
      <main className="flex-1 container px-3 py-3 md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="params" className="text-xs">
              <Settings2 className="w-3.5 h-3.5 mr-1" />
              Parámetros
            </TabsTrigger>
            <TabsTrigger value="chart" className="text-xs" disabled={!hasResults}>
              <LineChart className="w-3.5 h-3.5 mr-1" />
              Gráfica
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs" disabled={!results}>
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
            <ParameterForm params={params} onChange={setParams} onReset={handleReset} />

            <div className="sticky bottom-3 pt-2 space-y-2">
              {/* Chart mode selector */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {([['individual', 'Individual'], ['multi-g', 'Multi-G'], ['multi-t', 'Multi-T']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartMode(mode)}
                    className={`flex-1 py-1 text-[10px] md:text-xs rounded transition-colors ${
                      chartMode === mode
                        ? 'bg-sena-green text-white font-medium shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                size="lg"
                className="w-full shadow-xl bg-sena-green hover:bg-sena-green-dark text-white"
              >
                {isSimulating ? (
                  <>
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Ejecutar Simulación
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="mt-0">
            {activeTab === 'chart' && chartMode === 'individual' && results ? (
              <div className="h-[calc(100vh-160px)]">
                <IVChart ref={chartRef} results={results} params={params} />
              </div>
            ) : activeTab === 'chart' && activeMultiResults ? (
              <div className="h-[calc(100vh-160px)] overflow-y-auto">
                <MultiConditionChart results={activeMultiResults} params={params} />
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
                chartRef={getChartRef()}
                multiGResults={multiGResults ?? undefined}
                multiTResults={multiTResults ?? undefined}
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
              <p className="font-medium text-destructive">Error en la simulación</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Columna izquierda: Parámetros */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              <ParameterForm params={params} onChange={setParams} onReset={handleReset} />

              {/* Chart mode selector */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {([['individual', 'Individual'], ['multi-g', 'Multi-G'], ['multi-t', 'Multi-T']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartMode(mode)}
                    className={`flex-1 py-1 text-[10px] md:text-xs rounded transition-colors ${
                      chartMode === mode
                        ? 'bg-sena-green text-white font-medium shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                size="lg"
                className="w-full bg-sena-green hover:bg-sena-green-dark text-white"
              >
                {isSimulating ? (
                  <>
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Ejecutar Simulación
                  </>
                )}
              </Button>

            </div>
          </aside>

          {/* Columna central: Gráfica */}
          <section className={`col-span-12 ${activeMultiResults ? 'lg:col-span-9' : 'lg:col-span-6'}`}>
            <div className={chartMode === 'individual' && hasResults ? 'h-[600px]' : ''}>
              {chartMode === 'individual' && results ? (
                <IVChart ref={chartRef} results={results} params={params} />
              ) : activeMultiResults ? (
                <MultiConditionChart results={activeMultiResults} params={params} />
              ) : (
                <Card className="glass h-[600px] flex items-center justify-center">
                  <CardContent className="text-center p-8">
                    <div className="relative mb-6 mx-auto w-fit">
                      <div className="absolute inset-0 bg-sena-green/20 rounded-full blur-2xl animate-pulse-slow" />
                      <Sun className="relative w-20 h-20 text-sena-green/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Listo para simular
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                      Configure los parámetros del módulo y presione
                      <span className="text-sena-green font-medium"> "Ejecutar Simulación" </span>
                      para generar las curvas.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Columna derecha: Resultados — siempre visible, muestra resultados individuales */}
          {!activeMultiResults && (
            <aside className="col-span-12 lg:col-span-3">
              <div className="sticky top-20">
                {results ? (
                  <ResultsPanel
                    results={results}
                    params={params}
                    chartRef={getChartRef()}
                    multiGResults={multiGResults ?? undefined}
                    multiTResults={multiTResults ?? undefined}
                  />
                ) : (
                  <Card className="glass">
                    <CardContent className="py-12 text-center">
                      <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        Los resultados aparecerán aquí después de la simulación.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Acerca de */}
      <section ref={aboutRef} className="border-t bg-white mt-auto scroll-mt-4">
        <div className="container px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm">
            {/* Col 1: descripción */}
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">
                ¿Qué es este simulador?
              </h3>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                Esta herramienta permite simular el comportamiento eléctrico de
                paneles solares fotovoltaicos. Genera las curvas características{" "}
                <strong className="text-gray-700">I-V</strong> (Corriente vs
                Voltaje) y <strong className="text-gray-700">P-V</strong>{" "}
                (Potencia vs Voltaje) utilizando modelos de circuito equivalente
                con uno, dos o tres diodos.
              </p>
            </div>

            {/* Col 2: Modelos disponibles */}
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">
                Modelos disponibles
              </h3>
              <ul className="text-xs md:text-sm text-gray-500 space-y-1">
                <li>• <strong>SDM-NR:</strong> Modelo de un diodo (Newton-Raphson)</li>
                <li>• <strong>SDM-Lambert:</strong> Solución analítica explícita (Barry 2000)</li>
                <li>• <strong>DDM:</strong> Modelo de dos diodos (Olayiwola 2024)</li>
                <li>• <strong>TDM:</strong> Modelo de tres diodos (Bennagi 2025)</li>
                <li>• Modo Datasheet (extracción Rahmani 2011)</li>
                <li>• Curvas Multi-G (5) y Multi-T (4)</li>
                <li>• Exportación a CSV, Excel y PDF</li>
              </ul>
            </div>

            {/* Col 3: Referencias (modal) */}
            <div>
              <h3 className="font-semibold mb-2 text-sena-green flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Referencias
              </h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Este simulador está basado en modelos matemáticos publicados en
                revistas indexadas (IEEE, MDPI). La bibliografía completa en
                formato APA 7 está disponible en el siguiente enlace.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReferences(true)}
                className="text-xs border-sena-green/40 text-sena-green hover:bg-sena-green hover:text-white hover:border-sena-green"
              >
                Ver bibliografía completa
              </Button>
            </div>

            {/* Col 4: Créditos */}
            <div>
              <h3 className="font-semibold mb-2 text-sena-green">Créditos</h3>
              <p className="text-xs md:text-sm text-gray-500">
                <strong className="text-gray-700">Autor:</strong> Ing.
                Mauricio Alexander Vargas Rodríguez, M.Sc., MBA Esp. PM
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                <strong className="text-gray-700">Institución:</strong> Centro
                de Electricidad, Electrónica y Telecomunicaciones (CEET)
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Servicio Nacional de Aprendizaje - SENA
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                <strong className="text-gray-700">Laboratorio:</strong> LEPS -
                Laboratorio de Ensayos para Paneles Solares
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-3">
                Versión Web 2.3 • Next.js 16 • Tailwind v4 • © 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer institucional */}
      <footer className="bg-sena-green text-white py-6 px-4 md:px-8 border-t-4 border-sena-blue mt-auto z-50 relative shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-6">
          {/* Logos institucionales */}
          <div className="flex items-center gap-5 sm:gap-6 flex-shrink-0">
            <img
              src="/logo-centro-formacion-white.svg"
              alt="Centro de Electricidad, Electrónica y Telecomunicaciones - SENA"
              className="h-10 sm:h-12 md:h-14 w-auto drop-shadow-sm object-contain"
            />
            <div className="w-px h-10 sm:h-12 bg-white/30" />
            <img
              src="/logo-grupo-investigacion.svg"
              alt="Grupo de Investigación GICS"
              className="h-10 sm:h-12 md:h-14 w-auto brightness-0 invert drop-shadow-sm object-contain"
            />
          </div>
          {/* Texto institucional */}
          <div className="text-center xl:text-right mt-2 md:mt-0 flex-1">
            <p className="text-sm md:text-base font-semibold tracking-wide text-white">
              © 2026 Servicio Nacional de Aprendizaje — SENA
            </p>
            <p className="text-xs md:text-sm text-white/90 mt-1 leading-snug">
              Centro de Electricidad, Electrónica y Telecomunicaciones · Regional Distrito Capital
            </p>
          </div>
        </div>
      </footer>

      <ReferencesModal open={showReferences} onClose={() => setShowReferences(false)} />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="glass flex items-center justify-center h-[300px]">
      <CardContent className="text-center p-6">
        <Sun className="w-12 h-12 text-sena-green/30 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          Ejecuta la simulación para ver los resultados
        </p>
      </CardContent>
    </Card>
  );
}
