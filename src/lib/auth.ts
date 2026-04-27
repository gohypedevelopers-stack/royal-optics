import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  type SessionPayload,
  signAuthToken,
  verifyAuthToken,
} from "@/lib/session-token";

export { AUTH_COOKIE_NAME, verifyAuthToken };
export type { SessionPayload };

export async function getSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signAuthToken(payload);

  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export function clearSessionCookie() {
  cookies().set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireUserSession() {
  const session = await getSession();

  if (!session || session.role !== "USER" || !session.userId) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN" || !session.adminId) {
    throw new Error("Unauthorized");
  }

  return session;
}
