import type { Request, Response } from "express";
import { z } from "zod";
import { idParam, orderBy, pageQuery, uuid } from "../lib/http.js";
import { notFound } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { deletePhotos, downloadUrl, presentPhotos } from "../services/photos.js";
import type { Prisma } from "../generated/client.js";

const adminQuery = pageQuery.extend({ eventId: uuid.optional() });

export async function listPhotos(req: Request, res: Response) {
  const q = adminQuery.parse(req.query);
  const where: Prisma.PhotoWhereInput = {
    ...(q.eventId && { eventId: q.eventId }),
    ...(q.albumId && { albumId: q.albumId }),
    ...(q.q && { fileName: { contains: q.q, mode: "insensitive" } }),
  };
  const [total, photos] = await Promise.all([
    prisma.photo.count({ where }),
    prisma.photo.findMany({ where, orderBy: orderBy(q.sort), skip: (q.page - 1) * q.limit, take: q.limit }),
  ]);
  res.json({ total, page: q.page, limit: q.limit, photos: await presentPhotos(photos) });
}

export async function deletePhoto(req: Request, res: Response) {
  const photo = await prisma.photo.findUnique({ where: { id: idParam(req) } });
  if (!photo) throw notFound("Foto");
  await deletePhotos([photo]);
  res.json({ ok: true });
}

export async function bulkDelete(req: Request, res: Response) {
  const { ids } = z.object({ ids: z.array(uuid).min(1).max(500) }).parse(req.body);
  const deleted = await deletePhotos(await prisma.photo.findMany({ where: { id: { in: ids } } }));
  res.json({ ok: true, deleted });
}

export async function downloadPhoto(req: Request, res: Response) {
  const photo = await prisma.photo.findUnique({ where: { id: idParam(req) } });
  if (!photo) throw notFound("Foto");
  res.redirect(302, await downloadUrl(photo));
}
