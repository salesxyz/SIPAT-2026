import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { env } from "../config/env.js";

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Rota não encontrada", code: "rota_nao_encontrada" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: err.issues[0]?.message ?? "Dados inválidos",
      code: "validacao",
      issues: err.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message })),
    });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `Arquivo muito grande (máximo ${env.MAX_UPLOAD_MB} MB)`, code: "arquivo_grande" });
    }
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: `Envie no máximo ${env.MAX_FILES_PER_REQUEST} fotos por vez`, code: "muitos_arquivos" });
    }
    return res.status(400).json({ error: "Envio inválido", code: "upload_invalido" });
  }
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido", code: "json_invalido" });
  console.error("Erro inesperado:", err);
  res.status(500).json({ error: "Erro interno do servidor", code: "erro_interno" });
};
