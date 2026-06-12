import { C, slideBase, text, box, riskCurve } from "./deck-helpers.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  slideBase(slide, ctx, "Risk model", "Payment linkage turns many small signals into one actionable profile.", 2);
  riskCurve(slide, ctx, { x: 92, y: 198, w: 690, h: 330 });
  box(slide, ctx, 840, 210, 300, 170, "#F8FAFC", "#CBD5E1");
  text(slide, ctx, "Reference formula", 862, 232, 180, 22, { size: 17, bold: true });
  text(slide, ctx, "Risk(n) ~= s*n + alpha*L*n(n-1)/2", 862, 272, 245, 44, { size: 16, bold: true, face: "Aptos Mono", color: C.ink });
  text(slide, ctx, "L = linkage strength\nn(n-1)/2 = pairwise joins\nPrivacy lowers L, not every signal.", 862, 330, 240, 56, { size: 14, color: C.muted });
  box(slide, ctx, 840, 418, 300, 124, C.softGreen, "#BBF7D0");
  text(slide, ctx, "Design claim", 862, 438, 120, 20, { size: 15, bold: true, color: C.green });
  text(slide, ctx, "We do not promise total anonymity. We reduce the stable join key that compounds repeated paid interactions.", 862, 466, 238, 58, { size: 15 });
  return slide;
}
