import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spikeRequire = createRequire(new URL("../px402-spike/package.json", import.meta.url));

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const DEFAULT_CAW_EVM = "0x8bf7aee000ccd484c7343346cd7666f52fde9e13";

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function arg(name, fallback = undefined) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function normalizePrivateKey(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("PRIVATE_KEY or PX402_PRIVATE_KEY is required.");
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

function roundTripPrintable(value) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 12 });
}

loadDotEnv(path.join(rootDir, ".env"));

const execute = process.argv.includes("--execute");
const to = arg("to", process.env.CAW_EVM_ADDRESS || DEFAULT_CAW_EVM);
const usdcAmount = arg("usdc", process.env.CAW_FUND_USDC || "0.12");
const ethAmount = arg("eth", process.env.CAW_FUND_ETH || "0.00003");
const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";

const { createPublicClient, createWalletClient, http, parseEther, parseUnits, formatEther, formatUnits, erc20Abi } = spikeRequire("viem");
const { privateKeyToAccount } = spikeRequire("viem/accounts");
const { base } = spikeRequire("viem/chains");

const account = privateKeyToAccount(normalizePrivateKey(process.env.PRIVATE_KEY || process.env.PX402_PRIVATE_KEY));
const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain: base, transport: http(rpcUrl) });

const usdcMicro = parseUnits(usdcAmount, 6);
const ethWei = parseEther(ethAmount);

const [sourceEth, sourceUsdc, targetEth, targetUsdc] = await Promise.all([
  publicClient.getBalance({ address: account.address }),
  publicClient.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }),
  publicClient.getBalance({ address: to }),
  publicClient.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: "balanceOf", args: [to] }),
]);

const result = {
  action: execute ? "fund_caw_base_execute" : "fund_caw_base_dry_run",
  network: "base",
  from: account.address,
  to,
  planned: {
    usdc: roundTripPrintable(usdcAmount),
    eth: roundTripPrintable(ethAmount),
  },
  before: {
    source: {
      baseEth: formatEther(sourceEth),
      baseUsdc: formatUnits(sourceUsdc, 6),
    },
    caw: {
      baseEth: formatEther(targetEth),
      baseUsdc: formatUnits(targetUsdc, 6),
    },
  },
};

if (sourceUsdc < usdcMicro) {
  throw new Error(`Insufficient source USDC: have ${formatUnits(sourceUsdc, 6)}, need ${usdcAmount}.`);
}
if (sourceEth < ethWei) {
  throw new Error(`Insufficient source ETH: have ${formatEther(sourceEth)}, need ${ethAmount}.`);
}

if (!execute) {
  console.log(JSON.stringify({ ...result, executeHint: "Re-run with --execute to broadcast." }, null, 2));
  process.exit(0);
}

const txs = [];
if (usdcMicro > 0n) {
  const hash = await walletClient.writeContract({
    address: BASE_USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, usdcMicro],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  txs.push({ kind: "USDC", hash, status: receipt.status });
}
if (ethWei > 0n) {
  const hash = await walletClient.sendTransaction({ to, value: ethWei });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  txs.push({ kind: "ETH", hash, status: receipt.status });
}

const [afterSourceEth, afterSourceUsdc, afterTargetEth, afterTargetUsdc] = await Promise.all([
  publicClient.getBalance({ address: account.address }),
  publicClient.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }),
  publicClient.getBalance({ address: to }),
  publicClient.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: "balanceOf", args: [to] }),
]);

console.log(JSON.stringify({
  ...result,
  txs,
  after: {
    source: {
      baseEth: formatEther(afterSourceEth),
      baseUsdc: formatUnits(afterSourceUsdc, 6),
    },
    caw: {
      baseEth: formatEther(afterTargetEth),
      baseUsdc: formatUnits(afterTargetUsdc, 6),
    },
  },
}, null, 2));
