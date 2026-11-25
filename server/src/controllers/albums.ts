import type { Request, Response } from "express";
import { z } from "zod";
import { idParam } from "../lib/http.js";
import { notFound } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { deletePhotos } from "../services/photos.js";
import { sendZip, slug } from "../services/zip.js";

const albumBody = z.object({
  name: z.string().trim().min(1, "Informe o nome do álbum").max(120),
  description: z.string().trim().max(500).nullish().transform((v) => v || null),
});

const present = (a: { id: string; eventId: string; name: string; description: string | null; createdAt: Date; _count?: { photos: number } }) => ({
  id: a.id, eventId: a.eventId, name: a.name, description: a.description, createdAt: a.createdAt, photoCount: a._count?.photos ?? 0,
});
const withCount = { _count: { select: { photos: true } } } as const;

export async function listAlbums(req: Request, res: Response) {
  const eventId = idParam(req);
  const albums = await prisma.album.findMany({ where: { eventId }, orderBy: { createdAt: "asc" }, include: withCount });
  res.json({ albums: albums.map(present) });
}

export async function createAlbum(req: Request, res: Response) {
  const eventId = idParam(req);
  if (!(await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } }))) throw notFound("Evento");
  const album = await prisma.album.create({ data: { ...albumBody.parse(req.body), eventId }, include: withCount });
  res.status(201).json({ album: present(album) });
}

export async function updateAlbum(req: Request, res: Response) {
  const id = idParam(req);
  if (!(await prisma.album.findUnique({ where: { id }, select: { id: true } }))) throw notFound("Álbum");
  const album = await prisma.album.update({ where: { id }, data: albumBody.parse(req.body), include: withCount });
  res.json({ album: present(album) });
}

export async function deleteAlbum(req: Request, res: Response) {
  const id = idParam(req);
  if (!(await prisma.album.findUnique({ where: { id }, select: { id: true } }))) throw notFound("Álbum");
  await deletePhotos(await prisma.photo.findMany({ where: { albumId: id } }));
  await prisma.album.delete({ where: { id } });
  res.json({ ok: true });
}

export async function albumZip(req: Request, res: Response) {
  const album = await prisma.album.findUnique({ where: { id: idParam(req) }, include: { event: true } });
  if (!album) throw notFound("Álbum");
  const photos = await prisma.photo.findMany({ where: { albumId: album.id }, orderBy: { uploadedAt: "asc" } });
  await sendZip(res, `${slug(album.event.name)}-${slug(album.name)}`, photos.map((p) => ({ name: p.fileName, path: p.filePath })));
}
