import { finished } from "node:stream/promises";
import type { Response } from "express";
import { ZipFile } from "yazl";
import { storage } from "../storage/index.js";

export interface ZipEntry {
  name: string;
  path: string;
}

export function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "sipat";
}

/** Faz streaming de um ZIP (sem compressão: JPEG já é comprimido) para a resposta HTTP. */
export async function sendZip(res: Response, zipName: string, entries: ZipEntry[]): Promise<void> {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${slug(zipName)}.zip"; filename*=UTF-8''${encodeURIComponent(zipName)}.zip`);
  const archive = new ZipFile();
  const output = archive.outputStream;
  output.pipe(res);
  const completion = finished(output);
  let finalized = false;
  const finalize = () => {
    if (finalized) return;
    finalized = true;
    archive.end();
  };
  try {
    const used = new Set<string>();
    for (const [i, e] of entries.entries()) {
      let name = e.name;
      if (used.has(name)) name = `${String(i + 1).padStart(3, "0")}-${name}`;
      used.add(name);
      archive.addBuffer(await storage.read(e.path), name, { compress: false });
    }
    finalize();
    await completion;
  } catch (error) {
    finalize();
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Erro no ZIP:", err);
    res.destroy(err);
  }
}
