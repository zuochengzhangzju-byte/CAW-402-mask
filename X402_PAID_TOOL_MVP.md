# x402 Paid Tool MVP

## Objective

Validate the simplest possible paid-tool flow:

```text
agent
  -> discovers a paid resource
  -> receives a 402 payment challenge
  -> pays with a small 0x wallet
  -> retries the request with payment proof
  -> receives result and receipt
```

Privacy, shielded payments, prompt privacy, and strong key isolation are explicitly out of scope for the first milestone.

## Minimal Modules

1. Agent runner

- Sends requests.
- Understands tool/resource descriptions.
- Decides whether a call is within budget.
- Retries after payment.

2. Small hot wallet

- New low-value 0x wallet.
- Funded with a tiny amount of USDC or native gas on the target network.
- Treated as disposable during MVP.

3. Budget policy

- Global monthly cap, e.g. 20 USD.
- Per-call cap, e.g. 0.01-0.10 USD for early tests.
- Optional merchant allowlist.
- Local spend ledger.

4. x402 client/payment handler

- Parses `402 Payment Required`.
- Extracts price, chain, asset, recipient, and resource.
- Signs or submits the required payment payload.
- Retries request with payment proof.

5. Marketplace/resource connector

- Bazaar, APIHub, the402, 402.rest, or OMA connector.
- Starts with one marketplace only.
- Normalizes resource metadata:
  - name;
  - endpoint/tool id;
  - price;
  - input schema;
  - output schema;
  - trust signals;
  - policy notes.

6. Result validator

- Confirms response matches output schema.
- Records latency, cost, result hash, and success/failure.
- For deterministic services, compares against simple checks.

7. Receipt log

- Records:
  - timestamp;
  - agent id;
  - marketplace;
  - resource id;
  - price;
  - transaction/payment reference;
  - request hash;
  - response hash;
  - validation result.

## MVP Wallet Policy

For speed, the first test can use a convenience-first hot wallet:

```text
new wallet
  -> tiny balance only
  -> no main funds
  -> no identity-critical assets
  -> used only for x402 MVP calls
```

This deliberately sacrifices strong security in exchange for easy iteration. The risk is bounded by keeping the wallet balance very small.

## Recommended First Tests

Start with low-risk paid tools:

- simple data lookup;
- weather query;
- OCR;
- translation;
- webpage fetch / structured extraction;
- small search result;
- cheap inference endpoint.

For the hackathon narrative, weather should be treated as the smoke test. The main demo should be
a trade research agent buying market data:

- CoinMarketCap x402 quotes or DEX search;
- CoinGecko x402 simple price / token data / trending pools;
- Exa x402 search or contents for web evidence;
- optional DEX Screener wrapper if no direct x402 endpoint is needed.

Avoid first:

- KYC data;
- financial/medical/legal advice;
- high-value purchases;
- unofficial model API resale;
- anything requiring sensitive personal data.

## Later Privacy Upgrade Point

After this works, insert the privacy layer at the payment handler:

```text
x402 client/payment handler
  -> privacy payment adapter
  -> shielded wallet / private payment rail
```

The rest of the agent, marketplace, validation, and receipt modules should remain mostly unchanged.

## First Successful Validation

See `VALIDATION_LOG.md` for the first successful paid weather query over x402.

See `px402-spike/RESULTS.md` for the successful private-note x402 weather flow and the successful
0x Gasless USDC-to-native-ETH onboarding step.

See `TRADE_RESEARCH_AGENT_DEMO.md` for the proposed market-data demo that should replace weather
as the headline case.

## Local Test Harness

This folder includes a minimal Node.js buyer harness:

```text
package.json
.env.example
scripts/search-bazaar.mjs
scripts/call-x402-resource.cjs
```

Workflow:

```text
1. Copy .env.example to .env.
2. Create a new disposable wallet.
3. Put only a tiny test balance into the wallet.
4. Run Bazaar search for a weather endpoint.
5. Set RESOURCE_URL to the selected endpoint.
6. Run the paid call script.
```

Never use a main wallet or identity-critical wallet for the MVP.
