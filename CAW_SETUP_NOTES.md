# Cobo Agentic Wallet Setup Notes

## CLI Version

```text
caw v0.2.86
```

## Wallet

```text
wallet_id: 7546a0eb-48b3-4388-8a88-fd71a3700b0d
created_at: 2026-06-11T13:10:55Z
```

## Addresses

### Solana

```json
{
  "address": "CTYBv9uhk3ukZaQhJ5NxMpSp2pNzkt9tHfyWPC7k64qk",
  "chain_type": "SOL",
  "compatible_chains": [
    "SOL",
    "SOLDEV_SOL"
  ]
}
```

### Ethereum / EVM

```json
{
  "address": "0x8bf7aee000ccd484c7343346cd7666f52fde9e13",
  "chain_type": "ETH",
  "compatible_chains": [
    "SETH",
    "BASE_ETH",
    "MATIC",
    "TBASE_SETH",
    "ETH",
    "ARBITRUM_ETH",
    "OPT_ETH",
    "BSC_BNB",
    "AVAXC",
    "HYPEREVM_HYPE"
  ]
}
```

## Demo-Relevant Chain

For the current x402 market-data demo, the relevant CAW address is the EVM address:

```text
0x8bf7aee000ccd484c7343346cd7666f52fde9e13
```

This address supports `BASE_ETH`, which is the target chain for the CMC/Exa x402 Base USDC demo.

## Do Not Store Here

Do not store:

- CAW API key;
- `.env` contents;
- private keys;
- owner pairing secrets;
- recovery material.
