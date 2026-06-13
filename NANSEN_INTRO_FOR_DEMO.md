# Nansen Intro For Demo

Use this page when introducing why the demo uses Nansen as the paid x402 service.

## One-Sentence Intro

Nansen is an onchain intelligence platform for crypto traders and builders. It
labels wallets, tracks Smart Money and wallet flows, and exposes structured
onchain data through its app, API, CLI, MCP, and x402 micropayments.

## Why Nansen Fits This Demo

Our demo needs a paid service where payment metadata can reveal sensitive intent.
Nansen is a strong example because a trade research agent may query:

```text
Smart Money netflow
token holdings
perp trading activity
wallet behavior
```

Those requests are not generic utility calls. They can reveal what an agent is
researching before it trades. That is exactly where a privacy-aware x402 adapter
is useful.

## Official Positioning

From Nansen's official homepage:

```text
Trade Everything Onchain With AI
Powered by Smart Money
```

The page also says Nansen helps users analyze wallet flows, track key metrics,
and trade with confidence.

Official page:

```text
https://nansen.ai/
```

Screenshot:

```text
assets/nansen-screenshots/nansen-home.png
```

## Nansen API / Agent Angle

From Nansen's official API page:

```text
Onchain Intelligence for AI Agents
```

Nansen describes its API as structured JSON access via CLI, MCP, or REST API.
It also states that the Nansen API can be accessed with direct HTTP using an API
key or x402 micropayments.

Official API page:

```text
https://nansen.ai/api
```

Screenshot:

```text
assets/nansen-screenshots/nansen-api.png
```

## x402 Pricing Relevance

The Nansen API page describes x402 pay-per-call access using USDC on Base or
Solana, with example tiers including:

```text
Basic: $0.01 / call
Premium: $0.05 / call
```

Our validated demo uses the Nansen Smart Money netflow x402 endpoint:

```text
endpoint: https://api.nansen.ai/api/v1/smart-money/netflow
price: 0.05 USDC
network: Base / eip155:8453
asset: USDC
```

## Suggested Voiceover

```text
Nansen is a crypto onchain intelligence platform. It tracks labelled wallets and
Smart Money flows, which makes it useful for trade research agents.

That is exactly why it is a good privacy demo. If an agent publicly pays for a
specific Smart Money or netflow query, that payment trail can reveal research
intent before the user trades.

Nansen also exposes agent-friendly access through API, CLI, MCP, and x402
micropayments. So our adapter does not invent a fake service; it plugs into a
real paid data source that agents can call today.

The privacy mask does not hide the prompt from Nansen. It reduces durable wallet
linkage and gives the user explicit controls over budget, receipts, recovery,
and whether residual funds are spent down, held, or returned to CAW.
```

## Slides / Recording Order

1. Show `assets/nansen-screenshots/nansen-home.png`.
2. Say Nansen is onchain intelligence powered by Smart Money.
3. Show `assets/nansen-screenshots/nansen-api.png`.
4. Say Nansen has API/CLI/MCP access and x402 pay-per-call.
5. Switch to terminal and run:

```bash
npm run demo:agent-recording
```

6. Point out the dry-run result:

```text
priceUsdc: 0.05
network: eip155:8453
resource: https://api.nansen.ai/api/v1/smart-money/netflow
```
