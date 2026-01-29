import { jsPDF } from "jspdf";
import { SimulationResults, ModuleParams } from "@/types/module";

// Constants for chart styling
const COLORS = {
  grid: [220, 220, 220] as [number, number, number],
  axis: [80, 80, 80] as [number, number, number],
  text: [80, 80, 80] as [number, number, number],
  ivCurve: [239, 68, 68] as [number, number, number], // Red
  pvCurve: [57, 169, 0] as [number, number, number], // Sena Green
  mpp: [253, 195, 0] as [number, number, number], // Sena Yellow
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
  doc.line(mppX, graphY, mppX, bottomY); // Vertical
  doc.line(graphX, mppY_I, mppX, mppY_I); // Horizontal I
  doc.line(mppX, mppY_P, rightX, mppY_P); // Horizontal P
  doc.setLineDashPattern([], 0);

  // MPP Points
  doc.setFillColor(COLORS.mpp[0], COLORS.mpp[1], COLORS.mpp[2]);
  doc.circle(mppX, mppY_I, 1.2, "F");
  doc.circle(mppX, mppY_P, 1.2, "F");

  // Isc Point (0, Isc)
  const isc_Y = mapY1(params.isc);
  doc.setFillColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.circle(graphX, isc_Y, 1.2, "F");

  // Voc Point (Voc, 0)
  const voc_X = mapX(params.voc);
  doc.setFillColor(0, 48, 77); // Navy blue like the web interface
  doc.circle(voc_X, bottomY, 1.2, "F");

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
