import fs from "node:fs";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { createPool } from "../src/lib/db.js";
import { runMigrations } from "../src/scripts/migrate.js";
import { ensureAdmin } from "../src/services/admin.js";
import { runRetention } from "../src/services/retention.js";
import { storage } from "../src/storage/index.js";

const app = createApp();
const agent = request.agent(app);
const pool = createPool();
const H = { "X-Requested-With": "sipat" };
const bin = (res: any, cb: (e: Error | null, b: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on("data", (c: Buffer) => chunks.push(c));
  res.on("end", () => cb(null, Buffer.concat(chunks)));
};

const jpeg = (w = 800, h = 600) => sharp({ create: { width: w, height: h, channels: 3, background: "#168447" } }).jpeg().toBuffer();
const noisyJpeg = async () => {
  const raw = Buffer.alloc(1800 * 1800 * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 2654435761) >>> 24;
  return sharp(raw, { raw: { width: 1800, height: 1800, channels: 3 } }).jpeg({ quality: 100 }).toBuffer();
};
const storageExists = (p: string) => fs.existsSync(`/tmp/sipat-test-storage/${p}`);

let event: any;
let token: string;
let photoId: string;
let photoPath: string;

beforeAll(async () => {
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  fs.rmSync("/tmp/sipat-test-storage", { recursive: true, force: true });
  await storage.init();
  await runMigrations();
  await ensureAdmin();
});
afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});

describe("banco", () => {
  it("cria as 5 entidades do projeto + settings", async () => {
    const { rows } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1");
    const names = rows.map((r) => r.table_name);
    for (const t of ["users", "events", "albums", "photos", "uploads", "settings"]) expect(names).toContain(t);
  });
  it("migrations são idempotentes", async () => {
    expect(await runMigrations()).toEqual([]);
  });
  it("senha do admin é armazenada com hash", async () => {
    const u = await prisma.user.findUnique({ where: { email: "admin@teste.com" } });
    expect(u!.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(u!.passwordHash).not.toContain("SenhaForte123");
  });
});

describe("autenticação", () => {
  it("rotas admin sem sessão → 401", async () => {
    for (const p of ["/api/admin/dashboard", "/api/admin/events", "/api/admin/photos"]) {
      expect((await request(app).get(p)).status).toBe(401);
    }
  });
  it("cookie inválido → 401", async () => {
    expect((await request(app).get("/api/admin/events").set("Cookie", "sipat_session=lixo")).status).toBe(401);
  });
  it("senha errada → 401 e não revela se o e-mail existe", async () => {
    const a = await request(app).post("/api/auth/login").send({ email: "admin@teste.com", password: "errada" });
    const b = await request(app).post("/api/auth/login").send({ email: "naoexiste@teste.com", password: "errada" });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
  });
  it("login correto define cookie httpOnly", async () => {
    const r = await agent.post("/api/auth/login").send({ email: "ADMIN@teste.com", password: "SenhaForte123" });
    expect(r.status).toBe(200);
    expect(String(r.headers["set-cookie"])).toMatch(/HttpOnly/i);
    expect((await agent.get("/api/auth/me")).body.user.email).toBe("admin@teste.com");
  });
  it("mutação sem cabeçalho anti-CSRF → 403", async () => {
    expect((await agent.post("/api/admin/events").send({ name: "X evento" })).status).toBe(403);
  });
});

describe("eventos e QR Code", () => {
  it("cria evento com token aleatório, álbum padrão e link", async () => {
    const r = await agent.post("/api/admin/events").set(H).send({ name: "SIPAT 2026", date: "2026-11-24", location: "Auditório" });
    expect(r.status).toBe(201);
    event = r.body.event;
    token = event.qrCodeToken;
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(event.uploadUrl).toBe(`https://sipat.teste/e/${token}`);
    expect(event.albumCount).toBe(1);
  });
  it("tokens de eventos diferentes são diferentes", async () => {
    const r = await agent.post("/api/admin/events").set(H).send({ name: "Outro evento" });
    expect(r.body.event.qrCodeToken).not.toBe(token);
    await agent.delete(`/api/admin/events/${r.body.event.id}`).set(H);
  });
  it("gera QR Code em PNG válido", async () => {
    const r = await agent.get(`/api/admin/events/${event.id}/qrcode.png?size=600&download`).buffer(true).parse(bin);
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toBe("image/png");
    expect(r.headers["content-disposition"]).toMatch(/attachment/);
    const meta = await sharp(r.body).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(600);
  });
  it("valida dados do evento", async () => {
    expect((await agent.post("/api/admin/events").set(H).send({ name: "a" })).status).toBe(400);
    expect((await agent.get("/api/admin/events/nao-e-uuid")).status).toBe(404);
  });
  it("página pública do evento pelo token; token inválido → 404", async () => {
    const r = await request(app).get(`/api/public/events/${token}`);
    expect(r.status).toBe(200);
    expect(r.body.event.accepting).toBe(true);
    expect(r.body.event.albums).toHaveLength(1);
    expect((await request(app).get("/api/public/events/tokeninexistente1234567890")).status).toBe(404);
    expect((await request(app).get("/api/public/events/curto")).status).toBe(404);
  });
});

describe("envio de fotos (participante, sem login)", () => {
  const up = (t: string) => request(app).post(`/api/public/events/${t}/upload`);

  it("envia JPEG válido: salva arquivo + miniatura + metadados", async () => {
    const r = await up(token).attach("photos", await jpeg(), { filename: "Café da manhã.jpeg", contentType: "image/jpeg" });
    expect(r.status).toBe(201);
    expect(r.body.uploaded).toBe(1);
    photoId = r.body.results[0].photoId;
    const p = await prisma.photo.findUnique({ where: { id: photoId }, include: { uploads: true } });
    photoPath = p!.filePath;
    expect(p!.fileName).toBe("Café da manhã.jpg");
    expect(p!.mimeType).toBe("image/jpeg");
    expect(p!.fileSize).toBeGreaterThan(0);
    expect(p!.uploads[0].uploadStatus).toBe("completed");
    expect(storageExists(p!.filePath)).toBe(true);
    expect(storageExists(p!.thumbPath!)).toBe(true);
  });
  it("redimensiona imagens enormes (máx. 2560px) e remove EXIF/GPS", async () => {
    const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#105C35" } })
      .withExif({ IFD3: { GPSLatitudeRef: "S", GPSLatitude: "23/1 33/1 0/1" } }).jpeg({ quality: 40 }).toBuffer();
    const r = await up(token).attach("photos", big, { filename: "gps.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(201);
    const p = await prisma.photo.findUnique({ where: { id: r.body.results[0].photoId } });
    const meta = await sharp(await storage.read(p!.filePath)).metadata();
    expect(meta.width).toBe(2560);
    expect(meta.exif).toBeUndefined();
  });
  it("aceita PNG e WebP (convertidos para JPEG)", async () => {
    const png = await sharp({ create: { width: 100, height: 100, channels: 4, background: "#fff" } }).png().toBuffer();
    const webp = await sharp({ create: { width: 100, height: 100, channels: 3, background: "#000" } }).webp().toBuffer();
    const r = await up(token).attach("photos", png, { filename: "a.png", contentType: "image/png" }).attach("photos", webp, { filename: "b.webp", contentType: "image/webp" });
    expect(r.body.uploaded).toBe(2);
  });
  it("[foco] arquivo .jpg que não é imagem → rejeitado e nada gravado", async () => {
    const before = await prisma.photo.count();
    const r = await up(token).attach("photos", Buffer.from("<?php echo 'hack'; ?>"), { filename: "shell.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(422);
    expect(r.body.results[0].ok).toBe(false);
    expect(await prisma.photo.count()).toBe(before);
  });
  it("[foco] formato de imagem não permitido (GIF) → rejeitado", async () => {
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#fff" } }).gif().toBuffer();
    const r = await up(token).attach("photos", gif, { filename: "a.gif", contentType: "image/gif" });
    expect(r.status).toBe(422);
    expect(r.body.results[0].error).toMatch(/Formato/);
  });
  it("[foco] arquivo acima do limite (1 MB no teste) → 413", async () => {
    const r = await up(token).attach("photos", await noisyJpeg(), { filename: "grande.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(413);
  });
  it("[foco] mais arquivos do que o permitido por envio → 400", async () => {
    const f = await jpeg(50, 50);
    let req = up(token);
    for (let i = 0; i < 4; i++) req = req.attach("photos", f, { filename: `f${i}.jpg`, contentType: "image/jpeg" });
    expect((await req).status).toBe(400);
  });
  it("sem arquivo → 400", async () => {
    expect((await up(token).field("x", "y")).status).toBe(400);
  });
  it("[foco] token inexistente → 404 e nada gravado", async () => {
    const before = await prisma.photo.count();
    const r = await up("tokeninexistente1234567890").attach("photos", await jpeg(), { filename: "a.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(404);
    expect(await prisma.photo.count()).toBe(before);
  });
  it("álbum de outro evento → 400", async () => {
    const other = await agent.post("/api/admin/events").set(H).send({ name: "Evento paralelo" });
    const otherAlbum = (await agent.get(`/api/admin/events/${other.body.event.id}/albums`)).body.albums[0].id;
    const r = await up(token).field("albumId", otherAlbum).attach("photos", await jpeg(), { filename: "a.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(400);
    await agent.delete(`/api/admin/events/${other.body.event.id}`).set(H);
  });
  it("[foco] evento desativado → 403 e nada gravado; reativar volta a aceitar", async () => {
    await agent.patch(`/api/admin/events/${event.id}`).set(H).send({ status: "closed" });
    const before = await prisma.photo.count();
    const r = await up(token).attach("photos", await jpeg(), { filename: "a.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(403);
    expect(await prisma.photo.count()).toBe(before);
    await agent.patch(`/api/admin/events/${event.id}`).set(H).send({ status: "active" });
    expect((await up(token).attach("photos", await jpeg(), { filename: "b.jpg", contentType: "image/jpeg" })).status).toBe(201);
  });
});

describe("galeria", () => {
  it("lista fotos do evento com URLs assinadas que funcionam", async () => {
    const r = await request(app).get(`/api/public/events/${token}/photos?sort=oldest`);
    expect(r.status).toBe(200);
    expect(r.body.total).toBeGreaterThanOrEqual(4);
    const img = await request(app).get(r.body.photos[0].thumbUrl).buffer(true).parse(bin);
    expect(img.status).toBe(200);
    expect(img.headers["content-type"]).toBe("image/jpeg");
    expect((await sharp(img.body).metadata()).width).toBeLessThanOrEqual(480);
  });
  it("URL assinada adulterada → 403", async () => {
    const r = await request(app).get(`/api/public/events/${token}/photos`);
    expect((await request(app).get(r.body.photos[0].url + "x")).status).toBe(403);
  });
  it("pesquisa por nome e paginação", async () => {
    const r = await request(app).get(`/api/public/events/${token}/photos?q=caf%C3%A9`);
    expect(r.body.total).toBe(1);
    const p = await request(app).get(`/api/public/events/${token}/photos?limit=2&page=2`);
    expect(p.body.photos.length).toBeLessThanOrEqual(2);
  });
  it("download força anexo com o nome do arquivo", async () => {
    const r = await request(app).get(`/api/public/events/${token}/photos/${photoId}/download`);
    expect(r.status).toBe(302);
    const f = await request(app).get(r.headers.location).buffer(true).parse(bin);
    expect(f.headers["content-disposition"]).toMatch(/attachment/);
    expect(decodeURIComponent(f.headers["content-disposition"])).toContain("Café da manhã.jpg");
  });
  it("[foco] foto de um evento não é acessível pelo token de outro", async () => {
    const other = await agent.post("/api/admin/events").set(H).send({ name: "Evento isolado" });
    const t2 = other.body.event.qrCodeToken;
    expect((await request(app).get(`/api/public/events/${t2}/photos/${photoId}/download`)).status).toBe(404);
    expect((await request(app).get(`/api/public/events/${t2}/photos`)).body.total).toBe(0);
    await agent.delete(`/api/admin/events/${other.body.event.id}`).set(H);
  });
  it("lista pública mostra apenas eventos listados", async () => {
    const hidden = await agent.post("/api/admin/events").set(H).send({ name: "Evento oculto", isListed: false });
    const r = await request(app).get("/api/public/events");
    const names = r.body.events.map((e: any) => e.name);
    expect(names).toContain("SIPAT 2026");
    expect(names).not.toContain("Evento oculto");
    await agent.delete(`/api/admin/events/${hidden.body.event.id}`).set(H);
  });
});

describe("painel administrativo", () => {
  it("dashboard com totais reais", async () => {
    const r = await agent.get("/api/admin/dashboard");
    expect(r.body.totals.events).toBe(1);
    expect(r.body.totals.photos).toBeGreaterThanOrEqual(4);
    expect(r.body.totals.bytes).toBeGreaterThan(0);
    expect(r.body.recentUploads.length).toBeGreaterThan(0);
  });
  it("lista e filtra fotos; baixa individual", async () => {
    const r = await agent.get(`/api/admin/photos?eventId=${event.id}`);
    expect(r.body.total).toBeGreaterThanOrEqual(4);
    const d = await agent.get(`/api/admin/photos/${photoId}/download`);
    expect(d.status).toBe(302);
  });
  it("cria álbum, move envio para ele e baixa ZIP", async () => {
    const a = await agent.post(`/api/admin/events/${event.id}/albums`).set(H).send({ name: "Palestras" });
    expect(a.status).toBe(201);
    const f = await jpeg(60, 60);
    await request(app).post(`/api/public/events/${token}/upload`).field("albumId", a.body.album.id)
      .attach("photos", f, { filename: "palestra1.jpg", contentType: "image/jpeg" })
      .attach("photos", f, { filename: "palestra1.jpg", contentType: "image/jpeg" });
    const zip = await agent.get(`/api/admin/albums/${a.body.album.id}/zip`).buffer(true).parse(bin);
    expect(zip.status).toBe(200);
    expect(zip.headers["content-type"]).toBe("application/zip");
    expect(zip.body.subarray(0, 2).toString()).toBe("PK");
    const text = zip.body.toString("latin1");
    expect(text).toContain("palestra1.jpg");
    expect(text).toContain("-palestra1.jpg"); // duplicado renomeado
    // exclui álbum → remove os arquivos
    const paths = (await prisma.photo.findMany({ where: { albumId: a.body.album.id } })).map((p) => p.filePath);
    expect((await agent.delete(`/api/admin/albums/${a.body.album.id}`).set(H)).status).toBe(200);
    expect(paths.every((p) => !storageExists(p))).toBe(true);
  });
  it("[foco] excluir foto remove também o arquivo do storage", async () => {
    const p = await prisma.photo.findUnique({ where: { id: photoId } });
    expect(storageExists(photoPath)).toBe(true);
    expect((await agent.delete(`/api/admin/photos/${photoId}`).set(H)).status).toBe(200);
    expect(storageExists(photoPath)).toBe(false);
    expect(storageExists(p!.thumbPath!)).toBe(false);
    expect(await prisma.photo.findUnique({ where: { id: photoId } })).toBeNull();
  });
  it("exclusão em lote", async () => {
    const ids = (await prisma.photo.findMany({ take: 2 })).map((p) => p.id);
    const r = await agent.post("/api/admin/photos/bulk-delete").set(H).send({ ids });
    expect(r.body.deleted).toBe(2);
  });
  it("regenerar token invalida o QR antigo", async () => {
    const r = await agent.post(`/api/admin/events/${event.id}/regenerate-token`).set(H);
    expect(r.body.event.qrCodeToken).not.toBe(token);
    expect((await request(app).get(`/api/public/events/${token}`)).status).toBe(404);
    token = r.body.event.qrCodeToken;
  });
  it("configurações editáveis aparecem na API pública", async () => {
    const r = await agent.put("/api/admin/settings").set(H).send({ contact_email: "contato@empresa.com", social_instagram: "https://instagram.com/x", retention_days: 30 });
    expect(r.status).toBe(200);
    const pub = await request(app).get("/api/settings");
    expect(pub.body.settings.contact_email).toBe("contato@empresa.com");
    expect(pub.body.settings.retention_days).toBe("30");
    expect((await agent.put("/api/admin/settings").set(H).send({ social_instagram: "javascript:alert(1)" })).status).toBe(400);
  });
  it("retenção (LGPD) exclui fotos antigas e seus arquivos", async () => {
    const old = await prisma.photo.findFirst();
    await prisma.photo.update({ where: { id: old!.id }, data: { uploadedAt: new Date(Date.now() - 40 * 86_400_000) } });
    expect(await runRetention()).toBe(1);
    expect(storageExists(old!.filePath)).toBe(false);
  });
  it("excluir evento apaga fotos, álbuns e arquivos", async () => {
    const paths = (await prisma.photo.findMany({ where: { eventId: event.id } })).map((p) => p.filePath);
    expect(paths.length).toBeGreaterThan(0);
    expect((await agent.delete(`/api/admin/events/${event.id}`).set(H)).status).toBe(200);
    expect(paths.every((p) => !storageExists(p))).toBe(true);
    expect(await prisma.album.count({ where: { eventId: event.id } })).toBe(0);
  });
  it("logout encerra a sessão", async () => {
    await agent.post("/api/auth/logout");
    expect((await agent.get("/api/admin/events")).status).toBe(401);
  });
});

describe("proteção contra banco de outro app", () => {
  it("recusa migrar quando o schema public tem tabelas estranhas (e não altera nada)", async () => {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE TABLE wishlist_items (id int)");
    await expect(runMigrations()).rejects.toThrow(/outra aplicação.*wishlist_items/);
    const { rows } = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'schema_migrations'");
    expect(rows.map((r) => r.tablename)).toEqual(["wishlist_items"]);
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    expect((await runMigrations()).length).toBe(1);
    await pool.query("DELETE FROM schema_migrations");
    expect(await runMigrations()).toEqual(["0001_init.sql"]);
  });
});
