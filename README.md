# Simulador de Curvas I-V y P-V v2.1

Aplicación web para simular el comportamiento eléctrico de paneles solares fotovoltaicos. Genera las curvas características **I-V** (Corriente vs Voltaje) y **P-V** (Potencia vs Voltaje) utilizando el método matemático Barry Analytical Expansion.

## 🎨 Identidad Visual SENA/GICS

| Color | Variable | Hex | Uso |
|-------|----------|-----|-----|
| Verde Principal | `sena-green` | `#39a900` | Botones, iconos activos |
| Verde Oscuro | `sena-green-dark` | `#007832` | Hover, detalles |
| Azul Marino | `sena-navy` | `#00304d` | Encabezados |
| Amarillo | `sena-yellow` | `#fdc300` | Acentos, alertas |
| Cian | `sena-cyan` | `#50e5f9` | Gráficos |

## 🚀 Tecnologías

- **Next.js 15** con App Router y Turbopack
- **React 19** con Server Components
- **TypeScript** para type safety
- **Tailwind CSS** con variables CSS
- **shadcn/ui** para componentes
- **Recharts** para gráficas interactivas
- **jsPDF** para generación de reportes PDF
- **Work Sans** como tipografía principal

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
- **PDF**: Reporte profesional con:
  - Encabezado institucional SENA
  - Información del módulo
  - Gráfica de las curvas I-V y P-V
  - Resultados principales (Pmax, FF, Eficiencia, Error)
  - Punto de Máxima Potencia (MPP)
  - Tabla de parámetros de entrada
  - Parámetros calculados

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
| ☀️ **Ambiente** | Gop (irradiancia), Top (temperatura), αi |
| 📐 **Físico** | Área celda, Ns (serie), Np (paralelo) |
| 🔬 **Modelo** | Factor n, Rs (serie), Rsh (shunt) |

## 🔬 Método de Simulación

Barry Analytical Expansion con modelo de un solo diodo:
- Corriente fotogenerada (Iph)
- Corriente de saturación inversa (I0)
- Resistencia serie (Rs) y shunt (Rsh)
- Factor de idealidad (n)
- Corrección por temperatura e irradiancia

## 📝 Créditos

**Autor:** Mauricio Alexander Vargas Rodríguez  
**Institución:** Centro de Electricidad, Electrónica y Telecomunicaciones (CEET)  
**Organización:** Servicio Nacional de Aprendizaje - SENA

---
© 2024 - Todos los derechos reservados
