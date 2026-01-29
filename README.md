# Simulador de Curvas I-V y P-V para Módulos Fotovoltaicos

**Versión 2.2** - Laboratorio de Ensayos para Paneles Solares (LEPS)  
Centro de Electricidad, Electrónica y Telecomunicaciones (CEET)  
Servicio Nacional de Aprendizaje - SENA

## 📋 Descripción

Aplicación web para simular el comportamiento eléctrico de paneles solares fotovoltaicos, generando las curvas características I-V (Corriente vs Voltaje) y P-V (Potencia vs Voltaje). Implementa múltiples modelos de circuito equivalente basados en literatura científica revisada por pares.

## ✨ Características Principales

### Modelos Matemáticos Disponibles

| Modelo                         | Descripción                             | Método de Solución                      |
| ------------------------------ | --------------------------------------- | --------------------------------------- |
| **SDM**                        | Modelo de 1 Diodo (Single Diode Model)  | Newton-Raphson iterativo                |
| **DDM**                        | Modelo de 2 Diodos (Double Diode Model) | Newton-Raphson con A1=1, A2=2           |
| **TDM**                        | Modelo de 3 Diodos (Triple Diode Model) | Newton-Raphson con A1=1, A2=1.2, A3=2.5 |
| **Barry Analytical Expansion** | Solución analítica explícita            | Función W de Lambert                    |

### Funcionalidades

- ✅ Selección de modelo matemático
- ✅ Corrección por temperatura de operación (coeficientes α y β)
- ✅ Corrección por nivel de irradiancia solar
- ✅ Cálculo del punto de máxima potencia (MPP)
- ✅ Cálculo de Fill Factor y eficiencia
- ✅ Comparación con valores del fabricante
- ✅ Exportación a CSV, Excel y PDF
- ✅ Diseño responsivo (desktop y móvil)
- ✅ Módulos predefinidos de paneles comerciales

## 🛠️ Instalación

```bash
# Clonar o descomprimir el proyecto
cd simulador-curvas-iv-web-main

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📊 Parámetros de Entrada

### Parámetros Eléctricos (STC)

| Parámetro | Símbolo | Unidad | Descripción                    |
| --------- | ------- | ------ | ------------------------------ |
| Isc       | Isc     | A      | Corriente de cortocircuito     |
| Voc       | Voc     | V      | Voltaje de circuito abierto    |
| Vm        | Vm      | V      | Voltaje en MPP (fabricante)    |
| Im        | Im      | A      | Corriente en MPP (fabricante)  |
| Pmax      | Pmax    | W      | Potencia máxima del fabricante |

### Coeficientes de Temperatura

| Parámetro | Símbolo | Unidad | Descripción                       |
| --------- | ------- | ------ | --------------------------------- |
| Alpha     | αi      | %/°C   | Coeficiente de temperatura de Isc |
| Beta      | βv      | V/°C   | Coeficiente de temperatura de Voc |

### Parámetros Físicos

| Parámetro | Símbolo | Unidad | Descripción                  |
| --------- | ------- | ------ | ---------------------------- |
| Ns        | Ns      | -      | Número de celdas en serie    |
| Np        | Np      | -      | Número de celdas en paralelo |
| Acelda    | A       | m²     | Área de una celda individual |

### Parámetros del Modelo

| Parámetro | Símbolo | Unidad | Descripción                   |
| --------- | ------- | ------ | ----------------------------- |
| n         | n       | -      | Factor de idealidad del diodo |
| Rs        | Rs      | Ω      | Resistencia serie             |
| Rsh       | Rsh     | Ω      | Resistencia shunt (paralelo)  |

### Condiciones de Operación

| Parámetro | Símbolo | Unidad | Descripción              |
| --------- | ------- | ------ | ------------------------ |
| Gop       | G       | W/m²   | Irradiancia de operación |
| Top       | T       | °C     | Temperatura de operación |

## 📚 Referencias Bibliográficas (APA 7)

### Modelos de Circuito Equivalente

Olayiwola, T. N., Hyun, S. H., & Choi, S. J. (2024). Photovoltaic modeling: A comprehensive analysis of the I–V characteristic curve. _Sustainability, 16_(1), 432. https://doi.org/10.3390/su16010432

### Identificación de Parámetros

Abbassi, A., Dami, M. A., & Jemli, M. (2017). Parameters identification of photovoltaic modules based on numerical approach for the single-diode model. _IEEE Xplore_. https://doi.org/10.1109/GECS.2017.8066216

### Función W de Lambert

Barry, D. A., Parlange, J. Y., Li, L., Prommer, H., Cunningham, C. J., & Stagnitti, F. (2000). Analytical approximations for real values of the Lambert W-function. _Mathematics and Computers in Simulation, 53_(1-2), 95-103. https://doi.org/10.1016/S0378-4754(00)00172-5

## 🔧 Tecnologías Utilizadas

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **Gráficas:** Recharts
- **PDF:** jsPDF
- **Excel:** SheetJS (xlsx)
- **TypeScript:** Para tipado estático

## 📱 Capturas de Pantalla

### Versión Desktop

- Panel de parámetros a la izquierda
- Gráfica I-V/P-V en el centro
- Resultados a la derecha

### Versión Móvil

- Navegación por tabs
- Gráfica optimizada con leyenda debajo
- Etiquetas de ejes alineadas

## 👤 Autor

**Mauricio Alexander Vargas Rodríguez**  
Laboratorio de Ensayos para Paneles Solares (LEPS)  
Centro de Electricidad, Electrónica y Telecomunicaciones  
Servicio Nacional de Aprendizaje - SENA  
Bogotá, Colombia

## 📄 Licencia

Derechos reservados © 2024-2026  
Este software es de uso interno del SENA-CEET para fines educativos y de investigación.

## 📝 Changelog

### v2.2 (Enero 2026)

- ✨ Implementación de 4 modelos matemáticos (SDM, DDM, TDM, Lambert W)
- ✨ Selector de modelo matemático en la interfaz
- ✨ Nuevos parámetros: Vm, Im, βv (coeficiente de temperatura Voc)
- 🔧 Corrección de gráfica móvil (leyenda debajo, etiquetas alineadas)
- 📄 Actualización del informe PDF con modelo seleccionado
- 📚 Inclusión de referencias APA en el footer y PDF

### v2.1 (Diciembre 2025)

- Versión inicial web con modelo de un diodo
- Exportación a CSV, Excel y PDF
