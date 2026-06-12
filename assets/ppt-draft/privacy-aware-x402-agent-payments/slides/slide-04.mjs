import { C, slideBase, text, box, arrow } from "./deck-helpers.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  slideBase(slide, ctx, "Adapter boundary", "The product is a payment privacy and evidence layer, not another marketplace.", 4);
  const lanes = [
    ["Agent workflow", 190, "#F8FAFC"],
    ["x402 service delivery", 350, "#FFF7ED"],
    ["Privacy payment adapter", 480, C.softGreen],
  ];
  lanes.forEach(([name, y, fill]) => {
    box(slide, ctx, 80, y, 1000, 112, fill, "#D8D2C5");
    text(slide, ctx, name, 104, y + 16, 210, 20, { size: 18, bold: true });
  });
  const nodes = [
    ["agent decides", 340, 212], ["policy check", 560, 212], ["receipt log", 780, 212],
    ["402 quote", 340, 372], ["payment proof", 560, 372], ["paid result", 780, 372],
    ["private note", 340, 502], ["burner payer", 560, 502], ["weaker linkage", 780, 502],
  ];
  nodes.forEach(([n, x, y]) => {
    box(slide, ctx, x, y, 150, 44, "#FFFFFF", "#CBD5E1");
    text(slide, ctx, n, x + 12, y + 14, 126, 14, { size: 13, bold: true, align: "center" });
  });
  [[490,234,560,234],[710,234,780,234],[490,394,560,394],[710,394,780,394],[490,524,560,524],[710,524,780,524],[635,256,635,372],[635,416,635,502]].forEach(a => arrow(slide, ctx, ...a, C.ink, 2));
  text(slide, ctx, "Boundary: x402 remains the access protocol; privacy rails are replaceable backends.", 100, 612, 850, 20, { size: 16, color: C.muted });
  return slide;
}
