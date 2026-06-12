import "dotenv/config";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { getChainConfig } from "@prxvt/sdk";

const privateKey = process.env.PRIVATE_KEY || process.env.PX402_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY or PX402_PRIVATE_KEY is required in environment.");
}

const config = getChainConfig("base");
const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
const client = createPublicClient({
  chain: base,
  transport: http(config.rpcUrl),
});

const [ethBalance, usdcBalance] = await Promise.all([
  client.getBalance({ address: account.address }),
  client.readContract({
    address: config.usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  }),
]);

console.log(JSON.stringify({
  address: account.address,
  baseEth: formatUnits(ethBalance, 18),
  baseUsdc: formatUnits(usdcBalance, 6),
  canDepositMinimum001: usdcBalance >= 10000n,
  fundsTouched: false,
}, null, 2));
