import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const AUTH_COOKIE_NAME = "royal_auth";

const secret =
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "change-me-in-production-auth-secret";

const key = new TextEncoder().encode(secret);

export type SessionRole = "USER" | "ADMIN";

export type SessionPayload = JWTPayload & {
  role: SessionRole;
  userId?: string;
  adminId?: string;
  username: string;
  email: string;
  phone?: string;
};

export async function signAuthToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
