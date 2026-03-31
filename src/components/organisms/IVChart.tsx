"use client";

import { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  payload 
}: { 
  active?: boolean; 
  payload?: Array<{ value: number; name: string; color: string; dataKey: string; payload?: { voltage: number; current: number; power: number } }>; 
}) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 md:p-3 shadow-lg text-xs md:text-sm">
        <p className="text-amber-600 font-medium mb-1">
          V = {data?.voltage?.toFixed(2)} V
        </p>
        <p className="text-red-500">I = {data?.current?.toFixed(3)} A</p>
        <p className="text-sena-green font-medium">P = {data?.power?.toFixed(2)} W</p>
      </div>
    );
  }
  return null;
}

export const IVChart = forwardRef<IVChartHandle, IVChartProps>(
  function IVChart({ results, params }, ref) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const chartData = useMemo(() => toChartData(results), [results]);

    useEffect(() => {
      const el = chartContainerRef.current;
      if (!el) return;
      const observer = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      });
      observer.observe(el);
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setContainerSize({ width, height });
      return () => observer.disconnect();
    }, []);

    // Exponer el elemento del chart para captura de PDF
    useImperativeHandle(ref, () => ({
      getChartElement: () => chartRef.current,
    }));

    const handleExportImage = async () => {
      if (!chartRef.current) return;
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        const link = document.createElement("a");
        link.download = `${params.referencia}_curvas.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
              <CardTitle className="text-base md:text-lg">Curvas I-V y P-V</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                className={`h-8 text-xs ${showLabels ? "border-sena-green/40 text-sena-green bg-sena-green/10 hover:bg-sena-green/15 hover:text-sena-green" : ""}`}
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
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-2 md:p-4 pt-0 min-h-0">
          <div ref={chartRef} className="h-full flex flex-col bg-card/50 rounded-lg p-2">
            {/* Contenedor de la gráfica con altura fija */}
            <div ref={chartContainerRef} className="h-[300px] md:h-[400px] min-w-0">
              {containerSize.width > 0 && containerSize.height > 0 && <ResponsiveContainer width={containerSize.width} height={containerSize.height} minWidth={0}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

                  <XAxis
                    dataKey="voltage"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    tickFormatter={(v) => v.toFixed(0)}
                  />
                  
                  <YAxis
                    yAxisId="current"
                    stroke="#ef4444"
                    tick={{ fill: "#ef4444", fontSize: 10 }}
                    tickFormatter={(v) => v.toFixed(2)}
                    width={45}
                  />
                  
                  <YAxis
                    yAxisId="power"
                    orientation="right"
                    stroke="#39a900"
                    tick={{ fill: "#39a900", fontSize: 10 }}
                    tickFormatter={(v) => v.toFixed(0)}
                    width={35}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    formatter={(value) => (
                      <span style={{ color: "#9ca3af" }} className="text-xs">{value}</span>
                    )}
                  />
                  
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
                  {showLabels && isFinite(results.vmpp) && isFinite(results.impp) && (
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
                  {isFinite(results.vmpp) && isFinite(results.impp) && (
                    <ReferenceDot
                      yAxisId="current"
                      x={results.vmpp}
                      y={results.impp}
                      r={5}
                      fill="#fdc300"
                      stroke="#fdc300"
                      strokeWidth={2}
                    />
                  )}

                  {isFinite(results.vmpp) && isFinite(results.pmaxCalc) && (
                    <ReferenceDot
                      yAxisId="power"
                      x={results.vmpp}
                      y={results.pmaxCalc}
                      r={5}
                      fill="#39a900"
                      stroke="#39a900"
                      strokeWidth={2}
                    />
                  )}
                  
                  <ReferenceDot
                    yAxisId="current"
                    x={0}
                    y={results.current[0]}
                    r={4}
                    fill="#ef4444"
                  />

                  <ReferenceDot
                    yAxisId="current"
                    x={results.voltage[results.voltage.length - 1]}
                    y={0}
                    r={4}
                    fill="#00324D"
                  />
                </ComposedChart>
              </ResponsiveContainer>}
            </div>

            {/* Info panel - siempre visible pero compacto */}
            {showLabels && (
              <div className="flex-shrink-0 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] md:text-xs">
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-red-500 font-medium">Isc</p>
                  <p className="text-gray-700 font-mono">{params.isc.toFixed(2)} A</p>
                </div>
                <div className="bg-sena-blue/10 rounded-lg p-2 text-center">
                  <p className="text-sena-blue font-medium">Voc</p>
                  <p className="text-foreground font-mono">{params.voc.toFixed(2)} V</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-amber-600 font-medium">MPP</p>
                  <p className="text-gray-700 font-mono">{results.vmpp.toFixed(1)}V, {results.impp.toFixed(2)}A</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-sena-green font-medium">Pmax</p>
                  <p className="text-gray-700 font-mono">{results.pmaxCalc.toFixed(1)} W</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
