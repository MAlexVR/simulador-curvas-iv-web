# Skill Registry — curvas-iv-web

Generated: 2026-03-27

## User Skills

| Skill | Trigger Context |
|-------|----------------|
| go-testing | Go tests, Bubbletea TUI testing |
| skill-creator | Creating new AI skills |
| judgment-day | Code review, adversarial validation |
| branch-pr | PR creation, preparing changes for review |
| issue-creation | Creating GitHub issues, bug reports, feature requests |

## Project Conventions

**Stack**: Next.js 16.2.1 (webpack), React 19, TypeScript 6.0, Tailwind CSS 4.2, Recharts 3.8, Radix UI, jsPDF 4.2, XLSX

**Architecture**: Atomic Design — `atoms/` → `molecules/` → `organisms/` → `templates/`

**Domain**: Simulador fotovoltaico de curvas I-V / P-V — SENA CEET (Colombia)

**Key Files**:
- `src/lib/simulation.ts` — Motor matemático (modelo single-diode, Newton-Raphson)
- `src/lib/presets.ts` — Módulos fotovoltaicos de referencia
- `src/lib/pdf-generator.ts` — Exportación PDF con jsPDF
- `src/types/module.ts` — Tipos TypeScript del dominio
- `src/app/page.tsx` — Entry point (App Router)
- `src/components/templates/SimulatorTemplate.tsx` — Layout principal
- `docs/` — Papers académicos de referencia (10 PDFs)

## Compact Rules

### TypeScript / React
- Strict TypeScript — todos los tipos explícitos, sin `any`
- Componentes funcionales con hooks
- Server components por defecto; `"use client"` solo cuando se necesita interactividad

### Estilo
- Tailwind CSS v4 (CSS-first, `@theme` en globals.css, sin tailwind.config.ts)
- Radix UI para componentes primitivos accesibles
- shadcn/ui patterns para UI components

### Matemática
- Las fórmulas deben citarse con el paper y número de ecuación en comentario
- `E_G = 1.12 eV` para silicio cristalino (Abbassi 2017)
- Modelo de referencia: Abbassi 2017 (Newton-Raphson, single-diode)

### Commits
- Conventional commits (sin Co-Authored-By)
- `feat:`, `fix:`, `refactor:`, `docs:`
