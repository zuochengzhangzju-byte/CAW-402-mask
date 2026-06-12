const SPIKE_FUNDED_ACK = "I_UNDERSTAND_SPIKE_BYPASSES_MAIN_ADAPTER";
const DEFAULT_NOTE_PASSWORD = "local-dev-password-change-me";

export function assertSpikeFundedAllowed(scriptName) {
  if (process.env.ALLOW_UNGUARDED_SPIKE_FUNDED !== SPIKE_FUNDED_ACK) {
    throw new Error(`${scriptName} bypasses the main privacy adapter budget, allowlist, recovery, and circuit-risk gates. Use ../bin/privacy-adapter.js for funded notes, or set ALLOW_UNGUARDED_SPIKE_FUNDED=${SPIKE_FUNDED_ACK} only for isolated legacy debugging.`);
  }
}

export function requiredNotePassword() {
  const raw = String(process.env.PX402_NOTE_PASSWORD || "").trim();
  if (!raw) throw new Error("PX402_NOTE_PASSWORD is required.");
  if (raw === DEFAULT_NOTE_PASSWORD) throw new Error(`PX402_NOTE_PASSWORD must not be '${DEFAULT_NOTE_PASSWORD}'.`);
  if (raw.length < 12) throw new Error("PX402_NOTE_PASSWORD must be at least 12 characters.");
  return raw;
}

