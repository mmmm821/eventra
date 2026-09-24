import crypto from "crypto";
import QRCode from "qrcode";

/**
 * Ticket QR security model
 * ----------------------------------------------------------------
 * Every ticket gets:
 *   - `secureToken`  : a random, unguessable 32-byte hex string stored in
 *                      the DB. This is the source of truth for verification.
 *   - QR payload      : `${ticketId}.${secureToken}.${signature}` where
 *                      `signature` = HMAC-SHA256(ticketId + secureToken,
 *                      TICKET_SIGNING_SECRET), base64url-encoded.
 *
 * The signature lets the scanner reject obviously-tampered or malformed
 * codes instantly (no DB hit needed), but it is NEVER trusted on its own —
 * `verifyScannedPayload` only tells you the payload is well-formed and
 * signed by us. The API route that handles /api/tickets/verify always
 * re-checks the token against the database inside a transaction before
 * marking a ticket USED. No personal data, payment details, or passwords
 * are ever encoded in the QR.
 */

const SECRET = process.env.TICKET_SIGNING_SECRET || "dev-only-insecure-secret-change-me";

export function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sign(ticketId: string, token: string) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${ticketId}.${token}`)
    .digest("base64url");
}

export function buildQrPayload(ticketId: string, secureToken: string) {
  const signature = sign(ticketId, secureToken);
  return `${ticketId}.${secureToken}.${signature}`;
}

export function verifyScannedPayload(
  payload: string
): { ticketId: string; token: string } | null {
  const parts = payload.trim().split(".");
  if (parts.length !== 3) return null;
  const [ticketId, token, signature] = parts;
  if (!ticketId || !token || !signature) return null;

  const expected = sign(ticketId, token);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  return { ticketId, token };
}

/** Renders the signed payload as a QR code data URL (PNG) for embedding in pages/emails. */
export async function renderQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: { dark: "#0A0B14", light: "#FFFFFF" },
  });
}
