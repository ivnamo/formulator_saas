export function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : null;
}

export function normalizeCode(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function slugify(value: string): string {
  return normalizeCode(value).replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function makeLocalId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
