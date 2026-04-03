import Image from "next/image";
import { INSTITUTION_CONFIG } from "@/config/report.config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sena-green text-white py-6 px-4 md:px-8 border-t-4 border-sena-blue mt-auto z-50 relative shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-6">
        {/* Left — Logos Institucionales solos */}
        <div className="flex items-center gap-5 sm:gap-6 flex-shrink-0">
          <Image
            src="/assets/logos/logo-centro-formacion-white.svg"
            alt="CEET"
            width={100}
            height={50}
            className="h-10 sm:h-12 md:h-14 w-auto drop-shadow-sm object-contain"
          />
          <div className="w-px h-10 sm:h-12 bg-white/30" />
          <Image
            src="/assets/logos/logo-grupo-investigacion.svg"
            alt="GICS"
            width={100}
            height={50}
            className="h-10 sm:h-12 md:h-14 w-auto brightness-0 invert drop-shadow-sm object-contain"
          />
        </div>

        {/* Right — Texto institucional al estilo leps-iv-report */}
        <div className="text-center xl:text-right mt-2 md:mt-0 flex-1">
          <p className="text-sm md:text-base font-semibold tracking-wide text-white">
            &copy; {currentYear} {INSTITUTION_CONFIG.nameFull}
          </p>
          <p className="text-xs md:text-sm text-white/90 mt-1 leading-snug">
            {INSTITUTION_CONFIG.centerFull} &middot; {INSTITUTION_CONFIG.regional}
          </p>
        </div>
      </div>
    </footer>
  );
}
