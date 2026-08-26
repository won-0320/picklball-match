import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  return password;
}

function expectedSessionToken(): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(getAdminPassword())
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = crypto.createHash("sha256").update(a).digest();
  const bufB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(input: string): boolean {
  return safeEqual(input, getAdminPassword());
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  return safeEqual(token, expectedSessionToken());
}

export function issueSessionToken(): string {
  return expectedSessionToken();
}
