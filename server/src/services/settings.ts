import { prisma } from "../lib/prisma.js";

export const PUBLIC_KEYS = [
  "org_name", "contact_email", "contact_phone", "contact_address",
  "social_instagram", "social_facebook", "social_linkedin", "social_youtube",
  "privacy_notice", "retention_days",
] as const;

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getRetentionDays(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "retention_days" } });
  const n = Number(row?.value ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
