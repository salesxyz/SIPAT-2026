import type { Request, Response } from "express";
import { z } from "zod";
import { baseUrl, idParam } from "../lib/http.js";
import { notFound } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { deletePhotos } from "../services/photos.js";
import { newToken } from "../services/images.js";
import { eventUrl, qrPng } from "../services/qr.js";
import type { Event } from "../generated/client.js";

const optText = (max: number) => z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
const eventBody = z.object({
  name: z.string().trim().min(2, "Informe o nome do evento").max(120),
  description: optText(1000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").nullish().or(z.literal("")).transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null)),
  location: optText(200),
  status: z.enum(["active", "closed"]).default("active"),
  isListed: z.boolean().default(true),
});

function present(e: Event & { _count?: { photos: number; albums: number } }, req: Request) {
  return {
    id: e.id, name: e.name, description: e.description, location: e.location,
    date: e.date ? e.date.toISOString().slice(0, 10) : null,
    status: e.status, isListed: e.isListed, createdAt: e.createdAt,
    qrCodeToken: e.qrCodeToken, uploadUrl: eventUrl(baseUrl(req), e.qrCodeToken),
    photoCount: e._count?.photos ?? 0, albumCount: e._count?.albums ?? 0,
  };
}

const withCounts = { _count: { select: { photos: true, albums: true } } } as const;

export async function listEvents(req: Request, res: Response) {
  const events = await prisma.event.findMany({ orderBy: { createdAt: "desc" }, include: withCounts });
  res.json({ events: events.map((e) => present(e, req)) });
}

export async function getEvent(req: Request, res: Response) {
  const e = await prisma.event.findUnique({ where: { id: idParam(req) }, include: withCounts });
  if (!e) throw notFound("Evento");
  res.json({ event: present(e, req) });
}

export async function createEvent(req: Request, res: Response) {
  const body = eventBody.parse(req.body);
  const e = await prisma.event.create({
    data: { ...body, qrCodeToken: newToken(), albums: { create: { name: "Fotos dos participantes" } } },
    include: withCounts,
  });
  res.status(201).json({ event: present(e, req) });
}

export async function updateEvent(req: Request, res: Response) {
  const id = idParam(req);
  const body = eventBody.partial().parse(req.body);
  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound("Evento");
  const e = await prisma.event.update({ where: { id }, data: body, include: withCounts });
  res.json({ event: present(e, req) });
}

export async function deleteEvent(req: Request, res: Response) {
  const id = idParam(req);
  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound("Evento");
  await deletePhotos(await prisma.photo.findMany({ where: { eventId: id } }));
  await prisma.event.delete({ where: { id } });
  res.json({ ok: true });
}

/** Gera um novo token (invalida o QR Code anterior, ex.: se vazou). */
export async function regenerateToken(req: Request, res: Response) {
  const id = idParam(req);
  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound("Evento");
  const e = await prisma.event.update({ where: { id }, data: { qrCodeToken: newToken() }, include: withCounts });
  res.json({ event: present(e, req) });
}

export async function eventQr(req: Request, res: Response) {
  const e = await prisma.event.findUnique({ where: { id: idParam(req) } });
  if (!e) throw notFound("Evento");
  const size = z.coerce.number().int().min(200).max(2000).catch(900).parse(req.query.size);
  const png = await qrPng(eventUrl(baseUrl(req), e.qrCodeToken), size);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store");
  if (req.query.download !== undefined) {
    res.setHeader("Content-Disposition", `attachment; filename="qrcode-${e.id.slice(0, 8)}.png"`);
  }
  res.send(png);
}
