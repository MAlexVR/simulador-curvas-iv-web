import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  variant?: "solar" | "volt" | "current" | "blue" | "default";
  subtitle?: string;
  compact?: boolean;
}

const variantStyles = {
  solar: "from-sena-yellow/20 to-sena-yellow/10 border-sena-yellow/30",
  volt: "from-sena-green/20 to-sena-green-dark/10 border-sena-green/30",
  current: "from-current-500/20 to-current-600/10 border-current-500/30",
  blue: "from-sena-navy/20 to-sena-navy/10 border-sena-cyan/30",
  default: "from-muted/50 to-muted/30 border-border",
};

const iconStyles = {
  solar: "text-sena-yellow",
  volt: "text-sena-green",
  current: "text-current-500",
  blue: "text-sena-cyan",
  default: "text-muted-foreground",
};

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  variant = "default",
  subtitle,
  compact = false
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl bg-gradient-to-br border backdrop-blur-sm",
      variantStyles[variant],
      compact ? "p-3" : "p-3 md:p-4"
    )}>
      <div className="flex items-start justify-between mb-1.5 md:mb-2">
        <Icon className={cn("w-4 h-4 md:w-5 md:h-5", iconStyles[variant])} />
      </div>
      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1 truncate">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "font-bold text-foreground",
          compact ? "text-lg" : "text-xl md:text-2xl"
        )}>
          {value}
        </span>
        <span className="text-xs md:text-sm text-muted-foreground">{unit}</span>
      </div>
      {subtitle && (
        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
