# Security Review Notes

## Current Status

This project is a hackathon privacy-payment adapter, not a production privacy wallet.

The intended claim is narrow:

```text
Separate the research-payment note/burner path from future trading wallets.
Enforce provider allowlists and small spend budgets.
Keep local note/recovery material encrypted.
```

It does not currently prove prompt privacy, IP privacy, provider-account privacy, or production-grade
ZK circuit integrity.

## Findings And Mitigations

### Public Default PX402_NOTE_PASSWORD

Finding:

```text
Missing PX402_NOTE_PASSWORD previously fell back to local-dev-password-change-me.
That password protects encrypted notes and recovery blobs.
```

Mitigation:

```text
Fixed in bin/privacy-adapter.js.
The CLI now refuses empty passwords, the old public default, and passwords shorter than 12 chars.
px402-spike funded legacy scripts use the same rejection.
```

### Remote PRXVT Circuits Without Hash Pinning

Finding:

```text
@prxvt/sdk defaults to downloading wasm/zkey from https://circuits.prxvt.com.
The adapter does not hash-pin those artifacts, so it cannot prove exactly which circuit/proving key
was used.
```

Mitigation / avoidance:

```text
Real spend now requires:
PRXVT_REMOTE_CIRCUITS_ACK=I_UNDERSTAND_UNPINNED_REMOTE_CIRCUITS
```

This is an explicit hackathon-only acknowledgement, not a production fix. A production path should
vendor the wasm/zkey, pin hashes, verify before proving, and ideally pin the verification key against
the deployed verifier contract.

### PRXVT publicSignals Nullifier Ordering

Finding:

```text
The inspected SDK build uses publicSignals[1] for cross-chain attestation nullifierHash and
publicSignals[0] in the returned PaymentResult.nullifierHash.
```

Mitigation / avoidance:

```text
The main adapter is Base-only and selects only Base USDC x402 payment requirements.
It does not use PaymentResult.nullifierHash as spend authority.
Cross-chain / attestor usage is out of scope and should remain disabled until the SDK/circuit public
signal order is audited against the circuit source and onchain verifier.
```

### Missing Resource / Method / Host Binding

Finding:

```text
Budget and Base USDC filtering existed, but provider resource, method, and host were not hard
invariants before payment.
```

Mitigation:

```text
Fixed in bin/privacy-adapter.js.
The adapter now allowlists provider method, origin, and path before probing and again checks the
x402 challenge resource before payment.
```

Current allowlist:

```text
cmc:     GET  https://pro-api.coinmarketcap.com/x402/v3/cryptocurrency/quotes/latest
exa:     POST https://api.exa.ai/search
weather: GET  https://httpay.xyz/api/weather
```

### Spike Scripts Bypass Main Adapter

Finding:

```text
px402-spike scripts can call sdk.wrapFetch(fetch), depositFast, or other raw SDK paths without the
main adapter's budget, provider allowlist, recovery, and circuit-risk gates.
```

Mitigation:

```text
Funded spike scripts now require:
ALLOW_UNGUARDED_SPIKE_FUNDED=I_UNDERSTAND_SPIKE_BYPASSES_MAIN_ADAPTER
```

Funded notes should use:

```text
npm run privacy -- prepare
npm run demo:market -- --providers cmc,exa --symbol ETH --query "..."
```

### Residual Fund Return Can Re-Link Funds

Finding:

```text
The return path withdraws px402 note balance to a disposable burner and then sweeps USDC to the
CAW Base address.

That sweep is public. It can link the burner that received the private withdrawal to the CAW
wallet, even though it does not reveal the original note contents or provider request body.
```

Mitigation / product stance:

```text
Treat return:caw as treasury reconciliation, not as a privacy-preserving default.
For sensitive flows, prefer spend-down or hold-note modes.
Use return:caw when the operator explicitly values fund recovery/accounting more than avoiding
the public return link.
```

Required product controls:

```text
- show a PUBLIC_RETURN_LINK warning before return:caw --execute;
- require --ack-return-link for return:caw --execute;
- record the return-link tradeoff in the receipt;
- support delayed recovery sweep, because burner balances may appear after the first balance read;
- avoid automatically returning residual funds after every purchase.
```

### Secret Custody For Agent-Controlled Notes

Finding:

```text
PX402_NOTE_PASSWORD controls encrypted note and recovery material. If an LLM agent can read it,
the note can be drained or recovery burners can be exposed through logs, prompts, tool traces, or
model output.
```

Mitigation / product stance:

```text
The agent should control spend policy through adapter commands, not by seeing raw secrets.
Secrets belong in a local vault / OS keychain / managed secret store. The adapter receives a scoped
runtime capability and performs decryption/signing internally.

The hackathon CLI now auto-creates a local gitignored vault at:
data/secrets/px402-note-password.json

PX402_NOTE_PASSWORD is only an optional external-secret override.
```

Minimum safety rules:

```text
- no password, decrypted note, or burner private key in stdout;
- no secret values in receipts or run logs;
- one vault entry per project or rail budget;
- refuse to create a fresh secret if existing note files are present but no matching vault/env
  secret can be found;
- explicit rotation command for note-password migration;
- encrypted recovery files written before any operation that could strand funds;
- agent permissions limited by provider allowlist, per-call limit, and budget.
```

## Remaining Production Gaps

```text
No local circuit hash pinning yet.
No independent audit of PRXVT SDK public signal order.
No prompt/IP privacy.
No provider-side identity unlinkability.
No merchant payTo pinning; provider payTo can rotate within an allowlisted resource.
No production OS-keychain-backed secret vault or password rotation command yet.
No automated spend-down policy for residual private-note balances yet.
No packaged one-command installer yet.
```
