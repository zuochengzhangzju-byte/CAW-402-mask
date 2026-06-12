export const C = {
  ink: "#111827",
  muted: "#667085",
  paper: "#FBFAF7",
  line: "#D8D2C5",
  red: "#DC2626",
  orange: "#F97316",
  green: "#16A34A",
  blue: "#2563EB",
  gray: "#CBD5E1",
  softRed: "#FEE2E2",
  softGreen: "#DCFCE7",
  softBlue: "#DBEAFE",
  dark: "#14161A",
};

export function slideBase(slide, ctx, kicker, claim, page) {
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill: C.paper });
  ctx.addText(slide, {
    text: kicker.toUpperCase(),
    left: 64,
    top: 44,
    width: 240,
    height: 18,
    fontSize: 12,
    bold: true,
    color: C.orange,
    typeface: "Aptos",
  });
  ctx.addText(slide, {
    text: claim,
    left: 64,
    top: 72,
    width: 880,
    height: 76,
    fontSize: 34,
    bold: true,
    color: C.ink,
    typeface: "Aptos Display",
  });
  ctx.addText(slide, {
    text: String(page).padStart(2, "0"),
    left: 1168,
    top: 642,
    width: 48,
    height: 20,
    fontSize: 12,
    color: "#8A8173",
    align: "right",
  });
  ctx.addShape(slide, { left: 64, top: 652, width: 1060, height: 1, fill: C.line });
}

export function text(slide, ctx, s, x, y, w, h, opts = {}) {
  return ctx.addText(slide, {
    text: s,
    left: x,
    top: y,
    width: w,
    height: h,
    fontSize: opts.size ?? 18,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    typeface: opts.face ?? "Aptos",
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
    fill: opts.fill ?? "#00000000",
    line: opts.line ?? { style: "solid", fill: "#00000000", width: 0 },
  });
}

export function box(slide, ctx, x, y, w, h, fill, line = "#00000000") {
  return ctx.addShape(slide, {
    left: x,
    top: y,
    width: w,
    height: h,
    fill,
    line: { style: "solid", fill: line, width: line === "#00000000" ? 0 : 1 },
  });
}

export function pill(slide, ctx, label, x, y, w, fill, color = C.ink) {
  box(slide, ctx, x, y, w, 34, fill, "#00000000");
  text(slide, ctx, label, x + 12, y + 8, w - 24, 16, { size: 12, bold: true, color });
}

export function arrow(slide, ctx, x1, y1, x2, y2, color = C.ink, width = 2) {
  const line = ctx.addShape(slide, {
    geometry: "line",
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1) || 1,
    height: Math.abs(y2 - y1) || 1,
    fill: "#00000000",
    line: { style: "solid", fill: color, width },
  });
  return line;
}

export function labelValue(slide, ctx, label, value, x, y, w, accent = C.blue) {
  text(slide, ctx, value, x, y, w, 34, { size: 28, bold: true, color: accent });
  text(slide, ctx, label, x, y + 38, w, 34, { size: 13, color: C.muted });
}

export function barChart(slide, ctx, { x, y, w, h, ymax, title, yLabel, categories, series }) {
  text(slide, ctx, title, x, y - 40, w, 28, { size: 18, bold: true });
  text(slide, ctx, yLabel, x - 64, y + h / 2 + 60, 160, 18, { size: 12, color: C.muted, align: "center" }).rotation = 270;
  for (let i = 0; i <= 4; i++) {
    const gy = y + h - (h * i) / 4;
    box(slide, ctx, x, gy, w, 1, "#E7E2D8");
    text(slide, ctx, String(Math.round((ymax * i) / 4)), x - 36, gy - 7, 28, 14, { size: 11, color: C.muted, align: "right" });
  }
  box(slide, ctx, x, y, 1, h, C.ink);
  box(slide, ctx, x, y + h, w, 1, C.ink);
  const groupW = w / categories.length;
  const barW = 38;
  categories.forEach((cat, idx) => {
    const gx = x + groupW * idx + groupW / 2 - 45;
    series.forEach((s, si) => {
      const val = s.values[idx];
      const bh = (val / ymax) * h;
      const bx = gx + si * 50;
      box(slide, ctx, bx, y + h - bh, barW, bh, s.color);
      text(slide, ctx, String(val), bx - 4, y + h - bh - 22, barW + 8, 16, { size: 12, bold: true, align: "center" });
    });
    text(slide, ctx, cat, x + groupW * idx + 6, y + h + 18, groupW - 12, 18, { size: 12, bold: true, align: "center" });
  });
  series.forEach((s, idx) => {
    box(slide, ctx, x + w - 260, y - 34 + idx * 22, 14, 14, s.color);
    text(slide, ctx, s.name, x + w - 240, y - 36 + idx * 22, 180, 16, { size: 12 });
  });
}

export function riskCurve(slide, ctx, { x, y, w, h }) {
  text(slide, ctx, "Illustrative profiling confidence", x, y - 34, w, 20, { size: 18, bold: true });
  const ymax = 100;
  for (let i = 0; i <= 5; i++) {
    const gy = y + h - (h * i) / 5;
    box(slide, ctx, x, gy, w, 1, "#E7E2D8");
    text(slide, ctx, String(i * 20), x - 34, gy - 7, 28, 14, { size: 11, color: C.muted, align: "right" });
  }
  box(slide, ctx, x, y, 1, h, C.ink);
  box(slide, ctx, x, y + h, w, 1, C.ink);
  const data = [
    { n: "n=4", public: 16, privacy: 11, content: 10 },
    { n: "n=8", public: 48, privacy: 26, content: 21 },
    { n: "n=12", public: 96, privacy: 43, content: 33 },
  ];
  const colors = { public: C.red, privacy: C.green, content: C.blue };
  const groupW = w / data.length;
  const barW = 28;
  data.forEach((row, idx) => {
    const gx = x + groupW * idx + groupW / 2 - 54;
    ["public", "privacy", "content"].forEach((key, si) => {
      const val = row[key];
      const bh = (val / ymax) * h;
      const bx = gx + si * 38;
      box(slide, ctx, bx, y + h - bh, barW, bh, colors[key]);
      text(slide, ctx, String(val), bx - 4, y + h - bh - 20, barW + 8, 14, { size: 11, bold: true, align: "center" });
    });
    text(slide, ctx, row.n, x + groupW * idx, y + h + 18, groupW, 16, { size: 12, bold: true, align: "center" });
  });
  const ty = y + h - (h * 70) / ymax;
  box(slide, ctx, x, ty, w, 2, C.orange);
  text(slide, ctx, "actionable threshold", x + 10, ty - 20, 150, 16, { size: 11, color: C.orange, bold: true });
  text(slide, ctx, "paid agent interactions", x + w / 2 - 72, y + h + 42, 160, 16, { size: 12, color: C.muted });
  const lx = x + w - 210, ly = y + 32;
  box(slide, ctx, lx, ly, 14, 14, C.red); text(slide, ctx, "public payment anchor", lx + 22, ly - 1, 170, 16, { size: 12 });
  box(slide, ctx, lx, ly + 24, 14, 14, C.green); text(slide, ctx, "privacy adapter", lx + 22, ly + 23, 170, 16, { size: 12 });
  box(slide, ctx, lx, ly + 48, 14, 14, C.blue); text(slide, ctx, "fragmented content", lx + 22, ly + 47, 170, 16, { size: 12 });
}
