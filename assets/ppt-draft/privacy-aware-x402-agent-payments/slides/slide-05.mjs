import { C, slideBase, text, barChart } from "./deck-helpers.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  slideBase(slide, ctx, "Market unlock", "Privacy lifts both high-frequency usage and high-value transaction volume.", 5);
  barChart(slide, ctx, {
    x: 76, y: 220, w: 500, h: 290, ymax: 120,
    title: "Activity index",
    yLabel: "Monthly activity index",
    categories: ["Micro", "Research", "Trading"],
    series: [
      { name: "without privacy", color: C.gray, values: [70, 38, 14] },
      { name: "with privacy", color: C.green, values: [92, 58, 31] },
    ],
  });
  barChart(slide, ctx, {
    x: 680, y: 220, w: 500, h: 290, ymax: 160,
    title: "Volume index",
    yLabel: "Monthly volume index",
    categories: ["Micro", "Research", "Trading"],
    series: [
      { name: "without privacy", color: C.gray, values: [18, 45, 42] },
      { name: "with privacy", color: C.green, values: [25, 82, 135] },
    ],
  });
  text(slide, ctx, "Illustrative model: micro-tools are high-frequency; sensitive services are higher-ticket. Privacy reduces the trust bottleneck in both.", 86, 580, 940, 30, { size: 17, color: C.muted });
  return slide;
}
