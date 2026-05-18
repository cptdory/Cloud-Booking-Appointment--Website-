import { cookies } from "next/headers";
import { verifySession } from "./session";
import type { Session } from "@/types/session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_session")?.value;

  if (!token) return null;

  try {
    return (await verifySession(token)) as Session;
  } catch {
    return null;
  }
}