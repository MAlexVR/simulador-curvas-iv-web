import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IconWrapperProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "solar" | "volt" | "current" | "muted";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const variantClasses = {
  default: "text-foreground",
  solar: "text-solar-500",
  volt: "text-volt-500",
  current: "text-current-500",
  muted: "text-muted-foreground",
};

export function IconWrapper({ 
  icon: Icon, 
  size = "md", 
  variant = "default",
  className 
}: IconWrapperProps) {
  return (
    <Icon className={cn(sizeClasses[size], variantClasses[variant], className)} />
  );
}
