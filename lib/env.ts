import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  B2_S3_ENDPOINT: z.string().url().min(1, "B2_S3_ENDPOINT is required"),
  B2_KEY_ID: z.string().min(1, "B2_KEY_ID is required"),
  B2_APPLICATION_KEY: z.string().min(1, "B2_APPLICATION_KEY is required"),
  B2_BUCKET_NAME: z.string().min(6, "B2_BUCKET_NAME must be at least 6 characters"),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().int().positive().default(262144000),
  DEFAULT_SOFT_DELETE_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  INTERNAL_EMAIL_DOMAIN: z.string().min(1).optional(),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const parsedServerEnv = serverEnvSchema.parse({
  APP_BASE_URL: process.env.APP_BASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  B2_S3_ENDPOINT: process.env.B2_S3_ENDPOINT,
  B2_KEY_ID: process.env.B2_KEY_ID,
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY,
  B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  MAX_UPLOAD_SIZE_BYTES: process.env.MAX_UPLOAD_SIZE_BYTES,
  DEFAULT_SOFT_DELETE_RETENTION_DAYS:
    process.env.DEFAULT_SOFT_DELETE_RETENTION_DAYS,
  INTERNAL_EMAIL_DOMAIN: process.env.INTERNAL_EMAIL_DOMAIN,
});

const parsedPublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const env = {
  appBaseUrl: parsedServerEnv.APP_BASE_URL,
  publicAppUrl: parsedPublicEnv.NEXT_PUBLIC_APP_URL,
  databaseUrl: parsedServerEnv.DATABASE_URL,
  betterAuthSecret: parsedServerEnv.BETTER_AUTH_SECRET,
  b2Endpoint: parsedServerEnv.B2_S3_ENDPOINT,
  b2KeyId: parsedServerEnv.B2_KEY_ID,
  b2ApplicationKey: parsedServerEnv.B2_APPLICATION_KEY,
  b2BucketName: parsedServerEnv.B2_BUCKET_NAME,
  resendApiKey: parsedServerEnv.RESEND_API_KEY,
  maxUploadSizeBytes: parsedServerEnv.MAX_UPLOAD_SIZE_BYTES,
  defaultSoftDeleteRetentionDays:
    parsedServerEnv.DEFAULT_SOFT_DELETE_RETENTION_DAYS,
  internalEmailDomain: parsedServerEnv.INTERNAL_EMAIL_DOMAIN?.toLowerCase(),
};

export const publicEnv = {
  appUrl: parsedPublicEnv.NEXT_PUBLIC_APP_URL,
};

export const readiness = {
  database: Boolean(env.databaseUrl),
  auth: Boolean(env.betterAuthSecret),
  storage: Boolean(
    env.b2Endpoint && env.b2KeyId && env.b2ApplicationKey && env.b2BucketName,
  ),
  email: Boolean(env.resendApiKey),
};
