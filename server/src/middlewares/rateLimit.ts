import rateLimit from "express-rate-limit";

const msg = (m: string) => ({ error: m, code: "muitas_requisicoes" });

export const apiLimiter = rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false, message: msg("Muitas requisições. Tente novamente em instantes") });
export const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: msg("Muitas tentativas de login. Aguarde alguns minutos") });
// Eventos reais têm muitas pessoas atrás do mesmo IP (Wi‑Fi da empresa): limite generoso, mas existente.
export const uploadLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 400, standardHeaders: true, legacyHeaders: false, message: msg("Muitos envios deste local. Aguarde alguns minutos") });
