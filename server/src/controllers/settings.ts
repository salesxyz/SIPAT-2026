import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getSettings, PUBLIC_KEYS } from "../services/settings.js";
import { runRetention } from "../services/retention.js";

const txt = (max: number) => z.string().trim().max(max);
const url = z.string().trim().max(300).refine((v) => v === "" || /^https?:\/\//i.test(v), "Use um link que comece com http:// ou https://");
const settingsBody = z.object({
  org_name: txt(80).min(1), contact_email: txt(120), contact_phone: txt(40), contact_address: txt(240),
  social_instagram: url, social_facebook: url, social_linkedin: url, social_youtube: url,
  privacy_notice: txt(4000).min(10), retention_days: z.coerce.number().int().min(0).max(3650).transform(String),
}).partial();

export async function publicSettings(_req: Request, res: Response) {
  const all = await getSettings();
  res.json({ settings: Object.fromEntries(PUBLIC_KEYS.map((k) => [k, all[k] ?? ""])) });
}

export async function updateSettings(req: Request, res: Response) {
  const body = settingsBody.parse(req.body);
  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value: value as string }, update: { value: value as string } }),
    ),
  );
  const all = await getSettings();
  res.json({ settings: Object.fromEntries(PUBLIC_KEYS.map((k) => [k, all[k] ?? ""])) });
}

export async function runRetentionNow(_req: Request, res: Response) {
  res.json({ deleted: await runRetention() });
}
