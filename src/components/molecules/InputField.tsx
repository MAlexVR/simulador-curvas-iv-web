"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputFieldProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  suffix?: string;
  step?: string;
  className?: string;
  compact?: boolean;
}

export function InputField({
  id,
  label,
  value,
  onChange,
  type = "number",
  suffix,
  step = "any",
  className,
  compact = false,
}: InputFieldProps) {
  return (
    <div className={cn("space-y-1.5 min-w-0", className)}>
      <Label 
        htmlFor={id} 
        className={cn(
          "text-muted-foreground block truncate",
          compact ? "text-xs" : "text-xs md:text-sm"
        )}
        title={label}
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        suffix={suffix}
        className={cn(
          "bg-background/50",
          compact ? "h-9 text-sm" : "h-9 md:h-10"
        )}
      />
    </div>
  );
}
