import { prisma } from "../lib/prisma.js";
import { deletePhotos } from "./photos.js";
import { getRetentionDays } from "./settings.js";

/** Exclui fotos mais antigas que `retention_days` (0 = retenção desligada). */
export async function runRetention(): Promise<number> {
  const days = await getRetentionDays();
  if (!days) return 0;
  const limit = new Date(Date.now() - days * 86_400_000);
  let total = 0;
  for (;;) {
    const batch = await prisma.photo.findMany({ where: { uploadedAt: { lt: limit } }, take: 200 });
    if (!batch.length) break;
    total += await deletePhotos(batch);
  }
  return total;
}
