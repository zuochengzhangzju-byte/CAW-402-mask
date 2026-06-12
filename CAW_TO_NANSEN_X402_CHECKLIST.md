# CAW + Privacy Adapter to Nansen x402 Checklist

## Current Judgment

Best case is Nansen.

There are two different paths. Do not conflate them.

### Path A: CAW-native x402, no privacy adapter

CAW -> Nansen looks feasible, because CAW v0.2.86 already has a native
payment-aware HTTP client:

```text
caw fetch <pact-id> <url>
```

Local dry-run evidence shows CAW can read the Nansen x402 payment challenge:

```text
endpoint: https://api.nansen.ai/api/v1/smart-money/netflow
protocol: x402
network: eip155:8453
asset: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
amount: 50000 micro USDC = 0.05 USDC
```

This is useful for the Cobo track because it proves CAW-controlled x402 payment,
but it bypasses our current privacy adapter.

### Path B: Privacy adapter purchase, CAW as governed funding source

This is the product path from `PRIVACY_X402_ADAPTER_SPEC.md`:

```text
agent
  -> our privacy adapter
  -> privacy rail / shielded note
  -> fresh disposable x402 payer
  -> Nansen x402
```

For the Cobo version, CAW should sit before the privacy rail:

```text
agent
  -> our adapter policy
  -> CAW Pact-governed top-up
  -> privacy rail / px402 note
  -> disposable x402 payer
  -> Nansen x402
```

In this path, Nansen does not see the CAW wallet as the x402 payer. CAW proves
agent fund authority and budget control; the privacy adapter provides wallet
unlinkability by funding a disposable payer.

## What Is Already Proven

- CAW wallet exists.
- Owner approved a Pact in the mobile app.
- Agent/runtime executed an allowed transfer.
- Over-limit transfer was denied by policy.
- Pact/audit evidence is visible.
- CAW CLI exposes `caw fetch`, which handles HTTP 402 with x402/MPP.
- CAW CLI exposes `caw tx sign-message --destination-type eip712`, so a custom
  adapter path is possible if native `caw fetch` needs help.
- CAW dry-run sees Nansen's Base USDC x402 accept item.
- CAW EVM address has been funded on Base mainnet for the Nansen test.

Evidence:

```text
hackathon/caw-evidence-redacted/
hackathon/caw-bridge/logs/20260611T134847Z-005-caw-fetch-meta-help.log
hackathon/caw-bridge/logs/20260611T134940Z-006-caw-nansen-dryrun-and-usdc.log
```

Use only redacted CAW evidence for sharing.

## Target Demo Path

### Track-Minimum CAW Path

```text
Agent
  -> CAW Pact-scoped authority
  -> caw fetch
  -> Nansen x402 402 challenge
  -> CAW pays 0.05 USDC on Base
  -> Nansen returns Smart Money data
  -> local receipt / response hash / demo table
```

This is the cleanest Cobo-track version because CAW is not merely funding a
separate wallet. CAW is the payment executor for the paid HTTP tool.

### Product-Accurate Privacy Path

```text
Agent
  -> our privacy adapter CLI
  -> CAW Pact-scoped funding/top-up
  -> px402 private note
  -> disposable payer signs normal x402 payment
  -> Nansen returns Smart Money data
  -> our receipt / response hash / CAW funding evidence
```

This is the path that matches the original privacy product plan.

## Implementation Checklist

### 1. Confirm Base USDC Metadata

- [x] Confirm CAW supports Base chain ID: `BASE_ETH`.
- [x] Confirm Nansen requires Base CAIP-2 network: `eip155:8453`.
- [x] Confirm Nansen requires Base USDC asset:
  `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
- [ ] Confirm CAW token id for Base USDC, likely `BASE_USDC`, with:

```bash
caw meta search-tokens --symbol USDC
```

### 2. Create A Base x402 Pact

Needed policy shape:

```text
allow: x402/Nansen payment on BASE_ETH / Base USDC
limit: <= 0.06 USDC per call
scope: Nansen research demo
completion: small tx/sign/fetch count threshold
```

Checklist:

- [ ] Submit a new Pact for Base USDC/Nansen x402.
- [ ] Approve it in the CAW mobile app.
- [ ] Save redacted Pact status evidence.
- [ ] Verify an over-limit payment or transfer is denied if feasible.

### 3. Fund CAW On Base Mainnet

The Nansen endpoint is Base mainnet, not testnet.

Minimum funding:

```text
Base USDC: at least 0.05 USDC, preferably 0.12 USDC for two attempts.
Base ETH: small gas buffer.
```

Checklist:

- [x] Deposit Base USDC to CAW EVM address.
- [x] Deposit a small amount of Base ETH for gas if CAW/x402 path needs it.
- [x] Confirm:

```bash
caw wallet balance --chain-id BASE_ETH
caw wallet balance --token-id BASE_USDC
```

Funding result on 2026-06-11:

```text
CAW EVM address: 0x8bf7aee000ccd484c7343346cd7666f52fde9e13
Base USDC received: 0.12
Base ETH received: 0.00003

USDC tx: 0x2689856cee5fa9198b49d38dd949db21d6269a6849f76cee640ff9ec04974cb4
ETH tx:  0x97939d3ed201f584b7c8015e76b2564dfde3c4652a548829e8dc27719ea6b9b3
```

### 4. No-Spend Nansen Dry Run

Already passed at challenge-selection level.

Command shape:

```bash
caw fetch "$PACT_ID" "https://api.nansen.ai/api/v1/smart-money/netflow" \
  --protocol x402 \
  --network eip155:8453 \
  --asset 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  --max-amount 60000 \
  --json "$(cat hackathon/assets/nansen-smart-money-netflow-request.json)" \
  --dry-run \
  --output full
```

Observed:

```text
available accepts: network=eip155:8453
asset=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
amount=50000
```

### 5. Real Paid Nansen Call Through CAW-Native Path

Run only after Base funds and Base Pact are ready.

Command shape:

```bash
caw fetch "$PACT_ID" "https://api.nansen.ai/api/v1/smart-money/netflow" \
  --protocol x402 \
  --network eip155:8453 \
  --asset 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  --max-amount 60000 \
  --json "$(cat hackathon/assets/nansen-smart-money-netflow-request.json)" \
  --output full
```

Pass criteria:

- [ ] HTTP status is 200.
- [ ] Response body contains Smart Money data.
- [ ] CAW transaction/payment record exists.
- [ ] Pact status/audit shows the operation.
- [ ] Local demo receipt records endpoint, price, chain, payer, response hash.

### 6. Real Paid Nansen Call Through Privacy Adapter

This is the product demo path. It should use the existing adapter command:

```bash
MAX_USD_PER_CALL=0.06 npm run demo:nansen -- --dataset netflow
```

Current implementation detail:

```text
px402/private note
  -> sdk.makePayment(...)
  -> disposable burner payer
  -> EIP-3009 TransferWithAuthorization
  -> Nansen x402
```

To make this CAW-track-aligned, add a CAW funding/top-up step before the
existing px402 note payment:

```text
CAW Pact
  -> policy-limited transfer/top-up
  -> privacy adapter note or disposable payer
  -> existing Nansen x402 purchase
```

Pass criteria:

- [ ] CAW Pact approves a small funding/top-up operation.
- [ ] Existing privacy adapter buys Nansen and returns HTTP 200.
- [ ] Receipt shows `privacyStrategy: disposable-payer`.
- [ ] Receipt includes CAW funding tx hash or CAW operation id.
- [ ] Demo makes clear that CAW is not the final visible Nansen payer in this path.

### 7. Fallback If Native `caw fetch` Fails

Fallback A: CAW EIP-712 signer path.

CAW exposes:

```text
caw tx sign-message --destination-type eip712 --eip712-typed-data ...
```

Our current privacy adapter already knows how to build the Nansen x402
EIP-3009 `TransferWithAuthorization` typed data. If `caw fetch` fails for a
fixable implementation reason, replace the local burner signer with CAW
`sign-message`.

Fallback B: CAW funds disposable x402 payer.

CAW executes a policy-limited Base USDC transfer into a disposable payer, then
the existing adapter completes Nansen x402. This proves CAW fund authority, but
it is weaker for the Cobo story because CAW is not the direct x402 payer.

## Demo Claim If This Passes

```text
CAW gives the agent a policy-governed wallet.
x402 gives the agent a native paid-tool protocol.
Nansen gives a high-signal paid research service where the payment itself can
reveal trade intent.

Our module ties them into a demoable agent payment path with scoped authority,
receipts, budgets, and a future privacy layer.
```

## Open Risks

- Nansen is mainnet Base, so real USDC is required.
- CAW Pact policy syntax for `caw fetch` may need one iteration.
- Provider-side privacy is not solved; Nansen still sees the request content.
- Payment privacy is not solved by CAW alone; CAW solves authority and policy.
- The privacy layer remains the next module after the CAW x402 path is stable.
