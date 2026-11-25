import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export const COOKIE = "sipat_session";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export interface AdminSession {
  sub: string;
  email: string;
  name: string;
}

export function signSession(s: AdminSession) {
  return jwt.sign(s, env.JWT_SECRET, { expiresIn: "12h", audience: "admin" });
}

export function cookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: env.NODE_ENV === "production", path: "/", maxAge: 12 * 3600 * 1000 };
}

declare module "express-serve-static-core" {
  interface Request {
    admin?: AdminSession;
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return next(new AppError(401, "Faça login para continuar", "nao_autenticado"));
  try {
    req.admin = jwt.verify(token, env.JWT_SECRET, { audience: "admin" }) as AdminSession;
  } catch {
    return next(new AppError(401, "Sessão expirada. Entre novamente", "sessao_expirada"));
  }
  // Defesa extra contra CSRF: mutações exigem um cabeçalho que formulários cross-site não conseguem enviar.
  if (!SAFE.has(req.method) && req.get("x-requested-with") !== "sipat") {
    return next(new AppError(403, "Requisição não autorizada", "csrf"));
  }
  next();
}
