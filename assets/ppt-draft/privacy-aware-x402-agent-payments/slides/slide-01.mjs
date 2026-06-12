import { C, slideBase, text, box, pill, arrow } from "./deck-helpers.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  slideBase(slide, ctx, "Opening case", "The receipt leaks the edge before the trade does.", 1);

  const y = 190, h = 330, gap = 20, w = 260;
  const xs = [70, 70 + w + gap, 70 + (w + gap) * 2, 70 + (w + gap) * 3];
  const fills = ["#F9FAFB", "#FFF7ED", "#111827", "#FEE2E2"];
  const titles = ["1. Alice spots a spread", "2. She buys research", "3. Bob connects receipts", "4. Her edge compresses"];
  titles.forEach((t, i) => {
    box(slide, ctx, xs[i], y, w, h, fills[i], i === 2 ? "#111827" : "#E5E7EB");
    text(slide, ctx, t, xs[i] + 18, y + 18, w - 36, 30, { size: 17, bold: true, color: i === 2 ? "#FFFFFF" : C.ink });
  });

  text(slide, ctx, "+2.7% spread", xs[0] + 50, y + 128, 160, 30, { size: 26, bold: true, color: C.green, align: "center" });
  box(slide, ctx, xs[0] + 60, y + 178, 140, 82, "#EEF2FF", "#C7D2FE");
  text(slide, ctx, "Prediction market\nNews signal", xs[0] + 74, y + 198, 112, 42, { size: 14, align: "center" });

  pill(slide, ctx, "Market Data $0.01", xs[1] + 44, y + 112, 172, "#FED7AA");
  pill(slide, ctx, "News Search $0.007", xs[1] + 44, y + 158, 172, "#FED7AA");
  text(slide, ctx, "public wallet: 0xA...", xs[1] + 48, y + 224, 164, 20, { size: 13, color: C.muted, align: "center" });
  text(slide, ctx, "Privacy Adapter", xs[1] + 64, y + 272, 130, 18, { size: 13, color: C.green, bold: true, align: "center" });
  box(slide, ctx, xs[1] + 98, y + 244, 58, 24, C.softGreen, C.green);

  const bx = xs[2] + 40;
  ["Market Data", "News Search", "Trade 3 min later"].forEach((card, i) => {
    box(slide, ctx, bx + (i % 2) * 92, y + 105 + i * 50, 118, 34, "#1F2937", "#4B5563");
    text(slide, ctx, card, bx + (i % 2) * 92 + 8, y + 114 + i * 50, 100, 14, { size: 11, color: "#F9FAFB", align: "center" });
  });
  arrow(slide, ctx, bx + 52, y + 138, bx + 142, y + 188, C.red, 2);
  arrow(slide, ctx, bx + 154, y + 188, bx + 68, y + 238, C.red, 2);
  text(slide, ctx, "Strategy Pattern", xs[2] + 58, y + 272, 150, 18, { size: 13, color: "#FCA5A5", bold: true, align: "center" });

  text(slide, ctx, "+2.7", xs[3] + 52, y + 118, 70, 34, { size: 28, bold: true, color: C.green });
  arrow(slide, ctx, xs[3] + 130, y + 134, xs[3] + 172, y + 134, C.red, 3);
  text(slide, ctx, "+0.6", xs[3] + 178, y + 118, 70, 34, { size: 28, bold: true, color: C.red });
  text(slide, ctx, "expected spread, %", xs[3] + 50, y + 154, 150, 16, { size: 12, color: C.muted, align: "center" });
  text(slide, ctx, "No stolen key.\nNo leaked prompt.\nJust public receipts turning into trading intelligence.", xs[3] + 28, y + 206, 204, 78, { size: 17, bold: true, color: C.ink, align: "center" });

  text(slide, ctx, "Solid truth: payment metadata is already intent metadata; privacy reduces the durable wallet linkage in that trail.", 70, 560, 920, 34, { size: 18, color: C.muted });
  return slide;
}
