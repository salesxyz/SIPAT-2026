import type { Request } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export const uuid = z.string().uuid("Identificador inválido");

export function idParam(req: Request, name = "id"): string {
  const r = uuid.safeParse(req.params[name]);
  if (!r.success) throw new AppError(404, "Recurso não encontrado", "nao_encontrado");
  return r.data;
}

export function baseUrl(req: Request): string {
  return env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get("host")}`;
}

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(48),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["recent", "oldest", "name"]).default("recent"),
  albumId: uuid.optional(),
});

export function orderBy(sort: "recent" | "oldest" | "name") {
  if (sort === "oldest") return { uploadedAt: "asc" as const };
  if (sort === "name") return { fileName: "asc" as const };
  return { uploadedAt: "desc" as const };
}
