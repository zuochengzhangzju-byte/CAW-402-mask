# Validation Log

## 2026-06-07: x402 Weather Paid Tool

Objective:

Validate the minimal flow:

```text
agent/client
  -> paid weather endpoint
  -> 402 payment challenge
  -> wallet payment
  -> retry with payment proof
  -> JSON result
```

Endpoint:

```text
https://httpay.xyz/api/weather?lat=22.3193&lon=114.1694
```

Network and asset:

```text
Base mainnet
USDC
```

Result:

```text
status: 200
payment success: true
transaction: 0xf82abef150dfa5b063834e400c9707d697e7a7d335c05ee67b799d47903537fd
lat/lon: 22.319859, 114.198555
temperature: 26.5 C
humidity: 90%
wind: 13.2 km/h
conditions: Slight rain
source: Open-Meteo
```

Notes:

- The first run paid successfully but returned `Missing ?lat= and ?lon= parameters`; this confirmed payment but not business output.
- The second run included Hong Kong coordinates and returned a valid weather JSON response.
- The endpoint requires Base mainnet. `X402_CHAIN=base-sepolia` is incorrect for this resource.
- This validates the ordinary x402 path before adding any shielded-wallet privacy adapter.

## 2026-06-07: Market Data x402 Probes

Objective:

Evaluate whether the headline demo should replace weather with a market-data purchase.

Probe results:

```text
CoinMarketCap x402 quotes/latest
status: 402
x402Version: 2
Base USDC payment option: present
amount: 10000 micro USDC = 0.01 USDC
network: eip155:8453
asset: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

```text
CoinGecko x402 simple/price
status: 402
body: payment required
official docs describe $0.01 USDC/request and Base support
```

```text
Exa /search
status: 402
x402Version: 2
Base USDC payment option: present
amount: 7000 micro USDC = 0.007 USDC
network: eip155:8453
```

Assessment:

```text
Use market data as the headline demo.
Keep weather as the smoke test.
CMC is the cleanest first market-data target; Exa is a strong second paid source for evidence.
```

## 2026-06-07: Privacy Adapter Product CLI

Objective:

Implement and test a one-command privacy adapter CLI for the trade research agent demo.

Commands added:

```text
npm run privacy -- doctor
npm run privacy -- prepare --dry-run
npm run privacy -- prepare
npm run demo:market -- --dry-run --symbol ETH --query "Ethereum market structure"
npm run demo:market -- --providers cmc --symbol ETH --query "Ethereum market structure"
```

Dry-run checks:

```text
doctor: passed
prepare --dry-run: passed
market --dry-run: passed
budget block with MAX_USD_PER_CALL=0.005: passed
weather smoke --dry-run: passed
```

Real-funds checks:

```text
prepare: passed
px402 deposit: 0.1 USDC
encrypted note path: data/notes/px402-note-1780845226868.json
```

CMC private x402 v2:

```text
status: 200
price: 0.01 USDC
payment-response: present
receipt: data/receipts/receipt-1780847403391-cmc.json
response: data/responses/response-1780847403372-cmc.json
note balance before: 0.063 USDC
note balance after: 0.053 USDC
```

Initial Exa private x402 v2 failure:

```text
status: 402
price attempted: 0.007 USDC
error body: Payment verification failed: Facilitator returned 400
receipt: data/receipts/receipt-1780847563501-exa.json
recovery: data/recovery/recovery-1780847562980.json
note balance before: 0.053 USDC
note balance after: 0.046 USDC
```

Review finding:

```text
The first hand-rolled v2 payload was accepted by CMC but rejected by Exa's facilitator.
The CLI saved encrypted burner recovery files before retrying provider requests.
Failed burner balances were recoverable instead of permanently lost.
```

## 2026-06-08: Product Evaluation Pass

Objective:

Validate the product-shaped flow:

```text
agent -> privacy adapter -> CMC x402 + Exa x402 -> structured market signal
```

Npm cleanup:

```text
npm ls --depth=0
result: (empty)
```

Implementation fix:

```text
Exa requires the x402 v2 payment payload to include scheme and network.
After adding those fields, Exa /search accepted the payment proof.
```

Exa paid call:

```text
status: 200
price: 0.007 USDC
receipt: data/receipts/receipt-1780851091440-exa.json
signal: data/receipts/market-signal-1780851091547.json
```

Combined market demo:

```text
command: npm run demo:market -- --providers cmc,exa --symbol ETH --query "Ethereum market structure Base ecosystem catalyst"
status: passed
CMC price: 0.01 USDC
Exa price: 0.007 USDC
total provider price: 0.017 USDC
CMC receipt: data/receipts/receipt-1780851247301-cmc.json
Exa receipt: data/receipts/receipt-1780851352484-exa.json
signal: data/receipts/market-signal-1780851352485.json
```

Agent-usable output:

```text
symbol: ETH
priceUsd: present
volume24h: present
percentChange24h: present
marketCap: present
evidence: 3 Exa search results
decision: needs_more_evidence
privacyBoundary: research payment note/burner is separate from future trading wallet
```

Budget guard:

```text
test: MAX_USD_PER_CALL=0.005 with Exa dry-run
result: blocked before payment
message: exa price 0.007 exceeds MAX_USD_PER_CALL 0.005
```

Failure recovery:

```text
dry-run recovery found failed Exa burner balance: 0.007 USDC
dry-run recovery found failed CMC burner balance: 0.01 USDC
CMC recovery sweep: success
tx: 0x698729f22dfb801a1438e68519696c579c1a03ecc99b18398f44a0db9b06fa40
Exa recovery sweep: success
tx: 0xa6188842d9c38d477447dec56ec523687c5b6337ad69a5937c33222e3038a884
```

Final doctor state:

```text
wallet: 0x2fb65E4a76A6086228F83C8FA7B1bD1EeA092a63
Base ETH: 0.000651802235875848
Base USDC: 3.403
latest note balance: 0.022 USDC
monthly spent ledger: 0.078 USDC
max per call: 0.05 USDC
monthly budget: 20 USDC
```

Product assessment:

```text
Can call successfully: yes, CMC + Exa both returned HTTP 200.
Overpayment: no provider overpayment observed on successful path; receipts match quoted prices.
Over budget: blocked before payment by per-call and monthly budget checks.
Agent usability: yes, market-signal JSON is structured and can be consumed by an agent.
Failure recovery: yes, failed burner funds can be swept back with recover:sweep --execute.
```

## 2026-06-11: Nansen Trade-Intent Purchases

Objective:

Validate a stronger trade-intent paid research flow:

```text
agent -> privacy adapter -> Nansen x402 Smart Money endpoint -> receipt + response + run log
```

Discovery:

```text
Nansen Smart Money netflow
resource: https://api.nansen.ai/api/v1/smart-money/netflow
price: 0.05 USDC
network: eip155:8453
serviceName: Nansen
quality: roughly 382-387 calls and 19-20 unique payers in recent Bazaar discovery results

Nansen Smart Money holdings
resource: https://api.nansen.ai/api/v1/smart-money/holdings
price: 0.05 USDC
network: eip155:8453
serviceName: Nansen
quality: roughly 282 calls and 17 unique payers in recent Bazaar discovery results
```

Nansen netflow purchase:

```text
status: 200
price: 0.05 USDC
payer: 0x93A0bB47Ac867322eaF0fAA22A796f45e2A8A9a7
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
paymentTx: 0x86377f36d2c9bfec23e79d3ed4041a1e38bd005c87f55c2a34fb925e09d896ba
receipt: data/receipts-nansen/receipt-1781109373440-nansen_netflow.json
response: data/responses-nansen/response-1781109373422-nansen_netflow.json
note balance: 0.1 -> 0.05 USDC
```

Netflow output:

```text
Top row: KINS on Solana
24h net flow: 40210.34 USD
7d net flow: 91907.42 USD
trader count: 8
sector: GameFi
```

Nansen holdings purchase:

```text
status: 200
price: 0.05 USDC
payer: 0x730396fbAD3cc6b8C763BBc68B184782aA21E7d8
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
paymentTx: 0xff16e3cd099ef13c0f0017c107ea5abdd8d59cd2d94481a732c7cd74f9a6a9fa
run log: data/run-logs/20260611-0317031-nansen-97b9f5bd.jsonl
receipt: data/receipts-nansen/receipt-1781148011376-nansen_holdings.json
response: data/responses-nansen/response-1781148011356-nansen_holdings.json
note balance: 0.05 -> 0 USDC
```

Holdings output:

```text
Top row: GACHA on Solana
value: 12960.05 USD
holders: 2
token age: 16 days
sector: GambleFi / GameFi / NFTs
```

Holdings run timing:

```text
initial Nansen probe: 14724 ms
dust ETH check: 36085 ms
note balance check: 5207 ms
private note payment: 128806 ms
retry fetch with payment: 2909 ms
x402 paid call total: 132152 ms
```

Assessment:

```text
Nansen is now the clearest trade-intent demo source.
The agent bought Smart Money netflow and holdings data through the privacy adapter.
The holdings purchase has a full stage-by-stage JSONL run log.
The netflow purchase happened before run logs were added, but receipt and response artifacts are complete.
```

## 2026-06-12: px402 Purchase With CAW Return Path

Goal:

```text
Complete the px402-private path without relying on the CAW WSL bridge:
1. create a fresh encrypted px402 note;
2. buy Nansen Smart Money netflow through x402;
3. return remaining note funds to the Cobo Agentic Wallet Base address.
```

Configuration:

```text
CAW EVM address: 0x8bf7aee000ccd484c7343346cd7666f52fde9e13
isolated note dir: data/notes-caw-return
isolated recovery dir: data/recovery-caw-return
isolated receipt dir: data/receipts-caw-return
```

Nansen purchase:

```text
command: npm run demo:nansen -- --dataset netflow
resource: https://api.nansen.ai/api/v1/smart-money/netflow
price: 0.05 USDC
note balance: 0.1 -> 0.05 USDC
status: 200
paymentTx: 0xa2a97bddd890cdae6b23af02c8df25c6dbe0419e1188d7f522ccc9ff56250aed
run log: data/run-logs/20260612-0759073-nansen-10825337.jsonl
receipt: data/receipts-caw-return/receipt-1781251343431-nansen_netflow.json
response: data/responses-caw-return/response-1781251343412-nansen_netflow.json
elapsed: 139202 ms
private note payment stage: 136330 ms
paid retry fetch: 2410 ms
```

Return path:

```text
first command: npm run privacy -- return:caw --execute
result: private withdrawal succeeded, immediate burner balance check read 0 USDC
recovery file: data/recovery-caw-return/recovery-1781251469881.json
private withdrawal tx: 0xfba06ae7cd17f474e7b54cd05578408df796983d30fceb2e13e3440aaabf56f5
burner: 0xE724B254C4A33C0149eC9Ee5a5745D19B3ad4593

recovery dry-run after short delay:
burner balance: 0.05 USDC
destination: 0x8bf7aee000ccd484c7343346cd7666f52fde9e13

recovery execute:
command: npm run privacy -- recover:sweep --file data/recovery-caw-return/recovery-1781251469881.json --to-caw --execute
status: success
amount: 0.05 USDC
sweep tx: 0x80fdd3973cc49d0e8ac8e76a3143b92699def78eca04498782240bf18c0fdde4
receipt: data/receipts-caw-return/receipt-1781255328734-recovery_sweep.json
```

CAW balance verification:

```text
command: node scripts/fund-caw-base.mjs --usdc 0 --eth 0
CAW Base ETH: 0.00003
CAW Base USDC: 0.17
interpretation: previous 0.12 USDC funding + 0.05 USDC returned from px402 note
```

Implementation notes:

```text
return:caw now supports:
- px402 note -> private withdrawal burner -> EIP-3009 sweep to CAW;
- encrypted recovery file for failed/late burner sweep;
- Windows-safe run ids for commands containing ":".

recover:sweep now supports:
- --to-caw to sweep recovery burners directly back to CAW;
- paymentTx display in dry-run/execute output for verification.

Observed edge case:
The burner balance can be zero immediately after private withdrawal even when the
withdrawal later settles. Recovery sweep is required as a first-class demo path.
```
