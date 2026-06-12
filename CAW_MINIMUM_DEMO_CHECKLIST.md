# CAW Minimum Demo Checklist

## Target Proof

For the Cobo Agentic Wallet track, the minimum credible proof is:

```text
CAW wallet created
Pact approved by owner
Agent/runtime can execute an allowed transfer
Over-limit transfer is denied by policy
Policy/audit evidence is visible
```

This proves CAW's role in agent fund authority before integrating it into the x402 market-data demo.

## Current Wallet Metadata

```text
caw version: v0.2.86
wallet_id: 7546a0eb-48b3-4388-8a88-fd71a3700b0d
EVM address: 0x8bf7aee000ccd484c7343346cd7666f52fde9e13
SOL address: CTYBv9uhk3ukZaQhJ5NxMpSp2pNzkt9tHfyWPC7k64qk
```

## Smoke Test Command

Run from the Ubuntu WSL prompt:

```bash
cd "/mnt/d/Zuocheng/zuocheng Zhang/personal/web3/ethpanda"
bash hackathon/caw-pact-smoke-test.sh
```

The script:

1. checks CAW version, wallet, and addresses;
2. requests Sepolia testnet funds for the EVM address;
3. submits a Pact allowing small `SETH` transfers and denying transfers above `0.001 SETH`;
4. waits for owner approval in the Cobo Agentic Wallet app;
5. attempts an over-limit transfer, expecting policy denial;
6. attempts an allowed transfer;
7. saves logs under `hackathon/caw-evidence`.

## Evidence To Capture

Keep:

- `00-version.log`
- `01-wallet-get.log`
- `02-address-list.log`
- `05-pact-submit.log`
- `06-pact-status-after-approval.log`
- `07-over-limit-denied.log`
- `08-allowed-transfer.log`
- `10-pact-status-final.log`

Do not store:

- CAW API key;
- `.env` contents;
- private keys;
- pairing secrets.

## Smoke Test Result

Status: passed.

Evidence directory:

```text
hackathon/caw-evidence-redacted
```

Important redacted artifacts:

- `05-pact-submit.log`: Pact submitted and pending owner approval.
- `06b-pact-status-real-id.log`: Pact activated.
- `07-over-limit-denied.log`: over-limit transfer denied by Pact policy.
- `08-allowed-transfer.log`: allowed transfer submitted.
- `11-pact-status-polled.log`: allowed transfer reached `Success`, denied transfer remained `Rejected`.
- `12-balance-polled.log`: Sepolia balance reflected the successful transfer and fee spend.

Key proof points:

```text
CAW wallet created: yes
Pact approved: yes
Agent/runtime can execute allowed transfer: yes
Over-limit transfer denied: yes
Policy/audit evidence visible: yes
```

Observed denial:

```text
code: TRANSFER_LIMIT_EXCEEDED
reason: matched_pact_transfer_deny_if
policy_type: transfer
```

Observed allowed transfer:

```text
operation_type: transfer
status: Success
```

Security note:

```text
Raw caw-evidence logs can include CAW api_key fields from `caw pact status`.
Use only caw-evidence-redacted for demos, commits, screenshots, and sharing.
```

## Demo Interpretation

This is not yet the x402 integration. It proves the CAW-controlled funds layer:

```text
CAW = agent fund account + owner-approved Pact + policy enforcement
our adapter = x402 paid tool flow + receipts + future privacy adapter
```

Once this smoke test passes, the next step is to replace the local wallet signer in the x402 demo with a CAW-backed signing/payment path.
