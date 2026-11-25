import type { NextFunction, Request, RequestHandler, Response } from "express";

export class AppError extends Error {
  constructor(public status: number, message: string, public code = "erro") {
    super(message);
  }
}

export const notFound = (what = "Recurso") => new AppError(404, `${what} não encontrado`, "nao_encontrado");

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
