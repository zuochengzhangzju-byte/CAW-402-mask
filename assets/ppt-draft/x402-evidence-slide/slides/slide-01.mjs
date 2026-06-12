import { C, base, text, box, tag } from "./deck-helpers.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  base(slide, ctx, "Validated demo evidence", "One CLI call produced real x402 receipts, Exa evidence, and a local market-signal JSON.");

  box(slide, ctx, 70, 180, 500, 112, C.dark, "#111827");
  text(slide, ctx, "$ npm run demo:market -- --providers cmc,exa --symbol ETH", 92, 205, 448, 24, {
    size: 17,
    bold: true,
    color: "#F9FAFB",
    face: "Aptos Mono",
  });
  text(slide, ctx, "agent intent -> paid tools -> receipts -> local signal", 92, 246, 430, 20, {
    size: 14,
    color: "#CBD5E1",
  });

  box(slide, ctx, 70, 326, 230, 154, "#FFFFFF", "#D8D2C5");
  text(slide, ctx, "CMC receipt", 92, 348, 160, 22, { size: 18, bold: true });
  tag(slide, ctx, "status 200", 92, 386, 90, C.softGreen, C.green);
  tag(slide, ctx, "0.010 USDC", 194, 386, 96, C.softBlue, C.blue);
  text(slide, ctx, "network: eip155:8453\nrequestHash saved\nresponseHash saved", 92, 430, 170, 44, { size: 13, color: C.muted });

  box(slide, ctx, 330, 326, 240, 154, "#FFFFFF", "#D8D2C5");
  text(slide, ctx, "Exa receipt", 352, 348, 160, 22, { size: 18, bold: true });
  tag(slide, ctx, "status 200", 352, 386, 90, C.softGreen, C.green);
  tag(slide, ctx, "0.007 USDC", 454, 386, 96, C.softBlue, C.blue);
  text(slide, ctx, "searchTime: 1020.8 ms\n3 evidence results\npayment tx recorded", 352, 430, 178, 44, { size: 13, color: C.muted });

  box(slide, ctx, 70, 512, 500, 76, C.softOrange, "#FED7AA");
  text(slide, ctx, "Combined provider cost", 92, 532, 220, 18, { size: 15, bold: true, color: C.orange });
  text(slide, ctx, "0.017 USDC", 332, 520, 180, 36, { size: 32, bold: true, color: C.orange, align: "right" });
  text(slide, ctx, "Base mainnet paid calls; future trading wallet not used in this research trail.", 92, 564, 390, 16, { size: 13, color: C.muted });

  box(slide, ctx, 630, 180, 500, 162, "#FFFFFF", "#D8D2C5");
  text(slide, ctx, "Exa evidence returned", 654, 204, 210, 22, { size: 20, bold: true });
  text(slide, ctx, "1. Base's Flow: Dominance, the Token Gap, and the $10B Catalyst\n2. Base Is Not an L2 Anymore: Coinbase's on-chain OS pivot\n3. The Case for Base: An Open Stack for the Global Economy", 654, 250, 420, 62, { size: 14, color: C.ink });

  box(slide, ctx, 630, 372, 500, 176, "#F8FAFC", "#CBD5E1");
  text(slide, ctx, "market-signal.json", 654, 394, 240, 22, { size: 20, bold: true });
  text(slide, ctx, "{\n  \"symbol\": \"ETH\",\n  \"priceUsd\": 1631.64,\n  \"percentChange24h\": 4.36,\n  \"decision\": \"needs_more_evidence\",\n  \"privacyBoundary\": \"research payment note/burner is separate from any future trading wallet\"\n}", 654, 430, 430, 86, { size: 13, color: C.ink, face: "Aptos Mono" });

  text(slide, ctx, "Proof object: real paid x402 provider responses plus local JSON output, not a mock marketplace.", 76, 612, 900, 22, { size: 17, color: C.muted });
  return slide;
}
