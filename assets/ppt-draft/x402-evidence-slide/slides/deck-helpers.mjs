export const C = {
  ink: "#111827",
  muted: "#667085",
  paper: "#FBFAF7",
  line: "#D8D2C5",
  orange: "#F97316",
  green: "#16A34A",
  blue: "#2563EB",
  red: "#DC2626",
  gray: "#E5E7EB",
  softGreen: "#DCFCE7",
  softBlue: "#DBEAFE",
  softOrange: "#FFF7ED",
  dark: "#111827",
};

export function base(slide, ctx, kicker, claim) {
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill: C.paper });
  ctx.addText(slide, {
    text: kicker.toUpperCase(),
    left: 64,
    top: 44,
    width: 260,
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
    width: 960,
    height: 76,
    fontSize: 34,
    bold: true,
    color: C.ink,
    typeface: "Aptos Display",
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
    fontSize: opts.size ?? 16,
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

export function box(slide, ctx, x, y, w, h, fill, line = "#00000000", width = 1) {
  return ctx.addShape(slide, {
    left: x,
    top: y,
    width: w,
    height: h,
    fill,
    line: { style: "solid", fill: line, width: line === "#00000000" ? 0 : width },
  });
}

export function tag(slide, ctx, label, x, y, w, fill, color = C.ink) {
  box(slide, ctx, x, y, w, 28, fill, "#00000000");
  text(slide, ctx, label, x + 10, y + 7, w - 20, 12, { size: 11, bold: true, color, align: "center" });
}
