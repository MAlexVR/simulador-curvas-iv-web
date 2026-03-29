"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Reference {
  id: number;
  apa: React.ReactNode;
  url?: string;
}

const REFERENCES: Reference[] = [
  {
    id: 1,
    apa: (
      <>
        Barry, D. A., Parlange, J.-Y., Li, L., Prommer, H., Cunningham, C. J., &amp; Stagnitti, F.
        (2000). Analytical approximations for real values of the Lambert W-function.{" "}
        <em>Mathematics and Computers in Simulation</em>, <em>53</em>(1&ndash;2), 95&ndash;103.
      </>
    ),
    url: "https://doi.org/10.1016/S0378-4754(00)00172-5",
  },
  {
    id: 2,
    apa: (
      <>
        Barry, D. A., Parlange, J.-Y., Li, L., Prommer, H., Cunningham, C. J., &amp; Stagnitti, F.
        (2002). Erratum to &ldquo;Analytical approximations for real values of the Lambert
        W-function&rdquo; [Mathematics and Computers in Simulation 53 (2000) 95&ndash;103].{" "}
        <em>Mathematics and Computers in Simulation</em>, <em>59</em>(6), 543.
      </>
    ),
    url: "https://doi.org/10.1016/S0378-4754(02)00051-4",
  },
  {
    id: 3,
    apa: (
      <>
        Olayiwola, T. N., Hyun, S.-H., &amp; Choi, S.-J. (2024). Photovoltaic modeling: A
        comprehensive analysis of the I&ndash;V characteristic curve.{" "}
        <em>Sustainability</em>, <em>16</em>(1), 432.
      </>
    ),
    url: "https://doi.org/10.3390/su16010432",
  },
  {
    id: 4,
    apa: (
      <>
        Rahmani, L., Seddaoui, N., Kessala, A., &amp; Chouder, A. (2011). Parameters extraction of
        photovoltaic module at reference and real conditions. In{" "}
        <em>
          Proceedings of the 2011 International Conference on Communications, Computing and Control
          Applications (CCCA)
        </em>{" "}
        (pp. 1&ndash;6). IEEE.
      </>
    ),
    url: "https://ieeexplore.ieee.org/document/6125617",
  },
  {
    id: 5,
    apa: (
      <>
        Abbassi, A., Dami, M. A., &amp; Jemli, M. (2017). Parameters identification of
        photovoltaic modules based on numerical approach for the single-diode model. In{" "}
        <em>
          Proceedings of the 2017 IEEE International Conference on Sciences and Techniques of
          Automatic Control and Computer Engineering (STA)
        </em>{" "}
        (pp. 1&ndash;7). IEEE.
      </>
    ),
  },
  {
    id: 6,
    apa: (
      <>
        Song, Z., Fang, K., Sun, X., Liang, Y., Lin, W., Xu, C., Huang, G., &amp; Yu, F. (2021).
        An effective method to accurately extract the parameters of single diode model of solar
        cells. <em>Nanomaterials</em>, <em>11</em>(10), 2615.
      </>
    ),
    url: "https://doi.org/10.3390/nano11102615",
  },
  {
    id: 7,
    apa: (
      <>
        Vais, R. I., Sahay, K., Chiranjeevi, T., Devarapalli, R., &amp; Knypi&#324;ski, &#321;.
        (2023). Parameter extraction of solar photovoltaic modules using a novel bio-inspired swarm
        intelligence optimisation algorithm. <em>Sustainability</em>, <em>15</em>(10), 8407.
      </>
    ),
    url: "https://doi.org/10.3390/su15108407",
  },
  {
    id: 8,
    apa: (
      <>
        Mahto, R., &amp; John, R. (2021). Modeling of photovoltaic module. In A. M. Elseman (Ed.),{" "}
        <em>Solar cells &mdash; Theory, materials and recent advances</em>. IntechOpen.
      </>
    ),
    url: "https://doi.org/10.5772/intechopen.97082",
  },
  {
    id: 9,
    apa: (
      <>
        Bennagi, A., AlHousrya, O., Cotfas, D. T., &amp; Cotfas, P. A. (2025). Parameter
        extraction of photovoltaic cells and panels using a PID-based metaheuristic algorithm.{" "}
        <em>Applied Sciences</em>, <em>15</em>(13), 7403.
      </>
    ),
    url: "https://doi.org/10.3390/app15137403",
  },
];

interface ReferencesModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReferencesModal({ open, onClose }: ReferencesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] bg-card border rounded-xl shadow-2xl flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sena-green" />
              <Dialog.Title className="text-base font-semibold">
                Referencias
              </Dialog.Title>
              <Badge variant="secondary" className="text-xs">
                APA 7
              </Badge>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <p className="text-xs text-muted-foreground mb-4">
              Bibliografía utilizada como base teórica y metodológica para el desarrollo de este
              simulador.
            </p>
            <ol className="space-y-4">
              {REFERENCES.map((ref) => (
                <li key={ref.id} className="flex gap-3 text-sm leading-relaxed">
                  <span className="text-sena-green font-semibold shrink-0 w-5 text-right">
                    {ref.id}.
                  </span>
                  <span className="text-muted-foreground flex-1">
                    {ref.apa}
                    {ref.url && (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 ml-1.5 text-sena-green hover:underline"
                        aria-label="Abrir en fuente original"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-muted/30 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Cerrar
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
