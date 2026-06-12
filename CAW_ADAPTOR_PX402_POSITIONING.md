# CAW -> adaptor -> px402 -> paid service positioning

## Current target path

The product path we should explain in the demo is:

```text
Agent
  -> Cobo Agentic Wallet / Pact
  -> our adaptor
  -> PRXVT / px402 private rail
  -> x402 paid service
  -> payment confirmation / anti-double-spend / local evidence
```

More concretely:

```text
Agent decides to buy Nansen Smart Money data
  -> CAW controls whether the agent is allowed to use funds
  -> adaptor checks provider, budget, amount, request body, and idempotency
  -> px402 spends a private note and creates a burner-funded x402 payment
  -> x402 merchant receives a normal X-PAYMENT authorization
  -> provider returns the paid result
  -> adaptor records receipt, response hash, timing log, recovery state
```

## What local tests already show

### CAW authority and policy

Local redacted CAW evidence shows:

- wallet exists;
- owner approved a Pact;
- allowed transfer path worked;
- over-limit transfer was denied with `TRANSFER_LIMIT_EXCEEDED`;
- Pact/audit evidence exists.

Evidence folder:

```text
hackathon/caw-evidence-redacted/
```

Relevant file:

```text
07-over-limit-denied.log
```

This proves CAW is useful for fund authority:

```text
who can spend, how much, on which asset/chain, and under which policy
```

### CAW native x402 capability

CAW has a native payment-aware HTTP client:

```text
caw fetch <pact-id> <url> --protocol x402 ...
```

Local evidence shows it can see the Nansen x402 challenge:

```text
network: eip155:8453
asset: Base USDC 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
amount: 50000 micro USDC = 0.05 USDC
```

Relevant file:

```text
caw-evidence-redacted/15-nansen-dryrun-usdc.log
```

The later `caw-native` rail run failed at WSL DNS lookup for `api.nansen.ai`, classified as `network_error`. That is not evidence against CAW policy or x402. It is local WSL networking.

### px402 private rail

The `px402-private` dry run passed against Nansen netflow:

```text
classification: dry_run_challenge_ok
price: 0.05 USDC
network: eip155:8453
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
```

Relevant file:

```text
data/rail-runs/20260611-1437016-px402-private-netflow.json
```

Separate real Nansen purchases through the adaptor already validated the paid path and response handling.

## Why not let the agent call px402 directly?

An agent can call px402 directly in the narrow technical sense. That is not enough for this product.

Direct px402 has these gaps:

| Gap | Direct agent -> px402 behavior | What the adaptor adds |
| --- | --- | --- |
| Fund authority | agent needs direct wallet/signing authority or raw key-like capability | CAW/Pact controls agent fund permission |
| Spend policy | each agent/client must implement limits itself | centralized per-provider cap, budget, chain and asset checks |
| Provider safety | agent may pay any returned 402 challenge | provider allowlist, method/origin/path validation, request template control |
| Intent leakage | direct payer can be linked to sensitive research endpoint | px402 private note + burner-funded x402 payment reduce direct payer linkage |
| Idempotency | retry after partial failure can double-pay or lose state | request/run IDs, stage logs, recovery classification |
| Abnormal exits | payment success + network failure is ambiguous | recovery files and JSONL logs record exact failure stage |
| Evidence | raw stdout is not a receipt system | receipts, response hashes, timing, schema checks, safe previews |
| Demo hygiene | easy to leak `.env`, response, receipt, note files | public/private artifact boundary and redacted evidence convention |

The short version:

```text
px402 is the payment protocol.
It is not the whole agent payment product.
```

## Why not let CAW call x402 directly?

CAW-native x402 is valuable and should remain our convenience baseline:

```text
Agent -> CAW Pact -> caw fetch -> x402 provider
```

It solves:

- key custody;
- owner approval;
- spend limits;
- audit trail;
- policy denial;
- direct x402 payment execution.

But CAW-native by itself does not solve the privacy layer:

| Need | CAW-native x402 | CAW -> adaptor -> px402 |
| --- | --- | --- |
| Policy-governed agent funds | yes | yes |
| Native x402 payment | yes | yes, via burner x402 payment |
| Wallet unlinkability from paid service | no, CAW wallet is payer | stronger, px402 note/burner is payer path |
| Provider-specific request validation | limited to command flags | adaptor-owned request builders and allowlists |
| Failure recovery around privacy note state | not applicable | explicit note/recovery handling |
| Cross-provider receipt normalization | not the main CAW concern | adaptor normalizes receipts/timings/errors |

So the clean comparison is:

```text
CAW-native:
  best for authority, policy, and wallet operations.

px402-private:
  best for reducing direct payer-to-merchant linkage.

CAW-funded px402 through adaptor:
  combines CAW-controlled funds with px402 payment privacy and adaptor evidence.
```

## What exactly do we solve?

### 1. Agent fund control

CAW ensures the agent does not hold unrestricted private keys. The owner can approve a Pact, enforce limits, deny over-limit actions, and audit execution.

Demo proof:

```text
over-limit transfer denied by Pact policy
```

### 2. Sensitive paid-research privacy

Nansen Smart Money data is a high-intent purchase. The payment itself can reveal research direction.

The px402 rail changes:

```text
CAW/main wallet -> Nansen x402 payer
```

into:

```text
CAW governs/top-ups budget
  -> px402 private note
  -> burner-funded x402 payment
  -> Nansen
```

This reduces direct wallet-to-research-service linkage.

### 3. Safe x402 execution

The adaptor does not blindly pay every 402:

- checks provider policy;
- checks method/origin/path;
- checks Base USDC network/asset;
- checks `MAX_USD_PER_CALL`;
- records quoted price;
- records payer/payee/payment proof where available.

### 4. Double-spend and partial-failure handling

px402 itself uses nullifiers to prevent the same private note commitment from being spent twice.

Our adaptor adds application-level protection:

- run ID;
- request hash;
- stage timing;
- receipt path;
- recovery path;
- classification such as `network_error`, `dry_run_challenge_ok`, `success_200`.

This matters for the failure case:

```text
payment succeeded, but paid retry/network failed
```

Without the adaptor, that can look like an ordinary failed tool call. With the adaptor, it is a recoverable payment-state incident.

### 5. Demo-grade evidence

The adaptor produces evidence that can be shown without leaking secrets:

- redacted CAW evidence;
- rail-run receipts;
- response hashes;
- timing tables;
- private/public artifact split;
- Claude third-party attack test package.

## Recommended demo phrasing

Use this:

```text
We are not replacing CAW or px402.
CAW controls fund authority.
px402 provides private-note payment and anti-double-spend.
Our adaptor is the control plane between agent intent and paid services:
it chooses the rail, validates the x402 challenge, enforces budget,
executes through px402 when privacy is needed, and records receipts,
timings, and recovery state.
```

Avoid this:

```text
The agent cannot call px402 directly.
```

That is too strong. Say:

```text
The agent can call px402 directly, but direct px402 lacks the policy,
privacy orchestration, idempotency, recovery, and evidence layer needed
for sensitive autonomous paid research.
```

## One-slide version

```text
Why adaptor?

CAW gives authority:
  approval, Pact policy, spend limits, audit, no raw agent key

px402 gives privacy payment:
  private note, ZK spend, nullifier anti-double-spend, burner x402 payer

Adaptor gives product control:
  provider policy, budget, request builder, x402 validation,
  timing logs, receipts, recovery, demo-safe evidence
```

