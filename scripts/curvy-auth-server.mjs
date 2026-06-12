import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";

const walletPath = path.resolve(".curvy", "wallet.json");
const urlPath = path.resolve(".curvy", "auth-url.txt");
const pidPath = path.resolve(".curvy", "auth-server.pid");
const authAppUrl = "https://app.curvy.box/auth";

fs.mkdirSync(path.dirname(walletPath), { recursive: true });

if (fs.existsSync(walletPath)) {
  console.log(`Local Curvy wallet already exists at ${walletPath}`);
  process.exit(0);
}

const app = express();
app.use(cors({ origin: "*" }));

const server = app.listen(0, () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start auth server");
  }

  const callbackUrl = `http://localhost:${address.port}/auth/callback`;
  const authUrl = `${authAppUrl}?callback=${encodeURIComponent(callbackUrl)}`;
  fs.writeFileSync(urlPath, `${authUrl}\n`);
  fs.writeFileSync(pidPath, `${process.pid}\n`);

  console.log(`Curvy auth server listening on ${callbackUrl}`);
  console.log(`Open this URL to authenticate:\n${authUrl}`);
});

app.get("/auth/callback", (req, res) => {
  try {
    const signatureParams = req.query.signatureParams;
    if (!signatureParams) {
      res.status(400).end("Missing signatureParams");
      return;
    }

    const parsed = JSON.parse(decodeURIComponent(signatureParams));
    fs.writeFileSync(walletPath, JSON.stringify({ signature: parsed }, null, 2));
    fs.rmSync(urlPath, { force: true });
    fs.rmSync(pidPath, { force: true });

    res.status(200).end("Authentication successful. You can close this tab.");
    console.log(`Wallet saved to ${walletPath}`);
    server.close(() => process.exit(0));
  } catch (error) {
    console.error("Auth callback error:", error);
    res.status(500).end("Authentication failed");
    server.close(() => process.exit(1));
  }
});
