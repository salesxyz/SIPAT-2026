import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AppError, notFound } from "../lib/errors.js";
import { idParam, orderBy, pageQuery, uuid } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { processImage } from "../services/images.js";
import { downloadUrl, presentPhotos } from "../services/photos.js";
import { storage } from "../storage/index.js";
import type { Event, Prisma } from "../generated/client.js";

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/** Carrega o evento pelo token do QR Code. Roda ANTES do multer: token inválido não recebe bytes. */
export async function loadEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const token = String(req.params.token ?? "");
    const event = TOKEN_RE.test(token) ? await prisma.event.findUnique({ where: { qrCodeToken: token } }) : null;
    if (!event) throw notFound("Evento");
    res.locals.event = event;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireActiveEvent(_req: Request, res: Response, next: NextFunction) {
  const event: Event = res.locals.event;
  if (event.status !== "active") {
    return next(new AppError(403, "Este evento não está recebendo fotos no momento", "evento_encerrado"));
  }
  next();
}

export async function eventInfo(_req: Request, res: Response) {
  const e: Event = res.locals.event;
  const albums = await prisma.album.findMany({ where: { eventId: e.id }, orderBy: { createdAt: "asc" }, include: { _count: { select: { photos: true } } } });
  res.json({
    event: {
      name: e.name, description: e.description, location: e.location,
      date: e.date ? e.date.toISOString().slice(0, 10) : null,
      accepting: e.status === "active",
      photoCount: albums.reduce((s, a) => s + a._count.photos, 0),
      albums: albums.map((a) => ({ id: a.id, name: a.name, description: a.description, photoCount: a._count.photos })),
    },
  });
}

/** Eventos marcados como "listados" aparecem na galeria pública; os demais só por QR/link. */
export async function listPublicEvents(_req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { isListed: true },
    orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: { _count: { select: { photos: true } }, photos: { orderBy: { uploadedAt: "desc" }, take: 1 } },
  });
  const covers = await presentPhotos(events.map((e) => e.photos[0]).filter(Boolean));
  let c = 0;
  res.json({
    events: events.map((e) => ({
      token: e.qrCodeToken, name: e.name, location: e.location,
      date: e.date ? e.date.toISOString().slice(0, 10) : null,
      accepting: e.status === "active", photoCount: e._count.photos,
      coverUrl: e.photos[0] ? covers[c++].thumbUrl : null,
    })),
  });
}

export async function listEventPhotos(req: Request, res: Response) {
  const e: Event = res.locals.event;
  const q = pageQuery.parse(req.query);
  const where: Prisma.PhotoWhereInput = {
    eventId: e.id,
    ...(q.albumId && { albumId: q.albumId }),
    ...(q.q && { fileName: { contains: q.q, mode: "insensitive" } }),
  };
  const [total, photos] = await Promise.all([
    prisma.photo.count({ where }),
    prisma.photo.findMany({ where, orderBy: orderBy(q.sort), skip: (q.page - 1) * q.limit, take: q.limit }),
  ]);
  res.json({ total, page: q.page, limit: q.limit, photos: await presentPhotos(photos) });
}

export async function downloadEventPhoto(req: Request, res: Response) {
  const e: Event = res.locals.event;
  const photo = await prisma.photo.findFirst({ where: { id: idParam(req, "photoId"), eventId: e.id } });
  if (!photo) throw notFound("Foto");
  res.redirect(302, await downloadUrl(photo));
}

function fixName(name: string) {
  // multer entrega nomes UTF-8 como latin1
  return Buffer.from(name, "latin1").toString("utf8");
}

export async function uploadPhotos(req: Request, res: Response) {
  const e: Event = res.locals.event;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new AppError(400, "Nenhuma foto foi enviada", "sem_arquivos");

  let albumId: string | undefined;
  if (req.body?.albumId) {
    const parsed = uuid.safeParse(req.body.albumId);
    const album = parsed.success ? await prisma.album.findFirst({ where: { id: parsed.data, eventId: e.id } }) : null;
    if (!album) throw new AppError(400, "Álbum inválido para este evento", "album_invalido");
    albumId = album.id;
  } else {
    const first = await prisma.album.findFirst({ where: { eventId: e.id }, orderBy: { createdAt: "asc" } });
    albumId = (first ?? (await prisma.album.create({ data: { eventId: e.id, name: "Fotos dos participantes" } }))).id;
  }

  const results: { name: string; ok: boolean; photoId?: string; error?: string }[] = [];
  for (const file of files) {
    const name = fixName(file.originalname);
    const written: string[] = [];
    try {
      const img = await processImage(file.buffer, name);
      const id = crypto.randomUUID();
      const base = `events/${e.id}/${albumId}/${id}`;
      await storage.put(`${base}.jpg`, img.main, img.mimeType);
      written.push(`${base}.jpg`);
      await storage.put(`${base}_t.jpg`, img.thumb, img.mimeType);
      written.push(`${base}_t.jpg`);
      await prisma.photo.create({
        data: {
          id, albumId, eventId: e.id, fileName: img.fileName, filePath: `${base}.jpg`, thumbPath: `${base}_t.jpg`,
          fileSize: img.main.length, mimeType: img.mimeType,
          uploads: { create: { uploadStatus: "completed" } },
        },
      });
      results.push({ name, ok: true, photoId: id });
    } catch (err) {
      if (written.length) await storage.remove(written).catch(() => undefined);
      if (!(err instanceof AppError)) console.error("Falha no upload:", err);
      results.push({ name, ok: false, error: err instanceof AppError ? err.message : "Falha ao salvar a foto. Tente novamente" });
    }
  }
  const uploaded = results.filter((r) => r.ok).length;
  res.status(uploaded ? 201 : 422).json({ uploaded, failed: results.length - uploaded, results });
}
