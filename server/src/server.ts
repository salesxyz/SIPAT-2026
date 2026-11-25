import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { runMigrations } from "./scripts/migrate.js";
import { ensureAdmin } from "./services/admin.js";
import { runRetention } from "./services/retention.js";
import { storage } from "./storage/index.js";

async function main() {
  const applied = await runMigrations();
  if (applied.length) console.log("Migrations aplicadas:", applied.join(", "));
  await storage.init();
  const admin = await ensureAdmin();
  if (admin === "criado") console.log("Administrador inicial criado a partir do ambiente.");

  const server = createApp().listen(env.PORT, () => console.log(`SIPAT Photo Drive em http://localhost:${env.PORT}`));

  // Retenção/LGPD: verifica a cada hora (e uma vez na partida)
  const tick = () => runRetention().then((n) => n && console.log(`Retenção: ${n} foto(s) excluída(s)`)).catch((e) => console.error("Retenção falhou:", e));
  setTimeout(tick, 15_000).unref();
  setInterval(tick, 3_600_000).unref();

  const stop = () => server.close(() => prisma.$disconnect().finally(() => process.exit(0)));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
