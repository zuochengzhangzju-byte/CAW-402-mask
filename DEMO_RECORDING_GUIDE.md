# Demo Recording Guide

This guide is for a short terminal recording of CAW-402 Mask.

The recording mode is dry-run only:

```text
no real private key
no signing
no payment broadcast
no CAW transfer
```

## One-Time Setup

Install the pinned dependency bundle:

```bash
cd px402-spike
npm install
cd ..
```

## One-Command Recording

From the repository root:

```bash
npm run demo:agent-recording
```

The opening terminal banner should highlight the production principle, not the
demo command:

```text
Small CAW-authorized budgets are working capital for agent purchases.
```

Standalone slide assets for this line:

```text
assets/slides/caw-402-mask-core-line.pptx
assets/slides/caw-402-mask-core-line.png
```

The script simulates an agent calling the product:

```text
1. Agent creates or opens the local note secret vault.
2. Agent checks wallet, note state, policy, and budget.
3. Agent asks Nansen for an x402 price without spending.
4. Agent asks whether residual funds should be returned to CAW and sees the warning.
```

## VHS Product Video

Use this for a polished sub-1-minute terminal visual. It is a product video, not
the real-spend proof path:

```bash
brew install vhs
vhs tapes/caw-402-mask-demo.tape
```

The generated output is:

```text
assets/videos/caw-402-mask-demo.gif
```

The tape runs:

```bash
npm run demo:vhs-product
```

To check the scripted output without VHS:

```bash
npm run demo:vhs-product -- --fast
```

On Windows, if Homebrew/VHS is unavailable, generate a visually equivalent GIF
with the local renderer:

```powershell
npm run demo:gif:windows
```

That scripted output shows:

```text
required local config
local note secret vault
budget/policy check
Nansen x402 quote
return:caw privacy warning
```

## Manual Recording Commands

Use these if you want to type each command yourself.

PowerShell setup for a safe demo session:

```powershell
$env:PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000001"
$env:X402_CHAIN="base"
$env:BASE_RPC_URL="https://mainnet.base.org"
$env:MAX_USD_PER_CALL="0.06"
$env:NOTE_DIR="./data/recording-notes"
$env:RECEIPT_DIR="./data/recording-receipts"
$env:RESPONSE_DIR="./data/recording-responses"
$env:RECOVERY_DIR="./data/recording-recovery"
$env:RUN_LOG_DIR="./data/recording-run-logs"
$env:PX402_NOTE_SECRET_FILE="./data/recording-secrets/px402-note-password.json"
Remove-Item Env:PX402_NOTE_PASSWORD -ErrorAction SilentlyContinue
```

Commands to type:

```bash
npm run privacy -- secrets:init --note-dir data/recording-notes
npm run privacy -- doctor
npm run demo:nansen -- --dataset netflow --dry-run
npm run privacy -- return:caw
```

## Suggested Voiceover

```text
We start from a local agent. The agent does not see note passwords or recovery keys.
The adapter creates a local secret vault and keeps encrypted note state on the user's machine.

Next the agent checks policy and budget. This is a low-value working budget, not a savings wallet.

Then the agent asks Nansen for an x402 quote. The provider replies with price, asset, network, and payTo.
In a real run, the adapter would pay from a px402 private note through a disposable payer.

Finally, if the user asks to return leftover funds to CAW, the product warns that this is treasury
reconciliation, not a privacy action. The final burner-to-CAW sweep is public, so execution requires
an explicit acknowledgement.
```

## Real-Spend Difference

For real spend, replace the demo private key with a funded low-value Base wallet and review:

```text
SECURITY_REVIEW.md
PRIVACY_ADAPTER_CLI.md
CAW_PRIVACY_RAIL_ADAPTER_PLAN.md
```

Real return requires:

```bash
npm run privacy -- return:caw --execute --ack-return-link
```
