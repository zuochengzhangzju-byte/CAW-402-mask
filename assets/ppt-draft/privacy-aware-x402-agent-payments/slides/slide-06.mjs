import { C, slideBase, text, box, arrow } from "./deck-helpers.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  slideBase(slide, ctx, "Ecosystem fit", "The adapter sits under agent markets as a reusable payment privacy boundary.", 6);
  const top = [
    ["ERC-8004\nidentity / reputation / validation", 86],
    ["Virtuals ACP\ntask / escrow / job lifecycle", 416],
    ["NEAR Agent Market\nagent task marketplace", 746],
  ];
  top.forEach(([label, x]) => {
    box(slide, ctx, x, 190, 260, 86, "#F8FAFC", "#CBD5E1");
    text(slide, ctx, label, x + 18, 210, 224, 38, { size: 17, bold: true, align: "center" });
    arrow(slide, ctx, x + 130, 278, 608, 362, C.muted, 2);
  });
  box(slide, ctx, 420, 350, 360, 92, "#FFF7ED", "#FED7AA");
  text(slide, ctx, "x402 paid resource access", 452, 374, 296, 26, { size: 24, bold: true, align: "center" });
  text(slide, ctx, "quote -> pay -> retry -> result", 480, 406, 236, 18, { size: 15, color: C.muted, align: "center" });
  arrow(slide, ctx, 600, 444, 600, 494, C.ink, 2);
  box(slide, ctx, 380, 492, 440, 88, C.softGreen, "#BBF7D0");
  text(slide, ctx, "Privacy-aware payment adapter", 420, 514, 360, 24, { size: 24, bold: true, color: C.green, align: "center" });
  text(slide, ctx, "policy + private funding + receipt + validation hook", 444, 548, 312, 18, { size: 15, color: C.ink, align: "center" });
  text(slide, ctx, "Roadmap: plug in Curvy/crops.cash, px402, disposable payer rotation, and stronger selective disclosure without changing x402 service delivery.", 100, 612, 940, 32, { size: 17, color: C.muted });
  return slide;
}
