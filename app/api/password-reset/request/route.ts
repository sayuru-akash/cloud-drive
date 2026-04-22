import { z } from "zod";
import { env } from "@/lib/env";
import { requestPasswordResetEmail } from "@/lib/password-reset";

const passwordResetRequestSchema = z.object({
  email: z.email(),
  redirectTo: z.string().url().optional(),
});

function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const protocol = forwardedProto || url.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : env.appBaseUrl;
}

export async function POST(request: Request) {
  let body: z.infer<typeof passwordResetRequestSchema>;

  try {
    body = passwordResetRequestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const result = await requestPasswordResetEmail({
      ...body,
      appOrigin: getRequestOrigin(request),
    });
    return Response.json(result);
  } catch (error) {
    console.error("Password reset email request failed.", error);

    return Response.json(
      {
        message:
          "We couldn't send the reset email right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
