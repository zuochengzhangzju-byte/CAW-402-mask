# PRXVT / px402 No-Funds Spike Results

## 2026-06-07

Status:

```text
PASS for no-funds SDK feasibility.
```

What was tested:

- Installed `@prxvt/sdk@1.0.2` in an isolated `px402-spike` folder.
- Imported SDK without using private keys.
- Constructed `PrivacySDK` for supported chains.
- Parsed an x402 weather payment requirement.
- Performed a no-funds dry run against the real weather x402 endpoint.

No funds were touched:

- `deposit` was not called.
- `depositFast` was not called.
- `depositLegacy` was not called.
- `makePayment` was not reached.
- No private key was read.

## Findings

Allowed deposit denominations:

```text
0.01, 0.1, 1, 10, 100 USDC
```

Supported chain configs observed:

```text
base
polygon
```

Unsupported or missing config in this SDK version:

```text
base-sepolia
polygon-amoy
```

The SDK parsed the already-validated weather x402 endpoint and found:

```text
required amount: 0.002 USDC
network: base
resource: https://httpay.xyz/api/weather?lat=22.3193&lon=114.1694
```

Dry run result:

```text
Insufficient balance. Need 0.002 USDC, have 0.000001 USDC
```

This is the desired no-funds failure. It proves the SDK reached x402 parsing and local note balance validation, then stopped before private payment execution.

## Assessment

px402 is currently the best-fit privacy path for this project because it directly wraps x402 rather than requiring a custom adapter from a generic privacy wallet.

Main risk:

```text
Next useful test requires a real Base mainnet deposit, minimum 0.01 USDC.
```

Before authorizing that, inspect contract/audit maturity and decide whether the minimum real-funds risk is acceptable.

## Maturity Check

Signals in favor:

- SDK is public on GitHub and npm.
- SDK import/init works locally.
- Base and Polygon chain configs are present.
- Base pool/paymaster/wallet/entrypoint/USDC addresses all have bytecode.
- Base pool has non-zero USDC balance; observed pool balance was about 49.6828 USDC.
- SDK dry run successfully parsed a real x402 weather endpoint and stopped before funds.

Risk signals:

- GitHub repo is very small: observed 19 stars, 1 fork, and 7 commits at time of review.
- No clear third-party audit report was found in docs/search.
- A third-party report claims a PRXVT hack in January 2026 with about 97K USD lost. This was not independently confirmed during the spike, but it is a material caution signal.
- SDK/docs are inconsistent around gasless deposits: docs describe gasless ERC-3009 behavior, but SDK `depositFast` still submits a direct `writeContract` transaction from the user wallet.
- `base-sepolia` and `polygon-amoy` configs were not available in `@prxvt/sdk@1.0.2`, so the next real test requires mainnet.

Conclusion:

```text
Maturity: early / experimental.
Acceptable only for tiny test funds.
Not acceptable as default production privacy rail yet.
```

## Deposit Attempt

Attempt:

```text
Base mainnet
depositFast(0.01 USDC)
wallet: 0x2fb65E4a76A6086228F83C8FA7B1bD1EeA092a63
```

Result:

```text
FAILED before transaction submission.
No transaction hash.
No USDC moved.
```

Reason:

```text
Execution reverted with reason: gas required exceeds allowance (0).
```

Interpretation:

The wallet had 3.596 Base USDC but 0 Base ETH. Despite the SDK's gasless deposit language, `depositFast` currently calls `walletClient.writeContract(...)` on the pool contract, so the wallet needs a small amount of Base ETH for gas.

Post-check:

```text
Base ETH: 0
Base USDC: 3.596
```

Next step if continuing:

```text
Fund the disposable wallet with a tiny amount of Base ETH for gas, then retry depositFast(0.01).
```

## Deposit Retry With Dust ETH

Attempt:

```text
Base mainnet
depositFast(0.01 USDC)
wallet: 0x2fb65E4a76A6086228F83C8FA7B1bD1EeA092a63
Base ETH before attempt: 0.000006096677281306
```

Result:

```text
FAILED before confirmation.
No successful transaction hash.
No USDC moved.
```

Reason:

```text
insufficient funds for gas * price + value
have 6096677281306 wei
want 6645772000000 wei
```

Interpretation:

The wallet was short by roughly `0.0000005491 ETH` at the RPC's estimated gas price for the
`depositWithAuthorization` call. This confirms the SDK path is close to working, but it is not
reliably gasless from a zero-ETH EOA. A product-grade flow should either:

- ask the user for a small Base ETH gas buffer,
- integrate a real gasless swap/relayer path,
- or move to an account-abstraction/paymaster design.

## Successful Main Path

After funding the same disposable wallet with more Base ETH:

```text
Base ETH before successful deposit: 0.000606096677281306
Base USDC before successful deposit: 3.596
```

The minimum private deposit succeeded:

```text
depositFast(0.01 USDC)
note balance after deposit: 0.01 USDC
encrypted note:
D:\Zuocheng\zuocheng Zhang\personal\web3\ethpanda\hackathon\px402-spike\notes\px402-note-1780834973807.json
```

The first private x402 weather call completed but the Node process did not exit cleanly because
the proof/runtime stack left background work alive. Local note inspection confirmed payment:

```text
note balance before: 0.01 USDC
note balance after:  0.008 USDC
```

The script was then updated to widen network timeouts, save the response body, and force process
exit after successful output. A second private x402 weather call succeeded:

```text
HTTP status: 200
note balance before: 0.008 USDC
note balance after:  0.006 USDC
x402 payer: 0xC59F80B58B42D42546dF710691Ee5f8726c65aEC
x402 payment tx: 0x5501dbf77e8d0485046bc5a12e20b96de9cc4c926f46b138afc7e2584cb31768
updated note:
D:\Zuocheng\zuocheng Zhang\personal\web3\ethpanda\hackathon\px402-spike\notes\px402-note-updated-1780836551557.json
response:
D:\Zuocheng\zuocheng Zhang\personal\web3\ethpanda\hackathon\px402-spike\notes\px402-weather-response-1780836551540.json
```

Weather response:

```json
{
  "latitude": 22.319859,
  "longitude": 114.198555,
  "temperature": "27.6 C",
  "humidity": "88%",
  "windSpeed": "11.5 km/h",
  "conditions": "Overcast",
  "weatherCode": 3,
  "updatedAt": "2026-06-07T12:45",
  "source": "Open-Meteo",
  "meta": {
    "x402": true
  }
}
```

External wallet balance after the successful deposit and private calls:

```text
Base ETH:  0.000600473400737581
Base USDC: 3.586
```

Conclusion:

```text
The main path is viable for tiny mainnet testing:
disposable wallet -> px402 deposit -> private note -> x402 paid tool -> updated note.
```

Important product note:

```text
The current SDK is not one-command smooth for a zero-ETH EOA. If the user has USDC but no ETH,
the product should attempt a USDC-paid gasless path first, such as 0x Gasless API, a relayer,
or an account-abstraction paymaster. Requiring users to manually source dust ETH is acceptable
for a hackathon spike, but not for a polished user path.
```

## 0x Gasless Dust ETH Path

Goal:

```text
If the user already has Base USDC but no Base ETH, automatically convert a tiny amount of USDC
into native Base ETH without requiring the user to source dust ETH manually.
```

Implementation added:

```text
npm run 0x:gasless:quote
script: zerox-gasless-quote.mjs
```

Environment variables:

```text
ZEROX_API_KEY or 0X_API_KEY
ZEROX_CHAIN_ID=8453
ZEROX_SELL_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
ZEROX_BUY_TOKEN=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
ZEROX_SELL_AMOUNT=100000
```

Dry-run quote result:

```text
sell: 0.1 Base USDC
buy: native Base ETH
liquidityAvailable: true
approvalType: permit
approvalSignable: true
tradeSignable: true
gasFee token: USDC
```

Executed with:

```text
ZEROX_EXECUTE=1
```

Result:

```text
status: confirmed
0x trade hash: 0x955ae8a61de76d3b01156807603d8b8213dd5f43c85f2a3c04d11b793072b3e0
transaction hash: 0xb243cfe7c717645b0fbeb3be115734c0ae45188b6eb8af961a01365d8f907b50
```

Wallet balance after the 0x Gasless test:

```text
Base ETH:  0.000658463757880035
Base USDC: 3.486
```

Conclusion:

```text
This fills the onboarding gap. A one-command product can:

1. check wallet USDC and ETH balances,
2. if ETH is below a gas buffer and USDC is available, use 0x Gasless to buy dust native ETH,
3. run px402 deposit,
4. call x402 tools through the private note,
5. persist the updated encrypted note after each payment.
```
