import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

const demoEnv = {
  ...process.env,
  // Public demo-only key. It is intentionally unfunded and used only for dry-run recording.
  PRIVATE_KEY: "0x0000000000000000000000000000000000000000000000000000000000000001",
  X402_CHAIN: "base",
  BASE_RPC_URL: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  MAX_USD_PER_CALL: "0.06",
  MONTHLY_BUDGET_USD: "20",
  NOTE_DIR: "./data/recording-notes",
  RECEIPT_DIR: "./data/recording-receipts",
  RESPONSE_DIR: "./data/recording-responses",
  RECOVERY_DIR: "./data/recording-recovery",
  RUN_LOG_DIR: "./data/recording-run-logs",
  PX402_NOTE_SECRET_FILE: "./data/recording-secrets/px402-note-password.json",
};

delete demoEnv.PX402_NOTE_PASSWORD;

const steps = [
  {
    title: "Agent creates or opens the local note secret vault",
    args: ["./bin/privacy-adapter.js", "secrets:init", "--note-dir", "data/recording-notes"],
  },
  {
    title: "Agent checks local wallet, note state, policy, and budget",
    args: ["./bin/privacy-adapter.js", "doctor"],
  },
  {
    title: "Agent asks Nansen for the x402 price without spending",
    args: ["./bin/privacy-adapter.js", "nansen", "--dataset", "netflow", "--dry-run"],
  },
  {
    title: "Agent asks whether funds should be returned to CAW",
    args: ["./bin/privacy-adapter.js", "return:caw"],
  },
];

function runStep(step, index) {
  return new Promise((resolve, reject) => {
    console.log("");
    console.log(`=== Step ${index + 1}: ${step.title} ===`);
    console.log(`agent$ node ${step.args.join(" ")}`);
    const child = spawn(process.execPath, step.args, {
      cwd: rootDir,
      env: demoEnv,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`step ${index + 1} exited with code ${code}`));
    });
  });
}

console.log("CAW-402 Mask agent recording demo");
console.log("Mode: dry-run only; no signing, no spending, no real private key.");
console.log(`Platform: ${isWin ? "Windows" : process.platform}`);

for (let index = 0; index < steps.length; index += 1) {
  await runStep(steps[index], index);
}

console.log("");
console.log("Demo complete. For the real-spend version, replace the demo key with a funded low-value wallet and remove --dry-run only after reviewing SECURITY_REVIEW.md.");
