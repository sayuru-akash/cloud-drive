import { z } from "zod";
import { requestPasswordResetEmail } from "@/lib/password-reset";

const passwordResetRequestSchema = z.object({
  email: z.email(),
  redirectTo: z.string().url().optional(),
});

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
    const result = await requestPasswordResetEmail(body);
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
