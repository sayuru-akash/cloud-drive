import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.session || !session.user) {
    redirect("/login");
  }

  if (session.user.isActive === false) {
    redirect("/login?error=inactive");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();

  if (!ADMIN_ROLES.has(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  return session;
}
