import fs from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { StorageDriver } from "./types.js";

/** Driver em disco: apenas para desenvolvimento e testes. Em produção use Supabase. */
export class LocalStorage implements StorageDriver {
  readonly base = path.resolve(env.LOCAL_STORAGE_DIR);

  private resolve(p: string): string {
    const full = path.resolve(this.base, p);
    if (!full.startsWith(this.base + path.sep)) throw new Error("Caminho inválido");
    return full;
  }

  async init() {
    await fs.mkdir(this.base, { recursive: true });
  }

  async put(p: string, data: Buffer) {
    const full = this.resolve(p);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  read(p: string) {
    return fs.readFile(this.resolve(p));
  }

  async remove(paths: string[]) {
    await Promise.all(paths.map((p) => fs.rm(this.resolve(p), { force: true })));
  }

  async signedUrls(paths: string[], expiresIn: number, downloadName?: string) {
    return paths.map((p) => {
      const token = jwt.sign({ p, dl: downloadName }, env.JWT_SECRET, { expiresIn, audience: "file" });
      return `/api/files/${token}`;
    });
  }
}

export function verifyFileToken(token: string): { p: string; dl?: string } {
  return jwt.verify(token, env.JWT_SECRET, { audience: "file" }) as { p: string; dl?: string };
}
