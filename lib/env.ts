import "server-only";
import { z } from "zod";

const envSchema = z.object({
  APP_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  B2_S3_ENDPOINT: z.string().url().optional(),
  B2_KEY_ID: z.string().min(1).optional(),
  B2_APPLICATION_KEY: z.string().min(1).optional(),
  B2_BUCKET_NAME: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().int().positive().default(262144000),
  DEFAULT_SOFT_DELETE_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
});

const parsedEnv = envSchema.parse({
  APP_BASE_URL: process.env.APP_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  B2_S3_ENDPOINT: process.env.B2_S3_ENDPOINT,
  B2_KEY_ID: process.env.B2_KEY_ID,
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY,
  B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  MAX_UPLOAD_SIZE_BYTES: process.env.MAX_UPLOAD_SIZE_BYTES,
  DEFAULT_SOFT_DELETE_RETENTION_DAYS:
    process.env.DEFAULT_SOFT_DELETE_RETENTION_DAYS,
});

export const env = {
  appBaseUrl:
    parsedEnv.APP_BASE_URL ??
    parsedEnv.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",
  maxUploadSizeBytes: parsedEnv.MAX_UPLOAD_SIZE_BYTES,
  defaultSoftDeleteRetentionDays:
    parsedEnv.DEFAULT_SOFT_DELETE_RETENTION_DAYS,
};

export const readiness = {
  database: Boolean(parsedEnv.DATABASE_URL),
  auth: Boolean(parsedEnv.BETTER_AUTH_SECRET),
  storage: Boolean(
    parsedEnv.B2_S3_ENDPOINT &&
      parsedEnv.B2_KEY_ID &&
      parsedEnv.B2_APPLICATION_KEY &&
      parsedEnv.B2_BUCKET_NAME,
  ),
  email: Boolean(parsedEnv.RESEND_API_KEY),
  monitoring: Boolean(parsedEnv.SENTRY_DSN),
};
