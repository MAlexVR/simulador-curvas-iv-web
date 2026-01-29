"use client";

import {
  ModuleParams,
  PresetModule,
  presetToParams,
  ModelType,
} from "@/types/module";
import { InputField } from "@/components/molecules/InputField";
import { ModuleSelector } from "@/components/molecules/ModuleSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Settings2,
  Zap,
  Sun,
  Grid3X3,
  Download,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  FlaskConical,
} from "lucide-react";
import { defaultModule } from "@/lib/presets";
import { MODEL_NAMES } from "@/lib/simulation";

interface ParameterFormProps {
  params: ModuleParams;
  onChange: (params: ModuleParams) => void;
  onReset: () => void;
}

export function ParameterForm({
  params,
  onChange,
  onReset,
}: ParameterFormProps) {
  const updateField = <K extends keyof ModuleParams>(
    field: K,
    value: string,
  ) => {
    const numericFields = [
      "isc",
      "voc",
      "vm",
      "im",
      "gop",
      "top",
      "alphaI",
      "betaV",
      "acelda",
      "ns",
      "np",
      "n",
      "rs",
      "rsh",
      "pmax",
    ];
    if (numericFields.includes(field)) {
      const numValue = value === "" ? 0 : parseFloat(value);
      onChange({ ...params, [field]: isNaN(numValue) ? 0 : numValue });
    } else {
      onChange({ ...params, [field]: value });
    }
  };

  const handleModelChange = (value: ModelType) => {
    onChange({ ...params, modelo: value });
  };

  const handlePresetSelect = (preset: PresetModule) => {
    onChange({ ...presetToParams(preset), modelo: params.modelo });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as PresetModule;
        onChange({ ...presetToParams(json), modelo: params.modelo });
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
      Vm: params.vm.toString(),
      Im: params.im.toString(),
      Gop: params.gop.toString(),
      Top: params.top.toString(),
      Alpha_i: params.alphaI.toString(),
      Beta_v: params.betaV.toString(),
      Acelda: params.acelda.toString(),
      Ns: params.ns.toString(),
      Np: params.np.toString(),
      n: params.n.toString(),
      Rs: params.rs.toString(),
      Rsh: params.rsh.toString(),
      Pmax: params.pmax.toString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 md:w-5 md:h-5 text-sena-green" />
            <CardTitle className="text-base md:text-lg">
              Parámetros del Panel
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <label className="cursor-pointer">
              <Button variant="ghost" size="icon-sm" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <Button variant="ghost" size="icon-sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs mt-1">
          Ingresa los datos técnicos del módulo fotovoltaico. Puedes cargar un
          módulo predefinido o valores personalizados.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selector de módulo */}
        <ModuleSelector
          value={params.referencia}
          onSelect={handlePresetSelect}
        />

        {/* Selector de modelo matemático */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-sena-yellow" />
            <Label className="text-xs font-medium">Modelo Matemático</Label>
          </div>
          <Select value={params.modelo} onValueChange={handleModelChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Seleccionar modelo" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(MODEL_NAMES) as [ModelType, string][]).map(
                ([key, name]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {name}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            {params.modelo === "sdm" &&
              "Un diodo con Newton-Raphson. Modelo estándar de la industria."}
            {params.modelo === "ddm" &&
              "Dos diodos (A1=1, A2=2). Mayor precisión en baja irradiancia."}
            {params.modelo === "tdm" &&
              "Tres diodos (A1=1, A2=1.2, A3=2.5). Máxima precisión teórica."}
            {params.modelo === "lambert" &&
              "Solución explícita con función W de Lambert. Rápido y estable."}
          </p>
        </div>

        <Separator />

        {/* Categorías de parámetros */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Categorías de parámetros:</span>
            <div className="group relative">
              <div className="cursor-help rounded-full bg-muted-foreground/20 p-0.5 hover:bg-muted-foreground/30 transition-colors">
                <span className="sr-only">Ayuda</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block w-64 p-2 bg-popover text-popover-foreground text-[10px] rounded-md border shadow-md z-50">
                <p className="font-semibold mb-1">Descripción de parámetros:</p>
                <ul className="space-y-0.5 list-disc pl-3">
                  <li>
                    <strong>Isc:</strong> Corriente de cortocircuito
                  </li>
                  <li>
                    <strong>Voc:</strong> Voltaje de circuito abierto
                  </li>
                  <li>
                    <strong>Vm/Im:</strong> Voltaje/Corriente en MPP
                  </li>
                  <li>
                    <strong>n:</strong> Factor de idealidad del diodo
                  </li>
                  <li>
                    <strong>Rs:</strong> Resistencia serie
                  </li>
                  <li>
                    <strong>Rsh:</strong> Resistencia shunt (paralelo)
                  </li>
                  <li>
                    <strong>Alpha/Beta:</strong> Coef. temperatura
                  </li>
                </ul>
              </div>
            </div>
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
                ⚡ Características eléctricas según el fabricante (STC).
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
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="vm"
                  label="Vm (MPP)"
                  value={params.vm}
                  onChange={(v) => updateField("vm", v)}
                  suffix="V"
                  compact
                />
                <InputField
                  id="im"
                  label="Im (MPP)"
                  value={params.im}
                  onChange={(v) => updateField("im", v)}
                  suffix="A"
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
            </TabsContent>

            <TabsContent value="conditions" className="mt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md">
                ☀️ Condiciones ambientales y coeficientes de temperatura.
              </p>
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
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="alphaI"
                  label="Coef. α (Isc)"
                  value={params.alphaI}
                  onChange={(v) => updateField("alphaI", v)}
                  suffix="%/°C"
                  step="0.001"
                  compact
                />
                <InputField
                  id="betaV"
                  label="Coef. β (Voc)"
                  value={params.betaV}
                  onChange={(v) => updateField("betaV", v)}
                  suffix="V/°C"
                  step="0.001"
                  compact
                />
              </div>
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
                🔬 Parámetros del circuito equivalente.
              </p>
              <InputField
                id="n"
                label="Factor η"
                value={params.n}
                onChange={(v) => updateField("n", v)}
                step="0.0001"
                compact
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="rs"
                  label="Rs"
                  value={params.rs}
                  onChange={(v) => updateField("rs", v)}
                  suffix="Ω"
                  step="0.0001"
                  compact
                />
                <InputField
                  id="rsh"
                  label="Rsh"
                  value={params.rsh}
                  onChange={(v) => updateField("rsh", v)}
                  suffix="Ω"
                  compact
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
