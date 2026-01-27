"use client";

import { Loader2, Camera, CheckCircle2, XCircle } from "lucide-react";

interface ChartCaptureModalProps {
  isVisible: boolean;
  progress: number;
  message: string;
  isComplete: boolean;
  isError: boolean;
}

export function ChartCaptureModal({ 
  isVisible, 
  progress, 
  message, 
  isComplete,
  isError 
}: ChartCaptureModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-[320px] mx-4">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          {isComplete && !isError ? (
            <div className="w-16 h-16 rounded-full bg-sena-green/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-sena-green" />
            </div>
          ) : isError ? (
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-sena-green/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-sena-green animate-pulse" />
            </div>
          )}
        </div>

        {/* Titulo */}
        <h3 className="text-center font-semibold text-lg mb-2">
          {isComplete && !isError 
            ? "Captura Completada" 
            : isError 
              ? "Error en Captura"
              : "Capturando Grafica"}
        </h3>

        {/* Mensaje */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          {message}
        </p>

        {/* Barra de progreso */}
        {!isComplete && !isError && (
          <div className="space-y-2">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-sena-green transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Mensaje de exito */}
        {isComplete && !isError && (
          <p className="text-center text-xs text-sena-green">
            La grafica se incluira en el PDF
          </p>
        )}

        {/* Mensaje de error */}
        {isError && (
          <p className="text-center text-xs text-red-500">
            El PDF se generara sin la grafica
          </p>
        )}
      </div>
    </div>
  );
}
