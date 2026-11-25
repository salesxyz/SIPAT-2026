// Sobe um PostgreSQL real e descartável para os testes (precisa rodar como usuário não-root).
import EmbeddedPostgres from "embedded-postgres";

const dir = process.env.PG_DIR || "/tmp/sipat-pg-data";
const port = Number(process.env.PG_PORT || 54329);
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "sipat", password: "sipat", port, persistent: false, onLog: () => {}, onError: console.error });
await pg.initialise();
await pg.start();
try { await pg.createDatabase("sipat_test"); } catch {}
console.log("PG_READY", port);
const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
setInterval(() => {}, 1 << 30);
