import "dotenv/config";
import { Agent, setGlobalDispatcher } from "undici";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { base } from "viem/chains";

setGlobalDispatcher(new Agent({
  connect: {
    timeout: 60_000,
  },
  headersTimeout: 120_000,
  bodyTimeout: 300_000,
}));

const apiKey = process.env.ZEROX_API_KEY || process.env["0X_API_KEY"];
const privateKey = process.env.PRIVATE_KEY || process.env.PX402_PRIVATE_KEY;

if (!apiKey) {
  throw new Error("ZEROX_API_KEY or 0X_API_KEY is required in environment.");
}

if (!privateKey) {
  throw new Error("PRIVATE_KEY or PX402_PRIVATE_KEY is required in environment.");
}

const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

const chainId = process.env.ZEROX_CHAIN_ID || "8453";
const usdcBase = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const nativeToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const wethBase = "0x4200000000000000000000000000000000000006";

const sellToken = process.env.ZEROX_SELL_TOKEN || usdcBase;
const buyToken = process.env.ZEROX_BUY_TOKEN || nativeToken;
const sellAmount = process.env.ZEROX_SELL_AMOUNT || "100000"; // 0.1 USDC

const url = new URL("https://api.0x.org/gasless/quote");
url.searchParams.set("chainId", chainId);
url.searchParams.set("sellToken", sellToken);
url.searchParams.set("buyToken", buyToken);
url.searchParams.set("sellAmount", sellAmount);
url.searchParams.set("taker", account.address);

const headers = {
  "0x-api-key": apiKey,
  "0x-version": "v2",
  "Content-Type": "application/json",
};

const response = await fetch(url, {
  headers: {
    "0x-api-key": headers["0x-api-key"],
    "0x-version": headers["0x-version"],
  },
});

const bodyText = await response.text();
let body;
try {
  body = JSON.parse(bodyText);
} catch {
  body = { raw: bodyText };
}

const summarize = (quote) => ({
  status: response.status,
  ok: response.ok,
  taker: account.address,
  chainId,
  sellToken,
  buyToken,
  sellAmount,
  liquidityAvailable: quote.liquidityAvailable,
  blockNumber: quote.blockNumber,
  buyAmount: quote.buyAmount,
  minBuyAmount: quote.minBuyAmount,
  totalNetworkFee: quote.totalNetworkFee,
  approvalType: quote.approval?.type || null,
  approvalSignable: Boolean(quote.approval?.eip712),
  tradeSignable: Boolean(quote.trade?.eip712),
  tradeHashPresent: Boolean(quote.trade?.hash),
  issues: quote.issues || null,
  fees: quote.fees || null,
  errorCode: quote.code || quote.validationErrors?.[0]?.code || null,
  errorReason: quote.reason || quote.message || quote.validationErrors?.[0]?.reason || null,
  note: buyToken === nativeToken
    ? "native ETH requested; if unsupported or unsuitable, retry with ZEROX_BUY_TOKEN set to Base WETH"
    : buyToken.toLowerCase() === wethBase.toLowerCase()
      ? "Base WETH requested"
      : null,
});

console.log(JSON.stringify(summarize(body), null, 2));

if (!response.ok) {
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

if (process.env.ZEROX_EXECUTE !== "1") {
  process.exit(0);
}

function splitSignature(signature) {
  const hex = signature.startsWith("0x") ? signature.slice(2) : signature;
  const r = `0x${hex.slice(0, 64)}`;
  const s = `0x${hex.slice(64, 128)}`;
  const v = Number.parseInt(hex.slice(128, 130), 16);
  return { r, s, v, signatureType: 2 };
}

async function signTyped(eip712) {
  const types = { ...eip712.types };
  delete types.EIP712Domain;
  return walletClient.signTypedData({
    domain: eip712.domain,
    types,
    primaryType: eip712.primaryType,
    message: eip712.message,
  });
}

if (body.issues?.balance) {
  throw new Error(`0x quote reports insufficient balance: ${JSON.stringify(body.issues.balance)}`);
}

if (body.issues?.allowance && !body.approval?.eip712) {
  throw new Error("0x quote requires allowance, but no gasless approval object was returned.");
}

let approval = null;
if (body.issues?.allowance && body.approval?.eip712) {
  const approvalSignature = await signTyped(body.approval.eip712);
  approval = {
    type: body.approval.type,
    eip712: body.approval.eip712,
    signature: splitSignature(approvalSignature),
  };
}

const tradeSignature = await signTyped(body.trade.eip712);
const trade = {
  type: body.trade.type,
  eip712: body.trade.eip712,
  signature: splitSignature(tradeSignature),
};

const submitBody = {
  chainId: Number(chainId),
  trade,
};

if (approval) {
  submitBody.approval = approval;
}

const submitResponse = await fetch("https://api.0x.org/gasless/submit", {
  method: "POST",
  headers,
  body: JSON.stringify(submitBody),
});

const submitText = await submitResponse.text();
let submit;
try {
  submit = JSON.parse(submitText);
} catch {
  submit = { raw: submitText };
}

console.log(JSON.stringify({
  action: "zerox_gasless_submit",
  status: submitResponse.status,
  ok: submitResponse.ok,
  tradeHash: submit.tradeHash || null,
  errorCode: submit.code || null,
  errorReason: submit.reason || submit.message || null,
}, null, 2));

if (!submitResponse.ok || !submit.tradeHash) {
  console.error(JSON.stringify(submit, null, 2));
  process.exit(1);
}

for (let i = 0; i < 20; i += 1) {
  await new Promise((resolve) => setTimeout(resolve, 3_000));
  const statusUrl = new URL(`https://api.0x.org/gasless/status/${submit.tradeHash}`);
  statusUrl.searchParams.set("chainId", chainId);
  const statusResponse = await fetch(statusUrl, {
    headers: {
      "0x-api-key": headers["0x-api-key"],
      "0x-version": headers["0x-version"],
    },
  });
  const status = await statusResponse.json();
  console.log(JSON.stringify({
    action: "zerox_gasless_status",
    poll: i + 1,
    status: status.status,
    transactionHash: status.transactionHash || status.transactions?.[0]?.hash || null,
  }, null, 2));

  if (["confirmed", "failed", "cancelled"].includes(status.status)) {
    break;
  }
}
