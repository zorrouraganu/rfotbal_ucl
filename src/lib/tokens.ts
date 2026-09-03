import { createHash, randomBytes } from "node:crypto";

export function generateSecureToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function sha256TokenHash(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
