import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool } from "../lib/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const projectColumns = [
  "albums.id:uuid:NO", "albums.event_id:uuid:NO", "albums.name:text:NO", "albums.description:text:YES", "albums.created_at:timestamp with time zone:NO",
  "events.id:uuid:NO", "events.name:text:NO", "events.description:text:YES", "events.date:date:YES", "events.location:text:YES",
  "events.status:text:NO", "events.is_listed:boolean:NO", "events.qr_code_token:text:NO", "events.created_at:timestamp with time zone:NO",
  "photos.id:uuid:NO", "photos.album_id:uuid:NO", "photos.event_id:uuid:NO", "photos.file_name:text:NO", "photos.file_path:text:NO",
  "photos.thumb_path:text:YES", "photos.file_size:integer:NO", "photos.mime_type:text:NO", "photos.uploaded_at:timestamp with time zone:NO",
  "settings.key:text:NO", "settings.value:text:NO", "settings.updated_at:timestamp with time zone:NO",
  "uploads.id:uuid:NO", "uploads.photo_id:uuid:NO", "uploads.upload_status:text:NO", "uploads.created_at:timestamp with time zone:NO",
  "users.id:uuid:NO", "users.name:text:NO", "users.email:text:NO", "users.password_hash:text:NO", "users.role:text:NO",
  "users.created_at:timestamp with time zone:NO",
].sort();
const projectTables = ["albums", "events", "photos", "settings", "uploads", "users"];

async function matchesProjectSchema(pool: ReturnType<typeof createPool>): Promise<boolean> {
  const { rows } = await pool.query(
    "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
    [projectTables],
  );
  const columns = rows
    .map((r) => `${r.table_name}.${r.column_name}:${r.data_type}:${r.is_nullable}`)
    .sort();
  return columns.length === projectColumns.length && columns.every((column, i) => column === projectColumns[i]);
}

export async function runMigrations(dir = path.resolve(here, "../../migrations")): Promise<string[]> {
  const pool = createPool(2);
  const applied: string[] = [];
  try {
    await pool.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const done = new Set((await pool.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
    if (done.size === 0) {
      const { rows } = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations' ORDER BY 1",
      );
      const tables = rows.map((r) => r.tablename).sort();
      if (rows.length && (tables.join(",") !== projectTables.join(",") || !(await matchesProjectSchema(pool)))) {
        throw new Error(
          `O schema "public" já contém tabelas de outra aplicação (${rows.map((r) => r.tablename).join(", ")}). ` +
            "A estrutura não corresponde ao SIPAT Photo Drive; nada foi alterado.",
        );
      }
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(fs.readFileSync(path.join(dir, file), "utf8"));
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        applied.push(file);
      } catch (e) {
        await client.query("ROLLBACK");
        throw new Error(`Falha na migration ${file}: ${(e as Error).message}`);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
  return applied;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigrations()
    .then((a) => console.log(a.length ? `Migrations aplicadas: ${a.join(", ")}` : "Banco já está atualizado."))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
