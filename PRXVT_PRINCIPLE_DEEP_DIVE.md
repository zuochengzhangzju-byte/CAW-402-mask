# PRXVT / px402 principle deep dive

This document explains the private-payment mechanism we rely on. It is intentionally lower-level than the demo flow docs. The purpose is to avoid presenting PRXVT / px402 as a magic SDK box.

## Correct positioning

Our demo has three layers:

```text
x402
  paid HTTP access protocol: server returns 402, client retries with X-PAYMENT

PRXVT / px402
  private payment rail: USDC deposit -> private note -> ZK spend -> burner-funded x402 payment

Our adaptor
  agent integration: CLI, provider policy, request building, price checks, timing logs, receipts, recovery
```

The privacy-critical layer is PRXVT / px402. Our adaptor makes that layer usable for agent tool calls and records evidence.

## What actually happens

Based on the local `@prxvt/sdk` implementation used by `px402-spike`, the payment path is:

```text
1. Deposit USDC into PRXVT pool
2. Create local private note
3. Later, spend part of the note with a ZK proof
4. Withdraw the payment amount to a fresh burner wallet
5. Burner signs USDC transfer authorization to x402 merchant
6. Client retries paid HTTP request with X-PAYMENT
7. Remaining balance becomes a new local note
```

Important: the x402 provider does not receive the private note. The provider receives a normal x402-style payment authorization from the burner wallet.

## Deposit phase

The SDK supports fixed USDC denominations:

```text
0.01, 0.1, 1, 10, 100 USDC
```

Deposit creates a commitment:

```text
secret = random field element
nullifier = random field element
amount = USDC amount in micro units
commitment = Poseidon(secret, nullifier, amount)
```

Then the commitment is sent to the PRXVT pool contract. In the fast path, the SDK uses USDC ERC-3009 `receiveWithAuthorization`, so the depositor signs an EIP-712 authorization and submits one `depositWithAuthorization` transaction rather than doing `approve + deposit`.

Local note shape:

```json
{
  "version": "2.0",
  "commitments": [
    {
      "secret": "...",
      "nullifier": "...",
      "amount": 100000,
      "depositChain": "base"
    }
  ]
}
```

This note is sensitive. It is the local spend authority for the deposited commitment. In our adaptor, it is encrypted with `PX402_NOTE_PASSWORD` before storage.

## Merkle proof phase

To spend a note, the SDK must prove the commitment exists in the pool without revealing which one belongs to the payer.

The SDK:

1. recomputes the commitment hash from the note;
2. fetches pool commitments from the subgraph;
3. builds a Poseidon Merkle tree;
4. verifies the computed root against the on-chain root;
5. extracts the Merkle path for the commitment.

Conceptually:

```text
private input:
  secret, nullifier, amount, Merkle path

public input:
  Merkle root, nullifier hash, payment amount, change commitment

claim:
  I know an unspent commitment in this tree,
  and I am spending exactly paymentAmount while creating valid change,
  without revealing which deposit commitment is mine.
```

## ZK spend phase

When `sdk.makePayment(note, recipient, amount)` runs, it:

1. selects the first note commitment;
2. checks available balance;
3. computes `paymentAmount` and `changeAmount`;
4. creates a new random `secret/nullifier` pair for the change;
5. creates a `changeCommitment`;
6. creates a fresh burner wallet;
7. generates a Groth16 proof with `snarkjs`;
8. submits an ERC-4337 UserOperation through a bundler/paymaster path;
9. waits for the UserOperation receipt;
10. returns updated note state and burner private key.

The SDK loads circuit files from PRXVT-hosted URLs by default:

```text
https://circuits.prxvt.com/circuit_V16.wasm
https://circuits.prxvt.com/circuit_V16.zkey
```

This is operationally important. Our demo currently requires explicit acknowledgement for unpinned remote circuits before real spending.

## Burner wallet bridge to x402

The most important bridge detail:

```text
PRXVT / px402 private note spend
  -> withdraws payment amount to burner wallet
  -> burner wallet signs USDC TransferWithAuthorization
  -> x402 provider gets paid through normal x402 header
```

The SDK returns:

```text
txHash
nullifierHash
burnerAddress
burnerPrivateKey
updatedNote
```

The burner wallet is not the user's main wallet. It is an ephemeral wallet funded by the private-note spend.

The x402 retry uses an `X-PAYMENT` payload roughly shaped as:

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "base",
  "payload": {
    "signature": "...",
    "authorization": {
      "from": "burnerAddress",
      "to": "merchantPayTo",
      "value": "50000",
      "validAfter": "0",
      "validBefore": "...",
      "nonce": "..."
    }
  }
}
```

That is why the provider can remain an ordinary x402 merchant. It does not need to understand the user's private note.

## Updated note and nullifier

After a payment:

- the old commitment is spent;
- its nullifier prevents double-spend;
- the remaining balance is represented as a new change commitment;
- the local note is updated to contain only the change commitment.

If the payment spends the whole note, the updated note may have zero commitments.

Our adaptor must save the updated encrypted note. If it fails to save the note after a successful spend, the operator can lose clean local accounting of remaining balance.

## What privacy is gained

The mechanism reduces direct linkage:

```text
main/deposit wallet -> exact x402 merchant payment
```

becomes:

```text
deposit wallet -> PRXVT pool commitment
private note spend -> burner wallet -> x402 merchant
```

An observer may still see deposits, pool activity, burner funding/payment behavior, timing, amount, and merchant payee. The privacy claim should therefore be:

```text
PRXVT / px402 reduces direct payer-to-merchant linkage for x402 payments.
It does not make all metadata disappear.
```

## What our adaptor adds on top

Our code does not implement the ZK protocol. It orchestrates it safely for agent paid tools:

```text
Agent intent
  -> provider policy and request builder
  -> dry 402 probe
  -> price and budget check
  -> PRXVT / px402 note spend
  -> x402 paid retry
  -> receipt, response hash, run log, recovery
```

Concrete integration points:

- `@prxvt/sdk` is loaded from `px402-spike`;
- `depositFast(...)` creates/funds a note;
- `decryptNote(...)` and `encryptNote(...)` protect local note files;
- `getNoteBalance(...)` drives spend checks;
- `sdk.makePayment(...)` performs the private note spend;
- `sdk.getUpdatedNote()` provides the new local note state;
- our adaptor builds the provider-specific x402 retry and records logs.

## Failure cases to explain

The demo should explicitly show these because they are where the engineering matters:

| Failure | What happened | Required local artifact |
| --- | --- | --- |
| Missing `PX402_NOTE_PASSWORD` | note/recovery cannot be decrypted or encrypted | no spend |
| Remote circuit unavailable | proof cannot be generated | no spend or interrupted spend before proof |
| Payment succeeds, x402 retry fails | burner/payment happened but provider response not obtained | recovery + run log |
| Updated note write fails | spend may have occurred but local balance state is stale | recovery / receipt review |
| Provider accepts payment but response parse fails | paid API worked, adaptor failed after receipt | raw response or recovery context |

## Animation version

The animation should have two levels: protocol level and product level.

### Protocol level

```text
Deposit Wallet
  --USDC + commitment-->
PRXVT Pool
  --Merkle root / commitment set-->
ZK Proof Generator
  --UserOperation + proof-->
Bundler / Paymaster
  --withdraw-->
Burner Wallet
  --EIP-3009 authorization-->
x402 Merchant
```

Visual actions:

1. Deposit wallet drops USDC into a pool.
2. Pool emits many indistinguishable commitments.
3. One local note card stays with the user.
4. A ZK proof bubble says "valid member, unspent, amount split".
5. Burner wallet appears only after proof succeeds.
6. Burner signs x402 payment authorization.
7. Merchant receives ordinary x402 payment and returns data.
8. Change note returns to local vault.

### Product level

```text
Agent CLI
  -> Our Adaptor
  -> PRXVT / px402 Rail
  -> x402 Merchant
  -> Local Evidence Store
```

Visual actions:

1. Agent asks for Nansen holdings.
2. Adaptor checks policy and price.
3. Adaptor invokes PRXVT / px402 rail.
4. x402 retry happens.
5. Local evidence store receives receipt, response hash, updated note path, run log.

## Demo wording

Use this wording:

```text
We are not claiming to have built the cryptographic privacy rail.
The private payment primitive comes from PRXVT / px402.
Our contribution is adapting that rail into an agent commerce workflow:
provider selection, request construction, spend policy, x402 retry,
and auditable logs/recovery for real paid tool calls.
```

