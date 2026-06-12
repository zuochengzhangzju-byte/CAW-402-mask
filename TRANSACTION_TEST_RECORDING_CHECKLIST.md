# Transaction Test Recording Checklist

Use this for every x402 / CAW / privacy-rail transaction test.

## Required Run Identity

- `runId`
- absolute timestamp: start and end
- rail: `px402-private`, `caw-native`, or `caw-funded-px402`
- mode: `adapter`, `caw_native`, `raw_x402`, or `direct_api`
- scenario: `dry_run_quote`, `happy_path`, `network_error`, `policy_denied`, `paid_retry_timeout`, `duplicate_request`, etc.
- dataset/provider/resource URL
- request body file path
- request hash

## Required Policy And Budget Evidence

- provider allowlist result
- method/origin/path check
- network and asset check
- quoted price
- max per-call budget
- monthly budget state if available
- CAW Pact ID or privacy note source if used
- denial reason if blocked

## Required Timing Fields

Record at least:

```text
total
quoteOrProbe
policy
noteDepositOrLoad
payment
retryFetch
validation
receiptWrite
```

For CAW-native, internal CAW timings may be unavailable. At minimum record:

```text
total bridge elapsed
caw command start/end
classification
bridge log path
```

## Required Payment Fields

- network: e.g. `eip155:8453`
- asset contract and symbol
- amount / price
- payer
- payTo
- payment tx hash or CAW operation id if available
- payment response header if available
- CAW audit / Pact status path if available

## Required Integrity Fields

- response hash
- response hash match if response body is stored
- schema pass/fail
- response file path
- receipt file path
- stdout/stderr hashes for child tools
- safe previews only, no secrets

## Required Idempotency And Recovery Fields

- request id
- duplicate payment count, if known
- paid-but-delivery-unknown flag
- recovery path for px402 burner if created
- recovered funds flag
- rerun policy: whether retry is safe without paying again

## Required Failure Classification

Use machine-readable classifications:

| Classification | Meaning |
|---|---|
| `dry_run_challenge_ok` | x402 quote parsed, no spend |
| `success_200` | paid request returned usable HTTP 200 |
| `bridge_timeout` | local CAW WSL bridge not running/responding |
| `pact_missing` | CAW Pact ID unavailable |
| `policy_denied` | CAW or local policy blocked the operation |
| `insufficient_balance` | CAW wallet, hot wallet, or privacy note lacks funds |
| `env_missing_note_password` | px402 note password missing for real path |
| `network_error` | DNS/RPC/provider/network failure before confirmed payment |
| `paid_delivery_unknown` | payment likely happened, result delivery unresolved |
| `schema_invalid` | response returned but not agent-usable |

## Current Harness

The rail harness now writes:

```text
data/rail-runs/<runId>.json
data/eval/runs.jsonl
```

Command examples:

```bash
npm run demo:nansen:rail -- --rail px402-private --dataset netflow --dry-run
npm run demo:nansen:rail -- --rail caw-native --dataset netflow --dry-run --timeout-ms 120000 --caw-timeout 90
```

## Current Known Blocker

CAW-native Nansen dry-run currently fails in WSL DNS:

```text
classification: network_error
message: lookup api.nansen.ai: i/o timeout
```

This is pre-payment and safe to retry after DNS is fixed.
