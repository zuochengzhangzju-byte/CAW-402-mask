import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Agent, setGlobalDispatcher } from "undici";
import { PrivacySDK, decryptNote, encryptNote, getNoteBalance } from "@prxvt/sdk";
import { assertSpikeFundedAllowed, requiredNotePassword } from "./funded-guard.mjs";

assertSpikeFundedAllowed("call-private-weather.mjs");

setGlobalDispatcher(new Agent({
  connect: {
    timeout: 60_000,
  },
  headersTimeout: 120_000,
  bodyTimeout: 300_000,
}));

const endpoint = process.env.X402_WEATHER_URL || "https://httpay.xyz/api/weather?lat=22.3193&lon=114.1694";
const password = requiredNotePassword();
const explicitNotePath = process.env.PX402_NOTE_PATH;

function latestNotePath() {
  const notesDir = path.resolve("notes");
  const files = fs.existsSync(notesDir)
    ? fs.readdirSync(notesDir)
        .filter((name) => name.startsWith("px402-note-") && name.endsWith(".json"))
        .map((name) => path.join(notesDir, name))
    : [];

  if (files.length === 0) {
    throw new Error("No px402 note file found. Run npm run deposit:min first.");
  }

  return files
    .map((file) => ({ file, mtimeMs: fs.statSync(file).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0].file;
}

const notePath = path.resolve(explicitNotePath || latestNotePath());
const stored = JSON.parse(fs.readFileSync(notePath, "utf8"));
const note = await decryptNote(stored.encryptedNote, password);

const sdk = new PrivacySDK({ chain: "base" });
sdk.setNote(note);

const fetchWithPay = sdk.wrapFetch(fetch);
const response = await fetchWithPay(endpoint);
const bodyText = await response.text();
const responsePath = path.resolve("notes", `px402-weather-response-${Date.now()}.json`);
fs.writeFileSync(responsePath, JSON.stringify({
  endpoint,
  status: response.status,
  createdAt: new Date().toISOString(),
  xPaymentResponse: response.headers.get("x-payment-response"),
  body: bodyText,
}, null, 2));

const updatedNote = sdk.getUpdatedNote();
if (updatedNote) {
  const encryptedNote = await encryptNote(updatedNote, password);
  const updatedPath = path.resolve("notes", `px402-note-updated-${Date.now()}.json`);
  fs.writeFileSync(updatedPath, JSON.stringify({
    chain: "base",
    createdAt: new Date().toISOString(),
    sourceNotePath: notePath,
    encryptedNote,
  }, null, 2));

  console.log(JSON.stringify({
    action: "px402_private_weather_complete",
    status: response.status,
    noteBalanceBeforeUsdc: getNoteBalance(note),
    noteBalanceAfterUsdc: getNoteBalance(updatedNote),
    sourceNotePath: notePath,
    updatedNotePath: updatedPath,
    responsePath,
    xPaymentResponse: response.headers.get("x-payment-response"),
  }, null, 2));
} else {
  console.log(JSON.stringify({
    action: "px402_private_weather_complete",
    status: response.status,
    noteBalanceBeforeUsdc: getNoteBalance(note),
    updatedNotePath: null,
    responsePath,
    xPaymentResponse: response.headers.get("x-payment-response"),
  }, null, 2));
}

console.log(bodyText);
process.exit(0);
