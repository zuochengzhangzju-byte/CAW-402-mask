# CAW-402 Mask

CAW-402 Mask is the Cobo Agentic Wallet hackathon version of a privacy-aware x402
payment adapter.

The core product idea is simple:

```text
Agents should be able to buy x402 services,
but sensitive agents should not leak every research-payment trail from one durable wallet.
```

This repo focuses on the CAW track:

```text
Cobo Agentic Wallet
  -> small governed agent budget
  -> local privacy adapter
  -> px402 private note / disposable payer
  -> x402 paid service such as Nansen
  -> receipt, audit, recovery, and residual-fund policy
```

The more general x402 product path lives in:

```text
https://github.com/zuochengzhangzju-byte/claw-idea-inbox
```

## What It Demonstrates

- CAW is the governed funding and policy layer.
- x402 is the paid-service delivery primitive.
- The adapter is the local control plane for privacy, receipts, recovery, and warnings.
- The privacy mask separates research-payment activity from future trading wallets.
- Residual funds are handled explicitly: spend down, hold in note, or return to CAW.

## CAW-Specific Thesis

CAW-native x402 is the convenience baseline:

```text
agent -> CAW Pact -> caw fetch -> x402 service
```

CAW-funded px402 is the privacy-sensitive path:

```text
agent -> CAW-approved small budget -> privacy adapter -> px402 note -> disposable payer -> x402 service
```

This is not trying to hide everything. The claim is narrow:

```text
Reduce durable wallet linkage for sensitive agent service purchases.
Keep CAW policy/audit and local receipts.
Do not claim prompt privacy, IP privacy, provider-account privacy, or regulatory bypass.
```

## Validated Case

The strongest current case is Nansen Smart Money data:

```text
provider: Nansen
endpoint: /api/v1/smart-money/netflow
price: 0.05 USDC on Base via x402
status: real paid call validated
```

Validated return path:

```text
px402 note residual balance
  -> private withdrawal to burner
  -> EIP-3009 USDC sweep
  -> CAW Base address
```

Important warning:

```text
return:caw is treasury reconciliation, not a privacy enhancement.
The final burner -> CAW sweep is public and can link that burner to the CAW wallet.
```

For that reason, real return execution requires explicit acknowledgement:

```bash
npm run privacy -- return:caw --execute --ack-return-link
```

## Quick Start

Install root scripts:

```bash
npm install
```

Install the pinned px402 / PRXVT dependency bundle:

```bash
cd px402-spike
npm install
cd ..
```

Create local config:

```bash
cp .env.example .env
```

Set a low-value disposable Base wallet private key in `.env`:

```env
PRIVATE_KEY=...
X402_CHAIN=base
BASE_RPC_URL=https://mainnet.base.org
```

Initialize the local note secret vault:

```bash
npm run privacy -- secrets:init
```

The adapter creates:

```text
data/secrets/px402-note-password.json
```

The password is never printed. The agent can call the adapter, but should not read
note secrets, decrypted notes, or recovery burner keys.

## No-Spend Checks

```bash
npm run privacy -- doctor
npm run privacy -- return:caw
npm run demo:nansen -- --dataset netflow --dry-run
npm run demo:nansen:rail -- --rail px402-private --dataset netflow --dry-run
```

## Real-Spend Demo

Real spend currently requires acknowledging that the PRXVT SDK downloads unpinned
remote circuit artifacts:

```env
PRXVT_REMOTE_CIRCUITS_ACK=I_UNDERSTAND_UNPINNED_REMOTE_CIRCUITS
MAX_USD_PER_CALL=0.06
```

Then run:

```bash
npm run demo:nansen -- --dataset netflow
```

Return residual funds only after the public-link warning is accepted:

```bash
npm run privacy -- return:caw
npm run privacy -- return:caw --execute --ack-return-link
```

If the private withdrawal succeeds but the burner balance is not immediately
visible, use recovery:

```bash
npm run privacy -- recover:sweep --file data/recovery-caw-return/recovery-....json --to-caw --execute
```

## Repo Map

- `bin/privacy-adapter.js` - main adapter CLI.
- `scripts/run-nansen-rail.mjs` - rail comparison harness.
- `scripts/fund-caw-base.mjs` - CAW Base funding/balance helper.
- `assets/nansen-*.json` - prepared Nansen request bodies.
- `CAW_PRIVACY_RAIL_ADAPTER_PLAN.md` - CAW + privacy rail product shape.
- `CAW_TO_NANSEN_X402_CHECKLIST.md` - CAW-to-Nansen test checklist.
- `COBO_AGENTIC_WALLET_TRACK_FIT.md` - why this fits the CAW track.
- `NANSEN_PURCHASE_CASE.md` - paid Nansen case study.
- `SECURITY_REVIEW.md` - risks, non-claims, and mitigations.
- `VALIDATION_LOG.md` - engineering validation notes.
- `px402-spike/` - pinned dependency bundle and lower-level spike scripts.

## Safety Boundary

Do not use this adapter to bypass KYC, sanctions screening, platform limits,
model policies, or regulated-service requirements.

The intended use is:

```text
wallet/payment unlinkability,
small governed agent budgets,
reduced cross-platform profiling,
auditable receipts,
and explicit user warnings when privacy is traded for treasury reconciliation.
```
