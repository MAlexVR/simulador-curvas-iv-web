import { jsPDF } from "jspdf";
import { SimulationResults, ModuleParams } from "@/types/module";
import { MultiConditionResults } from "@/lib/models/types";
import { loadFonts } from "./font-loader";
import { drawIVChart, drawMultiChart } from "./pdf-charts";

// Colores institucionales SENA/LEPS
const COLORS = {
  senaGreen: [57, 169, 0] as [number, number, number],
  lepsYellow: [253, 195, 0] as [number, number, number],
  lepsNavy: [0, 48, 77] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray: [128, 128, 128] as [number, number, number],
  grayLight: [245, 245, 245] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

// Proporciones reales de los logos (ancho/alto)
const LOGO_RATIOS = {
  sena: 3820 / 561,   // 6.81:1
  leps: 4178 / 1719,  // 2.43:1
};

// Mapeo de modelos internos a nombres y claves de descripción
const MODEL_NAMES: Record<string, string> = {
  SDM_NR: "SDM Newton-Raphson (Abbassi 2017)",
  SDM_LAMBERT: "SDM Lambert W (Barry 2000)",
  DDM_NR: "DDM Newton-Raphson (Olayiwola 2024)",
  TDM_NR: "TDM Newton-Raphson (Bennagi 2025)",
};

const MODEL_DESCRIPTIONS: Record<string, string> = {
  SDM_NR: "Modelo de un diodo con resolución Newton-Raphson.",
  SDM_LAMBERT:
    "Solución explícita mediante función W de Lambert (Barry Analytical Expansion).",
  DDM_NR: "Modelo de dos diodos con factores de idealidad A1=1 y A2=2.",
  TDM_NR: "Modelo de tres diodos con factores A1=1, A2=1.2 y A3=2.5.",
};

interface GeneratePDFOptions {
  results?: SimulationResults;           // Resultados simulación individual
  params: ModuleParams;
  chartImage?: string;                   // Ignorado — usamos drawIVChart nativo
  multiResults?: MultiConditionResults;  // Legacy: un solo multi (desde MultiConditionChart)
  multiGResults?: MultiConditionResults; // Multi-Irradiancia (desde ResultsPanel)
  multiTResults?: MultiConditionResults; // Multi-Temperatura (desde ResultsPanel)
  ivChartImage?: string;                 // Ignorado — usamos drawMultiChart nativo
  pvChartImage?: string;                 // Ignorado — usamos drawMultiChart nativo
  modelLabel?: string;                   // Override del nombre del modelo
}

// Helper para cargar imagen como base64 con timeout
async function loadImageAsBase64(
  url: string,
  timeout = 5000,
): Promise<string | null> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn(`Timeout loading image: ${url}`);
      resolve(null);
    }, timeout);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn("Error converting image to base64:", e);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      console.warn(`Error loading image: ${url}`);
      resolve(null);
    };

    img.src = url;
  });
}

export async function generatePDFReport({
  results,
  params,
  multiResults,
  multiGResults,
  multiTResults,
  modelLabel,
}: GeneratePDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  // Cargar fuentes personalizadas
  const fontsLoaded = await loadFonts(doc);
  if (!fontsLoaded) {
    console.warn("pdf-generator: fuentes personalizadas no disponibles, el layout del PDF puede verse afectado");
  }
  doc.setFont("Roboto");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 18;
  const marginRight = 18;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Formatear fecha
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const dateStr = `${day}.${month}.${year}`;

  // Cargar logos una vez
  const [senaLogo, lepsLogo] = await Promise.all([
    loadImageAsBase64("/logo-sena.png"),
    loadImageAsBase64("/logo-leps.png"),
  ]);

  // Normalizar multi-results: multiGResults/multiTResults tienen prioridad sobre multiResults legacy
  const resolvedG = multiGResults ?? (multiResults?.mode === 'multi-g' ? multiResults : undefined);
  const resolvedT = multiTResults ?? (multiResults?.mode === 'multi-t' ? multiResults : undefined);
  const multiList = [resolvedG, resolvedT].filter(Boolean) as MultiConditionResults[];

  // Calcular total de páginas
  const hasIndividual = !!results;
  // Páginas: (3 individuales si hay results) + (N páginas multi) + 1 bibliografía
  const totalPages = (hasIndividual ? 3 : 0) + multiList.length + 1;

  let currentPage = 1;

  // Nombre del modelo
  const activeModel = params.model ?? "SDM_NR";
  const modelName = modelLabel ?? MODEL_NAMES[activeModel] ?? "SDM Newton-Raphson";
  const modelDescription = MODEL_DESCRIPTIONS[activeModel] ?? MODEL_DESCRIPTIONS.SDM_NR;

  // Helper functions
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const setDrawColor = (color: [number, number, number]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
  };

  const drawLine = (yPos: number, thickness: number = 0.3) => {
    setDrawColor(COLORS.black);
    doc.setLineWidth(thickness);
    doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  };

  // Función para dibujar el header en cada página
  const drawHeader = (pageNum: number) => {
    const y = 15;

    // Logo SENA con proporción correcta (altura 12mm)
    const senaHeight = 12;
    const senaWidth = senaHeight * LOGO_RATIOS.sena;

    if (senaLogo) {
      try {
        doc.addImage(
          senaLogo,
          "PNG",
          marginLeft,
          y - 3,
          Math.min(senaWidth, 82),
          senaHeight,
        );
      } catch (e) {
        console.warn("Error adding SENA logo:", e);
      }
    }

    // Logo LEPS con proporción correcta (altura 14mm)
    const lepsHeight = 14;
    const lepsWidth = lepsHeight * LOGO_RATIOS.leps;

    if (lepsLogo) {
      try {
        doc.addImage(
          lepsLogo,
          "PNG",
          marginLeft + 90,
          y - 4,
          Math.min(lepsWidth, 35),
          lepsHeight,
        );
      } catch (e) {
        console.warn("Error adding LEPS logo:", e);
      }
    }

    // Tabla de versión (derecha)
    const versionBoxX = pageWidth - marginRight - 40;
    const versionBoxY = y - 5;

    setDrawColor(COLORS.black);
    doc.setLineWidth(0.2);
    doc.setFontSize(7);
    setColor(COLORS.black);
    doc.setFont("Roboto", "normal");

    doc.rect(versionBoxX, versionBoxY, 40, 5);
    doc.text("Versión 2.3", versionBoxX + 20, versionBoxY + 3.5, {
      align: "center",
    });

    doc.rect(versionBoxX, versionBoxY + 5, 40, 5);
    doc.text("Código: LEPS-SIM.001", versionBoxX + 20, versionBoxY + 8.5, {
      align: "center",
    });

    doc.rect(versionBoxX, versionBoxY + 10, 40, 5);
    doc.text(`Fecha: ${dateStr}`, versionBoxX + 20, versionBoxY + 13.5, {
      align: "center",
    });

    // Línea de página
    doc.setFontSize(8);
    setColor(COLORS.gray);
    doc.text(
      `Página ${pageNum} de ${totalPages} del informe de simulación de fecha ${dateStr}`,
      marginLeft,
      y + 15,
    );

    drawLine(y + 17, 0.4);

    return y + 22;
  };

  // Función para dibujar el footer en cada página
  const drawFooter = () => {
    const footerY = pageHeight - 18;

    drawLine(footerY - 3, 0.3);

    doc.setFontSize(7);
    doc.setFont("Roboto", "normal");
    setColor(COLORS.black);

    doc.text(
      "Laboratorio de Ensayos para Paneles Solares (LEPS)",
      marginLeft,
      footerY,
    );
    doc.text(
      "Av. Cra 30 No. 17-91 Sur, Bogotá - Colombia",
      marginLeft,
      footerY + 4,
    );

    doc.text(
      "https://electricidadelectronicaytelecomu.blogspot.com",
      pageWidth - marginRight,
      footerY,
      { align: "right" },
    );
    doc.text(
      "www.gics-sennova.edu.co",
      pageWidth - marginRight,
      footerY + 4,
      { align: "right" },
    );

    // Línea verde SENA
    setFillColor(COLORS.senaGreen);
    doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  };

  // Función para agregar nueva página
  const addNewPage = () => {
    drawFooter();
    doc.addPage();
    currentPage++;
    return drawHeader(currentPage);
  };

  const rowH = 6;

  // ============================================================
  // PÁGINAS INDIVIDUALES (solo si hay results)
  // ============================================================
  if (results) {
    // ==========================================================
    // PÁGINA 1: Información del módulo y resultados
    // ==========================================================

    let y = drawHeader(1);
    y += 3;

    // TÍTULO
    doc.setFont("Roboto", "bold");
    doc.setFontSize(18);
    setColor(COLORS.black);
    doc.text("Informe de Simulación de Curvas I-V y P-V", marginLeft, y);
    y += 7;

    doc.setFontSize(13);
    doc.text(
      "Determinación del Punto de Máxima Potencia (MPP)",
      marginLeft,
      y,
    );
    y += 8;

    // Info del laboratorio
    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    setColor(COLORS.gray);
    doc.text(
      "Generado por el simulador web del laboratorio de ensayos",
      marginLeft,
      y,
    );
    y += 5;

    doc.setFont("Roboto", "bold");
    doc.setFontSize(11);
    setColor(COLORS.black);
    doc.text(
      "Laboratorio de Ensayos para Paneles Solares (LEPS)",
      marginLeft,
      y,
    );
    y += 4;

    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.text("Servicio Nacional de Aprendizaje SENA", marginLeft, y);
    y += 4;
    doc.text(
      "Centro de Electricidad, Electrónica y Telecomunicaciones - Regional Distrito Capital",
      marginLeft,
      y,
    );
    y += 4;
    doc.text("Av. Cra 30 No. 17-91 Sur, Bogotá - Colombia", marginLeft, y);
    y += 2;

    drawLine(y, 0.3);
    y += 6;

    // DATOS DEL MÓDULO
    doc.setFontSize(10);
    const labelCol = 40;

    const moduleInfo = [
      ["Objeto:", "Módulo fotovoltaico"],
      ["Marca del módulo:", params.marca || "N/A"],
      ["Referencia del módulo:", params.referencia || "N/A"],
      [
        "Configuración:",
        `${params.ns}S × ${params.np}P (${params.ns * params.np} celdas)`,
      ],
      ["Fecha del informe:", dateStr],
    ];

    moduleInfo.forEach(([label, value]) => {
      doc.setFont("Roboto", "normal");
      setColor(COLORS.gray);
      doc.text(label, marginLeft, y);
      doc.setFont("Roboto", "bold");
      setColor(COLORS.black);
      doc.text(value, marginLeft + labelCol, y);
      y += 5;
    });

    y += 5;

    // CONDICIONES DE SIMULACIÓN
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    setColor(COLORS.lepsNavy);
    doc.text("Condiciones de Simulación", marginLeft, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");

    const betaV = (params as ModuleParams & { betaV?: number }).betaV;
    const conditions = [
      ["Irradiancia de operación Gop (W/m²):", `${params.gop}`],
      ["Temperatura de operación Top (°C):", `${params.top}`],
      ["Coeficiente de temperatura Isc αi (%/°C):", `${params.alphaI}`],
      [
        "Coeficiente de temperatura Voc βv (V/°C):",
        betaV !== undefined ? `${betaV}` : "N/D",
      ],
      ["Modelo matemático:", modelName],
    ];

    conditions.forEach(([label, value]) => {
      setColor(COLORS.gray);
      doc.text(label, marginLeft, y);
      doc.setFont("Roboto", "bold");
      setColor(COLORS.black);
      doc.text(value, marginLeft + 100, y);
      doc.setFont("Roboto", "normal");
      y += 5;
    });

    y += 5;

    // RESULTADOS DE LA SIMULACIÓN
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    setColor(COLORS.lepsNavy);
    doc.text("Resultados de la Simulación", marginLeft, y);
    y += 6;

    setDrawColor(COLORS.black);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, marginLeft + contentWidth, y);

    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    setColor(COLORS.black);
    y += 4;
    doc.text("Mesurando", marginLeft + 2, y);
    doc.text("Símbolo", marginLeft + 60, y);
    doc.text("Valor", marginLeft + 100, y);
    doc.text("Unidad", marginLeft + 140, y);
    y += 2;
    doc.line(marginLeft, y, marginLeft + contentWidth, y);
    y += 4;

    doc.setFont("Roboto", "normal");

    const isErrorOk = results.errorPercent < 5;

    const resultsData = [
      ["Corriente de cortocircuito", "Isc", params.isc.toFixed(3), "A"],
      ["Voltaje de circuito abierto", "Voc", params.voc.toFixed(3), "V"],
      ["Corriente en MPP", "Impp", results.impp.toFixed(3), "A"],
      ["Voltaje en MPP", "Vmpp", results.vmpp.toFixed(3), "V"],
      ["Potencia máxima *", "Pmpp", results.pmaxCalc.toFixed(2), "W"],
      [
        "Factor de llenado *",
        "FF",
        (results.fillFactor * 100).toFixed(2),
        "%",
      ],
      ["Eficiencia *", "η", results.efficiency.toFixed(2), "%"],
      ["Error vs fabricante", "ε", results.errorPercent.toFixed(2), "%"],
    ];

    resultsData.forEach((row, idx) => {
      if (idx % 2 === 0) {
        setFillColor(COLORS.grayLight);
        doc.rect(marginLeft, y - 3.5, contentWidth, rowH, "F");
      }

      if (row[0] === "Error vs fabricante") {
        if (isErrorOk) {
          doc.setFillColor(220, 252, 231);
        } else {
          doc.setFillColor(254, 226, 226);
        }
        doc.rect(marginLeft, y - 3.5, contentWidth, rowH, "F");
      }

      setColor(COLORS.black);
      doc.text(row[0], marginLeft + 2, y);
      doc.setFont("Roboto", "normal");
      doc.text(row[1], marginLeft + 60, y);
      doc.setFont("Roboto", "bold");

      if (row[0] === "Error vs fabricante") {
        setColor(isErrorOk ? COLORS.senaGreen : [220, 38, 38]);
      }
      doc.text(row[2], marginLeft + 100, y);
      doc.setFont("Roboto", "normal");
      setColor(COLORS.black);
      doc.text(row[3], marginLeft + 140, y);
      y += rowH;
    });

    doc.line(marginLeft, y - 2, marginLeft + contentWidth, y - 2);

    doc.setFontSize(7);
    setColor(COLORS.gray);
    doc.text("* Valor derivado de la simulación", marginLeft, y + 2);

    // ==========================================================
    // PÁGINA 2: Gráfica I-V y P-V
    // ==========================================================

    y = addNewPage();
    y += 3;

    doc.setFont("Roboto", "bold");
    doc.setFontSize(16);
    setColor(COLORS.lepsNavy);
    doc.text("Curvas I-V y P-V", marginLeft, y);
    y += 8;

    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    setColor(COLORS.gray);
    doc.text(`Modelo: ${modelName}`, marginLeft, y);
    y += 6;

    // DIBUJAR GRÁFICA NATIVA
    const chartHeight = 90;
    drawIVChart(doc, results, params, marginLeft, y, contentWidth, chartHeight);

    y += chartHeight - 5;

    doc.setFontSize(9);
    setColor(COLORS.gray);
    doc.setFont("Roboto", "normal");
    doc.text(
      "Figura 1: Curvas características I-V (rojo) y P-V (verde) generadas por el simulador",
      pageWidth / 2,
      y,
      { align: "center" },
    );
    y += 10;

    // PUNTO DE MÁXIMA POTENCIA
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    setColor(COLORS.lepsNavy);
    doc.text("Punto de Máxima Potencia (MPP)", marginLeft, y);
    y += 7;

    doc.setFillColor(255, 251, 235);
    setDrawColor(COLORS.lepsYellow);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginLeft, y, contentWidth, 18, 2, 2, "FD");

    doc.setFontSize(11);
    const mppY = y + 11;

    setColor(COLORS.black);
    doc.setFont("Roboto", "normal");
    doc.text("Vmpp =", marginLeft + 15, mppY);
    doc.setFont("Roboto", "bold");
    doc.text(`${results.vmpp.toFixed(3)} V`, marginLeft + 35, mppY);

    doc.setFont("Roboto", "normal");
    doc.text("Impp =", marginLeft + 70, mppY);
    doc.setFont("Roboto", "bold");
    doc.text(`${results.impp.toFixed(3)} A`, marginLeft + 90, mppY);

    doc.setFont("Roboto", "normal");
    doc.text("Pmax =", marginLeft + 125, mppY);
    doc.setFont("Roboto", "bold");
    setColor(COLORS.senaGreen);
    doc.text(`${results.pmaxCalc.toFixed(2)} W`, marginLeft + 147, mppY);

    // ==========================================================
    // PÁGINA 3: Parámetros e información adicional
    // ==========================================================

    y = addNewPage();
    y += 3;

    // PARÁMETROS DE ENTRADA
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    setColor(COLORS.lepsNavy);
    doc.text("Parámetros de Entrada", marginLeft, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    setColor(COLORS.black);

    const vmp = params.vmp ?? 0;
    const imp = params.imp ?? 0;

    const inputParams: [string, string][] = [
      ["Corriente de corto-circuito Isc (A):", `${params.isc}`],
      ["Voltaje de circuito abierto Voc (V):", `${params.voc}`],
      ...(vmp
        ? ([["Voltaje en MPP fabricante Vm (V):", `${vmp}`]] as [
            string,
            string,
          ][])
        : []),
      ...(imp
        ? ([["Corriente en MPP fabricante Im (A):", `${imp}`]] as [
            string,
            string,
          ][])
        : []),
      ["Pmax fabricante (W):", `${params.pmax}`],
      ["Número de celdas en serie Ns:", `${params.ns}`],
      ["Número de celdas en paralelo Np:", `${params.np}`],
      ["Resistencia serie Rs (Ω):", `${params.rs}`],
      ["Resistencia shunt Rsh (Ω):", `${params.rsh}`],
      ["Factor de idealidad η:", `${params.n}`],
      ["Área de la celda Acelda (m²):", `${params.acelda}`],
    ];

    inputParams.forEach((p) => {
      doc.setFont("Roboto", "normal");
      setColor(COLORS.gray);
      doc.text(p[0], marginLeft, y);
      doc.setFont("Roboto", "bold");
      setColor(COLORS.black);
      doc.text(p[1], marginLeft + 100, y);
      y += 5.5;
    });

    y += 6;

    // PARÁMETROS CALCULADOS
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    setColor(COLORS.lepsNavy);
    doc.text("Parámetros Calculados del Modelo", marginLeft, y);
    y += 6;

    doc.setFontSize(10);
    setColor(COLORS.black);

    const modelParams: [string, string][] = [
      ["Corriente fotogenerada (Iph)", `${results.iph.toFixed(6)} A`],
      ["Corriente de saturación (I₀)", `${results.i0.toExponential(4)} A`],
      ["Densidad de corriente (Jsc)", `${results.jsc.toFixed(4)} mA/cm²`],
      ["Área total del módulo", `${results.atotal.toFixed(6)} m²`],
    ];

    modelParams.forEach((p) => {
      doc.setFont("Roboto", "normal");
      setColor(COLORS.gray);
      doc.text(p[0], marginLeft, y);
      doc.setFont("Roboto", "bold");
      setColor(COLORS.black);
      doc.text(p[1], marginLeft + 65, y);
      y += 5.5;
    });

    y += 6;

    // COMPARACIÓN CON FABRICANTE
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    setColor(COLORS.lepsNavy);
    doc.text("Comparación con Valores del Fabricante", marginLeft, y);
    y += 6;

    doc.setFontSize(9);

    setDrawColor(COLORS.black);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, marginLeft + contentWidth, y);

    doc.setFont("Roboto", "bold");
    setColor(COLORS.black);
    y += 4;
    doc.text("Parámetro", marginLeft + 2, y);
    doc.text("Fabricante", marginLeft + 70, y);
    doc.text("Simulado", marginLeft + 110, y);
    doc.text("Desviación", marginLeft + 150, y);
    y += 2;
    doc.line(marginLeft, y, marginLeft + contentWidth, y);
    y += 4;

    doc.setFont("Roboto", "normal");

    const comparison = [
      [
        "Potencia máxima (Pmax)",
        `${params.pmax} W`,
        `${results.pmaxCalc.toFixed(2)} W`,
        `${results.errorPercent.toFixed(2)}%`,
      ],
      [
        "Corriente Isc",
        `${params.isc} A`,
        `${params.isc.toFixed(3)} A`,
        "0.00%",
      ],
      [
        "Voltaje Voc",
        `${params.voc} V`,
        `${params.voc.toFixed(3)} V`,
        "0.00%",
      ],
    ];

    comparison.forEach((row, idx) => {
      if (idx % 2 === 0) {
        setFillColor(COLORS.grayLight);
        doc.rect(marginLeft, y - 3.5, contentWidth, rowH, "F");
      }

      setColor(COLORS.black);
      doc.text(row[0], marginLeft + 2, y);
      doc.text(row[1], marginLeft + 70, y);
      doc.text(row[2], marginLeft + 110, y);

      const deviation = parseFloat(row[3]);
      if (Math.abs(deviation) < 5) {
        setColor(COLORS.senaGreen);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(row[3], marginLeft + 150, y);
      setColor(COLORS.black);
      y += rowH;
    });

    doc.line(marginLeft, y - 2, marginLeft + contentWidth, y - 2);

    y += 8;

    // NOTAS
    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    setColor(COLORS.lepsNavy);
    doc.text("Notas", marginLeft, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont("Roboto", "normal");
    setColor(COLORS.black);

    const notes = [
      `1. Modelo utilizado: ${modelDescription}`,
      "2. Parámetros térmicos calculados según Abbassi et al. (2017).",
      "3. Las condiciones de simulación corresponden a las especificadas por el usuario.",
      "4. El factor de llenado (FF) y la eficiencia son valores derivados de la simulación.",
      "5. Un error menor al 5% respecto al fabricante se considera aceptable.",
    ];

    notes.forEach((note) => {
      const lines = doc.splitTextToSize(note, contentWidth);
      lines.forEach((line: string, li: number) => {
        doc.text(li === 0 ? line : `   ${line}`, marginLeft, y);
        y += 4.5;
      });
    });
  }

  // ============================================================
  // PÁGINAS MULTI-CONDICIÓN (una por cada MultiConditionResults)
  // ============================================================
  for (const mc of multiList) {
    const startY = hasIndividual || multiList.indexOf(mc) > 0 ? addNewPage() : drawHeader(currentPage);
    let my = startY + 3;

    const modeLabel =
      mc.mode === "multi-g"
        ? "Análisis Multi-Irradiancia"
        : "Análisis Multi-Temperatura";
    const modeUnit = mc.mode === "multi-g" ? "Irradiancia" : "Temperatura";

    doc.setFont("Roboto", "bold");
    doc.setFontSize(16);
    setColor(COLORS.lepsNavy);
    doc.text(modeLabel, marginLeft, my);
    my += 5;

    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    setColor(COLORS.gray);
    doc.text(
      `Condiciones evaluadas: ${mc.labels.join(" | ")}`,
      marginLeft,
      my,
    );
    my += 7;

    const chartH = 83;
    const gap = 6;

    // Curvas I-V
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    setColor(COLORS.black);
    doc.text(`Curvas I-V por ${modeUnit}`, marginLeft, my);
    my += 4;
    drawMultiChart(doc, mc, marginLeft, my, contentWidth, chartH, "iv");
    my += chartH + gap;

    // Curvas P-V
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    setColor(COLORS.black);
    doc.text(`Curvas P-V por ${modeUnit}`, marginLeft, my);
    my += 4;
    drawMultiChart(doc, mc, marginLeft, my, contentWidth, chartH, "pv");
  }

  // ============================================================
  // PÁGINA BIBLIOGRAFÍA (siempre la última)
  // ============================================================

  if (hasIndividual || multiList.length > 0) {
    drawFooter();
    doc.addPage();
    currentPage++;
  }

  let bibY = drawHeader(currentPage) + 15;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setColor(COLORS.lepsNavy);
  doc.text("Referencias Bibliográficas", pageWidth / 2, bibY, {
    align: "center",
  });
  bibY += 3;

  // Línea decorativa
  doc.setDrawColor(
    COLORS.senaGreen[0],
    COLORS.senaGreen[1],
    COLORS.senaGreen[2],
  );
  doc.setLineWidth(0.5);
  doc.line(marginLeft + 40, bibY, pageWidth - marginRight - 40, bibY);
  bibY += 10;

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  setColor(COLORS.black);

  const refTexts = [
    "Barry, D. A., Parlange, J.-Y., Li, L., Prommer, H., Cunningham, C. J., & Stagnitti, F. (2000). Analytical approximations for real values of the Lambert W-function. Mathematics and Computers in Simulation, 53(1-2), 95-103. https://doi.org/10.1016/S0378-4754(00)00172-5",
    "Barry, D. A., Parlange, J.-Y., Li, L., Prommer, H., Cunningham, C. J., & Stagnitti, F. (2002). Erratum to \"Analytical approximations for real values of the Lambert W-function\" [Mathematics and Computers in Simulation 53 (2000) 95-103]. Mathematics and Computers in Simulation, 59(6), 543. https://doi.org/10.1016/S0378-4754(02)00051-4",
    "Olayiwola, T. N., Hyun, S.-H., & Choi, S.-J. (2024). Photovoltaic modeling: A comprehensive analysis of the I-V characteristic curve. Sustainability, 16(1), 432. https://doi.org/10.3390/su16010432",
    "Rahmani, L., Seddaoui, N., Kessala, A., & Chouder, A. (2011). Parameters extraction of photovoltaic module at reference and real conditions. In Proceedings of the 2011 International Conference on Communications, Computing and Control Applications (CCCA) (pp. 1-6). IEEE. https://ieeexplore.ieee.org/document/6125617",
    "Abbassi, A., Dami, M. A., & Jemli, M. (2017). Parameters identification of photovoltaic modules based on numerical approach for the single-diode model. In Proceedings of the 2017 IEEE International Conference on Sciences and Techniques of Automatic Control and Computer Engineering (STA) (pp. 1-7). IEEE.",
    "Song, Z., Fang, K., Sun, X., Liang, Y., Lin, W., Xu, C., Huang, G., & Yu, F. (2021). An effective method to accurately extract the parameters of single diode model of solar cells. Nanomaterials, 11(10), 2615. https://doi.org/10.3390/nano11102615",
    "Vais, R. I., Sahay, K., Chiranjeevi, T., Devarapalli, R., & Knypinski, L. (2023). Parameter extraction of solar photovoltaic modules using a novel bio-inspired swarm intelligence optimisation algorithm. Sustainability, 15(10), 8407. https://doi.org/10.3390/su15108407",
    "Mahto, R., & John, R. (2021). Modeling of photovoltaic module. In A. M. Elseman (Ed.), Solar cells - Theory, materials and recent advances. IntechOpen. https://doi.org/10.5772/intechopen.97082",
    "Bennagi, A., AlHousrya, O., Cotfas, D. T., & Cotfas, P. A. (2025). Parameter extraction of photovoltaic cells and panels using a PID-based metaheuristic algorithm. Applied Sciences, 15(13), 7403. https://doi.org/10.3390/app15137403",
  ];

  const maxBibY = pageHeight - 22;

  refTexts.forEach((refText, index) => {
    const lines = doc.splitTextToSize(refText, contentWidth - 10);
    // Verificar si cabe en la página actual; si no, nueva página
    const blockHeight = lines.length * 5 + 6;
    if (bibY + blockHeight > maxBibY) {
      drawFooter();
      doc.addPage();
      currentPage++;
      bibY = drawHeader(currentPage) + 15;
      doc.setFontSize(10);
      doc.setFont("Roboto", "normal");
      setColor(COLORS.black);
    }
    // Sangría francesa: primera línea sin sangría, resto con sangría
    lines.forEach((line: string, lineIndex: number) => {
      const xPos = lineIndex === 0 ? marginLeft : marginLeft + 10;
      doc.text(line, xPos, bibY);
      bibY += 5;
    });
    if (index < refTexts.length - 1) {
      bibY += 6;
    }
  });

  bibY += 20;

  // Mensaje de fin de informe
  doc.setFontSize(10);
  setColor(COLORS.gray);
  doc.text("— Fin del informe de simulación —", pageWidth / 2, bibY, {
    align: "center",
  });

  bibY += 15;

  // Información adicional
  doc.setFontSize(9);
  setColor(COLORS.lepsNavy);
  doc.text(
    "Laboratorio de Ensayos para Paneles Solares (LEPS)",
    pageWidth / 2,
    bibY,
    { align: "center" },
  );
  bibY += 5;
  doc.text(
    "Centro de Electricidad, Electrónica y Telecomunicaciones",
    pageWidth / 2,
    bibY,
    { align: "center" },
  );
  bibY += 5;
  doc.text("Servicio Nacional de Aprendizaje - SENA", pageWidth / 2, bibY, {
    align: "center",
  });

  drawFooter();

  // Guardar PDF
  const fileName = `Simulacion_LEPS_${params.marca || "Modulo"}_${params.referencia || "PV"}_${dateStr.replace(/\./g, "-")}.pdf`;
  doc.save(fileName);
}

// Helper para capturar chart como imagen (mantenido para compatibilidad con callers existentes)
export async function captureChartImage(
  chartRef: HTMLElement | null,
): Promise<string | undefined> {
  if (!chartRef) return undefined;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(chartRef, {
      backgroundColor: "#0f172a",
      scale: 2,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error capturing chart:", error);
    return undefined;
  }
}
