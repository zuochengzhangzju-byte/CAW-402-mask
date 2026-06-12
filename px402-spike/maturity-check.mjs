import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { getChainConfig } from "@prxvt/sdk";

const config = getChainConfig("base");
const client = createPublicClient({
  chain: base,
  transport: http(config.rpcUrl),
});

const addresses = {
  poolAddress: config.poolAddress,
  paymasterAddress: config.paymasterAddress,
  walletAddress: config.walletAddress,
  entryPointAddress: config.entryPointAddress,
  usdcAddress: config.usdcAddress,
};

const checks = {};
for (const [name, address] of Object.entries(addresses)) {
  const bytecode = await client.getCode({ address });
  checks[name] = {
    address,
    hasCode: Boolean(bytecode && bytecode !== "0x"),
    bytecodeBytes: bytecode && bytecode !== "0x" ? (bytecode.length - 2) / 2 : 0,
  };
}

const usdcBalanceOfPool = await client.readContract({
  address: config.usdcAddress,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [config.poolAddress],
});

console.log(JSON.stringify({
  chain: "base",
  config,
  checks,
  usdcBalanceOfPool: {
    raw: usdcBalanceOfPool.toString(),
    formatted: formatUnits(usdcBalanceOfPool, 6),
  },
  fundsTouched: false,
}, null, 2));
