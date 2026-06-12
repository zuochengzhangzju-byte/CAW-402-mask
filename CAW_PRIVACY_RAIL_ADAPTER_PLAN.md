# CAW + Privacy Rail Adapter Plan

## Product Shape

Do not force CAW and the privacy rail into one wallet abstraction too early.
Use a rail adapter shape:

```text
agent request
  -> provider policy / budget / allowlist
  -> rail selector
     -> px402-private rail
     -> caw-native rail
     -> later: caw-funded px402 rail
  -> normalized receipt / timing / error classification
```

This makes the tradeoff visible:

```text
CAW-native rail: easiest agent payment, strongest policy/audit, weaker payment privacy.
px402-private rail: stronger payment unlinkability, more setup and failure handling.
caw-funded px402 rail: target shape for the hackathon story.
```

## Current Implemented Harness

Command:

```bash
npm run demo:nansen:rail -- --rail px402-private --dataset netflow --dry-run
npm run demo:nansen:rail -- --rail caw-native --dataset netflow --dry-run
```

Output:

```text
data/rail-runs/<runId>.json
```

Each rail-run receipt records:

- rail: `px402-private` or `caw-native`;
- privacy posture;
- Nansen dataset and endpoint;
- dry-run or real-spend mode;
- elapsed time;
- error classification;
- bridge log path for CAW;
- parsed child receipt where available;
- stdout/stderr hashes and safe previews.

## Validated So Far

### px402-private dry-run

Passed on 2026-06-11.

```text
rail: px402-private
dataset: netflow
classification: dry_run_challenge_ok
elapsed: about 17.5s
Nansen quote: 0.05 USDC on Base / eip155:8453
payTo: 0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f
```

This path goes through the existing privacy adapter and does not spend in dry-run.

### caw-native dry-run

The harness can enqueue a CAW bridge job and the bridge is reachable.

Latest result on 2026-06-11:

Classification:

```text
network_error
```

The CAW command reached the bridge, but WSL could not resolve `api.nansen.ai`.
Diagnostic evidence:

```text
/etc/resolv.conf nameserver: 10.255.255.254
getent hosts api.nansen.ai: no result
CAW fetch error: lookup api.nansen.ai: i/o timeout
nslookup api.nansen.ai 1.1.1.1: timed out
nslookup api.nansen.ai 8.8.8.8: timed out
curl cloudflare DoH: could not resolve cloudflare-dns.com
```

This is a WSL DNS/network issue, not an x402 policy, CAW balance, or Nansen
challenge issue. When WSL DNS is healthy, this path should call:

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

## Target Integration

### Phase 1: Rail Comparison

Keep both rails explicit.

```text
px402-private:
  our adapter -> px402 note -> disposable payer -> Nansen

caw-native:
  our rail wrapper -> caw fetch -> Nansen
```

Demo value:

- shows CAW is convenient for x402;
- shows privacy rail reduces wallet linkage;
- shows our adapter is the control plane and evidence layer.

### Phase 2: CAW-Funded Privacy Rail

Use CAW only for governed top-up:

```text
agent
  -> our adapter
  -> CAW Pact approves small top-up
  -> px402/private note receives budget
  -> disposable payer buys Nansen
```

This is the best story:

```text
CAW controls who may spend and how much.
The privacy rail controls what public payer Nansen sees.
Our adapter records receipts, budget, timing, and failure recovery.
```

### Return Path

When the privacy rail keeps residual funds in a px402 note, the adapter must be
able to return those funds to the CAW-controlled wallet:

```text
px402 note
  -> private withdrawal to disposable burner
  -> EIP-3009 USDC sweep
  -> CAW Base address
```

Validated command sequence:

```bash
npm run privacy -- return:caw
npm run privacy -- return:caw --execute --ack-return-link
npm run privacy -- recover:sweep --file data/recovery-caw-return/recovery-....json --to-caw --execute
```

The recovery command is not optional plumbing. In testing, the private withdrawal
completed but the burner balance was not immediately visible, so a delayed
recovery sweep was needed to finish the return.

Important privacy boundary:

```text
Returning funds to CAW is an operational treasury action, not a privacy action.
The private withdrawal hides the note-spend path from the original funding wallet,
but sweeping the withdrawal burner to CAW creates a public link between that burner
and the CAW address.
```

The product therefore needs three explicit residual-balance modes:

| Mode | Behavior | Privacy / Convenience Tradeoff |
|---|---|---|
| `spend-down` | Keep buying allowed x402 services until the note is near zero | Best for avoiding a return-link, but requires useful future calls |
| `hold-note` | Keep encrypted residual funds in the px402 note for later agent use | Good privacy posture, requires reliable local secret custody |
| `return-caw` | Withdraw residual funds and sweep to CAW | Best treasury hygiene, but creates a public return link |

Default recommendation:

```text
The CAW-authorized privacy budget is working capital for agent purchases, not a default
auto-return balance.
For sensitive trade research, use spend-down or hold-note by default.
Use return-caw only when the user prioritizes treasury reconciliation over unlinkability.
```

Execution gate:

```text
return:caw --execute must fail unless --ack-return-link is present.
The dry-run output must include a PUBLIC_RETURN_LINK warning before the user or agent can ask for
execution.
```

### Secret Custody

The agent should not directly know or print note secrets. Treat them as adapter-managed
vault secrets:

```text
human / operator
  -> approves project / wallet / spend policy
  -> adapter creates or unlocks vault entry
  -> grants the adapter a scoped runtime capability
  -> agent calls adapter commands
  -> adapter decrypts note/recovery material internally
```

Current hackathon implementation:

```text
npm run privacy -- secrets:init
  -> creates data/secrets/px402-note-password.json if missing
  -> never prints the password
  -> refuses to replace an unknown secret when existing note files are present
```

Product requirements:

- never expose `PX402_NOTE_PASSWORD`, decrypted notes, recovery burner keys, or CAW secrets in
  stdout, receipts, prompts, or run logs;
- support per-project vault entries instead of one global password;
- support password rotation by decrypting the latest note and re-encrypting it under a new vault
  entry;
- separate agent policy authority from secret material: the agent may request `buy`,
  `hold-note`, `spend-down`, or `return-caw`, but the adapter owns signing/decryption;
- store encrypted recovery files for every private withdrawal before any provider retry or sweep;
- allow a user-approved emergency recovery path when a burner balance appears after a delay.

### Phase 3: Unified CLI

After the harness is stable, fold it into:

```bash
npm run demo:nansen -- --dataset netflow --rail px402-private
npm run demo:nansen -- --dataset netflow --rail caw-native
npm run demo:nansen -- --dataset netflow --rail caw-funded-px402
```

## Special Cases To Handle

| Classification | Meaning | Expected Handling |
|---|---|---|
| `dry_run_challenge_ok` | Provider returned usable x402 quote | Safe to proceed to real spend if funded |
| `bridge_timeout` | CAW WSL bridge not running | Ask user to start `bash hackathon/caw-wsl-bridge.sh` |
| `pact_missing` | No Pact ID available | Create or pass `--pact-id` |
| `policy_denied` | CAW policy blocked payment | Show CAW value; no retry without new policy |
| `insufficient_balance` | CAW or px402 note lacks funds | Top up or lower max amount |
| `secret_missing_or_mismatch` | Existing px402 notes cannot be decrypted with available local/env secret | Restore the matching vault/env secret; never overwrite silently |
| `network_error` | RPC/provider/network failure | Retry with same run context; avoid duplicate spend after payment stage |
| `success_200` | Paid result returned | Hash and store response |

## Demo Metrics

Measure:

- total elapsed time;
- quote/probe time;
- payment preparation time;
- paid retry time;
- receipt write time;
- success/failure classification;
- whether payer is CAW or disposable;
- whether future trading wallet is linked.

The important comparison is not "privacy is faster." It is:

```text
CAW-native is the convenience baseline.
px402-private is the privacy baseline.
CAW-funded px402 is the combined target.
```

## Next Action

1. Restart WSL bridge:

```bash
cd "/mnt/d/Zuocheng/zuocheng Zhang/personal/web3/ethpanda"
bash hackathon/caw-wsl-bridge.sh
```

2. Re-run CAW dry-run:

```bash
npm run demo:nansen:rail -- --rail caw-native --dataset netflow --dry-run --timeout-ms 60000
```

3. Create a Base USDC/Nansen Pact if the real CAW purchase is needed.

4. Run one real `px402-private` Nansen purchase and one real `caw-native`
purchase only after confirming budgets.
