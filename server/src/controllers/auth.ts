import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { COOKIE, cookieOptions, signSession } from "../middlewares/auth.js";

const loginBody = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido"), password: z.string().min(1, "Informe a senha").max(200) });
// Hash fictício para igualar o tempo de resposta quando o e-mail não existe.
const DUMMY_HASH = bcrypt.hashSync("sipat-dummy-password", 12);

export async function login(req: Request, res: Response) {
  const { email, password } = loginBody.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, "E-mail ou senha incorretos", "credenciais_invalidas");
  res.cookie(COOKIE, signSession({ sub: user.id, email: user.email, name: user.name }), cookieOptions());
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true });
}

export function me(req: Request, res: Response) {
  res.json({ user: { id: req.admin!.sub, name: req.admin!.name, email: req.admin!.email } });
}

export async function changePassword(req: Request, res: Response) {
  const body = z.object({ current: z.string().min(1), next: z.string().min(8, "A nova senha precisa ter ao menos 8 caracteres").max(200) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.admin!.sub } });
  if (!user || !(await bcrypt.compare(body.current, user.passwordHash))) throw new AppError(400, "Senha atual incorreta", "senha_incorreta");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(body.next, 12) } });
  res.json({ ok: true });
}
