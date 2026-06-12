import { C, slideBase, text, box, labelValue, arrow } from "./deck-helpers.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  slideBase(slide, ctx, "Validated demo", "The live path buys CMC and Exa research through private x402 on Base.", 3);
  const steps = [
    ["Disposable\nresearch wallet", "#F8FAFC"],
    ["px402\nprivate note", C.softGreen],
    ["CMC market data\n0.01 USDC", "#FFF7ED"],
    ["Exa search\n0.007 USDC", "#FFF7ED"],
    ["Local market\nsignal JSON", C.softBlue],
  ];
  const x0 = 86, y = 250, w = 184, h = 96;
  steps.forEach((s, i) => {
    const x = x0 + i * 214;
    box(slide, ctx, x, y, w, h, s[1], "#D8D2C5");
    text(slide, ctx, s[0], x + 16, y + 25, w - 32, 42, { size: 19, bold: true, align: "center", valign: "middle" });
    if (i < steps.length - 1) arrow(slide, ctx, x + w + 8, y + h / 2, x + 206, y + h / 2, C.ink, 2);
  });
  labelValue(slide, ctx, "combined provider cost", "0.017 USDC", 100, 430, 220, C.green);
  labelValue(slide, ctx, "validated network", "Base mainnet", 384, 430, 220, C.blue);
  labelValue(slide, ctx, "evidence outputs", "receipts + hashes", 668, 430, 240, C.orange);
  text(slide, ctx, "Proof object: a working CMC + Exa paid-research loop, not a mock marketplace.", 100, 550, 820, 30, { size: 18, color: C.muted });
  return slide;
}
