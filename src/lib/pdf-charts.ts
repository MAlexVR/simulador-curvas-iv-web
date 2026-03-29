import { jsPDF } from "jspdf";
import { SimulationResults, ModuleParams } from "@/types/module";
import { MultiConditionResults } from "@/lib/models/types";

function hexToRgb(hex: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    console.warn(`hexToRgb: formato hex inválido "${hex}", usando fallback azul`);
    return [59, 130, 246];
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [isNaN(r) ? 59 : r, isNaN(g) ? 130 : g, isNaN(b) ? 246 : b];
}

// Constants for chart styling
const COLORS = {
  grid: [220, 220, 220] as [number, number, number],
  axis: [80, 80, 80] as [number, number, number],
  text: [80, 80, 80] as [number, number, number],
  ivCurve: [239, 68, 68] as [number, number, number],   // Red
  pvCurve: [57, 169, 0] as [number, number, number],    // Sena Green
  mpp: [253, 195, 0] as [number, number, number],       // Sena Yellow
  background: [248, 250, 252] as [number, number, number], // Light gray bg
};

/**
 * Draws the I-V and P-V chart directly onto the PDF document
 * Con etiquetas de ejes FUERA del área de gráfica y leyenda DEBAJO
 */
export function drawIVChart(
  doc: jsPDF,
  results: SimulationResults,
  params: ModuleParams,
  startX: number,
  startY: number,
  width: number,
  height: number,
) {
  // Márgenes ampliados para etiquetas FUERA del gráfico
  const margin = { top: 8, right: 18, bottom: 28, left: 18 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const graphX = startX + margin.left;
  const graphY = startY + margin.top;
  const bottomY = graphY + graphHeight;
  const rightX = graphX + graphWidth;

  // 1. Calculate Scales
  const maxVoltage = params.voc * 1.1;
  const maxCurrent = params.isc * 1.1;
  const maxPower = params.voc * params.isc * 1.1;

  // Helper to map values to coordinates
  const mapX = (v: number) => graphX + (v / maxVoltage) * graphWidth;
  const mapY1 = (i: number) => bottomY - (i / maxCurrent) * graphHeight;
  const mapY2 = (p: number) => bottomY - (p / maxPower) * graphHeight;

  // 2. Draw background
  doc.setFillColor(
    COLORS.background[0],
    COLORS.background[1],
    COLORS.background[2],
  );
  doc.rect(graphX, graphY, graphWidth, graphHeight, "F");

  // 3. Draw Grid
  doc.setLineWidth(0.1);
  doc.setDrawColor(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2]);

  // Vertical grid lines (Voltage)
  const xSteps = 10;
  for (let i = 0; i <= xSteps; i++) {
    const v = (maxVoltage / xSteps) * i;
    const x = mapX(v);
    doc.line(x, graphY, x, bottomY);

    // Tick labels en eje X
    doc.setFontSize(7);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(v.toFixed(0), x, bottomY + 3.5, { align: "center" });
  }

  // Horizontal grid lines
  const ySteps = 10;
  for (let i = 0; i <= ySteps; i++) {
    const c = (maxCurrent / ySteps) * i;
    const y = mapY1(c);
    doc.line(graphX, y, rightX, y);

    // Left axis ticks (Current) - en rojo
    doc.setFontSize(7);
    doc.setTextColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
    doc.text(c.toFixed(1), graphX - 2, y + 1, { align: "right" });
  }

  // Right axis ticks (Power) - en verde
  const pSteps = 10;
  for (let i = 0; i <= pSteps; i++) {
    const p = (maxPower / pSteps) * i;
    const y = mapY2(p);
    doc.setFontSize(7);
    doc.setTextColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
    doc.text(p.toFixed(0), rightX + 2, y + 1, { align: "left" });
  }

  // 4. Draw Axis Border
  doc.setLineWidth(0.3);
  doc.setDrawColor(COLORS.axis[0], COLORS.axis[1], COLORS.axis[2]);
  doc.rect(graphX, graphY, graphWidth, graphHeight);

  // 5. Axis Labels - posición simétrica respecto a sus ejes
  doc.setFontSize(9);

  // X axis label (Voltaje) - debajo del eje
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text("Voltaje (V)", graphX + graphWidth / 2, bottomY + 9, {
    align: "center",
  });

  // Y1 axis label (Corriente) - izquierda, simétrico
  doc.setTextColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.text("I (A)", graphX - 11, graphY + graphHeight / 2, {
    align: "center",
    angle: 90,
  });

  // Y2 axis label (Potencia) - derecha, simétrico
  doc.setTextColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
  doc.text("P (W)", rightX + 11, graphY + graphHeight / 2, {
    align: "center",
    angle: 270,
  });

  // 6. Draw Curves
  const vData = results.voltage;
  const iData = results.current;
  const pData = results.power;

  // I-V Curve (Red)
  doc.setLineWidth(0.6);
  doc.setDrawColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  for (let i = 0; i < vData.length - 1; i++) {
    const x1 = mapX(vData[i]);
    const y1 = mapY1(iData[i]);
    const x2 = mapX(vData[i + 1]);
    const y2 = mapY1(iData[i + 1]);
    doc.line(x1, y1, x2, y2);
  }

  // P-V Curve (Green)
  doc.setDrawColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
  for (let i = 0; i < vData.length - 1; i++) {
    const x1 = mapX(vData[i]);
    const y1 = mapY2(pData[i]);
    const x2 = mapX(vData[i + 1]);
    const y2 = mapY2(pData[i + 1]);
    doc.line(x1, y1, x2, y2);
  }

  // 7. Highlight MPP
  const mppX = mapX(results.vmpp);
  const mppY_I = mapY1(results.impp);
  const mppY_P = mapY2(results.pmaxCalc);

  // Dashed lines
  doc.setLineDashPattern([2, 1], 0);
  doc.setLineWidth(0.2);
  doc.setDrawColor(COLORS.mpp[0], COLORS.mpp[1], COLORS.mpp[2]);
  doc.line(mppX, graphY, mppX, bottomY);    // Vertical
  doc.line(graphX, mppY_I, mppX, mppY_I);  // Horizontal I
  doc.line(mppX, mppY_P, rightX, mppY_P);  // Horizontal P
  doc.setLineDashPattern([], 0);

  // MPP Points
  doc.setFillColor(COLORS.mpp[0], COLORS.mpp[1], COLORS.mpp[2]);
  doc.circle(mppX, mppY_I, 1.2, "F");
  doc.circle(mppX, mppY_P, 1.2, "F");

  // Isc Point (0, Isc) - Triangle
  const isc_Y = mapY1(params.isc);
  doc.setFillColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.triangle(
    graphX,
    isc_Y - 1.5,
    graphX - 1.5,
    isc_Y + 1.5,
    graphX + 1.5,
    isc_Y + 1.5,
    "F",
  );
  doc.setFontSize(8);
  doc.setTextColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.text("Isc", graphX + 2, isc_Y);

  // Voc Point (Voc, 0) - Square
  const voc_X = mapX(params.voc);
  doc.setFillColor(0, 48, 77); // Navy blue
  doc.rect(voc_X - 1.2, bottomY - 2.4, 2.4, 2.4, "F");
  doc.setTextColor(0, 48, 77);
  doc.text("Voc", voc_X - 1, bottomY - 3);

  // 8. Legend - DEBAJO del gráfico, centrada
  const legendY = bottomY + 14;
  const legendCenterX = graphX + graphWidth / 2;

  doc.setFontSize(8);

  // I-V Legend item
  doc.setFillColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.circle(legendCenterX - 35, legendY, 1.2, "F");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text("Curva I-V", legendCenterX - 32, legendY + 1);

  // P-V Legend item
  doc.setFillColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
  doc.circle(legendCenterX + 5, legendY, 1.2, "F");
  doc.text("Curva P-V", legendCenterX + 8, legendY + 1);

  // MPP Legend item
  doc.setFillColor(COLORS.mpp[0], COLORS.mpp[1], COLORS.mpp[2]);
  doc.circle(legendCenterX + 42, legendY, 1.2, "F");
  doc.text("MPP", legendCenterX + 45, legendY + 1);
}

/**
 * Dibuja un gráfico multi-condición (I-V o P-V) directamente en el PDF
 * Tipo 'iv' → eje Y = corriente, tipo 'pv' → eje Y = potencia
 */
export function drawMultiChart(
  doc: jsPDF,
  mcResults: MultiConditionResults,
  startX: number,
  startY: number,
  width: number,
  height: number,
  type: "iv" | "pv",
): void {
  const margin = { top: 8, right: 18, bottom: 28, left: 18 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const graphX = startX + margin.left;
  const graphY = startY + margin.top;
  const bottomY = graphY + graphHeight;
  const rightX = graphX + graphWidth;

  const { curves, labels, colors } = mcResults;

  // Calculate scales from all curves
  const maxVoltage =
    Math.max(...curves.map((c) => Math.max(...c.voltage))) * 1.05;
  const maxY =
    type === "iv"
      ? Math.max(...curves.map((c) => Math.max(...c.current))) * 1.1
      : Math.max(...curves.map((c) => Math.max(...c.power))) * 1.1;

  const mapX = (v: number) => graphX + (v / maxVoltage) * graphWidth;
  const mapYval = (val: number) => bottomY - (val / maxY) * graphHeight;

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(graphX, graphY, graphWidth, graphHeight, "F");

  // Grid
  doc.setLineWidth(0.1);
  doc.setDrawColor(220, 220, 220);

  for (let i = 0; i <= 10; i++) {
    const v = (maxVoltage / 10) * i;
    const x = mapX(v);
    doc.line(x, graphY, x, bottomY);
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(v.toFixed(0), x, bottomY + 3.5, { align: "center" });
  }

  for (let i = 0; i <= 10; i++) {
    const val = (maxY / 10) * i;
    const y = mapYval(val);
    doc.line(graphX, y, rightX, y);
    const label = type === "iv" ? val.toFixed(1) : val.toFixed(0);
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(label, graphX - 2, y + 1, { align: "right" });
  }

  // Border
  doc.setLineWidth(0.3);
  doc.setDrawColor(80, 80, 80);
  doc.rect(graphX, graphY, graphWidth, graphHeight);

  // Axis labels
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Voltaje (V)", graphX + graphWidth / 2, bottomY + 9, {
    align: "center",
  });
  const yLabel = type === "iv" ? "I (A)" : "P (W)";
  doc.text(yLabel, graphX - 11, graphY + graphHeight / 2, {
    align: "center",
    angle: 90,
  });

  // Draw curves
  curves.forEach((curve, ci) => {
    const rgb = hexToRgb(colors[ci] ?? "#3b82f6");
    doc.setLineWidth(0.6);
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    const data = type === "iv" ? curve.current : curve.power;
    for (let i = 0; i < curve.voltage.length - 1; i++) {
      doc.line(
        mapX(curve.voltage[i]),
        mapYval(data[i]),
        mapX(curve.voltage[i + 1]),
        mapYval(data[i + 1]),
      );
    }
  });

  // Legend — centrada debajo del gráfico
  const legendY = bottomY + 14;
  const itemW = 30;
  const totalW = curves.length * itemW;
  let lx = graphX + (graphWidth - totalW) / 2;

  doc.setFontSize(8);
  curves.forEach((_, ci) => {
    const rgb = hexToRgb(colors[ci] ?? "#3b82f6");
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.circle(lx, legendY, 1.2, "F");
    doc.setTextColor(80, 80, 80);
    doc.text(labels[ci], lx + 3, legendY + 1);
    lx += itemW;
  });
}
