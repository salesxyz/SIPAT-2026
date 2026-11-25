import path from "node:path";
import type { Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { storage } from "../storage/index.js";
import { verifyFileToken } from "../storage/local.js";

/** Entrega arquivos do driver local por URL assinada e temporária. (Supabase usa as próprias URLs assinadas.) */
export async function serveFile(req: Request, res: Response) {
  let claims: { p: string; dl?: string };
  try {
    claims = verifyFileToken(String(req.params.token));
  } catch {
    throw new AppError(403, "Link expirado ou inválido", "link_invalido");
  }
  const data = await storage.read(claims.p);
  res.setHeader("Content-Type", path.extname(claims.p) === ".png" ? "image/png" : "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (claims.dl) res.setHeader("Content-Disposition", `attachment; filename="photo.jpg"; filename*=UTF-8''${encodeURIComponent(claims.dl)}`);
  res.send(data);
}
