# Simulador de Curvas I-V y P-V v2.4

Aplicación web para simular el comportamiento eléctrico de paneles solares fotovoltaicos. Genera las curvas características **I-V** (Corriente vs Voltaje) y **P-V** (Potencia vs Voltaje) utilizando cuatro modelos matemáticos seleccionables: SDM Newton-Raphson, SDM Lambert W, DDM y TDM.

## Modelos Matemáticos

| Modelo | Método | Referencia |
|--------|--------|-----------|
| SDM Newton-Raphson | Iterativo implícito | Abbassi et al. 2017 |
| SDM Lambert W | Analítico explícito | Barry et al. 2000/2002 |
| DDM Newton-Raphson | Dos diodos, iterativo | Olayiwola et al. 2024 |
| TDM Newton-Raphson | Tres diodos, iterativo | Bennagi et al. 2025 |

## 🔬 Modelo Matemático

El simulador implementa cuatro modelos de circuito equivalente del módulo fotovoltaico.

### SDM — Modelo de Un Solo Diodo (Newton-Raphson)

Ecuación implícita:

```
I = Iph - I0 × [exp((V + I·Rs) / (Ns·n·Vt)) - 1] - (V + I·Rs) / Rsh
```

Esta ecuación es **implícita en I** — no existe solución algebraica directa. Se resuelve numéricamente con el **método Newton-Raphson** en cada punto de voltaje.

### SDM — Modelo de Un Solo Diodo (Lambert W)

Solución analítica explícita utilizando la función Lambert W (rama principal W₀):

```
I = (Iph + I0 - V/Rsh) / (1 + Rs/Rsh) - (Ns·Vt / Rs) × W₀(arg)
```

Convergencia cuadrática mediante iteración de Halley.

### DDM — Modelo de Doble Diodo (Newton-Raphson)

```
I = Iph - I01·[exp((V+IRs)/(Ns·n1·Vt))-1] - I02·[exp((V+IRs)/(Ns·n2·Vt))-1] - (V+IRs)/Rsh
```

### TDM — Modelo de Triple Diodo (Newton-Raphson)

```
I = Iph - I01·[exp((V+IRs)/(Ns·n1·Vt))-1] - I02·[...] - I03·[...] - (V+IRs)/Rsh
```

### Parámetros del modelo

| Parámetro | Descripción | Fórmula |
|-----------|-------------|---------|
| **Iph** | Corriente fotogenerada | `(G/Gref) × [Isc + αi·Isc·(T - Tref)]` |
| **I0** | Corriente de saturación inversa | `Irs × (T/Tref)³ × exp[(Eg/(n·Vtref)) × (1 - Tref/T)]` |
| **Irs** | Corriente de saturación en STC | `Isc / [exp(Voc/(Ns·n·Vt_stc)) - 1]` |
| **Vt** | Voltaje térmico del diodo | `n·k·T / q` |
| **Rs** | Resistencia serie (Ω) | Dato del fabricante o extracción Rahmani |
| **Rsh** | Resistencia shunt (Ω) | Dato del fabricante o extracción Rahmani |

### Newton-Raphson (SDM/DDM/TDM)

Para cada punto de voltaje V, se resuelve `f(I) = 0` donde:

```
f(I)  = Iph - I0·[exp(Vd/(Ns·n·Vt)) - 1] - Vd/Rsh - I
f'(I) = -I0·(Rs/(Ns·n·Vt))·exp(Vd/(Ns·n·Vt)) - Rs/Rsh - 1
I_n+1 = I_n - f(I_n) / f'(I_n)
```

Convergencia típica: ~15-20 iteraciones a tolerancia 1e-10.

### Modo Datasheet — Extracción Rs/Rsh (Rahmani 2011)

A partir de Voc, Isc, Vmp e Imp del fabricante, extrae automáticamente Rs y Rsh mediante el método iterativo de Rahmani et al. (2011, CCCA).

### Referencias académicas

- **Abbassi et al. (2017)** — "Parameters identification of photovoltaic modules based on numerical approach for the single-diode model" (IEEE)
- **Seddahou et al. (2011)** — "Parameters extraction of photovoltaic module at reference and real conditions" (UPEC)
- **Olayiwola et al. (2024)** — "Photovoltaic Modeling: A Comprehensive Analysis" (Sustainability 16, 432)
- **Barry et al. (2000)** — "Analytical approximations for real values of the Lambert W-function" (Math. Comput. Simul. 53, 95-103)
- **Barry et al. (2002)** — Erratum (Math. Comput. Simul. 59, 543)
- **Bennagi et al. (2025)** — Triple diode model (Appl. Sci. 15, 7403)
- **Rahmani et al. (2011)** — Rs/Rsh extraction from datasheet (CCCA, doi:10.1109/CCCA.2011.6125617)

## 🎨 Identidad Visual SENA/GICS

| Color | Variable | Hex | Uso |
|-------|----------|-----|-----|
| Verde Principal | `sena-green` | `#39a900` | Botones, iconos activos |
| Verde Oscuro | `sena-green-dark` | `#007832` | Hover, detalles |
| Azul Marino | `sena-navy` | `#00304d` | Encabezados |
| Amarillo | `sena-yellow` | `#fdc300` | Acentos, alertas |
| Cian | `sena-cyan` | `#50e5f9` | Gráficos |

## 🚀 Tecnologías (Stack Actualizado 2026)

| Dependencia | Versión | Nota |
|-------------|---------|------|
| **Next.js** | 16.2.1 | App Router, Turbopack nativo |
| **React** | 19.2.4 | Server Components |
| **TypeScript** | 6.0.2 | Type safety estricto |
| **Tailwind CSS** | 4.2.2 | CSS-first config (@theme) |
| **@tailwindcss/postcss** | 4.2.2 | Plugin PostCSS v4 |
| **Recharts** | 3.8.1 | Gráficas interactivas |
| **jsPDF** | 4.2.1 | Generación de PDF |
| **lucide-react** | 1.7.0 | Iconografía |
| **Radix UI** | latest | Componentes headless |
| **class-variance-authority** | 0.7.1 | Variants de componentes |
| **tailwind-merge** | 2.6.1 | Merge inteligente de clases |
| **html2canvas** | 1.4.1 | Captura de gráficas |
| **xlsx** | 0.18.5 | Exportación Excel |
| **Work Sans** | Google Fonts | Tipografía principal |

## 📱 Diseño Mobile-First

### Móvil (< 768px)
- Navegación por tabs: **Parámetros | Gráfica | Resultados**
- Formulario con categorías colapsables
- Botón de simulación sticky

### Desktop (> 768px)
- Layout de 3 columnas con paneles sticky

## 📄 Exportación de Reportes

- **CSV**: Datos tabulados de las curvas
- **Excel**: Formato .xlsx con los 200 puntos de simulación
- **PDF**: Informe técnico institucional SENA/LEPS con hasta 6 páginas en formato **Carta**:

| Página | Contenido |
|--------|-----------|
| 1 | Encabezado (logos SENA + LEPS), datos del módulo, condiciones de simulación, tabla de resultados |
| 2 | Curvas I-V y P-V dibujadas nativamente (sin captura de pantalla), caja MPP |
| 3 | Parámetros de entrada, parámetros calculados, comparación con fabricante, notas |
| 4 | Análisis Multi-Irradiancia — curvas I-V y P-V para 5 niveles (1000–200 W/m²) |
| 5 | Análisis Multi-Temperatura — curvas I-V y P-V para 4 niveles (5–65 °C) |
| 6 | Referencias bibliográficas (APA 7, sangría francesa) |

  Características:
  - Fuente **Roboto** (cargada desde `/public/fonts/`)
  - Logos institucionales con proporciones exactas (SENA 6.81:1, LEPS 2.43:1)
  - Footer con dirección del laboratorio y barra verde SENA en cada página
  - Nombre de archivo: `Simulacion_LEPS_{marca}_{ref}_{fecha}.pdf`
  - Curvas multi-condición dibujadas nativamente en jsPDF (sin html2canvas)
- **PNG**: Captura de gráficas individuales y multi-condición

## 📁 Estructura Atomic Design

```
src/components/
├── ui/              # shadcn/ui (Button, Input, Card, Select, Tabs, Badge)
├── atoms/           # Componentes básicos (IconWrapper)
├── molecules/       # Combinaciones (InputField, StatCard, ModuleSelector)
├── organisms/       # Secciones (Header, ParameterForm, IVChart, ResultsPanel)
└── templates/       # Layout de página (SimulatorTemplate)
```

## 🛠️ Instalación

```bash
cd curvas-iv-web
npm install
npm run dev
```

Abrir http://localhost:3000

## 📊 Categorías de Parámetros

| Categoría | Descripción |
|-----------|-------------|
| ⚡ **Eléctrico** | Isc, Voc, Pmax - datos del fabricante |
| ☀️ **Ambiente** | Gop (irradiancia), Top (temperatura), αi — botones STC/NOCT |
| 📐 **Físico** | Área celda, Ns (serie), Np (paralelo) |
| 🔬 **Modelo** | Modelo matemático, n, Rs, Rsh, modo Datasheet, simulación de defectos |

## 🧪 Simulación de Defectos Físicos

El simulador incluye un módulo de degradación de paneles con 5 defectos físicos reales, cada uno con 3 niveles de severidad:

| Defecto | Parámetro | Severidades | Referencia |
|---------|-----------|-------------|------------|
| Corrosión / Mal contacto | Rs ↑ | ×2 / ×5 / ×10 | Chegaar 2013; Jordan & Kurtz 2013 |
| Micro-cracks / Bordes dañados | Rsh ↓ | ×0.5 / ×0.2 / ×0.05 | Köntges 2014 (IEA PVPS Task 13) |
| Degradación del silicio (Aging) | n + | +0.1 / +0.3 / +0.5 | Ndiaye 2013; Jordan & Kurtz 2013 |
| Recombinación (Impurezas) | I₀ ↑ | ×10 / ×100 / ×1000 | Green 1982; Sze & Ng 2007 |
| LID — Deg. inducida por luz | Isc ↓ + n ↑ | 1% / 2% / 3% | Hahnloser 2006 |

## Changelog

### v2.4.0 (2026)
- **Refactor UX/UI completo**: tema claro, encabezado institucional verde SENA con borde azul, pie de página institucional con logos, tipografía y espaciado refinados para escritorio y móvil
- **Tokens de color coherentes**: sistema de colores `sena-green`, `sena-blue`, `sena-blue-light` aplicado consistentemente en gráficas, badges, botones e indicadores — eliminados `sena-navy`/`sena-cyan` (diseñados para modo oscuro)
- **Sección "Acerca de" en la interfaz principal**: descripción del programa, modelos disponibles, enlace a bibliografía y créditos visibles en la interfaz principal (scrollable desde el encabezado)
- **Judgment Day bugfixes** (revisión adversarial 2 jueces × 2 rondas):
  - Corregida violación HTML: doble elemento `<main>` en modo móvil/escritorio; unificado en un único landmark
  - Sección "Acerca de" movida dentro de `<main>` con `aria-labelledby` para estructura de documento accesible
  - Firefox ResizeObserver: inicialización sincrónica con `getBoundingClientRect()` para evitar gráficas en blanco en primera carga
  - `key={labels[ci]}` en `<Line>` de MultiConditionChart (estabilidad de reconciliación React)
  - `Dialog.Description` condicional con descripciones específicas por modal (sin fallback genérico)
  - `IVChart` ReferenceDot Isc/Voc ahora usa valores simulados (`results.current/voltage`) en lugar de parámetros de hoja de datos (corrección en modo defecto)
  - `ParameterForm` `originalRef` se limpia al cambiar el tipo de defecto (previene restauración incorrecta)
  - Prop `chartRef` muerta eliminada de `ResultsPanel`
  - `body { background-color }` usa token CSS `hsl(var(--background))`
  - `aria-hidden="true"` en ícono decorativo `<ExternalLink>` en `ReferencesModal`
  - Safari/Firefox: descargas CSV/PNG/Excel con patrón DOM append + `setTimeout` revoke

### v2.3.1 (2026)
- **Fix definitivo Recharts warnings**: reemplazado el `mounted` guard por `ResizeObserver` en `IVChart` y `MultiConditionChart`. El observer pasa dimensiones reales en píxeles directamente a `ResponsiveContainer`, eliminando el estado inicial `-1` de Recharts. Root cause: los layouts mobile (`md:hidden`) y desktop (`hidden md:block`) están ambos en el DOM; el container oculto medía `0/0` causando 8 advertencias por simulación.
- **Referencias PDF sincronizadas**: bibliografía del informe PDF actualizada de 3 a 9 referencias (APA 7, sangría francesa), idénticas al modal de referencias. Agrega control de desbordamiento de página.
- **Judgment Day bugfixes** (revisión adversarial con 2 jueces independientes, 2 rondas):
  - `estimateActualVoc`: retorna `Voc × 1.1` en lugar de `0` cuando I₀/Iph son inválidos (oversweep, evita curvas truncadas)
  - `runSimulation`: lanza error explícito si Gop ≤ 0 (antes: división por cero silenciosa en eficiencia)
  - `lambertW0`: registra `console.warn` antes del fallback de convergencia
  - `hexToRgb` en pdf-charts: valida formato hex con regex antes de parsear
  - `loadFonts`: retorna `boolean` de éxito; pdf-generator registra advertencia si las fuentes no cargan
  - `presetToParams`: valida que los campos críticos (Isc, Voc, Pmax) sean números finitos antes de aceptar el preset
  - `IVChart`: `ReferenceDot`/`ReferenceLine` del MPP envueltos en guard `isFinite(vmpp) && isFinite(impp)`
- `.gitignore`: agregados `.atl` y `docs`

### v2.3.0 (2026)
- **Informe PDF completamente rediseñado**: formato Carta, fuente Roboto, logos SENA + LEPS con proporciones exactas, dibujo nativo de curvas I-V/P-V y multi-condición en jsPDF (sin html2canvas), estructura de hasta 6 páginas
- **PDF incluye Multi-G y Multi-T**: el botón PDF en Resultados genera el informe completo con todas las condiciones simuladas
- **Simulación de defectos físicos** — 5 tipos, 3 severidades, con referencias académicas
- **Fix Multi-T**: sweep de voltaje dinámico al Voc real de cada temperatura (curva 5°C ya no queda cortada)
- **Layout Multi-condición**: paneles I-V y P-V lado a lado en desktop; sin corte de contenido
- **Exportación PNG** en gráficas Multi-G y Multi-T
- Manual de usuario v2.3 con documentación de todas las funciones
- Fix Recharts `width(0)/height(0)`: render condicional en tabs móvil

### v2.2.0 (2026)
- Cuatro modelos matemáticos seleccionables: SDM-NR, SDM-Lambert W, DDM, TDM
- Modo Datasheet: extracción automática Rs/Rsh (Rahmani 2011)
- Curvas Multi-Irradiancia (5 niveles: 1000–200 W/m²)
- Curvas Multi-Temperatura (4 niveles: 5–65 °C)
- PDF expandido con secciones comparativas
- Modal de bibliografía (9 referencias APA 7)
- Manual de usuario integrado

### v2.1.0 (2026)
- Modelo SDM Newton-Raphson (Abbassi 2017)
- Exportación CSV, Excel y PDF
- Interfaz responsive mobile-first

## 📝 Créditos

**Autor:** Mauricio Alexander Vargas Rodríguez
**Institución:** Centro de Electricidad, Electrónica y Telecomunicaciones (CEET)
**Organización:** Servicio Nacional de Aprendizaje - SENA

---

© 2026 - Todos los derechos reservados
