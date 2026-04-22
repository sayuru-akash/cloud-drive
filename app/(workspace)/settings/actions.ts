"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth/session";

export async function sendVerificationEmailAction() {
  const session = await requireSession();

  await auth.api.sendVerificationEmail({
    body: {
      email: session.user.email,
      callbackURL: "/settings?verified=1",
    },
    headers: await headers(),
  });

  redirect("/settings?sent=1");
}
