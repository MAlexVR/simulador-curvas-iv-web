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
};

/**
 * Draws the I-V and P-V chart directly onto the PDF document
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
  const margin = { top: 10, right: 15, bottom: 20, left: 15 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const graphX = startX + margin.left;
  const graphY = startY + margin.top;
  const bottomY = graphY + graphHeight;
  const rightX = graphX + graphWidth;

  // 1. Calculate Scales
  // X Axis: Voltage (0 to Voc * 1.1)
  const maxVoltage = params.voc * 1.1;

  // Y1 Axis: Current (0 to Isc * 1.1)
  const maxCurrent = params.isc * 1.1;

  // Y2 Axis: Power (0 to Pmax * 1.1)
  const maxPower = params.voc * params.isc * 1.1; // Rough estimate for max power scale

  // Helper to map values to coordinates
  const mapX = (v: number) => graphX + (v / maxVoltage) * graphWidth;
  const mapY1 = (i: number) => bottomY - (i / maxCurrent) * graphHeight;
  const mapY2 = (p: number) => bottomY - (p / maxPower) * graphHeight;

  // 2. Draw Grid and Axes
  doc.setLineWidth(0.1);
  doc.setDrawColor(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2]);

  // Vertical grid lines (Voltage)
  const xSteps = 10;
  for (let i = 0; i <= xSteps; i++) {
    const v = (maxVoltage / xSteps) * i;
    const x = mapX(v);

    // Grid line
    doc.setDrawColor(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2]);
    doc.line(x, graphY, x, bottomY);

    // Label
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(v.toFixed(1), x, bottomY + 5, { align: "center" });
  }

  // Horizontal grid lines (Current)
  const ySteps = 10;
  for (let i = 0; i <= ySteps; i++) {
    const c = (maxCurrent / ySteps) * i;
    const y = mapY1(c);

    // Grid line
    doc.setDrawColor(COLORS.grid[0], COLORS.grid[1], COLORS.grid[2]);
    doc.line(graphX, y, rightX, y);

    // Label Left (Current)
    doc.setTextColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
    doc.text(c.toFixed(1), graphX - 2, y + 1, { align: "right" });

    // Label Right (Power matches grid?)
    // Usually Power and Current scales don't align perfectly on grid lines,
    // so we might draw separate ticks for Power or just simplified labels.
    // Let's draw separate right-side axis ticks for Power.
  }

  // 3. Draw Right Axis (Power)
  doc.setDrawColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
  const pSteps = 10;
  for (let i = 0; i <= pSteps; i++) {
    const p = (maxPower / pSteps) * i;
    const y = mapY2(p);
    // Small tick
    doc.line(rightX, y, rightX + 1.5, y);
    // Label
    doc.setTextColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
    doc.text(p.toFixed(0), rightX + 2, y + 1, { align: "left" });
  }

  // Draw Axis Borders
  doc.setLineWidth(0.3);
  doc.setDrawColor(COLORS.axis[0], COLORS.axis[1], COLORS.axis[2]);
  doc.rect(graphX, graphY, graphWidth, graphHeight);

  // Axis Titles
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text("Voltaje (V)", graphX + graphWidth / 2, bottomY + 10, {
    align: "center",
  });

  doc.setTextColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.text("Corriente (A)", graphX - 10, graphY + graphHeight / 2, {
    align: "center",
    angle: 90,
  });

  doc.setTextColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
  doc.text("Potencia (W)", rightX + 12, graphY + graphHeight / 2, {
    align: "center",
    angle: 270,
  });

  // 4. Draw Curves
  // We'll downsample if there are too many points to keep PDF size small,
  // but usually results.voltage length is manageable (~100-200 points).

  // I-V Curve (Red)
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  const vData = results.voltage;
  const iData = results.current;
  const pData = results.power; // Assumes results has power array, if not calc it

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

  // 5. Highlight MPP
  const mppX = mapX(results.vmpp);
  const mppY_I = mapY1(results.impp);
  const mppY_P = mapY2(results.pmaxCalc);

  // Dashed lines to axis
  doc.setLineDashPattern([2, 1], 0);
  doc.setLineWidth(0.2);
  doc.setDrawColor(COLORS.mpp[0], COLORS.mpp[1], COLORS.mpp[2]);

  // Vertical line at Vmpp
  doc.line(mppX, graphY, mppX, bottomY);

  // Horizontal at Impp
  doc.line(graphX, mppY_I, mppX, mppY_I);

  // Horizontal at Pmpp
  doc.line(mppX, mppY_P, rightX, mppY_P);

  doc.setLineDashPattern([], 0); // Reset dash

  // Points
  doc.setFillColor(COLORS.mpp[0], COLORS.mpp[1], COLORS.mpp[2]);
  doc.circle(mppX, mppY_I, 1.0, "F");
  doc.circle(mppX, mppY_P, 1.0, "F");

  // Legend
  const legendX = graphX + graphWidth - 40;
  const legendY = graphY + 5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.rect(legendX, legendY, 35, 12, "FD");

  doc.setFontSize(7);

  // I-V Legend
  doc.setFillColor(COLORS.ivCurve[0], COLORS.ivCurve[1], COLORS.ivCurve[2]);
  doc.circle(legendX + 3, legendY + 3, 1, "F");
  doc.setTextColor(0, 0, 0);
  doc.text("Curva I-V", legendX + 6, legendY + 4);

  // P-V Legend
  doc.setFillColor(COLORS.pvCurve[0], COLORS.pvCurve[1], COLORS.pvCurve[2]);
  doc.circle(legendX + 3, legendY + 8, 1, "F");
  doc.setTextColor(0, 0, 0);
  doc.text("Curva P-V", legendX + 6, legendY + 9);
}
