import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrivacySDK, encryptNote, getNoteBalance } from "@prxvt/sdk";
import { assertSpikeFundedAllowed, requiredNotePassword } from "./funded-guard.mjs";

assertSpikeFundedAllowed("deposit-minimum.mjs");

const privateKey = process.env.PRIVATE_KEY || process.env.PX402_PRIVATE_KEY;
const password = requiredNotePassword();

if (!privateKey) {
  throw new Error("PRIVATE_KEY or PX402_PRIVATE_KEY is required in environment.");
}

const sdk = new PrivacySDK({ chain: "base" });
const amount = 0.01;

console.log(JSON.stringify({
  action: "px402_deposit_start",
  chain: "base",
  amountUsdc: amount,
}, null, 2));

const note = await sdk.depositFast(amount, privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
const encrypted = await encryptNote(note, password);

fs.mkdirSync("notes", { recursive: true });
const notePath = path.resolve("notes", `px402-note-${Date.now()}.json`);
fs.writeFileSync(notePath, JSON.stringify({
  chain: "base",
  createdAt: new Date().toISOString(),
  encryptedNote: encrypted,
}, null, 2));

console.log(JSON.stringify({
  action: "px402_deposit_complete",
  balanceUsdc: getNoteBalance(note),
  notePath,
  encrypted: true,
}, null, 2));
