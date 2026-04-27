import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export const GUEST_TOKEN_COOKIE = "royal_guest";

export type OwnerContext = {
  ownerKey: string;
  userId: string | null;
  guestToken: string | null;
};

export function getGuestTokenFromCookie() {
  return cookies().get(GUEST_TOKEN_COOKIE)?.value ?? null;
}

export function ensureGuestToken() {
  const cookieStore = cookies();
  let guestToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;

  if (!guestToken) {
    guestToken = randomUUID();
    cookieStore.set(GUEST_TOKEN_COOKIE, guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  return guestToken;
}

export async function getOwnerContext(): Promise<OwnerContext> {
  const session = await getSession();

  if (session?.role === "USER" && session.userId) {
    return {
      ownerKey: `user:${session.userId}`,
      userId: session.userId,
      guestToken: null,
    };
  }

  const guestToken = ensureGuestToken();

  return {
    ownerKey: `guest:${guestToken}`,
    userId: null,
    guestToken,
  };
}
