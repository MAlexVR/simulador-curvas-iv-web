"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { presetModules } from "@/lib/presets";
import { PresetModule } from "@/types/module";

interface ModuleSelectorProps {
  value: string;
  onSelect: (preset: PresetModule) => void;
}

export function ModuleSelector({ value, onSelect }: ModuleSelectorProps) {
  const handleChange = (reference: string) => {
    const preset = presetModules.find((p) => p.Referencia === reference);
    if (preset) onSelect(preset);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs md:text-sm text-sena-green">
        Módulos Predefinidos
      </Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full bg-sena-green/10 border-sena-green/30 focus:ring-sena-green/50">
          <SelectValue placeholder="Seleccionar módulo" />
        </SelectTrigger>
        <SelectContent>
          {presetModules.map((preset) => (
            <SelectItem key={preset.Referencia} value={preset.Referencia}>
              <span className="font-medium">{preset.Marca}</span>
              <span className="text-muted-foreground ml-2">
                {preset.Referencia}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
