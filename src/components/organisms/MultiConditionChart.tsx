"use client";

import { useMemo, useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MultiConditionResults } from "@/lib/models/types";
import { ModuleParams } from "@/types/module";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Image as ImageIcon, FileDown, LoaderCircle } from "lucide-react";

export interface MultiConditionChartHandle {
  getChartElement: () => HTMLDivElement | null;
}

interface MultiConditionChartProps {
  results: MultiConditionResults;
  params: ModuleParams;
}

interface MultiChartPoint {
  voltage: number;
  [key: string]: number;
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
  payload: MultiChartPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.payload?.voltage;
  return (
    <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">V = {v?.toFixed(2)} V</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(3)}</p>
      ))}
    </div>
  );
}

export const MultiConditionChart = forwardRef<MultiConditionChartHandle, MultiConditionChartProps>(
function MultiConditionChart({ results, params }, ref) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const ivPanelRef = useRef<HTMLDivElement>(null);
  const pvPanelRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { mode, curves, labels, colors } = results;

  useEffect(() => { setMounted(true); }, []);

  useImperativeHandle(ref, () => ({
    getChartElement: () => chartContainerRef.current,
  }));

  const captureElement = async (el: HTMLDivElement | null): Promise<string | undefined> => {
    if (!el) return undefined;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, { backgroundColor: "#020617", scale: 2 });
    return canvas.toDataURL("image/png");
  };

  const handleExportImage = async () => {
    if (!chartContainerRef.current) return;
    try {
      const image = await captureElement(chartContainerRef.current);
      if (!image) return;
      const link = document.createElement("a");
      link.download = `curvas_${mode === 'multi-g' ? 'multi-irradiancia' : 'multi-temperatura'}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Error exportando imagen:", error);
    }
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const [ivImage, pvImage] = await Promise.all([
        captureElement(ivPanelRef.current),
        captureElement(pvPanelRef.current),
      ]);
      const { generatePDFReport } = await import("@/lib/pdf-generator");
      await generatePDFReport({ params, multiResults: results, ivChartImage: ivImage, pvChartImage: pvImage });
    } catch (error) {
      console.error("Error generando PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const chartData = useMemo((): MultiChartPoint[] => {
    if (!curves.length) return [];
    return curves[0].voltage.map((v, i) => {
      const point: MultiChartPoint = { voltage: Number(v.toFixed(4)) };
      curves.forEach((curve, ci) => {
        point[`current_${ci}`] = Number(curve.current[i].toFixed(6));
      });
      return point;
    });
  }, [curves]);

  const pvData = useMemo((): MultiChartPoint[] => {
    if (!curves.length) return [];
    return curves[0].voltage.map((v, i) => {
      const point: MultiChartPoint = { voltage: Number(v.toFixed(4)) };
      curves.forEach((curve, ci) => {
        point[`power_${ci}`] = Number(curve.power[i].toFixed(4));
      });
      return point;
    });
  }, [curves]);

  const title = mode === 'multi-g' ? 'Curvas I-V por Irradiancia' : 'Curvas I-V por Temperatura';
  const pvTitle = mode === 'multi-g' ? 'Curvas P-V por Irradiancia' : 'Curvas P-V por Temperatura';

  const IVChart = (
    <div ref={ivPanelRef} className="min-w-0 h-[280px] md:h-[340px]">
      <p className="text-xs font-medium text-muted-foreground mb-1 text-center">{title}</p>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="voltage" type="number" domain={["dataMin", "dataMax"]} stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(0)} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(2)} width={45} domain={[0, 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            {curves.map((_, ci) => (
              <Line key={ci} type="monotone" dataKey={`current_${ci}`} stroke={colors[ci]} strokeWidth={2} dot={false} name={labels[ci]} activeDot={{ r: 3 }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const PVChart = (
    <div ref={pvPanelRef} className="min-w-0 h-[280px] md:h-[340px]">
      <p className="text-xs font-medium text-muted-foreground mb-1 text-center">{pvTitle}</p>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
          <ComposedChart data={pvData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="voltage" type="number" domain={["dataMin", "dataMax"]} stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(0)} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={(v: number) => v.toFixed(1)} width={45} domain={[0, 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            {curves.map((_, ci) => (
              <Line key={ci} type="monotone" dataKey={`power_${ci}`} stroke={colors[ci]} strokeWidth={2} dot={false} name={labels[ci]} activeDot={{ r: 3 }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 md:w-5 md:h-5 text-sena-green" />
            <CardTitle className="text-base md:text-lg">
              {mode === 'multi-g' ? 'Análisis Multi-Irradiancia' : 'Análisis Multi-Temperatura'}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {curves.length} curvas
            </Badge>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={handleExportImage} className="h-8 text-xs gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="h-8 text-xs gap-1 bg-sena-green hover:bg-sena-green-dark text-white"
            >
              {isGeneratingPDF
                ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                : <FileDown className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-4 pt-0">
        <div ref={chartContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card/50 rounded-lg p-2">
          {IVChart}
          {PVChart}
        </div>
      </CardContent>
    </Card>
  );
});
