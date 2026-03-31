"use client";

import { Info, Menu, X, HelpCircle } from "lucide-react";
import { UserManualModal } from "@/components/molecules/UserManualModal";
import { useState } from "react";

interface HeaderProps {
  onAboutClick?: () => void;
}

export function Header({ onAboutClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAboutClick = () => {
    setMenuOpen(false);
    onAboutClick?.();
  };

  return (
    <header className="w-full bg-sena-green text-white py-3 px-4 md:px-8 border-b-4 border-sena-blue shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
        {/* Logo + título */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink min-w-0">
          <div className="flex items-center shrink-0">
            <div className="h-10 w-20 md:h-12 md:w-28 relative flex items-center justify-center">
              <img
                src="/logo-leps-white.svg"
                alt="LEPS - Laboratorio de Ensayos para Paneles Solares"
                className="w-full h-auto drop-shadow-sm object-contain"
              />
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/30 shrink-0" />
          <div className="flex flex-col truncate min-w-0">
            <h1 className="text-sm md:text-lg font-bold text-white leading-tight tracking-tight truncate">
              Simulador Curvas I-V / P-V
            </h1>
            <p className="text-[10px] sm:text-xs text-white/80 hidden md:block mt-0.5 font-medium truncate">
              Módulos Fotovoltaicos · SENA CEET
            </p>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium bg-white/10 text-white/90 px-2 py-1 rounded-full mr-2 border border-white/20 select-none">
            v2.4
          </span>
          <UserManualModal triggerClassName="flex items-center gap-1.5 px-3 py-2 h-auto rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors font-medium border border-transparent">
            <HelpCircle size={16} />
            <span>Manual de Usuario</span>
          </UserManualModal>
          <button
            type="button"
            onClick={handleAboutClick}
            className="flex items-center gap-1.5 px-3 py-2 h-auto rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors font-medium border border-transparent"
          >
            <Info size={16} />
            <span>Acerca de</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center shrink-0">
          <button
            type="button"
            className="p-2 text-white/90 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden bg-sena-green border-t border-white/20 mt-3 pt-2">
          <div className="space-y-1">
            <UserManualModal triggerClassName="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-colors">
              <HelpCircle size={18} className="text-white/70" />
              <span>Manual de Usuario</span>
            </UserManualModal>
            <button
              type="button"
              onClick={handleAboutClick}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              <Info size={18} className="text-white/70" />
              Acerca de
            </button>
            <div className="flex items-center justify-between pt-3 pb-1 px-3 border-t border-white/20 mt-2">
              <span className="text-xs text-white/70 font-medium">SENA · CEET · LEPS</span>
              <span className="text-[10px] font-medium bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/20">
                v2.4
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
