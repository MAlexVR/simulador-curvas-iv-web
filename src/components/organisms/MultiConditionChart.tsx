"use client";

import { useMemo, useRef, forwardRef, useImperativeHandle, useState, useEffect, type RefObject } from "react";
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
    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">V = {v?.toFixed(2)} V</p>
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
  const [ivSize, setIvSize] = useState({ width: 0, height: 0 });
  const [pvSize, setPvSize] = useState({ width: 0, height: 0 });
  const { mode, curves, labels, colors } = results;

  useEffect(() => {
    const observePanel = (
      ref: RefObject<HTMLDivElement | null>,
      setter: (s: { width: number; height: number }) => void
    ) => {
      const el = ref.current;
      if (!el) return () => {};
      const observer = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setter({ width, height });
      });
      observer.observe(el);
      return () => observer.disconnect();
    };
    const cleanIv = observePanel(ivPanelRef, setIvSize);
    const cleanPv = observePanel(pvPanelRef, setPvSize);
    return () => { cleanIv(); cleanPv(); };
  }, []);

  useImperativeHandle(ref, () => ({
    getChartElement: () => chartContainerRef.current,
  }));

  const captureElement = async (el: HTMLDivElement | null): Promise<string | undefined> => {
    if (!el) return undefined;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2 });
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
      {ivSize.width > 0 && ivSize.height > 0 && (
        <ResponsiveContainer width={ivSize.width} height={ivSize.height} minWidth={0}>
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
      {pvSize.width > 0 && pvSize.height > 0 && (
        <ResponsiveContainer width={pvSize.width} height={pvSize.height} minWidth={0}>
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
            <Badge className="text-[10px] bg-sena-green/15 text-sena-green border-sena-green/30">
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
