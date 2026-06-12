# Cobo Agentic Wallet Track Fit

## Verdict

The project is directionally aligned with the Cobo Agentic Wallet track, but the current demo must be adapted so the agent's fund execution goes through Cobo Agentic Wallet.

Current positioning:

```text
privacy-aware x402 payment adapter for sensitive agent workflows
```

Track-compliant positioning:

```text
a CAW-governed trade research agent that buys x402 market-data services under a Pact,
with receipts, spend limits, and a future privacy adapter for reducing payment-linkage leakage.
```

## Fit Against Rules

### Project must center on agent + funds operation

Fit: yes.

The demo already centers on an agent buying paid x402 services with USDC.

### Fund operations must use Cobo Agentic Wallet

Current fit: partial / not yet.

The current implementation uses a disposable wallet, px402/private notes, and custom x402 v2 payment handling. For this track, the actual payment/transfer/signing path should be routed through CAW or a CAW Pact.

### Agent must have real fund execution ability

Fit: yes if CAW is integrated.

The agent can pay CMC and Exa x402 endpoints. To be track-compliant, those payments should be executed by CAW, not only by a local private key.

### Must show CAW value in wallet management, permissions, isolation, or autonomous payment

Fit: strong if reframed.

Best CAW value angle:

- Pact limits spending for market research.
- Policy restricts chain, token, max amount, destination, and x402 endpoint category.
- CAW gives audit logs for every paid research action.
- Agent never receives raw private keys.
- Owner can revoke or pause the research agent.

### Must be runnable demo, not concept only

Fit: yes if the CAW payment path works live or in a clear recorded run.

## Recommended Demo Adjustment

Keep the existing CMC + Exa trade research story, but replace the wallet execution layer:

```text
trade research agent
  -> policy checks research budget
  -> CAW Pact authorizes x402 payments on Base
  -> CAW executes the payment/signing operation
  -> x402 endpoint returns paid market data/search evidence
  -> local signal + receipt + CAW audit log
```

## What To Avoid

- Do not submit as a pure privacy-wallet adapter without CAW execution.
- Do not keep local private-key payment as the main fund path.
- Do not present privacy as bypassing CAW controls.
- Do not claim CAW provides shielded payment privacy unless actually implemented.

## Strong Track Narrative

```text
CAW solves agent fund authority: who can spend, how much, where, and under what rules.
Our adapter solves sensitive paid-research workflow UX: the agent buys x402 data,
records evidence, and prepares a privacy extension for future unlinkable payment rails.
```

## MVP Requirement For Submission

Minimum acceptable CAW integration:

- create or pair a CAW wallet;
- submit/approve a Pact for x402 market research;
- execute at least one real x402 payment through CAW;
- show CAW policy/audit record;
- produce the existing receipt/market-signal artifact.

## Optional Stronger Demo

Show one denied action:

```text
agent attempts x402 payment above research budget
  -> CAW policy blocks or escalates approval
```

This directly demonstrates CAW's value and fits the track better than privacy alone.
