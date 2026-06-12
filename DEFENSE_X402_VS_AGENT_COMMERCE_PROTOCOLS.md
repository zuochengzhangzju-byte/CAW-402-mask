# Defense: Why x402 Instead of ERC-8004, NEAR Agent Market, or Virtuals ACP?

## Short Answer

x402 is chosen because the demo targets paid tool access, not full task contracting.

```text
x402: pay to access a resource/API/tool over HTTP
ERC-8004: agent identity, reputation, and validation registries
NEAR Agent Market: agent task marketplace / hiring model
Virtuals ACP: multi-step agent commerce with escrow and job lifecycle
```

These are adjacent layers, not mutually exclusive replacements.

## Layering

```text
Agent identity / reputation:
  ERC-8004

Task negotiation / escrow / delivery lifecycle:
  Virtuals ACP, NEAR Agent Market, other agent markets

Payment execution / resource access:
  x402

Agent-side policy, receipt, validation, privacy adapter:
  this project
```

## Why x402 for the Demo

- It is the smallest useful unit of agent commerce.
- It maps naturally to HTTP APIs, MCP tools, and paid resources.
- It has concrete public ecosystems such as Bazaar, APIHub, 402.rest, and Cloudflare/AWS integrations.
- It keeps the MVP focused: request, quote, pay, retry, result, receipt.
- Privacy leakage in x402 payments is directly relevant to sensitive agent workflows such as trading and research.

## When Other Protocols Are Better

Use ERC-8004 when the main problem is:

- agent identity;
- portable reputation;
- validation records;
- trust discovery before transacting.

Use NEAR Agent Market / Virtuals ACP when the main problem is:

- multi-step jobs;
- escrow;
- buyer/seller negotiation;
- deliverable disputes;
- long-running task fulfillment;
- agent-to-agent work contracts.

Use x402 when the main problem is:

- one-shot paid access;
- API/tool/content payment;
- low-value machine-readable calls;
- minimal account setup;
- HTTP-native paid resources.

## How To Answer in a Demo

> We are not claiming x402 replaces ERC-8004, NEAR Agent Market, or ACP. We start with x402 because our demo is about paid tool calls, where the primitive is request, price, payment, result. If the ecosystem moves toward ERC-8004 identities or ACP escrow, our module can sit under those layers as the payment/privacy adapter.

## Product Implication

The project should remain adapter-oriented:

```text
ACP / NEAR task market / ERC-8004 agent
  -> wants to buy a paid resource
  -> calls our x402 payment module
  -> optional privacy funding adapter
  -> receipt and validation log
```

This makes the project complementary to agent commerce protocols rather than a competitor.
