"use client";

import { useState } from "react";
import { SimulationResults, ModuleParams } from "@/types/module";
import { exportToCSV } from "@/lib/simulation";
import { generatePDFReport, captureChartImage } from "@/lib/pdf-generator";
import { StatCard } from "@/components/molecules/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Sun,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Activity,
  FileDown,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface ResultsPanelProps {
  results: SimulationResults;
  params: ModuleParams;
  getChartElement?: () => HTMLDivElement | null;
  chartImageCache?: string;
}

export function ResultsPanel({ 
  results, 
  params, 
  getChartElement, 
  chartImageCache,
}: ResultsPanelProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleExportCSV = () => {
    const csv = exportToCSV(results, params);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${params.referencia}_datos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = results.voltage.map((v, i) => ({
        "Voltaje (V)": Number(v.toFixed(6)),
        "Corriente (A)": Number(results.current[i].toFixed(6)),
        "Potencia (W)": Number(results.power[i].toFixed(6)),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Curvas I-V y P-V");
      XLSX.writeFile(wb, `${params.referencia}.xlsx`);
    } catch (error) {
      console.error("Error exportando Excel:", error);
    }
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Usar la imagen cacheada si existe, si no intentar capturar
      let chartImage = chartImageCache;
      
      if (!chartImage && getChartElement) {
        console.log("No cached image, attempting manual capture...");
        const chartElement = getChartElement();
        chartImage = await captureChartImage(chartElement);
      }
      
      // Generar PDF
      await generatePDFReport({
        results,
        params,
        chartImage,
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el reporte PDF. Por favor, intente de nuevo.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isErrorAcceptable = results.errorPercent < 5;
  const hasChartImage = !!chartImageCache;

  return (
    <Card className="glass">
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-sena-green" />
              Resultados
            </CardTitle>
          </div>
          
          {/* Export buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-7 md:h-8 text-xs flex-1 min-w-[60px]"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-7 md:h-8 text-xs flex-1 min-w-[60px]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              Excel
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="h-7 md:h-8 text-xs flex-1 min-w-[60px] bg-sena-green hover:bg-sena-green-dark text-white"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5 mr-1" />
              )}
              PDF
            </Button>
          </div>
          
          {/* Indicador de estado de grafica */}
          {hasChartImage ? (
            <p className="text-[10px] text-sena-green flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Grafica lista para incluir en PDF
            </p>
          ) : (
            <p className="text-[10px] text-amber-500 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Vea la grafica para capturarla
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 md:space-y-4">
        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <StatCard
            icon={Zap}
            label="Pmax"
            value={results.pmaxCalc.toFixed(1)}
            unit="W"
            variant="volt"
            compact
          />
          <StatCard
            icon={Sun}
            label="Fill Factor"
            value={results.fillFactor.toFixed(3)}
            unit=""
            variant="solar"
            compact
          />
          <StatCard
            icon={Percent}
            label="Eficiencia"
            value={results.efficiency.toFixed(2)}
            unit="%"
            variant="blue"
            compact
          />
          <StatCard
            icon={isErrorAcceptable ? CheckCircle2 : AlertTriangle}
            label="Error"
            value={results.errorPercent.toFixed(2)}
            unit="%"
            variant={isErrorAcceptable ? "volt" : "current"}
            compact
          />
        </div>

        <Separator />

        {/* MPP destacado */}
        <div className="p-3 md:p-4 bg-gradient-to-r from-sena-green/10 via-sena-green/5 to-volt-500/10 rounded-xl border border-sena-green/20">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <span className="w-2 h-2 rounded-full bg-sena-green animate-pulse" />
            <span className="text-xs md:text-sm font-semibold text-sena-green">
              Punto de Maxima Potencia (MPP)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="text-center">
              <p className="text-[10px] md:text-xs text-muted-foreground">Vmpp</p>
              <p className="text-sm md:text-lg font-mono font-bold">
                {results.vmpp.toFixed(2)}
                <span className="text-xs text-muted-foreground ml-0.5">V</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] md:text-xs text-muted-foreground">Impp</p>
              <p className="text-sm md:text-lg font-mono font-bold">
                {results.impp.toFixed(2)}
                <span className="text-xs text-muted-foreground ml-0.5">A</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] md:text-xs text-muted-foreground">Pmax</p>
              <p className="text-sm md:text-lg font-mono font-bold text-sena-green">
                {results.pmaxCalc.toFixed(1)}
                <span className="text-xs text-muted-foreground ml-0.5">W</span>
              </p>
            </div>
          </div>
        </div>

        {/* Parametros calculados */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Parametros Calculados
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] md:text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Iph</span>
              <span className="font-mono">{results.iph.toFixed(4)} A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">I0</span>
              <span className="font-mono">{results.i0.toExponential(2)} A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jsc</span>
              <span className="font-mono">{results.jsc.toFixed(2)} mA/cm2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Area</span>
              <span className="font-mono">{results.atotal.toFixed(4)} m2</span>
            </div>
          </div>
        </div>

        {/* Comparacion con fabricante */}
        <div className="flex items-center justify-between p-2 md:p-3 rounded-lg border">
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Pmax Fabricante
            </p>
            <p className="text-sm md:text-base font-mono font-semibold">
              {params.pmax} W
            </p>
          </div>
          <Badge variant={isErrorAcceptable ? "volt" : "current"}>
            {isErrorAcceptable ? "Valido" : "Revisar"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
