import { jsPDF } from "jspdf";
import { SimulationResults, ModuleParams } from "@/types/module";
import { loadFonts } from "./font-loader";
import { drawIVChart } from "./pdf-charts";

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
  sena: 3820 / 561, // 6.81:1
  leps: 4178 / 1719, // 2.43:1
};

interface GeneratePDFOptions {
  results: SimulationResults;
  params: ModuleParams;
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
}: GeneratePDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  // Cargar fuentes personalizadas
  await loadFonts(doc);
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

  let currentPage = 1;
  const totalPages = 3;

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

  // Funcion para dibujar el header en cada pagina
  const drawHeader = (pageNum: number) => {
    const y = 15;

    // Logo SENA con proporcion correcta (altura 12mm)
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

    // Logo LEPS con proporcion correcta (altura 14mm)
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

    // Tabla de version (derecha)
    const versionBoxX = pageWidth - marginRight - 40;
    const versionBoxY = y - 5;

    setDrawColor(COLORS.black);
    doc.setLineWidth(0.2);
    doc.setFontSize(7);
    setColor(COLORS.black);
    doc.setFont("Roboto", "normal");

    doc.rect(versionBoxX, versionBoxY, 40, 5);
    doc.text("Version 2.1", versionBoxX + 20, versionBoxY + 3.5, {
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

    // Linea de pagina
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

  // Funcion para dibujar el footer en cada pagina
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
    doc.text("www.gics-sennova.edu.co", pageWidth - marginRight, footerY + 4, {
      align: "right",
    });

    // Linea verde SENA
    setFillColor(COLORS.senaGreen);
    doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  };

  // Funcion para agregar nueva pagina
  const addNewPage = () => {
    drawFooter();
    doc.addPage();
    currentPage++;
    return drawHeader(currentPage);
  };

  // ============================================
  // PAGINA 1: Informacion del modulo y resultados
  // ============================================

  let y = drawHeader(1);
  y += 3;

  // TITULO
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  setColor(COLORS.black);
  doc.text("Informe de Simulación de Curvas I-V y P-V", marginLeft, y);
  y += 7;

  doc.setFontSize(13);
  doc.text("Determinación del Punto de Máxima Potencia (MPP)", marginLeft, y);
  y += 8;

  // Info del laboratorio
  doc.setFont("Roboto", "italic");
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
  doc.text("Laboratorio de Ensayos para Paneles Solares (LEPS)", marginLeft, y);
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

  // DATOS DEL MODULO
  doc.setFontSize(10);
  const labelCol = 40;

  const moduleInfo = [
    ["Objeto:", "Modulo fotovoltaico"],
    ["Marca del módulo:", params.marca || "N/A"],
    ["Referencia del módulo:", params.referencia || "N/A"],
    [
      "Configuración:",
      `${params.ns}S x ${params.np}P (${params.ns * params.np} celdas)`,
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

  // CONDICIONES DE SIMULACION
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setColor(COLORS.lepsNavy);
  doc.text("Condiciones de Simulación", marginLeft, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  // Unicode support enabled
  const conditions = [
    ["Irradiancia de operación Gop (W/m²):", `${params.gop}`],
    ["Temperatura de operación Top (°C):", `${params.top}`],
    ["Coeficiente de temperatura Isc αi (%/°C):", `${params.alphaI}`],
    ["Método de cálculo:", "Barry Analytical Expansion"],
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

  // RESULTADOS DE LA SIMULACION
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setColor(COLORS.lepsNavy);
  doc.text("Resultados de la Simulación", marginLeft, y);
  y += 6;

  // Tabla de resultados
  const rowH = 6;

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

  // Unicode support enabled
  const resultsData = [
    ["Corriente de cortocircuito", "Isc", params.isc.toFixed(3), "A"],
    ["Voltaje de circuito abierto", "Voc", params.voc.toFixed(3), "V"],
    ["Corriente en MPP", "Impp", results.impp.toFixed(3), "A"],
    ["Voltaje en MPP", "Vmpp", results.vmpp.toFixed(3), "V"],
    ["Potencia máxima *", "Pmpp", results.pmaxCalc.toFixed(2), "W"],
    ["Factor de llenado *", "FF", (results.fillFactor * 100).toFixed(2), "%"],
    ["Eficiencia *", "η", results.efficiency.toFixed(2), "%"],
    ["Error vs fabricante", "ε", results.errorPercent.toFixed(2), "%"],
  ];

  const isErrorOk = results.errorPercent < 5;

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
    doc.setFont("Roboto", "italic");
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

  // ============================================
  // PAGINA 2: Grafica I-V y P-V
  // ============================================

  y = addNewPage();
  y += 3;

  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  setColor(COLORS.lepsNavy);
  doc.text("Curvas I-V y P-V", marginLeft, y);
  y += 8;

  // DIBUJAR GRAFICA NATIVA
  const chartHeight = 90;
  drawIVChart(doc, results, params, marginLeft, y, contentWidth, chartHeight);

  y += chartHeight + 10;

  doc.setFontSize(9);
  setColor(COLORS.gray);
  doc.setFont("Roboto", "italic");
  doc.text(
    "Figura 1: Curvas características I-V (rojo) y P-V (verde) generadas por el simulador",
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 10;

  // PUNTO DE MAXIMA POTENCIA
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

  // ============================================
  // PAGINA 3: Parametros e informacion adicional
  // ============================================

  y = addNewPage();
  y += 3;

  // PARAMETROS DE ENTRADA
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setColor(COLORS.lepsNavy);
  doc.text("Parámetros de Entrada", marginLeft, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  setColor(COLORS.black);

  // Unicode support
  const inputParams = [
    ["Corriente de corto-circuito Isc (A):", `${params.isc}`],
    ["Voltaje de circuito abierto Voc (V):", `${params.voc}`],
    ["Pmax fabricante (W):", `${params.pmax}`],
    ["Número de celdas en serie Ns:", `${params.ns}`],
    ["Número de celdas en paralelo Np:", `${params.np}`],
    ["Resistencia serie Rs (Ω):", `${params.rs}`],
    ["Resistencia shunt Rsh (Ω):", `${params.rsh}`],
    ["Factor de idealidad n:", `${params.n}`],
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

  y += 8;

  // PARAMETROS CALCULADOS
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  setColor(COLORS.lepsNavy);
  doc.text("Parámetros Calculados del Modelo", marginLeft, y);
  y += 6;

  doc.setFontSize(10);
  setColor(COLORS.black);

  // Unicode support
  const modelParams = [
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

  y += 8;

  // COMPARACION CON FABRICANTE
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
    ["Corriente Isc", `${params.isc} A`, `${params.isc.toFixed(3)} A`, "0.00%"],
    ["Voltaje Voc", `${params.voc} V`, `${params.voc.toFixed(3)} V`, "0.00%"],
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

  y += 10;

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
    "1. Los resultados se basan en el modelo de un diodo con resistencias serie (Rs) y shunt (Rsh).",
    "2. El método de cálculo utilizado es Barry Analytical Expansion.",
    "3. Las condiciones de simulación corresponden a las condiciones estándar de prueba (STC):",
    "   Irradiancia: 1000 W/m², Temperatura: 25 °C.",
    "4. El factor de llenado (FF) y la eficiencia son valores derivados de la simulación.",
    "5. Un error menor al 5% respecto al fabricante se considera aceptable.",
  ];

  notes.forEach((note) => {
    doc.text(note, marginLeft, y);
    y += 4.5;
  });

  y += 10;
  doc.setFontSize(9);
  setColor(COLORS.gray);
  doc.text("---- Fin del informe de simulación ----", pageWidth / 2, y, {
    align: "center",
  });

  drawFooter();

  const fileName = `Simulacion_LEPS_${params.marca || "Modulo"}_${params.referencia || "PV"}_${dateStr.replace(/\./g, "-")}.pdf`;
  doc.save(fileName);
}
