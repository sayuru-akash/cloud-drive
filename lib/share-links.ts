type ShareLinkStatus = "active" | "expired" | "revoked";

function normalizeDate(date: Date | string | null | undefined) {
  if (!date) {
    return null;
  }

  const value = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(value.getTime()) ? null : value;
}

export function isShareLinkExpired(date: Date | string | null | undefined) {
  const value = normalizeDate(date);

  if (!value) {
    return false;
  }

  return value.getTime() <= Date.now();
}

export function getShareLinkStatus({
  expiresAt,
  isRevoked,
}: {
  expiresAt: Date | string | null | undefined;
  isRevoked: boolean;
}): ShareLinkStatus {
  if (isRevoked) {
    return "revoked";
  }

  return isShareLinkExpired(expiresAt) ? "expired" : "active";
}

