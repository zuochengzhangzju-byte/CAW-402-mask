#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(rootDir, "..");
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const NANSEN = {
  netflow: {
    provider: "nansen_netflow",
    url: "https://api.nansen.ai/api/v1/smart-money/netflow",
    bodyFile: "assets/nansen-smart-money-netflow-request.json",
  },
  holdings: {
    provider: "nansen_holdings",
    url: "https://api.nansen.ai/api/v1/smart-money/holdings",
    bodyFile: "assets/nansen-smart-money-holdings-request.json",
  },
  "perp-trades": {
    provider: "nansen_perp_trades",
    url: "https://api.nansen.ai/api/v1/smart-money/perp-trades",
    bodyFile: "assets/nansen-smart-money-perp-trades-request.json",
  },
};

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      out._.push(item);
      continue;
    }
    const [rawKey, rawValue] = item.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (rawValue !== undefined) out[key] = rawValue;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) out[key] = argv[++i];
    else out[key] = true;
  }
  return out;
}

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (key) env[key] = value;
  }
  return env;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function appendJsonl(file, value) {
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toWslPath(windowsPath) {
  const resolved = path.resolve(windowsPath);
  const drive = resolved[0].toLowerCase();
  const rest = resolved.slice(2).replace(/\\/g, "/");
  return `/mnt/${drive}${rest}`;
}

function classifyOutput({ rail, exitCode, stdout = "", stderr = "" }) {
  const text = `${stdout}\n${stderr}`;
  if (exitCode === 124 && /Timed out waiting for WSL bridge job/i.test(text)) return "bridge_timeout";
  if (/PX402_NOTE_PASSWORD is required/i.test(text)) return "env_missing_note_password";
  if (/No pact id found/i.test(text)) return "pact_missing";
  if (/"code"\s*:\s*"TRANSFER_LIMIT_EXCEEDED"|matched_pact|exit_code=5|policy denial/i.test(text)) return "policy_denied";
  if (/"code"\s*:\s*"INSUFFICIENT_BALANCE"|exit_code=6|insufficient balance[^"]*$/im.test(text)) return "insufficient_balance";
  if (/available accepts/i.test(text)) return "dry_run_challenge_ok";
  if (/HTTP request failed|network error|fetch failed|context deadline exceeded|Client\.Timeout exceeded|lookup .* i\/o timeout|dial tcp/i.test(text)) return "network_error";
  if (/status[^0-9]{0,8}200|HTTP\/[0-9.]+\s+200/i.test(text)) return "success_200";
  if (exitCode === 0 && rail === "px402-private") return "completed";
  if (exitCode === 0) return "completed_unknown_status";
  return "failed";
}

function extractJsonObject(text) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function loadJsonFile(file) {
  if (!file || !fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function summarizeStageTiming(runLogPath) {
  const timing = {
    quoteOrProbe: null,
    policy: null,
    noteDepositOrLoad: null,
    payment: null,
    retryFetch: null,
    validation: null,
    receiptWrite: null,
  };
  if (!runLogPath || !fs.existsSync(runLogPath)) return timing;
  for (const line of fs.readFileSync(runLogPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.event !== "stage_end") continue;
    const ms = Number(row.elapsedMs || 0);
    if (row.stage === "probe_payment" || row.stage === "nansen_initial_probe") timing.quoteOrProbe = (timing.quoteOrProbe || 0) + ms;
    if (String(row.stage || "").startsWith("policy_") || row.stage === "budget_check") timing.policy = (timing.policy || 0) + ms;
    if (row.stage === "read_latest_note" || row.stage === "ensure_note_balance" || row.stage === "ensure_dust_eth") timing.noteDepositOrLoad = (timing.noteDepositOrLoad || 0) + ms;
    if (row.stage === "private_note_make_payment") timing.payment = (timing.payment || 0) + ms;
    if (row.stage === "retry_fetch_with_payment") timing.retryFetch = (timing.retryFetch || 0) + ms;
    if (row.stage === "write_response_body") timing.validation = (timing.validation || 0) + ms;
    if (row.stage === "write_receipt") timing.receiptWrite = (timing.receiptWrite || 0) + ms;
  }
  return timing;
}

function schemaLooksUsable(body) {
  if (!body || typeof body !== "object") return false;
  if (Array.isArray(body)) return body.length > 0;
  const text = JSON.stringify(body).toLowerCase();
  return ["token", "asset", "symbol", "chain", "wallet", "address", "net_flow", "position", "trade", "timestamp", "data", "result"].some((key) => text.includes(key));
}

function buildIntegrity({ selected, parsedStdout, childReceipt, responseBody, stdout, stderr }) {
  const responseHash = childReceipt?.responseHash || (responseBody ? sha256(JSON.stringify(responseBody)) : null);
  return {
    requestHash: sha256(JSON.stringify({ url: selected.url, bodyFile: selected.bodyFile })),
    responseHash,
    responseHashMatches: childReceipt?.responseHash && responseBody ? childReceipt.responseHash === sha256(JSON.stringify(responseBody)) : null,
    schemaPass: schemaLooksUsable(responseBody || parsedStdout?.result || parsedStdout),
    stdoutHash: sha256(stdout || ""),
    stderrHash: sha256(stderr || ""),
  };
}

function runChild(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: rootDir,
      env: { ...process.env, ...options.env },
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr, elapsedMs: Date.now() - startedAt });
    });
  });
}

async function runPx402({ dataset, dryRun, maxUsdPerCall }) {
  const args = ["./bin/privacy-adapter.js", "nansen", "--dataset", dataset];
  if (dryRun) args.push("--dry-run");
  const env = loadDotEnv(path.join(rootDir, ".env"));
  if (dryRun && !env.PX402_NOTE_PASSWORD && !process.env.PX402_NOTE_PASSWORD) {
    env.PX402_NOTE_PASSWORD = "rail-dry-run-placeholder";
  }
  return runChild(process.execPath, args, {
    env: { ...env, ...(maxUsdPerCall ? { MAX_USD_PER_CALL: String(maxUsdPerCall) } : {}) },
  });
}

function bridgeDirs() {
  const bridgeDir = path.join(rootDir, "caw-bridge");
  return {
    bridgeDir,
    inbox: path.join(bridgeDir, "inbox"),
    done: path.join(bridgeDir, "done"),
    logs: path.join(bridgeDir, "logs"),
  };
}

function latestDoneForJob(doneDir, jobName, sinceMs) {
  if (!fs.existsSync(doneDir)) return null;
  return fs.readdirSync(doneDir)
    .filter((name) => name.endsWith(`-${jobName}.done`))
    .map((name) => {
      const file = path.join(doneDir, name);
      const stat = fs.statSync(file);
      return { file, name, mtimeMs: stat.mtimeMs };
    })
    .filter((item) => item.mtimeMs >= sinceMs)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null;
}

function parseDoneMarker(file) {
  const marker = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const idx = line.indexOf("=");
    if (idx > 0) marker[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return marker;
}

async function runCaw({ dataset, dryRun, timeoutMs, pactId, maxAmount, cawTimeout }) {
  const selected = NANSEN[dataset];
  const dirs = bridgeDirs();
  ensureDir(dirs.inbox);
  ensureDir(dirs.done);
  ensureDir(dirs.logs);

  const jobName = `rail-caw-nansen-${dataset}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const jobPath = path.join(dirs.inbox, `${jobName}.sh`);
  const tmpJobPath = path.join(dirs.inbox, `${jobName}.tmp`);
  const rootWsl = toWslPath(workspaceRoot);
  const dryRunFlag = dryRun ? " --dry-run" : "";
  const pactLine = pactId
    ? `PACT_ID=${JSON.stringify(pactId)}`
    : `PACT_ID="$(cat hackathon/caw-evidence-redacted/pact-id.txt 2>/dev/null || cat hackathon/caw-evidence/pact-id.txt 2>/dev/null || true)"`;
  const script = `#!/usr/bin/env bash
set -u
cd ${JSON.stringify(rootWsl)} || exit 1
export PATH="$HOME/.cobo-agentic-wallet/bin:$HOME/.local/bin:$PATH"
${pactLine}
if [ -z "$PACT_ID" ]; then
  echo "No pact id found"
  exit 2
fi
echo "rail=caw-native"
echo "dataset=${dataset}"
echo "url=${selected.url}"
caw fetch "$PACT_ID" ${JSON.stringify(selected.url)} \\
  --timeout ${cawTimeout} \\
  --protocol x402 \\
  --network eip155:8453 \\
  --asset ${BASE_USDC} \\
  --max-amount ${maxAmount} \\
  --json "$(cat hackathon/${selected.bodyFile})" \\
  --output full${dryRunFlag}
`;
  fs.writeFileSync(tmpJobPath, script.replace(/\r\n/g, "\n"));
  fs.renameSync(tmpJobPath, jobPath);
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const done = latestDoneForJob(dirs.done, jobName, startedAt);
    if (done) {
      const marker = parseDoneMarker(done.file);
      const logPath = marker.log ? marker.log.replace(rootWsl, workspaceRoot).replace(/\//g, path.sep) : null;
      const stdout = logPath && fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "";
      return {
        exitCode: Number(marker.exit_code || 1),
        stdout,
        stderr: "",
        elapsedMs: Date.now() - startedAt,
        bridgeLogPath: logPath,
        doneMarkerPath: done.file,
      };
    }
    await sleep(500);
  }
  return {
    exitCode: 124,
    stdout: "",
    stderr: `Timed out waiting for WSL bridge job ${jobName}. Is hackathon/caw-wsl-bridge.sh running in WSL?`,
    elapsedMs: Date.now() - startedAt,
    bridgeJobPath: jobPath,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rail = String(args.rail || "px402-private");
  const dataset = String(args.dataset || "netflow");
  const dryRun = Boolean(args.dryRun);
  const selected = NANSEN[dataset];
  if (!selected) throw new Error(`Unknown dataset ${dataset}. Use netflow, holdings, or perp-trades.`);
  if (!["px402-private", "caw-native"].includes(rail)) throw new Error("Use --rail px402-private or --rail caw-native.");

  const runId = `${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").slice(0, 16)}-${rail}-${dataset}`;
  const outputDir = path.join(rootDir, "data", "rail-runs");
  const startedAt = new Date().toISOString();
  const maxAmount = String(args.maxAmount || "60000");
  const maxUsdPerCall = args.maxUsdPerCall || "0.06";

  const result = rail === "px402-private"
    ? await runPx402({ dataset, dryRun, maxUsdPerCall })
    : await runCaw({
        dataset,
        dryRun,
        pactId: args.pactId,
        maxAmount,
        cawTimeout: String(args.cawTimeout || "90"),
        timeoutMs: Number(args.timeoutMs || 180_000),
      });

  const parsedStdout = extractJsonObject(result.stdout);
  let classification = classifyOutput({ rail, ...result });
  if (dryRun && parsedStdout?.result?.dryRun && parsedStdout?.result?.priceUsdc) {
    classification = "dry_run_challenge_ok";
  }
  const childResult = parsedStdout?.result || null;
  const childReceiptPath = childResult?.receiptPath || parsedStdout?.receiptPath || null;
  const childResponsePath = childResult?.responsePath || parsedStdout?.responsePath || null;
  const childRunLogPath = parsedStdout?.runLogPath || childResult?.runLogPath || null;
  const childReceipt = loadJsonFile(childReceiptPath);
  const responseBody = loadJsonFile(childResponsePath);
  const success = classification === "success_200"
    || classification === "dry_run_challenge_ok"
    || (Number(childResult?.status || childReceipt?.status || 0) >= 200 && Number(childResult?.status || childReceipt?.status || 0) < 300);
  const errorStageByClassification = {
    bridge_timeout: "caw_bridge",
    pact_missing: "pact_resolution",
    policy_denied: "policy",
    insufficient_balance: "funding",
    env_missing_note_password: "configuration",
    network_error: "network",
    failed: "unknown",
  };
  const stageTiming = summarizeStageTiming(childRunLogPath);
  const integrity = buildIntegrity({
    selected,
    parsedStdout,
    childReceipt,
    responseBody,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  if (!success) integrity.schemaPass = false;
  const receipt = {
    runId,
    mode: rail === "px402-private" ? "adapter" : "caw_native",
    scenario: dryRun ? "dry_run_quote" : "happy_path",
    createdAt: new Date().toISOString(),
    startedAt,
    rail,
    privacyPosture: rail === "px402-private"
      ? "privacy-adapter disposable payer"
      : "CAW-native payment, no payment privacy layer",
    dataset,
    provider: selected.provider,
    resource: selected.url,
    url: selected.url,
    requestBodyFile: selected.bodyFile,
    dryRun,
    status: childResult?.status || childReceipt?.status || null,
    success,
    errorStage: success ? null : (errorStageByClassification[classification] || "unknown"),
    priceLimit: {
      maxAmountMicroUsdc: maxAmount,
      maxUsdPerCall,
    },
    priceUsdc: childResult?.priceUsdc || childReceipt?.priceUsdc || null,
    exitCode: result.exitCode,
    classification,
    timingMs: {
      total: result.elapsedMs,
      quoteOrProbe: stageTiming.quoteOrProbe,
      policy: stageTiming.policy,
      noteDepositOrLoad: stageTiming.noteDepositOrLoad,
      payment: stageTiming.payment,
      retryFetch: stageTiming.retryFetch,
      validation: stageTiming.validation,
      receiptWrite: stageTiming.receiptWrite,
    },
    payment: {
      network: childResult?.network || childReceipt?.network || "eip155:8453",
      asset: childReceipt?.asset || BASE_USDC,
      assetSymbol: "USDC",
      payer: childReceipt?.payer || (rail === "caw-native" ? "CAW wallet" : null),
      payTo: childResult?.payTo || childReceipt?.payTo || null,
      paymentTx: childReceipt?.paymentTx || null,
      paymentResponseSuccess: childReceipt?.paymentResponse ? true : null,
    },
    integrity,
    idempotency: {
      requestId: args.requestId || runId,
      duplicatePayment: null,
      recoveredFunds: false,
      recoveryPath: childReceipt?.recoveryPath || null,
    },
    artifacts: {
      bridgeLogPath: result.bridgeLogPath || null,
      doneMarkerPath: result.doneMarkerPath || null,
      childRunLogPath,
      parsedStdoutReceiptPath: childReceiptPath,
      parsedStdoutResponsePath: childResponsePath,
    },
    parsedStdout,
    stdoutPreview: String(result.stdout || "").slice(0, 2000),
    stderrPreview: String(result.stderr || "").slice(0, 2000),
  };
  const receiptPath = path.join(outputDir, `${runId}.json`);
  writeJson(receiptPath, receipt);
  appendJsonl(path.join(rootDir, "data", "eval", "runs.jsonl"), {
    runId: receipt.runId,
    mode: receipt.mode,
    scenario: receipt.scenario,
    provider: receipt.provider,
    resource: receipt.resource,
    priceUsdc: receipt.priceUsdc,
    status: receipt.status,
    success: receipt.success,
    errorStage: receipt.errorStage,
    classification: receipt.classification,
    timingMs: receipt.timingMs,
    payment: receipt.payment,
    integrity: receipt.integrity,
    idempotency: receipt.idempotency,
    receiptPath,
  });
  console.log(JSON.stringify({
    action: "nansen_rail_run",
    runId,
    rail,
    dataset,
    dryRun,
    exitCode: result.exitCode,
    classification,
    elapsedMs: result.elapsedMs,
    receiptPath,
    bridgeLogPath: result.bridgeLogPath || null,
  }, null, 2));
  process.exit(result.exitCode === 0 || classification === "dry_run_challenge_ok" ? 0 : 1);
}

main().catch((error) => {
  console.error(JSON.stringify({ action: "error", message: error.message }, null, 2));
  process.exit(1);
});
