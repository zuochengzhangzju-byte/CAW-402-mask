# Privacy Adapter CLI

## What This Demo Does

This is the hackathon product path:

```text
trade research agent
  -> privacy adapter CLI
  -> CMC x402 market data
  -> Exa x402 search evidence
  -> local market signal
  -> encrypted note + receipts
```

The privacy claim is narrow:

```text
The research-payment note/burner is separated from any future trading wallet.
This does not hide prompts, IP metadata, provider-side account metadata, or future trading execution.
```

## User Setup

Create `hackathon/.env` from `.env.example`.

Required:

```env
PRIVATE_KEY=disposable_low_value_wallet_private_key
X402_CHAIN=base
```

`PX402_NOTE_PASSWORD` is not required for normal onboarding. If it is absent, the adapter creates a
project-local secret vault:

```text
data/secrets/px402-note-password.json
```

The vault file is gitignored and the password is never printed. `PX402_NOTE_PASSWORD` remains an
optional override for users who intentionally want external secret management.

Security model:

```text
The agent may invoke adapter commands, but it should not read or print note secrets.
The adapter process decrypts notes and recovery files internally.
```

For the current hackathon CLI this vault is a local gitignored JSON file. The product target is an
OS keychain or managed password-box backend with the same permission boundary.

For real-spend hackathon runs, acknowledge the current PRXVT SDK circuit limitation:

```env
PRXVT_REMOTE_CIRCUITS_ACK=I_UNDERSTAND_UNPINNED_REMOTE_CIRCUITS
```

Leave it empty for no-spend review and dry-runs. This acknowledgement is not a production circuit
integrity fix; see `SECURITY_REVIEW.md`.

Recommended for one-command onboarding:

```env
0X_API_KEY=your_0x_dashboard_key
ZEROX_API_KEY=your_0x_dashboard_key
```

Spend controls:

```env
MAX_USD_PER_CALL=0.02
MONTHLY_BUDGET_USD=20
MIN_BASE_ETH_BUFFER=0.00005
ZEROX_DUST_USDC=0.1
```

The wallet should hold a small amount of Base USDC. If it has too little native Base ETH, the CLI
can use 0x Gasless to buy dust ETH with USDC.

## Commands

```text
npm run privacy -- secrets:init
npm run privacy -- secrets:init --materialize-vault
npm run privacy -- doctor
```

`secrets:init` creates or checks the local note secret vault. It does not require a wallet private
key, does not print the password, and does not spend.

`secrets:init --materialize-vault` copies an already configured `PX402_NOTE_PASSWORD` into the
local vault without printing it. It refuses to overwrite a different existing vault secret unless
`--force` is passed.

`doctor` checks env, wallet balances, note state, secret source, and budget state. Does not spend.

```text
npm run privacy -- prepare --dry-run
```

Shows whether the CLI would buy dust ETH or deposit into a px402 note. Does not spend.

```text
npm run privacy -- prepare
```

Ensures enough dust ETH and creates or tops up the encrypted px402 note.

```text
npm run demo:market -- --dry-run --symbol ETH --query "Ethereum market structure and Base ecosystem catalyst"
```

Probes CMC and Exa x402 v2 payment requirements. Does not sign or spend.

```text
npm run demo:market -- --symbol ETH --query "Ethereum market structure and Base ecosystem catalyst"
```

Runs the tiny real-funds demo:

```text
prepare if needed
  -> private CMC x402 call
  -> private Exa x402 call
  -> local signal JSON
  -> receipts
```

Confirmed headline command today:

```text
npm run demo:market -- --providers cmc,exa --symbol ETH --query "Ethereum market structure and Base ecosystem catalyst"
```

Confirmed provider prices in the current demo:

```text
CMC quotes/latest: 0.01 USDC
Exa /search: 0.007 USDC
Combined demo: 0.017 USDC
```

```text
npm run privacy -- summarize
```

Rebuilds an agent-readable market signal from the latest saved paid responses. This does not spend.

```text
npm run privacy -- recover:list
npm run privacy -- recover:sweep --file data/recovery/recovery-....json
npm run privacy -- recover:sweep --file data/recovery/recovery-....json --execute
```

Lists encrypted failure-recovery files, dry-runs a sweep, or executes a USDC recovery sweep from a
failed burner wallet back to the disposable research wallet. The sweep uses EIP-3009, so the burner
does not need ETH; the disposable wallet pays gas.

CAW return path:

```text
npm run privacy -- return:caw
npm run privacy -- return:caw --execute --ack-return-link
npm run privacy -- recover:sweep --file data/recovery-caw-return/recovery-....json --to-caw --execute
```

This returns residual px402 note funds to the CAW Base address. It is for fund recovery and
accounting. It is not the most private default, because the final burner-to-CAW sweep is public.

Warning behavior:

```text
return:caw always returns a PUBLIC_RETURN_LINK warning.
return:caw --execute is refused unless --ack-return-link is present.
```

Product framing:

```text
Small CAW-authorized privacy budgets are working capital for agent tool purchases.
They should normally be spent down on allowed services or held in the encrypted note for later.
They should not be treated as a savings balance that auto-returns after every call.
```

Residual balance policy:

```text
spend-down: keep using the note for allowed x402 calls until near zero
hold-note: keep encrypted residual funds in the note for later
return-caw: withdraw and sweep to CAW when treasury reconciliation matters more than linkability
```

For sensitive trade-research flows, prefer `spend-down` or `hold-note` unless the user explicitly
wants to reconcile funds back to CAW.

```text
npm run privacy -- smoke:weather --dry-run
```

Keeps the already validated weather endpoint as a smoke test.

## Output Files

Default local paths:

```text
data/secrets
data/notes
data/receipts
data/responses
data/recovery
```

Notes are encrypted with the local secret vault or the optional `PX402_NOTE_PASSWORD` override.
Receipts include provider, endpoint metadata, price, request/response hashes, note balance
before/after, and payment references. Paid response bodies are stored in `data/responses` for demo
inspection and signal parsing.

If a private payment withdraws to a burner wallet but the paid provider rejects the retry request,
the burner private key is written to `data/recovery` encrypted with the local note secret. This is
only a failure-recovery path and should be treated as sensitive local data.

The same recovery rule applies to `return:caw`: a private withdrawal can complete before the
burner balance is immediately visible through RPC. In that case, use `recover:sweep --to-caw`
after a short delay rather than repeating the withdrawal.

## Current Implementation Notes

- Root `npm install` for latest `x402@1.2.0` was unstable in this Windows workspace, so the CLI
  implements a thin x402 v2 EIP-3009 adapter directly.
- The CLI reuses the already working `px402-spike` dependency bundle for PRXVT SDK, viem, undici,
  and snarkjs.
- Root `hackathon/package.json` intentionally has no runtime dependencies. `npm ls --depth=0`
  is clean; the product CLI imports the pinned spike dependency bundle through `createRequire`.
- CMC and Exa return x402 v2 payloads with `network: eip155:8453`; the adapter selects only Base
  USDC.
- The adapter is Base-only and checks provider method, origin, path, and x402 challenge resource
  before payment.
- `market --dry-run` has verified:
  - CMC price: `0.01 USDC`;
  - Exa price: `0.007 USDC`;
  - both have Base USDC payment options.
- CMC and Exa private x402 v2 are confirmed with HTTP 200.
- Exa requires the v2 payment payload to include `scheme` and `network`; CMC accepted the narrower
  payload but Exa's facilitator rejected it.
- Failed provider retries create encrypted recovery files before the paid retry is attempted. Two
  failed burner balances were swept back successfully during validation.

## Review Checklist

- No private key, decrypted note, note password, or burner private key should appear in stdout.
- Burner recovery files must be encrypted and never printed.
- `.env`, `data/secrets`, `data/notes`, `data/recovery`, and spike notes must not be committed or
  shared.
- `doctor`, `prepare --dry-run`, and `market --dry-run` must not sign or spend.
- `summarize` must not sign or spend.
- `recover:sweep` without `--execute` must not sign or spend.
- Real-spend paths are `prepare`, `market`, and `smoke:weather` without `--dry-run`.
- `recover:sweep --execute` signs a recovery authorization and spends small Base ETH gas from the
  disposable wallet.
- `return:caw --execute` can create a public burner-to-CAW link. Use it only when fund recovery is
  more important than preserving unlinkability for the residual balance.
- Receipts should contain hashes and public payment metadata only.
- Trading wallet keys are out of scope and must not be added to `.env`.
