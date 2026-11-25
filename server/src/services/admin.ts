import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

/** Cria/atualiza o administrador inicial a partir de ADMIN_EMAIL / ADMIN_PASSWORD. */
export async function ensureAdmin(force = false): Promise<"criado" | "atualizado" | "ignorado"> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return "ignorado";
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !force) return "ignorado";
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, name: env.ADMIN_NAME } });
    return "atualizado";
  }
  await prisma.user.create({ data: { email, name: env.ADMIN_NAME, passwordHash, role: "admin" } });
  return "criado";
}
