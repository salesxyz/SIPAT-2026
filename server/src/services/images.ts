import crypto from "node:crypto";
import sharp from "sharp";
import type { Metadata } from "sharp";
import { AppError } from "../lib/errors.js";

const ALLOWED = new Set(["jpeg", "png", "webp"]);

export interface ProcessedImage {
  main: Buffer;
  thumb: Buffer;
  mimeType: "image/jpeg";
  fileName: string;
}

/** Nome seguro: remove caminhos e caracteres de controle, troca a extensão por .jpg. */
export function safeFileName(original: string): string {
  const base = original.split(/[\\/]/).pop() ?? "foto";
  const noExt = base.replace(/\.[^.]*$/, "");
  const clean = noExt.normalize("NFC").replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 100);
  return `${clean || "foto"}.jpg`;
}

/**
 * Valida o conteúdo REAL do arquivo (não confia em extensão nem mimetype),
 * corrige a orientação, limita a resolução e regrava como JPEG — o que também
 * remove metadados EXIF (incluindo GPS), protegendo a privacidade (LGPD).
 */
export async function processImage(buffer: Buffer, originalName: string): Promise<ProcessedImage> {
  let meta: Metadata;
  try {
    meta = await sharp(buffer, { failOn: "error", limitInputPixels: 120_000_000 }).metadata();
  } catch {
    throw new AppError(400, "O arquivo não é uma imagem válida", "imagem_invalida");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    throw new AppError(400, "Formato não permitido. Envie JPG, PNG ou WebP", "formato_invalido");
  }
  try {
    const main = await sharp(buffer, { failOn: "error", limitInputPixels: 120_000_000 })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    const thumb = await sharp(main).resize({ width: 480, height: 480, fit: "cover" }).jpeg({ quality: 72 }).toBuffer();
    return { main, thumb, mimeType: "image/jpeg", fileName: safeFileName(originalName) };
  } catch {
    throw new AppError(400, "Não foi possível processar a imagem", "imagem_invalida");
  }
}

export const newToken = (bytes = 24) => crypto.randomBytes(bytes).toString("base64url");
