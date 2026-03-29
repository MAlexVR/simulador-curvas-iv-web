"use client";

import { useState, useRef, useEffect } from "react";
import { ModuleParams, PresetModule, presetToParams } from "@/types/module";
import { SimulationModel } from "@/lib/models/types";
import { DEFECTS, DefectType, DefectSeverity } from "@/lib/defects";
import { extractRahmani } from "@/lib/rahmani";
import { InputField } from "@/components/molecules/InputField";
import { ModuleSelector } from "@/components/molecules/ModuleSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings2,
  Zap,
  Sun,
  Grid3X3,
  Download,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
  FlaskConical
} from "lucide-react";
import { defaultModule } from "@/lib/presets";

interface ParameterFormProps {
  params: ModuleParams;
  onChange: (params: ModuleParams) => void;
  onReset: () => void;
}

export function ParameterForm({ params, onChange, onReset }: ParameterFormProps) {
  const [selectedDefect, setSelectedDefect] = useState<DefectType | ''>('');
  const [defectSeverity, setDefectSeverity] = useState<DefectSeverity>('leve');
  const [defectApplied, setDefectApplied] = useState(false);
  const originalRef = useRef<{ rs: number; rsh: number; n: number; i0Factor: number; isc: number } | null>(null);

  // Limpiar defecto cuando cambia el módulo (preset o reset)
  useEffect(() => {
    setDefectApplied(false);
    originalRef.current = null;
  }, [params.referencia]);

  const handleApplyDefect = () => {
    if (!selectedDefect) return;
    originalRef.current = {
      rs: params.rs, rsh: params.rsh, n: params.n,
      i0Factor: params.i0Factor ?? 1, isc: params.isc,
    };
    const defect = DEFECTS.find(d => d.id === selectedDefect)!;
    const { factor } = defect.levels[defectSeverity];
    let updated = { ...params };
    switch (selectedDefect) {
      case 'corrosion':     updated = { ...updated, rs: params.rs * factor }; break;
      case 'microcracks':   updated = { ...updated, rsh: params.rsh * factor }; break;
      case 'aging':         updated = { ...updated, n: params.n + factor }; break;
      case 'recombination': updated = { ...updated, i0Factor: factor }; break;
      case 'lid':
        updated = { ...updated, isc: params.isc * factor, n: params.n + (defectSeverity === 'leve' ? 0.05 : defectSeverity === 'moderado' ? 0.08 : 0.10) };
        break;
    }
    onChange(updated);
    setDefectApplied(true);
  };

  const handleRemoveDefect = () => {
    if (originalRef.current) {
      onChange({ ...params, ...originalRef.current });
      originalRef.current = null;
    }
    setDefectApplied(false);
  };

  const updateField = <K extends keyof ModuleParams>(field: K, value: string) => {
    const numericFields = ["isc", "voc", "gop", "top", "alphaI", "acelda", "ns", "np", "n", "rs", "rsh", "pmax"];
    if (numericFields.includes(field)) {
      const numValue = value === "" ? 0 : parseFloat(value);
      onChange({ ...params, [field]: isNaN(numValue) ? 0 : numValue });
    } else {
      onChange({ ...params, [field]: value });
    }
  };

  const handlePresetSelect = (preset: PresetModule) => {
    onChange(presetToParams(preset));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as PresetModule;
        onChange(presetToParams(json));
      } catch {
        alert("Error al leer el archivo JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data: PresetModule = {
      Marca: params.marca,
      Referencia: params.referencia,
      Isc: params.isc.toString(),
      Voc: params.voc.toString(),
      Gop: params.gop.toString(),
      Top: params.top.toString(),
      Alpha_i: params.alphaI.toString(),
      Acelda: params.acelda.toString(),
      Ns: params.ns.toString(),
      Np: params.np.toString(),
      n: params.n.toString(),
      Rs: params.rs.toString(),
      Rsh: params.rsh.toString(),
      Pmax: params.pmax.toString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${params.referencia || "modulo"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 md:w-5 md:h-5 text-sena-green" />
          <CardTitle className="text-base md:text-lg">
            Parámetros del Panel
          </CardTitle>
        </div>
        <CardDescription className="text-xs mt-1">
          Ingresa los datos técnicos del módulo fotovoltaico. Puedes cargar un módulo predefinido o valores personalizados.
        </CardDescription>
        <div className="flex items-center gap-1.5 mt-2">
          <label className="flex-1 cursor-pointer">
            <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1" asChild>
              <span>
                <Upload className="w-3.5 h-3.5" />
                Cargar
              </span>
            </Button>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={onReset}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selector de módulo */}
        <ModuleSelector value={params.referencia} onSelect={handlePresetSelect} />

        <Separator />

        {/* Categorías de parámetros */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Categorías de parámetros:</span>
          </div>
          
          <Tabs defaultValue="electric" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 gap-1">
              <TabsTrigger 
                value="electric" 
                className="text-[10px] md:text-xs px-1 py-2 flex flex-col items-center gap-0.5 h-auto data-[state=active]:bg-sena-green/20 data-[state=active]:text-sena-green"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Eléctrico</span>
              </TabsTrigger>
              <TabsTrigger 
                value="conditions" 
                className="text-[10px] md:text-xs px-1 py-2 flex flex-col items-center gap-0.5 h-auto data-[state=active]:bg-sena-green/20 data-[state=active]:text-sena-green"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Ambiente</span>
              </TabsTrigger>
              <TabsTrigger 
                value="physical" 
                className="text-[10px] md:text-xs px-1 py-2 flex flex-col items-center gap-0.5 h-auto data-[state=active]:bg-sena-green/20 data-[state=active]:text-sena-green"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Físico</span>
              </TabsTrigger>
              <TabsTrigger 
                value="model" 
                className="text-[10px] md:text-xs px-1 py-2 flex flex-col items-center gap-0.5 h-auto data-[state=active]:bg-sena-green/20 data-[state=active]:text-sena-green"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Modelo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="electric" className="mt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md">
                ⚡ Características eléctricas según el fabricante.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="marca"
                  label="Marca"
                  value={params.marca}
                  onChange={(v) => updateField("marca", v)}
                  type="text"
                  compact
                />
                <InputField
                  id="referencia"
                  label="Referencia"
                  value={params.referencia}
                  onChange={(v) => updateField("referencia", v)}
                  type="text"
                  compact
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="isc"
                  label="Isc"
                  value={params.isc}
                  onChange={(v) => updateField("isc", v)}
                  suffix="A"
                  compact
                />
                <InputField
                  id="voc"
                  label="Voc"
                  value={params.voc}
                  onChange={(v) => updateField("voc", v)}
                  suffix="V"
                  compact
                />
              </div>
              <InputField
                id="pmax"
                label="Pmax (fabricante)"
                value={params.pmax}
                onChange={(v) => updateField("pmax", v)}
                suffix="W"
                compact
              />
              {params.operationMode === 'datasheet' && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dashed">
                  <InputField id="vmp" label="Vmp" value={params.vmp ?? ''} onChange={(v) => {
                    const updated = { ...params, vmp: parseFloat(v) || undefined };
                    if (updated.vmp && updated.imp) {
                      const { rs, rsh } = extractRahmani({ voc: updated.voc, isc: updated.isc, vmp: updated.vmp, imp: updated.imp, ns: updated.ns, n: updated.n, tOpK: updated.top + 273.15 });
                      onChange({ ...updated, rs, rsh });
                    } else {
                      onChange(updated);
                    }
                  }} suffix="V" compact />
                  <InputField id="imp" label="Imp" value={params.imp ?? ''} onChange={(v) => {
                    const updated = { ...params, imp: parseFloat(v) || undefined };
                    if (updated.vmp && updated.imp) {
                      const { rs, rsh } = extractRahmani({ voc: updated.voc, isc: updated.isc, vmp: updated.vmp!, imp: updated.imp, ns: updated.ns, n: updated.n, tOpK: updated.top + 273.15 });
                      onChange({ ...updated, rs, rsh });
                    } else {
                      onChange(updated);
                    }
                  }} suffix="A" compact />
                </div>
              )}
            </TabsContent>

            <TabsContent value="conditions" className="mt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md">
                ☀️ Irradiancia solar y temperatura de operación.
              </p>
              <div className="flex gap-2 mb-1">
                {(['STC', 'NOCT'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (mode === 'STC') onChange({ ...params, gop: 1000, top: 25 });
                      else if (mode === 'NOCT' && params.tnoct) onChange({ ...params, gop: 800, top: params.tnoct });
                      else onChange({ ...params, gop: 800, top: 45 });
                    }}
                    className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                      (mode === 'STC' && params.gop === 1000 && params.top === 25)
                        ? 'bg-sena-green/20 border-sena-green/50 text-sena-green font-medium'
                        : (mode === 'NOCT' && params.gop === 800)
                        ? 'bg-sena-yellow/20 border-sena-yellow/50 text-sena-yellow font-medium'
                        : 'bg-muted/30 border-transparent text-muted-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="gop"
                  label="Gop"
                  value={params.gop}
                  onChange={(v) => updateField("gop", v)}
                  suffix="W/m²"
                  compact
                />
                <InputField
                  id="top"
                  label="Top"
                  value={params.top}
                  onChange={(v) => updateField("top", v)}
                  suffix="°C"
                  compact
                />
              </div>
              <InputField
                id="alphaI"
                label="Coef. αi"
                value={params.alphaI}
                onChange={(v) => updateField("alphaI", v)}
                suffix="%/°C"
                step="0.0001"
                compact
              />
              <InputField id="tnoct" label="Tnoct" value={params.tnoct ?? 45} onChange={(v) => onChange({ ...params, tnoct: parseFloat(v) || 45 })} suffix="°C" compact />
            </TabsContent>

            <TabsContent value="physical" className="mt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md">
                📐 Dimensiones y configuración de celdas.
              </p>
              <InputField
                id="acelda"
                label="Área celda"
                value={params.acelda}
                onChange={(v) => updateField("acelda", v)}
                suffix="m²"
                step="0.0001"
                compact
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="ns"
                  label="Ns (serie)"
                  value={params.ns}
                  onChange={(v) => updateField("ns", v)}
                  compact
                />
                <InputField
                  id="np"
                  label="Np (paralelo)"
                  value={params.np}
                  onChange={(v) => updateField("np", v)}
                  compact
                />
              </div>
            </TabsContent>

            <TabsContent value="model" className="mt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md">
                🔬 Parámetros del modelo de diodo.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Modelo Matemático</label>
                <select
                  value={params.model ?? 'SDM_NR'}
                  onChange={(e) => onChange({ ...params, model: e.target.value as SimulationModel })}
                  className="w-full h-9 px-3 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="SDM_NR">SDM — Newton-Raphson (Abbassi 2017)</option>
                  <option value="SDM_LAMBERT">SDM — Lambert W (Barry 2000)</option>
                  <option value="DDM_NR">DDM — Doble Diodo NR (Olayiwola 2024)</option>
                  <option value="TDM_NR">TDM — Triple Diodo NR (Bennagi 2025)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onChange({ ...params, operationMode: 'manual' })}
                  className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                    (params.operationMode ?? 'manual') === 'manual'
                      ? 'bg-sena-green/20 border-sena-green/50 text-sena-green font-medium'
                      : 'bg-muted/30 border-transparent text-muted-foreground'
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (params.vmp && params.imp) {
                      const { rs, rsh } = extractRahmani({
                        voc: params.voc, isc: params.isc,
                        vmp: params.vmp, imp: params.imp,
                        ns: params.ns, n: params.n,
                        tOpK: (params.top + 273.15)
                      });
                      onChange({ ...params, operationMode: 'datasheet', rs, rsh });
                    } else {
                      onChange({ ...params, operationMode: 'datasheet' });
                    }
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                    params.operationMode === 'datasheet'
                      ? 'bg-sena-yellow/20 border-sena-yellow/50 text-sena-yellow font-medium'
                      : 'bg-muted/30 border-transparent text-muted-foreground'
                  }`}
                >
                  Datasheet
                </button>
              </div>
              <InputField
                id="n"
                label="Factor n"
                value={params.n}
                onChange={(v) => updateField("n", v)}
                step="0.0001"
                compact
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="rs"
                  label={params.operationMode === 'datasheet' ? 'Rs (calc.)' : 'Rs'}
                  value={params.rs}
                  onChange={(v) => updateField("rs", v)}
                  suffix="Ω"
                  step="0.0001"
                  compact
                />
                <InputField
                  id="rsh"
                  label={params.operationMode === 'datasheet' ? 'Rsh (calc.)' : 'Rsh'}
                  value={params.rsh}
                  onChange={(v) => updateField("rsh", v)}
                  suffix="Ω"
                  compact
                />
              </div>
              {(params.model === 'DDM_NR' || params.model === 'TDM_NR') && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dashed">
                  <InputField id="n2" label="n₂" value={params.n2 ?? 2.0} onChange={(v) => onChange({ ...params, n2: parseFloat(v) || 2.0 })} step="0.01" compact />
                  <InputField id="i02" label="I₀₂" value={params.i02 ?? 0} onChange={(v) => onChange({ ...params, i02: parseFloat(v) || 0 })} suffix="A" step="0.000001" compact />
                </div>
              )}
              {params.model === 'TDM_NR' && (
                <div className="grid grid-cols-2 gap-3">
                  <InputField id="n3" label="n₃" value={params.n3 ?? 1.5} onChange={(v) => onChange({ ...params, n3: parseFloat(v) || 1.5 })} step="0.01" compact />
                  <InputField id="i03" label="I₀₃" value={params.i03 ?? 0} onChange={(v) => onChange({ ...params, i03: parseFloat(v) || 0 })} suffix="A" step="0.000001" compact />
                </div>
              )}

              {/* Simulación de Defectos */}
              <Separator className="my-1" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Simulación de Defectos</span>
                  </div>
                  {defectApplied && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                      Activo
                    </Badge>
                  )}
                </div>

                <select
                  value={selectedDefect}
                  onChange={(e) => {
                    setSelectedDefect(e.target.value as DefectType | '');
                    setDefectApplied(false);
                  }}
                  className="w-full h-8 px-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">— Seleccionar defecto —</option>
                  {DEFECTS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                {selectedDefect && (() => {
                  const defect = DEFECTS.find(d => d.id === selectedDefect)!;
                  return (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {(['leve', 'moderado', 'severo'] as DefectSeverity[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setDefectSeverity(s)}
                            className={`flex-1 py-1 text-[10px] rounded border transition-colors capitalize ${
                              defectSeverity === s
                                ? s === 'leve'
                                  ? 'bg-sena-yellow/20 border-sena-yellow/50 text-sena-yellow font-medium'
                                  : s === 'moderado'
                                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 font-medium'
                                  : 'bg-destructive/20 border-destructive/50 text-destructive font-medium'
                                : 'bg-muted/30 border-transparent text-muted-foreground'
                            }`}
                          >
                            {defect.levels[s].label}
                          </button>
                        ))}
                      </div>

                      <div className="p-2 bg-muted/30 rounded-md space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {defect.parameter}: {defect.levels[defectSeverity].description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                          {defect.curveEffect}
                        </p>
                        <p className="text-[9px] text-muted-foreground/50 italic">
                          {defect.reference}
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyDefect}
                          disabled={defectApplied}
                          className="flex-1 h-7 text-[10px] bg-orange-500/80 hover:bg-orange-500 text-white"
                        >
                          Aplicar defecto
                        </Button>
                        {defectApplied && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleRemoveDefect}
                            className="flex-1 h-7 text-[10px]"
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
