import { prisma } from "../lib/prisma.js";
import { ensureAdmin } from "../services/admin.js";

ensureAdmin(true)
  .then((r) => console.log(r === "ignorado" ? "Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env" : `Administrador ${r}.`))
  .finally(async () => {
    await prisma.$disconnect();
  });
