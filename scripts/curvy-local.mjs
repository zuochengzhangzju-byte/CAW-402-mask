import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { input, select } from "@inquirer/prompts";

const walletPath = path.resolve(".curvy", "wallet.json");
const env = process.env.CURVY_ENV || "testnet";
const command = process.argv[2];
let curvyLib;

async function getCurvyLib() {
  if (!curvyLib) {
    curvyLib = await import("@0xcurvy/curvy-mcp/lib");
  }
  return curvyLib;
}

function walletExists() {
  return fs.existsSync(walletPath);
}

async function ensureWallet() {
  if (walletExists()) return;
  console.log(`No local Curvy wallet found at ${walletPath}. Starting onboarding.`);
  const { runAuthFlow } = await getCurvyLib();
  await runAuthFlow(walletPath);
}

async function loadSdk() {
  await ensureWallet();
  const { initSDK } = await getCurvyLib();
  const wallet = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  return initSDK(env, wallet.signature);
}

async function onboard() {
  if (walletExists()) {
    console.log(`Local Curvy wallet already exists at ${walletPath}`);
    console.log("Move or delete it manually if you intentionally want to replace it.");
    return;
  }
  const { runAuthFlow } = await getCurvyLib();
  await runAuthFlow(walletPath);
  console.log(`Onboarding complete. Local wallet saved at ${walletPath}`);
}

async function info() {
  const sdk = await loadSdk();
  const { tools } = await getCurvyLib();
  const tool = tools(sdk).find((item) => item.getName() === "curvy-get-supported-networks");
  const result = await tool.execute({});
  for (const content of result.content) console.log(content.text);
}

async function balance() {
  const sdk = await loadSdk();
  const { tools } = await getCurvyLib();
  const tool = tools(sdk).find((item) => item.getName() === "curvy-get-balances");
  const result = await tool.execute({});
  for (const content of result.content) console.log(content.text);
}

async function withdraw() {
  const sdk = await loadSdk();
  const { tools } = await getCurvyLib();
  const destinationAddress = await input({ message: "Destination 0x address:" });
  const networkId = await select({
    message: "Network:",
    choices: sdk.activeNetworks.map((network) => ({ name: `${network.name} (${network.id})`, value: network.id })),
  });
  const network = sdk.getNetwork(networkId);
  const currencySymbol = await select({
    message: "Currency:",
    choices: network.currencies.map((currency) => ({ name: currency.symbol, value: currency.symbol })),
  });
  const amount = await input({ message: "Amount, e.g. 0.05:" });
  const tool = tools(sdk).find((item) => item.getName() === "curvy-withdraw-funds");
  const result = await tool.execute({ destinationAddress, networkId, currencySymbol, amount });
  for (const content of result.content) console.log(content.text);
}

switch (command) {
  case "onboard":
    await onboard();
    break;
  case "info":
    await info();
    break;
  case "balance":
    await balance();
    break;
  case "withdraw":
    await withdraw();
    break;
  default:
    console.log(`Usage: node scripts/curvy-local.mjs <onboard|info|balance|withdraw>

Wallet path: ${walletPath}
CURVY_ENV: ${env}`);
}
