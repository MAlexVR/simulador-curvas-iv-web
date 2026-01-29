"use client";

import {
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { SimulationResults, ModuleParams } from "@/types/module";
import { toChartData } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Image as ImageIcon, LineChart } from "lucide-react";

interface IVChartProps {
  results: SimulationResults;
  params: ModuleParams;
}

export interface IVChartHandle {
  getChartElement: () => HTMLDivElement | null;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
    payload?: { voltage: number; current: number; power: number };
  }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-2 md:p-3 shadow-lg text-xs md:text-sm">
        <p className="text-sena-yellow font-medium mb-1">
          V = {data?.voltage?.toFixed(2)} V
        </p>
        <p className="text-current-400">I = {data?.current?.toFixed(3)} A</p>
        <p className="text-sena-green font-medium">
          P = {data?.power?.toFixed(2)} W
        </p>
      </div>
    );
  }
  return null;
}

export const IVChart = forwardRef<IVChartHandle, IVChartProps>(function IVChart(
  { results, params },
  ref,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showLabels, setShowLabels] = useState(true);
  const chartData = useMemo(() => toChartData(results), [results]);

  // Exponer el elemento del chart para captura de PDF
  useImperativeHandle(ref, () => ({
    getChartElement: () => chartRef.current,
  }));

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${params.referencia}_curvas.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error exportando imagen:", error);
    }
  };

  return (
    <Card className="glass h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 md:pb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 md:w-5 md:h-5 text-sena-green" />
            <CardTitle className="text-base md:text-lg">
              Curvas I-V y P-V
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showLabels ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              className="h-8 text-xs"
            >
              {showLabels ? (
                <Eye className="w-3.5 h-3.5 mr-1" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 mr-1" />
              )}
              <span className="hidden sm:inline">
                {showLabels ? "Ocultar" : "Mostrar"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportImage}
              className="h-8 text-xs"
            >
              <ImageIcon className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">PNG</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge className="text-[10px] md:text-xs bg-sena-green/20 text-sena-green border-sena-green/30">
            {params.marca}
          </Badge>
          <Badge variant="outline" className="text-[10px] md:text-xs">
            {params.referencia}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] md:text-xs bg-sena-yellow/20 text-sena-yellow border-sena-yellow/30"
          >
            {results.modelName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-2 md:p-4 pt-0 min-h-0 flex flex-col">
        <div
          ref={chartRef}
          id="iv-chart-container"
          className="flex-1 flex flex-col bg-slate-900 rounded-lg p-2 min-h-0"
        >
          {/* Contenedor de la gráfica - altura controlada */}
          <div className="flex-1 min-h-[180px] md:min-h-[280px] relative">
            {/* Etiquetas de ejes - misma distancia simétrica */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <span
                className="text-[9px] md:text-[10px] font-medium whitespace-nowrap"
                style={{
                  color: "#ef4444",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                I (A)
              </span>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <span
                className="text-[9px] md:text-[10px] font-medium whitespace-nowrap"
                style={{
                  color: "#39a900",
                  writingMode: "vertical-rl",
                }}
              >
                P (W)
              </span>
            </div>

            <div className="h-full pl-4 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{
                    top: 8,
                    right: 35,
                    left: 0,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />

                  <XAxis
                    dataKey="voltage"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                    tickFormatter={(v) => v.toFixed(0)}
                    label={{
                      value: "Voltaje (V)",
                      position: "insideBottom",
                      offset: -12,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    yAxisId="current"
                    stroke="#ef4444"
                    tick={{ fill: "#ef4444", fontSize: 9 }}
                    tickFormatter={(v) => v.toFixed(1)}
                    width={32}
                  />

                  <YAxis
                    yAxisId="power"
                    orientation="right"
                    stroke="#39a900"
                    tick={{ fill: "#39a900", fontSize: 9 }}
                    tickFormatter={(v) => v.toFixed(0)}
                    width={35}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* Curva I-V */}
                  <Line
                    yAxisId="current"
                    type="monotone"
                    dataKey="current"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="I (A)"
                    activeDot={{ r: 4, fill: "#ef4444" }}
                  />

                  {/* Curva P-V */}
                  <Line
                    yAxisId="power"
                    type="monotone"
                    dataKey="power"
                    stroke="#39a900"
                    strokeWidth={2}
                    dot={false}
                    name="P (W)"
                    activeDot={{ r: 4, fill: "#39a900" }}
                  />

                  {/* Líneas de referencia MPP */}
                  {showLabels && (
                    <>
                      <ReferenceLine
                        yAxisId="current"
                        x={results.vmpp}
                        stroke="#fdc300"
                        strokeDasharray="4 4"
                        opacity={0.7}
                      />
                      <ReferenceLine
                        yAxisId="current"
                        y={results.impp}
                        stroke="#fdc300"
                        strokeDasharray="4 4"
                        opacity={0.7}
                      />
                    </>
                  )}

                  {/* Puntos clave */}
                  <ReferenceDot
                    yAxisId="current"
                    x={results.vmpp}
                    y={results.impp}
                    r={5}
                    fill="#fdc300"
                    stroke="#fdc300"
                    strokeWidth={2}
                    isFront={true}
                  />

                  <ReferenceDot
                    yAxisId="power"
                    x={results.vmpp}
                    y={results.pmaxCalc}
                    r={5}
                    fill="#39a900"
                    stroke="#39a900"
                    strokeWidth={2}
                    isFront={true}
                  />

                  <ReferenceDot
                    yAxisId="current"
                    x={0}
                    y={params.isc}
                    r={4}
                    fill="#ef4444"
                    isFront={true}
                  />

                  {/* Punto Voc - Asegurar que se renderice */}
                  <ReferenceDot
                    yAxisId="current"
                    x={params.voc}
                    y={0}
                    r={4}
                    fill="#00304d"
                    isFront={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========== LEYENDA DEBAJO DE LA GRÁFICA ========== */}
          <div className="flex-shrink-0 mt-2 pt-2 border-t border-slate-700">
            {/* Leyenda de curvas */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-5 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-[3px] bg-[#ef4444] rounded-full"></div>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  Curva I-V
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-[3px] bg-[#39a900] rounded-full"></div>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  Curva P-V
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#fdc300]"></div>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  MPP
                </span>
              </div>
            </div>

            {/* Panel de valores */}
            {showLabels && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2 text-[10px] md:text-xs">
                <div className="bg-red-500/10 rounded-lg p-1.5 md:p-2 text-center border border-red-500/20">
                  <p className="text-red-400 font-medium">Isc</p>
                  <p className="text-foreground font-mono">
                    {params.isc.toFixed(2)} A
                  </p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-1.5 md:p-2 text-center border border-blue-500/20">
                  <p className="text-blue-400 font-medium">Voc</p>
                  <p className="text-foreground font-mono">
                    {params.voc.toFixed(2)} V
                  </p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-1.5 md:p-2 text-center border border-yellow-500/20">
                  <p className="text-yellow-400 font-medium">MPP</p>
                  <p className="text-foreground font-mono">
                    {results.vmpp.toFixed(1)}V, {results.impp.toFixed(2)}A
                  </p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-1.5 md:p-2 text-center border border-green-500/20">
                  <p className="text-green-400 font-medium">Pmax</p>
                  <p className="text-foreground font-mono">
                    {results.pmaxCalc.toFixed(1)} W
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
