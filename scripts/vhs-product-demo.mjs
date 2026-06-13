const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fast = process.argv.includes("--fast");
const lineDelay = fast ? 0 : 170;
const blockDelay = fast ? 0 : 650;

async function print(text = "") {
  process.stdout.write(`${text}\n`);
  if (lineDelay) await sleep(lineDelay);
}

async function block(lines) {
  for (const line of lines) {
    await print(line);
  }
  if (blockDelay) await sleep(blockDelay);
}

async function command(commandLine) {
  await print("");
  await print(`agent$ ${commandLine}`);
  if (!fast) await sleep(520);
}

await block([
  "+------------------------------------------------------------------------------------------+",
  "| CAW-402 MASK: PRODUCTION PRINCIPLE                                                       |",
  "| Small CAW-authorized budgets are working capital for agent purchases.                    |",
  "| Spend privately on allowed x402 services, or hold residual funds in the note.            |",
  "+------------------------------------------------------------------------------------------+",
  "SIMULATED PRODUCT VIDEO: no real key, no signing, no payment broadcast.",
]);

await command("cat .env.agent.example");
await block([
  "PRIVATE_KEY=0x...low_value_disposable_base_wallet",
  "X402_CHAIN=base",
  "BASE_RPC_URL=https://mainnet.base.org",
  "MAX_USD_PER_CALL=0.06",
  "MONTHLY_BUDGET_USD=20",
  "PX402_NOTE_SECRET_FILE=./data/secrets/px402-note-password.json",
]);

await command("npm run privacy -- secrets:init");
await block([
  "{",
  '  "action": "secrets_init",',
  '  "notePasswordSource": "local_secret_vault",',
  '  "noteSecretPath": "./data/secrets/px402-note-password.json",',
  '  "passwordPrinted": false',
  "}",
]);

await command("npm run privacy -- doctor");
await block([
  "{",
  '  "wallet": "0x...disposable",',
  '  "maxUsdPerCall": 0.06,',
  '  "monthlyBudgetUsd": 20,',
  '  "monthlySpentUsd": 0,',
  '  "latestNoteBalanceUsdc": 0',
  "}",
]);

await command("npm run demo:nansen -- --dataset netflow --dry-run");
await block([
  "{",
  '  "provider": "nansen_netflow",',
  '  "priceUsdc": 0.05,',
  '  "network": "eip155:8453",',
  '  "resource": "https://api.nansen.ai/api/v1/smart-money/netflow",',
  '  "rail": "px402_private_note -> disposable payer -> x402"',
  "}",
]);

await command("npm run privacy -- return:caw");
await block([
  "{",
  '  "warning": "PUBLIC_RETURN_LINK",',
  '  "message": "Returning funds to CAW is reconciliation, not the privacy default.",',
  '  "requiredAckFlag": "--ack-return-link"',
  "}",
]);

await block([
  "",
  "Result: one local CLI gives the agent governed budget, paid x402 access,",
  "receipt/audit trails, and explicit privacy warnings before treasury return.",
]);
