import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import type { StorageDriver } from "./types.js";

export class SupabaseStorage implements StorageDriver {
  private client: SupabaseClient;
  private bucket = env.SUPABASE_BUCKET;

  constructor() {
    this.client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async init() {
    const { data } = await this.client.storage.getBucket(this.bucket);
    if (data) return;
    const { error } = await this.client.storage.createBucket(this.bucket, { public: false });
    if (error && !/already exists/i.test(error.message)) throw new Error(`Bucket Supabase: ${error.message}`);
  }

  async put(path: string, data: Buffer, contentType: string) {
    const { error } = await this.client.storage.from(this.bucket).upload(path, data, { contentType, upsert: false });
    if (error) throw new Error(`Falha ao salvar arquivo: ${error.message}`);
  }

  async read(path: string) {
    const { data, error } = await this.client.storage.from(this.bucket).download(path);
    if (error || !data) throw new Error(`Falha ao ler arquivo: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(paths: string[]) {
    if (!paths.length) return;
    const { error } = await this.client.storage.from(this.bucket).remove(paths);
    if (error) throw new Error(`Falha ao remover arquivos: ${error.message}`);
  }

  async signedUrls(paths: string[], expiresIn: number, downloadName?: string) {
    if (!paths.length) return [];
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrls(paths, expiresIn, downloadName ? { download: downloadName } : undefined);
    if (error || !data) throw new Error(`Falha ao assinar URLs: ${error?.message}`);
    const byPath = new Map(data.map((d) => [d.path, d.signedUrl ?? ""]));
    return paths.map((p) => byPath.get(p) ?? "");
  }
}
