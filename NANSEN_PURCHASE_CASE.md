# Nansen Purchase Case

This is the stronger trade-intent paid data case for the demo.

Compared with a generic market-signal endpoint, Nansen is easier to explain:

```text
The agent is paying for Smart Money movement data.
That purchase itself reveals what the agent is researching: funds, smart traders,
net flows, and possibly perpetual positioning.
```

## Recommended Demo Purchase

Use Nansen Smart Money Netflow first:

```text
resource: https://api.nansen.ai/api/v1/smart-money/netflow
serviceName: Nansen
description: Get Smart Money Netflow Data
price: 0.05 USDC
network: Base / eip155:8453
asset: USDC / 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
x402Version: 2
quality signal: 387 calls / 19 unique payers in the last 30 days
```

Request body:

```json
{
  "chains": ["ethereum", "solana"],
  "filters": {
    "include_smart_money_labels": ["Fund", "Smart Trader"],
    "exclude_smart_money_labels": ["30D Smart Trader"],
    "include_stablecoins": false,
    "include_native_tokens": false
  },
  "order_by": [
    {
      "field": "net_flow_24h_usd",
      "direction": "DESC"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10
  }
}
```

Stored at:

```text
assets/nansen-smart-money-netflow-request.json
```

## More Aggressive Trade-Intent Variant

Use Nansen Smart Money Holdings when the story is "which assets are ranked highest by Smart Money holdings":

```text
resource: https://api.nansen.ai/api/v1/smart-money/holdings
description: Get Smart Money Holdings Data
price: 0.05 USDC
quality signal: 282 calls / 17 unique payers in the last 30 days
```

Request body:

```text
assets/nansen-smart-money-holdings-request.json
```

Use Nansen Smart Money Perpetual Trades:

```text
resource: https://api.nansen.ai/api/v1/smart-money/perp-trades
description: Get Smart Money Perpetual Trades Data
price: 0.05 USDC
quality signal: 606 calls / 3 unique payers in the last 30 days
```

This is more explicitly trading-oriented because it asks for new BTC long positions:

```json
{
  "only_new_positions": true,
  "filters": {
    "token_symbol": "BTC",
    "side": "Long",
    "action": "Buy - Add Long",
    "value_usd": {
      "min": 1000,
      "max": 10000
    }
  },
  "order_by": [
    {
      "field": "block_timestamp",
      "direction": "DESC"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10
  }
}
```

Stored at:

```text
assets/nansen-smart-money-perp-trades-request.json
```

## Dry Probes

No-spend probe through the generic x402 probe:

```bash
npm run probe:x402 -- --url https://api.nansen.ai/api/v1/smart-money/netflow --method POST --body-file assets/nansen-smart-money-netflow-request.json
```

```bash
npm run probe:x402 -- --url https://api.nansen.ai/api/v1/smart-money/perp-trades --method POST --body-file assets/nansen-smart-money-perp-trades-request.json
```

No-spend probe through the privacy adapter path:

```bash
$env:MAX_USD_PER_CALL="0.06"; npm run privacy -- nansen --dataset netflow --dry-run
```

```bash
$env:MAX_USD_PER_CALL="0.06"; npm run privacy -- nansen --dataset holdings --dry-run
```

```bash
$env:MAX_USD_PER_CALL="0.06"; npm run privacy -- nansen --dataset perp-trades --dry-run
```

Validated dry-run result on 2026-06-11:

```text
netflow:
  provider: nansen_netflow
  x402Version: 2
  priceUsdc: 0.05
  network: eip155:8453
  payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
  resource: https://api.nansen.ai/api/v1/smart-money/netflow

perp-trades:
  provider: nansen_perp_trades
  x402Version: 2
  priceUsdc: 0.05
  network: eip155:8453
  payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
  resource: https://api.nansen.ai/api/v1/smart-money/perp-trades
```

If `PX402_NOTE_PASSWORD` is not present in `.env`, use a real local password before running either dry-run or real-spend commands. The CLI intentionally refuses the public default.

## Real Purchase Command

This spends about `0.05 USDC`, plus the adapter needs a little note balance buffer.

```bash
$env:MAX_USD_PER_CALL="0.06"; npm run privacy -- nansen --dataset netflow
```

For the more trading-explicit version:

```bash
$env:MAX_USD_PER_CALL="0.06"; npm run privacy -- nansen --dataset perp-trades
```

Recommended order:

```text
1. Buy netflow first. It has broader Smart Money explanatory value and stronger payer diversity.
2. Buy holdings if the demo wants a Smart Money wallet/holding ranking story.
3. Buy perp-trades only if the demo needs a sharper trading-intent example.
```

## Run Logs

Every adapter command now writes a JSONL run log:

```text
data/run-logs/<runId>.jsonl
```

Each row is one event. Important events:

```text
command_start
command_nansen_start
stage_start / stage_end / stage_error
x402_call_start
payment_made
recovery_written
paid_response_received
x402_call_end
command_nansen_end
command_error
```

For purchases, the receipt also stores:

```text
runId
runLogPath
```

If the process exits awkwardly after payment, the log should still show the last completed stage. For example:

```text
payment_made -> recovery_written -> paid_response_received -> write_receipt -> x402_call_end
```

If a future run times out after `x402_call_end`, treat the payment as completed and inspect the receipt/response paths. If it times out before `paid_response_received`, treat it as a paid-delivery-unknown incident and use the recovery path.
```

## Expected Result

The paid response should be JSON. Accept it as demo-useful if it contains a list/table with some of:

```text
token / asset / symbol
chain
smart money label
net_flow_24h_usd or position/trade value
wallet/address or entity label
timestamp
direction/action/side
```

The demo claim should be:

```text
Buying Nansen data is a high-signal research action.
Even if no trade is executed, the payment reveals that the agent is investigating
smart-money flows or smart-money trading behavior.
The privacy adapter makes that paid research path less linkable to the user's
main or future trading wallet, while preserving receipts and response hashes.
```

## Real Purchase Result

Executed on 2026-06-11 with the privacy adapter against the Nansen Smart Money Netflow endpoint.

```text
dataset: netflow
resource: https://api.nansen.ai/api/v1/smart-money/netflow
status: 200
price: 0.05 USDC
network: eip155:8453
payer: 0x93A0bB47Ac867322eaF0fAA22A796f45e2A8A9a7
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
paymentTx: 0x86377f36d2c9bfec23e79d3ed4041a1e38bd005c87f55c2a34fb925e09d896ba
responseHash: f9f2422677d9bc9678ca548c5d80723220cfa9ff428af6335ffd88b89957f022
noteBalanceBeforeUsdc: 0.1
noteBalanceAfterUsdc: 0.05
```

Artifacts:

```text
receipt: data/receipts-nansen/receipt-1781109373440-nansen_netflow.json
response: data/responses-nansen/response-1781109373422-nansen_netflow.json
updated note: data/notes-nansen/px402-note-1781109373437.json
recovery: data/recovery-nansen/recovery-1781109369931.json
```

Top returned rows by `net_flow_24h_usd`:

| Rank | Token | Chain | 24h Net Flow | 7d Net Flow | Trader Count | Sector |
|---:|---|---|---:|---:|---:|---|
| 1 | KINS | solana | 40210.34 | 91907.42 | 8 | GameFi |
| 2 | WOJAK | solana | 13811.67 | 13811.67 | 2 | Memecoins |
| 3 | ROBO | ethereum | 11780.61 | 11780.61 | 1 | Artificial Intelligence / AI Agents |
| 4 | CARDS | solana | 7008.36 | -22292.45 | 23 | NFTs / RWAs / NFTFi |
| 5 | BURNIE | solana | 6984.77 | 13200.43 | 7 | Memecoins |

Demo interpretation:

```text
The agent bought Smart Money netflow data and received a ranked list of tokens
with 24h/7d/30d flows, chain, sectors, trader counts, token age, and market cap.
This is a much stronger intent signal than generic market data: the payment reveals
that the agent is investigating where funds and smart traders are moving now.
```

## Real Holdings Purchase Result

Executed on 2026-06-11 with the privacy adapter against the Nansen Smart Money Holdings endpoint, using the remaining Nansen note balance.

```text
dataset: holdings
resource: https://api.nansen.ai/api/v1/smart-money/holdings
status: 200
price: 0.05 USDC
network: eip155:8453
payer: 0x730396fbAD3cc6b8C763BBc68B184782aA21E7d8
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
paymentTx: 0xff16e3cd099ef13c0f0017c107ea5abdd8d59cd2d94481a732c7cd74f9a6a9fa
responseHash: 17b5155a091b3a60794f39349d93932b635137d504263e9f69a1a4afebb41c94
noteBalanceBeforeUsdc: 0.05
noteBalanceAfterUsdc: 0
runId: 20260611-0317031-nansen-97b9f5bd
```

Artifacts:

```text
run log: data/run-logs/20260611-0317031-nansen-97b9f5bd.jsonl
receipt: data/receipts-nansen/receipt-1781148011376-nansen_holdings.json
response: data/responses-nansen/response-1781148011356-nansen_holdings.json
updated note: data/notes-nansen/px402-note-1781148011374.json
recovery: data/recovery-nansen/recovery-1781148008445.json
```

Stage timing from the run log:

| Stage | Elapsed |
|---|---:|
| initial Nansen probe | 14724 ms |
| dust ETH check | 36085 ms |
| note balance check | 5207 ms |
| payment probe | 329 ms |
| private note payment | 128806 ms |
| retry fetch with payment | 2909 ms |
| write response | 1 ms |
| write updated note | 18 ms |
| write receipt | 1 ms |
| x402 paid call total | 132152 ms |

Top returned rows by `value_usd`:

| Rank | Token | Chain | Value | Holders | Age | Sector |
|---:|---|---|---:|---:|---:|---|
| 1 | GACHA | solana | 12960.05 | 2 | 16d | GambleFi / GameFi / NFTs |
| 2 | MANIFEST | solana | 12565.22 | 1 | 29d | Social Fi |
| 3 | TBH | solana | 12280.39 | 3 | 27d | Social Fi |
| 4 | SOLANGELES | solana | 11495.40 | 2 | 21d | Memecoins |
| 5 | TOESCOIN | solana | 8990.94 | 1 | 23d | Memecoins |

Demo interpretation:

```text
The agent spent the remaining private note balance to buy Smart Money holdings.
The response ranks fresh-token holdings by USD value and includes chain, holders,
token age, sectors, and market cap. This supports the "wallet/Smart Money ranking"
story more directly than the netflow table.
```
