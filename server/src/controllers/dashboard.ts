import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { presentPhotos } from "../services/photos.js";

export async function dashboard(_req: Request, res: Response) {
  const [events, albums, photos, size, recent, byEvent] = await Promise.all([
    prisma.event.count(),
    prisma.album.count(),
    prisma.photo.count(),
    prisma.photo.aggregate({ _sum: { fileSize: true } }),
    prisma.photo.findMany({ orderBy: { uploadedAt: "desc" }, take: 8, include: { event: { select: { name: true } }, album: { select: { name: true } } } }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, status: true, _count: { select: { photos: true } } } }),
  ]);
  const presented = await presentPhotos(recent);
  res.json({
    totals: { events, albums, photos, bytes: size._sum.fileSize ?? 0 },
    recentUploads: presented.map((p, i) => ({ ...p, eventName: recent[i].event.name, albumName: recent[i].album.name })),
    topEvents: byEvent.map((e) => ({ id: e.id, name: e.name, status: e.status, photoCount: e._count.photos })),
  });
}
