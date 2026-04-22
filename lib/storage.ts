import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const endpoint = new URL(env.b2Endpoint);
const region = endpoint.hostname.split(".")[1] ?? "us-east-1";

export const storageClient = new S3Client({
  region,
  endpoint: env.b2Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.b2KeyId,
    secretAccessKey: env.b2ApplicationKey,
  },
});

export function buildStorageKey(fileId: string, versionNumber: number, filename: string) {
  const safeName = filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `workspace/default/files/${fileId}/versions/${versionNumber}/${safeName || "file"}`;
}

export async function createUploadUrl({
  storageKey,
  contentType,
}: {
  storageKey: string;
  contentType: string;
}) {
  return getSignedUrl(
    storageClient,
    new PutObjectCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 },
  );
}

export async function createDownloadUrl(storageKey: string) {
  return createDownloadUrlWithOptions(storageKey);
}

function buildDownloadDisposition(filename?: string) {
  if (!filename) {
    return 'attachment; filename="file"';
  }

  const safeFilename = filename
    .replace(/[\r\n"]/g, "")
    .trim();

  const fallback = safeFilename
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]+/g, "")
    .trim() || "file";

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(safeFilename || "file")}`;
}

export async function createDownloadUrlWithOptions(
  storageKey: string,
  options?: { filename?: string },
) {
  return getSignedUrl(
    storageClient,
    new GetObjectCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
      ResponseContentDisposition: buildDownloadDisposition(options?.filename),
    }),
    { expiresIn: 60 * 5 },
  );
}

export async function getStoredObject(storageKey: string) {
  return storageClient.send(
    new HeadObjectCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
    }),
  );
}

export async function getStoredObjectStream(storageKey: string) {
  return storageClient.send(
    new GetObjectCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
    }),
  );
}

export async function deleteStoredObject(storageKey: string) {
  return storageClient.send(
    new DeleteObjectCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
    }),
  );
}
