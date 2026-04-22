import "server-only";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
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

export async function createMultipartUpload({
  storageKey,
  contentType,
}: {
  storageKey: string;
  contentType: string;
}) {
  return storageClient.send(
    new CreateMultipartUploadCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
      ContentType: contentType,
    }),
  );
}

export async function createMultipartPartUploadUrl({
  storageKey,
  uploadId,
  partNumber,
}: {
  storageKey: string;
  uploadId: string;
  partNumber: number;
}) {
  return getSignedUrl(
    storageClient,
    new UploadPartCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 60 * 60 },
  );
}

export async function completeMultipartUpload({
  storageKey,
  uploadId,
  parts,
}: {
  storageKey: string;
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
}) {
  return storageClient.send(
    new CompleteMultipartUploadCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((left, right) => left.partNumber - right.partNumber)
          .map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
      },
    }),
  );
}

export async function abortMultipartUpload({
  storageKey,
  uploadId,
}: {
  storageKey: string;
  uploadId: string;
}) {
  return storageClient.send(
    new AbortMultipartUploadCommand({
      Bucket: env.b2BucketName,
      Key: storageKey,
      UploadId: uploadId,
    }),
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
